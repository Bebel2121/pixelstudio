import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schemas/users";
import { eq } from "drizzle-orm";
import { hashPassword, USER_SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    }

    const hashed = hashPassword(password);
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!found.length || found[0].password !== hashed) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
    }

    const user = found[0];
    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, credits: user.credits } });
    response.cookies.set(USER_SESSION_COOKIE, `${user.id}:${hashed}`, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
