import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schemas/users";
import { eq } from "drizzle-orm";

export const ADMIN_PASSWORD = "darkdyabynho123";
export const ADMIN_SESSION_COOKIE = "admin_session";
export const USER_SESSION_COOKIE = "user_session";

export function hashPassword(password: string): string {
  // Simple hash for demo — deterministic, no native crypto needed
  let hash = 0;
  const str = password + "pixelstudio_salt_2025";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(USER_SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const [userId] = sessionCookie.value.split(":");
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user[0] ?? null;
  } catch {
    return null;
  }
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_SESSION_COOKIE);
  return adminCookie?.value === "admin_authenticated";
}
