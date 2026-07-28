import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url().optional().default('http://localhost:13000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  // Log warning but don't crash — env vars may arrive at runtime on Netlify
  console.warn('⚠️ Environment variable warning:', result.error.format())
}

export const env = result.success ? result.data : {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  NEXT_PUBLIC_API_URL: 'http://localhost:13000',
  NODE_ENV: (process.env.NODE_ENV ?? 'production') as 'development' | 'production' | 'test',
}
