import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  kind: z.literal("fiction"),
  title: z.string().optional(),
  description: z.string().optional(),
  plot: z.string().optional(),
  // Story Foundation
  premise: z.string().optional(),
  genre_tone: z.string().optional(),
  theme: z.string().optional(),
  // Worldbuilding Layer
  settings: z.string().optional(),
  world_rules: z.string().optional(),
  culture_history: z.string().optional(),
  sensory_details: z.string().optional(),
  // Characters
  protagonist: z.string().optional(),
  antagonist: z.string().optional(),
  supporting_cast: z.string().optional(),
  character_relationships: z.string().optional(),
  // Plot Structure
  outline_beats: z.string().optional(),
  conflict: z.string().optional(),
  pacing_resolution: z.string().optional(),
  subplots: z.string().optional(),
  // Writing Flow & Style
  point_of_view: z.string().optional(),
  voice_tone: z.string().optional(),
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
      // Story Foundation
      premise: body.premise ?? null,
      genre_tone: body.genre_tone ?? null,
      theme: body.theme ?? null,
      // Worldbuilding Layer
      settings: body.settings ?? null,
      world_rules: body.world_rules ?? null,
      culture_history: body.culture_history ?? null,
      sensory_details: body.sensory_details ?? null,
      // Characters
      protagonist: body.protagonist ?? null,
      antagonist: body.antagonist ?? null,
      supporting_cast: body.supporting_cast ?? null,
      character_relationships: body.character_relationships ?? null,
      // Plot Structure
      outline_beats: body.outline_beats ?? null,
      conflict: body.conflict ?? null,
      pacing_resolution: body.pacing_resolution ?? null,
      subplots: body.subplots ?? null,
      // Writing Flow & Style
      point_of_view: body.point_of_view ?? null,
      voice_tone: body.voice_tone ?? null,
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
