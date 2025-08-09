import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default("http://localhost:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default("placeholder-anon-key"),
});

const serverSchema = z.object({
  OPENAI_API_KEY: z.string().default(""),
  ALLOWED_ORIGINS: z.string().optional(),
});

function getAllowedOrigins(defaultOrigin: string): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return [defaultOrigin];
  return raw.split(/\s+/).map((s) => s.trim()).filter(Boolean);
}

export const env = {
  client: clientSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }),
  server: serverSchema.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  }),
  getAllowedOrigins,
};
