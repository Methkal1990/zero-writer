import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.pathname.split("/").slice(-2, -1)[0];

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title")
    .eq("project_id", id)
    .order("index", { ascending: true });

  const items = (chapters ?? []).map((c) => ({
    id: c.id,
    type: "chapter" as const,
    title: c.title ?? "Untitled Chapter",
  }));
  return NextResponse.json({ items });
}
