import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { env } from "@/env";

// For use in Server Components (pages, layouts) - read-only
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.client.NEXT_PUBLIC_SUPABASE_URL,
    env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // No-op for Server Components
        },
        remove() {
          // No-op for Server Components
        },
      },
    }
  );
}

// For use in Route Handlers and Server Actions - can modify cookies
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.client.NEXT_PUBLIC_SUPABASE_URL,
    env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  return h.get("origin") ?? env.client.NEXT_PUBLIC_SITE_URL;
}
