"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  credits: number;
  onCreditsUpdate: (credits: number) => void;
}

type GenType = "generate" | "edit" | "profile" | "banner" | "group";

const TYPE_OPTIONS: { id: GenType; label: string; icon: string; desc: string }[] = [
  { id: "generate", label: "Gerar Imagem",     icon: "✨", desc: "Crie qualquer imagem do zero" },
  { id: "edit",     label: "Editar Foto",       icon: "✏️", desc: "Edite uma imagem existente"  },
  { id: "profile",  label: "Foto de Perfil",    icon: "👤", desc: "Avatar circular perfeito"    },
  { id: "banner",   label: "Banner de Anúncio", icon: "📢", desc: "Banners chamativos 16:9"     },
  { id: "group",    label: "Foto de Grupo",     icon: "👥", desc: "Composição de equipe"        },
];

const PROGRESS_STEPS = [
  { pct: 8,  label: "Enviando pedido para a IA..." },
  { pct: 20, label: "IA analisando seu prompt..." },
  { pct: 40, label: "Criando a composição da imagem..." },
  { pct: 62, label: "Renderizando detalhes..." },
  { pct: 80, label: "Finalizando a imagem..." },
  { pct: 92, label: "Salvando resultado..." },
];

export default function GeneratorPanel({ credits, onCreditsUpdate }: Props) {
  const [type, setType]                         = useState<GenType>("generate");
  const [prompt, setPrompt]                     = useState("");
  const [referenceFile, setReferenceFile]       = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [generating, setGenerating]             = useState(false);
  const [progressIdx, setProgressIdx]           = useState(0);
  const [elapsed, setElapsed]                   = useState(0);
  const [result, setResult]                     = useState<string | null>(null);
  const [error, setError]                       = useState("");
  const fileRef  = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startProgress = () => {
    setProgressIdx(0);
    setElapsed(0);
    startRef.current = Date.now();
    let step = 0;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      // Advance through steps roughly every 4s, max at second-to-last
      const nextStep = Math.min(Math.floor((Date.now() - startRef.current) / 4000), PROGRESS_STEPS.length - 2);
      if (nextStep > step) { step = nextStep; setProgressIdx(step); }
    }, 500);
  };

  const stopProgress = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setProgressIdx(PROGRESS_STEPS.length - 1);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReferencePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Descreva o que deseja gerar"); return; }
    if (credits < 10)   { setError("Créditos insuficientes"); return; }

    setError("");
    setGenerating(true);
    setResult(null);
    startProgress();

    try {
      const fd = new FormData();
      fd.append("prompt", prompt);
      fd.append("type", type);
      if (type === "edit" && referenceFile) fd.append("image", referenceFile);

      const res  = await fetch("/api/generate", { method: "POST", body: fd });
      stopProgress();

      const data = await res.json() as { imageUrl?: string; credits?: number; error?: string };

      if (!res.ok || data.error) {
        setError(data.error || "Erro ao gerar imagem. Tente novamente.");
        return;
      }

      setResult(data.imageUrl!);
      onCreditsUpdate(data.credits!);
    } catch (e) {
      stopProgress();
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("fetch") || msg.includes("network") || msg.toLowerCase().includes("failed")) {
        setError("Erro de conexão. A geração pode demorar até 60s — verifique sua internet e tente novamente.");
      } else {
        setError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `pixelstudio-${type}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const currentStep = PROGRESS_STEPS[Math.min(progressIdx, PROGRESS_STEPS.length - 1)];
  const progressPct = generating ? currentStep.pct : 0;

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          Tipo de Criação
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => { if (!generating) { setType(t.id); setError(""); setResult(null); } }}
              className="p-4 rounded-xl text-left transition-all duration-200"
              style={
                type === t.id
                  ? { background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.5)" }
                  : { background: "var(--card)", border: "1px solid var(--border)" }
              }
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="text-xs font-semibold" style={{ color: type === t.id ? "var(--cyan)" : "var(--text)" }}>
                {t.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reference image for edit */}
      {type === "edit" && (
        <div>
          <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}>
            Imagem de Referência
          </p>
          <div
            className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200"
            style={{
              borderColor: referencePreview ? "var(--cyan)" : "rgba(255,255,255,0.15)",
              background: "var(--card)",
            }}
            onClick={() => !generating && fileRef.current?.click()}
          >
            {referencePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={referencePreview} alt="Referência" className="max-h-48 rounded-xl mx-auto" />
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ background: "#ff6b6b", color: "#fff" }}
                  onClick={(e) => { e.stopPropagation(); setReferenceFile(null); setReferencePreview(null); }}
                >×</button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">📁</div>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Clique para enviar uma imagem
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>PNG, JPG até 10MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* Prompt */}
      <div>
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          Descreva o que deseja criar
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating}
          placeholder={
            type === "profile" ? "Ex: Avatar guerreiro cyberpunk com cabelo azul, estilo anime..." :
            type === "banner"  ? "Ex: Banner para loja de roupas, fundo escuro, letras neon, estilo moderno..." :
            type === "group"   ? "Ex: Foto de equipe de 5 pessoas sorrindo em escritório moderno..." :
            type === "edit"    ? "Ex: Mude o fundo para floresta encantada, adicione efeito de magia..." :
                                 "Ex: Paisagem futurista com cidade flutuante, cores vibrantes, ultra realista..."
          }
          className="w-full px-4 py-3 text-sm resize-none"
          rows={4}
          onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && !generating && handleGenerate()}
        />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-dim)" }}>
          Ctrl+Enter para gerar · 10 créditos por imagem · Tempo médio: 20–30 segundos
        </p>
      </div>

      {/* Example prompts */}
      <div>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          Exemplos rápidos
        </p>
        <div className="flex flex-wrap gap-2">
          {(type === "profile" ? ["Avatar anime mulher guerreira", "Foto profissional empresário", "Avatar lobo digital neon"] :
            type === "banner"  ? ["Banner Black Friday 70% off", "Anúncio restaurante japonês", "Promoção academia fitness"] :
            type === "group"   ? ["Time de startup tech", "Família reunião feliz", "Grupo jovens estudantes"] :
            type === "edit"    ? ["Transformar em pintura a óleo", "Adicionar efeito neon glowing", "Mudar fundo para pôr do sol"] :
                                 ["Cidade cyberpunk chuva neon", "Dragão voando ao pôr do sol", "Floresta mágica com fadas"]
          ).map((ex) => (
            <button
              key={ex}
              onClick={() => !generating && setPrompt(ex)}
              disabled={generating}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                opacity: generating ? 0.4 : 1,
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.25)", color: "#ff6b6b" }}
        >
          ❌ {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || credits < 10}
        className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3"
      >
        {generating ? (
          <>
            <span
              className="w-5 h-5 rounded-full border-2 border-transparent animate-spin flex-shrink-0"
              style={{ borderTopColor: "#000", borderRightColor: "#000" }}
            />
            Gerando... aguarde
          </>
        ) : credits < 10 ? (
          "⚠️ Créditos Insuficientes"
        ) : (
          <>✨ Gerar Imagem <span style={{ opacity: 0.7, fontSize: 13 }}>(-10 créditos)</span></>
        )}
      </button>

      {/* Progress bar + status */}
      {generating && (
        <div
          className="glow-card p-6 animate-fade-in"
          style={{ border: "1px solid rgba(0,212,255,0.3)" }}
        >
          {/* Animated shimmer preview */}
          <div className="w-full rounded-xl shimmer mb-5" style={{ height: 260 }} />

          {/* Progress bar */}
          <div className="relative w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: "var(--gradient)",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {currentStep.label}
            </p>
            <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }} translate="no">
              {elapsed}s
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
            💡 A IA pode demorar até 60 segundos — não feche esta aba
          </p>
        </div>
      )}

      {/* Result */}
      {result && !generating && (
        <div className="glow-card p-6 animate-fade-in" style={{ border: "1px solid rgba(0,255,136,0.3)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: "var(--green)" }}>
              ✅ Imagem gerada com sucesso!
            </h3>
            <button onClick={handleDownload} className="btn-primary px-5 py-2 text-sm font-semibold">
              ⬇ Baixar
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result}
            alt="Imagem gerada"
            className="w-full rounded-xl"
            style={{ maxHeight: 600, objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
