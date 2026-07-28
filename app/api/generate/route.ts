import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, generations } from "@/db/schemas/users";
import { getSessionUser, generateId } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const CREDITS_PER_IMAGE = 10;

const TYPE_PREFIX: Record<string, string> = {
  profile:  "Create a stunning professional profile picture avatar, high quality, vibrant colors, perfect for social media. ",
  banner:   "Create a wide advertisement banner image, eye-catching design, professional marketing style, suitable for ads. ",
  group:    "Create a group photo composition, team photo style, multiple people, warm and welcoming atmosphere. ",
  generate: "",
  edit:     "",
};

export async function POST(req: NextRequest) {
  // Validate required env vars at runtime — fail fast with clear message
  const REACTUS_BASE_URL = process.env.REACTUS_BASE_URL;
  const API_KEY          = process.env.BTY_LLM_SERVER_API_KEY;
  const PROJECT_ID       = process.env.HAPPYSEEDS_PROJECT_ID;

  if (!REACTUS_BASE_URL || !API_KEY || !PROJECT_ID) {
    console.error("[generate] Missing env vars:", { REACTUS_BASE_URL: !!REACTUS_BASE_URL, API_KEY: !!API_KEY, PROJECT_ID: !!PROJECT_ID });
    return NextResponse.json({ error: "Servidor mal configurado. Contate o administrador." }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
  }
  if (user.credits < CREDITS_PER_IMAGE) {
    return NextResponse.json(
      { error: "Créditos insuficientes. Entre em contato com o dono do painel para comprar mais créditos." },
      { status: 402 }
    );
  }

  let prompt = "";
  let type = "generate";
  let referenceB64: string | null = null;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      prompt = (fd.get("prompt") as string) ?? "";
      type   = (fd.get("type")   as string) ?? "generate";
      const imgFile = fd.get("image") as File | null;
      if (imgFile && type === "edit") {
        const buf   = await imgFile.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        referenceB64 = btoa(bin).replace(/\s/g, "");
      }
    } else {
      const body = await req.json() as { prompt?: string; type?: string };
      prompt = body.prompt ?? "";
      type   = body.type   ?? "generate";
    }
  } catch (e) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 400 });
  }

  if (!prompt.trim()) {
    return NextResponse.json({ error: "Descreva o que deseja gerar" }, { status: 400 });
  }

  // Sanitize type
  if (!["generate","edit","profile","banner","group"].includes(type)) type = "generate";

  const generationId = generateId();

  // Deduct credits upfront
  try {
    await db.update(users)
      .set({ credits: sql`${users.credits} - ${CREDITS_PER_IMAGE}`, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (e) {
    console.error("[generate] Failed to deduct credits:", e);
    return NextResponse.json({ error: "Erro ao processar créditos. Tente novamente." }, { status: 500 });
  }

  try {
    await db.insert(generations).values({
      id: generationId,
      userId: user.id,
      prompt,
      type,
      status: "pending",
      creditsUsed: CREDITS_PER_IMAGE,
    });
  } catch (e) {
    // Non-fatal — don't block generation if history insert fails
    console.warn("[generate] Failed to insert generation record:", e);
  }

  try {
    const fullPrompt = (TYPE_PREFIX[type] ?? "") + prompt;
    const imageUrl   = await generateImage({
      fullPrompt, type, referenceB64,
      REACTUS_BASE_URL, API_KEY, PROJECT_ID,
    });

    // Update generation record
    try {
      await db.update(generations)
        .set({ imageUrl, status: "completed" })
        .where(eq(generations.id, generationId));
    } catch (e) {
      console.warn("[generate] Failed to update generation record:", e);
    }

    // Get updated credits
    let newCredits = user.credits - CREDITS_PER_IMAGE;
    try {
      const [updated] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      if (updated) newCredits = updated.credits;
    } catch (e) {
      console.warn("[generate] Failed to fetch updated credits:", e);
    }

    return NextResponse.json({ success: true, imageUrl, credits: newCredits });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate] Generation failed:", msg);

    // Refund credits
    try {
      await db.update(users)
        .set({ credits: sql`${users.credits} + ${CREDITS_PER_IMAGE}`, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    } catch (refundErr) {
      console.error("[generate] CRITICAL: Failed to refund credits:", refundErr);
    }

    try {
      await db.update(generations)
        .set({ status: "failed" })
        .where(eq(generations.id, generationId));
    } catch {}

    // Return user-friendly error based on failure type
    if (msg.includes("SSE HTTP 4") || msg.includes("Access Denied")) {
      return NextResponse.json({ error: "Serviço de IA temporariamente indisponível. Créditos devolvidos. Tente novamente em instantes." }, { status: 503 });
    }
    if (msg.includes("abort") || msg.includes("timeout") || msg.includes("110")) {
      return NextResponse.json({ error: "A geração demorou demais. Créditos devolvidos. Tente um prompt mais simples." }, { status: 504 });
    }
    return NextResponse.json({ error: "Erro ao gerar imagem. Créditos devolvidos. Tente novamente." }, { status: 500 });
  }
}

// ─── Core generation logic ────────────────────────────────────────────────────

async function generateImage(opts: {
  fullPrompt: string;
  type: string;
  referenceB64: string | null;
  REACTUS_BASE_URL: string;
  API_KEY: string;
  PROJECT_ID: string;
}): Promise<string> {
  const { fullPrompt, type, referenceB64, REACTUS_BASE_URL, API_KEY, PROJECT_ID } = opts;

  if (type === "edit" && referenceB64) {
    return generateWithGPTEdit({ fullPrompt, referenceB64, REACTUS_BASE_URL, API_KEY, PROJECT_ID });
  }

  // Primary: Doubao (~20s, returns URL)
  try {
    return await generateWithDoubao({ fullPrompt, type, REACTUS_BASE_URL, API_KEY, PROJECT_ID });
  } catch (e) {
    console.warn("[generate] Doubao failed, trying GPT Image:", e instanceof Error ? e.message : e);
  }

  // Fallback: GPT Image 2
  return generateWithGPTGen({ fullPrompt, type, REACTUS_BASE_URL, API_KEY, PROJECT_ID });
}

// ─── Doubao Seedream (fast ~20s, returns URL) ─────────────────────────────────

async function generateWithDoubao(opts: {
  fullPrompt: string; type: string;
  REACTUS_BASE_URL: string; API_KEY: string; PROJECT_ID: string;
}): Promise<string> {
  const { fullPrompt, type, REACTUS_BASE_URL, API_KEY, PROJECT_ID } = opts;

  const body = {
    model: "doubao-seedream-5-0-260128",
    prompt: fullPrompt,
    size: type === "banner" ? "3k" : "2k",
    output_format: "png",
    watermark: false,
  };

  const sseText = await fetchSSE(`${REACTUS_BASE_URL}/v1/llm_server/sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-bty-app": PROJECT_ID,
      "x-bty-model": "doubao-seedream-5-0-260128",
    },
    body: JSON.stringify(body),
  });

  const provider = parseSSE(sseText);
  const items = provider.data as Array<{ url?: string; b64_json?: string }> | undefined;
  const item = items?.[0];
  if (!item) throw new Error("Doubao: no data item");

  if (item.url)      return persistURL(item.url, PROJECT_ID, REACTUS_BASE_URL, API_KEY);
  if (item.b64_json) return persistB64(item.b64_json, PROJECT_ID, REACTUS_BASE_URL, API_KEY);
  throw new Error("Doubao: no url or b64_json");
}

// ─── GPT Image 2 generate ─────────────────────────────────────────────────────

async function generateWithGPTGen(opts: {
  fullPrompt: string; type: string;
  REACTUS_BASE_URL: string; API_KEY: string; PROJECT_ID: string;
}): Promise<string> {
  const { fullPrompt, type, REACTUS_BASE_URL, API_KEY, PROJECT_ID } = opts;

  const body = {
    model: "gpt-image-2",
    prompt: fullPrompt,
    n: 1,
    size: type === "banner" ? "1536x1024" : "1024x1024",
    quality: "medium",
    output_format: "png",
  };

  const sseText = await fetchSSE(`${REACTUS_BASE_URL}/v1/llm_server/sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-bty-app": PROJECT_ID,
      "x-bty-model": "gpt-image-2-gen",
    },
    body: JSON.stringify(body),
  });

  const provider = parseSSE(sseText);
  const items = provider.data as Array<{ b64_json?: string; url?: string }> | undefined;
  const item = items?.[0];
  if (!item) throw new Error("GPT-gen: no data item");

  if (item.b64_json) return persistB64(item.b64_json, PROJECT_ID, REACTUS_BASE_URL, API_KEY);
  if (item.url)      return persistURL(item.url, PROJECT_ID, REACTUS_BASE_URL, API_KEY);
  throw new Error("GPT-gen: no b64_json or url");
}

// ─── GPT Image 2 edit ─────────────────────────────────────────────────────────

async function generateWithGPTEdit(opts: {
  fullPrompt: string; referenceB64: string;
  REACTUS_BASE_URL: string; API_KEY: string; PROJECT_ID: string;
}): Promise<string> {
  const { fullPrompt, referenceB64, REACTUS_BASE_URL, API_KEY, PROJECT_ID } = opts;

  const clean   = referenceB64.replace(/\s/g, "");
  const dataUri = `data:image/png;base64,${clean}`;

  const body = {
    model: "gpt-image-2",
    prompt: fullPrompt,
    images: [{ image_url: dataUri }],
    n: 1,
    size: "1024x1024",
    quality: "medium",
    output_format: "png",
  };

  const sseText = await fetchSSE(`${REACTUS_BASE_URL}/v1/llm_server/sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-bty-app": PROJECT_ID,
      "x-bty-model": "gpt-image-2-edit",
    },
    body: JSON.stringify(body),
  });

  const provider = parseSSE(sseText);
  const items = provider.data as Array<{ b64_json?: string; url?: string }> | undefined;
  const item = items?.[0];
  if (!item) throw new Error("GPT-edit: no data item");

  if (item.b64_json) return persistB64(item.b64_json, PROJECT_ID, REACTUS_BASE_URL, API_KEY);
  if (item.url)      return persistURL(item.url, PROJECT_ID, REACTUS_BASE_URL, API_KEY);
  throw new Error("GPT-edit: no b64_json or url");
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

async function fetchSSE(url: string, init: RequestInit): Promise<string> {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort("timeout"), 110_000);

  let resp: Response;
  try {
    resp = await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    clearTimeout(timeout);
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`SSE fetch failed: ${msg}`);
  }

  if (!resp.ok) {
    clearTimeout(timeout);
    const body = await resp.text().catch(() => "");
    throw new Error(`SSE HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }

  const chunks: Uint8Array[] = [];
  try {
    if (resp.body) {
      const reader = resp.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } else {
      const buf = await resp.arrayBuffer();
      chunks.push(new Uint8Array(buf));
    }
  } finally {
    clearTimeout(timeout);
  }

  const total  = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  return new TextDecoder().decode(merged);
}

function parseSSE(raw: string): Record<string, unknown> {
  const lines = raw.split("\n");

  // Look for completed event block
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "event: llm_server.completed" || line.includes("llm_server.completed")) {
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (lines[j].startsWith("data:")) {
          return extractProviderJSON(lines[j].slice(5).trim());
        }
      }
    }
  }

  // Fallback: data line with "succeeded"
  for (const line of lines) {
    if (line.startsWith("data:") && line.includes("succeeded")) {
      return extractProviderJSON(line.slice(5).trim());
    }
  }

  // Fallback: data line with image data
  for (const line of lines) {
    if (line.startsWith("data:") && (line.includes("b64_json") || line.includes('"data"') || line.includes('"url"'))) {
      try {
        return extractProviderJSON(line.slice(5).trim());
      } catch { continue; }
    }
  }

  // Check for failed event
  for (const line of lines) {
    if (line.startsWith("data:") && line.includes("failed")) {
      let detail = "desconhecido";
      try {
        const d = JSON.parse(line.slice(5).trim()) as { message?: string; error?: string };
        detail = d.message ?? d.error ?? detail;
      } catch {}
      throw new Error(`SSE: geração falhou — ${detail}`);
    }
  }

  throw new Error(`SSE: nenhum evento completo encontrado. Preview: ${raw.slice(0, 300)}`);
}

function extractProviderJSON(dataStr: string): Record<string, unknown> {
  const envelope = JSON.parse(dataStr) as { status?: string; data?: unknown };
  if (envelope.status === "succeeded" && envelope.data !== undefined) {
    return envelope.data as Record<string, unknown>;
  }
  if (envelope.status === "failed") {
    const d = envelope.data as Record<string, unknown> | undefined;
    throw new Error(`Provider failed: ${d?.message ?? d?.error ?? "unknown"}`);
  }
  return envelope as Record<string, unknown>;
}

async function persistURL(
  url: string, projectId: string,
  REACTUS_BASE_URL: string, API_KEY: string,
): Promise<string> {
  try {
    const res  = await fetch(`${REACTUS_BASE_URL}/v1/llm_server/file_dump_to_oss`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ project_id: projectId, url }),
    });
    const data = await res.json() as { success?: boolean; data?: string };
    if (data.success && data.data) return data.data;
  } catch (e) {
    console.warn("[persistURL] OSS failed, using raw URL:", e);
  }
  return url;
}

async function persistB64(
  b64raw: string, projectId: string,
  REACTUS_BASE_URL: string, API_KEY: string,
): Promise<string> {
  const clean   = b64raw.replace(/\s/g, "");
  const dataUri = `data:image/png;base64,${clean}`;
  const res  = await fetch(`${REACTUS_BASE_URL}/v1/llm_server/upload_base64_file`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ project_id: projectId, content: dataUri }),
  });
  const data = await res.json() as { success?: boolean; data?: string };
  if (data.success && data.data) return data.data;
  throw new Error(`OSS upload failed: ${JSON.stringify(data).slice(0, 200)}`);
}
