export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, creditTransactions } from "@/db/schemas/users";
import { isAdminSession, generateId } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const ok = await isAdminSession();
  if (!ok) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { userId, amount, reason } = await req.json();
  if (!userId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  await db.update(users)
    .set({ credits: sql`${users.credits} + ${amount}`, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(creditTransactions).values({
    id: generateId(),
    userId,
    amount,
    reason: reason || "Créditos adicionados pelo admin",
    adminId: "admin",
  });

  const updated = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return NextResponse.json({ success: true, credits: updated[0].credits });
}
