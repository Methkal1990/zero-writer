import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.pathname.split("/").slice(-2, -1)[0];
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Ensure default structure exists: draft folder, plus organized story element folders and files
  const ensureDefaults = async () => {
    const { count } = await supabase
      .from("project_nodes")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);
    if ((count ?? 0) > 0) return;

    // Get project data to populate files with wizard content
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    // Create main folders
    await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "draft" })
      .select("id")
      .single();

    const { data: storyElementsFolder } = await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "story-elements" })
      .select("id")
      .single();

    const { data: worldbuildingFolder } = await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "worldbuilding" })
      .select("id")
      .single();

    const { data: charactersFolder } = await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "characters" })
      .select("id")
      .single();

    const { data: plotStructureFolder } = await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "plot-structure" })
      .select("id")
      .single();

    const { data: writingStyleFolder } = await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "writing-style" })
      .select("id")
      .single();

    // Create story elements files
    if (storyElementsFolder) {
      const storyElementsFiles = [
        { name: "premise-logline", content: projectData?.premise || null },
        { name: "genre-tone", content: projectData?.genre_tone || null },
        { name: "theme", content: projectData?.theme || null },
      ];

      for (const file of storyElementsFiles) {
        await supabase.from("project_nodes").insert({
          project_id: projectId,
          kind: "file",
          name: file.name,
          content: file.content,
          parent_id: storyElementsFolder.id,
        });
      }
    }

    // Create worldbuilding files
    if (worldbuildingFolder) {
      const worldbuildingFiles = [
        { name: "settings", content: projectData?.settings || null },
        { name: "world-rules", content: projectData?.world_rules || null },
        {
          name: "culture-history",
          content: projectData?.culture_history || null,
        },
        {
          name: "sensory-details",
          content: projectData?.sensory_details || null,
        },
      ];

      for (const file of worldbuildingFiles) {
        await supabase.from("project_nodes").insert({
          project_id: projectId,
          kind: "file",
          name: file.name,
          content: file.content,
          parent_id: worldbuildingFolder.id,
        });
      }
    }

    // Create characters files
    if (charactersFolder) {
      const charactersFiles = [
        { name: "protagonist", content: projectData?.protagonist || null },
        { name: "antagonist", content: projectData?.antagonist || null },
        {
          name: "supporting-cast",
          content: projectData?.supporting_cast || null,
        },
        {
          name: "relationships",
          content: projectData?.character_relationships || null,
        },
      ];

      for (const file of charactersFiles) {
        await supabase.from("project_nodes").insert({
          project_id: projectId,
          kind: "file",
          name: file.name,
          content: file.content,
          parent_id: charactersFolder.id,
        });
      }
    }

    // Create plot structure files
    if (plotStructureFolder) {
      const plotStructureFiles = [
        { name: "outline-beats", content: projectData?.outline_beats || null },
        { name: "conflict", content: projectData?.conflict || null },
        {
          name: "pacing-resolution",
          content: projectData?.pacing_resolution || null,
        },
        { name: "subplots", content: projectData?.subplots || null },
      ];

      for (const file of plotStructureFiles) {
        await supabase.from("project_nodes").insert({
          project_id: projectId,
          kind: "file",
          name: file.name,
          content: file.content,
          parent_id: plotStructureFolder.id,
        });
      }
    }

    // Create writing style files
    if (writingStyleFolder) {
      const writingStyleFiles = [
        { name: "point-of-view", content: projectData?.point_of_view || null },
        { name: "voice-tone", content: projectData?.voice_tone || null },
      ];

      for (const file of writingStyleFiles) {
        await supabase.from("project_nodes").insert({
          project_id: projectId,
          kind: "file",
          name: file.name,
          content: file.content,
          parent_id: writingStyleFolder.id,
        });
      }
    }

    // Create legacy files at root level for backward compatibility
    const legacyFiles = [
      { name: "plot", content: projectData?.plot || null },
      { name: "outline", content: null },
    ];

    for (const file of legacyFiles) {
      await supabase.from("project_nodes").insert({
        project_id: projectId,
        kind: "file",
        name: file.name,
        content: file.content,
      });
    }
  };

  await ensureDefaults();

  const { data: nodes } = await supabase
    .from("project_nodes")
    .select(
      "id, project_id, parent_id, kind, name, chapter_id, content, position"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ nodes: nodes ?? [] });
}

const createSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  kind: z.enum(["folder", "file", "chapter"]),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.pathname.split("/").slice(-2, -1)[0];

  const body = createSchema.parse(await req.json());

  // Verify parent ownership if provided
  if (body.parentId) {
    const { data: parent } = await supabase
      .from("project_nodes")
      .select("id, project_id")
      .eq("id", body.parentId)
      .single();
    if (!parent || parent.project_id !== projectId)
      return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
  }

  let chapterId: string | null = null;
  if (body.kind === "chapter") {
    const { data: chapter } = await supabase
      .from("chapters")
      .insert({ project_id: projectId, title: body.name })
      .select("id")
      .single();
    chapterId = chapter?.id ?? null;
  }

  const { data, error } = await supabase
    .from("project_nodes")
    .insert({
      project_id: projectId,
      parent_id: body.parentId ?? null,
      kind: body.kind,
      name: body.name,
      chapter_id: chapterId,
    })
    .select("id")
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 }
    );
  return NextResponse.json({ id: data.id, chapterId });
}

const renameSchema = z.object({ name: z.string().min(1) });

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.pathname.split("/").slice(-2, -1)[0];

  const search = new URL(req.url).searchParams;
  const nodeId = search.get("nodeId");
  if (!nodeId)
    return NextResponse.json({ error: "nodeId is required" }, { status: 400 });
  const body = renameSchema.parse(await req.json());

  // Verify node
  const { data: node } = await supabase
    .from("project_nodes")
    .select("id, project_id")
    .eq("id", nodeId)
    .single();
  if (!node || node.project_id !== projectId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("project_nodes")
    .update({ name: body.name })
    .eq("id", nodeId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
