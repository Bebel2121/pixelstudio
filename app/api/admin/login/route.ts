export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "admin_authenticated", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
