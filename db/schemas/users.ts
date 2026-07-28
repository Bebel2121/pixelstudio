import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(50),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generations = pgTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  type: text("type").notNull(), // 'generate' | 'edit' | 'profile' | 'banner' | 'group'
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"), // 'pending' | 'completed' | 'failed'
  creditsUsed: integer("credits_used").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  adminId: text("admin_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
