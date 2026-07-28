import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schemas/users";
import { eq } from "drizzle-orm";
import { generateId, hashPassword, USER_SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    const id = generateId();
    const hashed = hashPassword(password);

    await db.insert(users).values({
      id,
      name,
      email,
      password: hashed,
      credits: 50,
      isAdmin: false,
    });

    const response = NextResponse.json({ success: true, userId: id });
    response.cookies.set(USER_SESSION_COOKIE, `${id}:${hashed}`, {
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
