import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, creditTransactions } from "@/db/schemas/users";
import { isAdminSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const ok = await isAdminSession();
  if (!ok) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      credits: users.credits,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: allUsers });
}
