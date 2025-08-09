"use client";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.client.NEXT_PUBLIC_SUPABASE_URL,
    env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
