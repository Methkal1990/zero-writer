import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  kind: z.literal("fiction"),
  title: z.string().optional(),
  description: z.string().optional(),
  plot: z.string().optional(),
});

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, description, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ projects: projects ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const body = bodySchema.parse(json);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      kind: body.kind,
      title: body.title ?? null,
      description: body.description ?? null,
      plot: body.plot ?? null,
    })
    .select("id")
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 }
    );

  return NextResponse.json({ id: data.id });
}
