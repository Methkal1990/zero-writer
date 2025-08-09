import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
