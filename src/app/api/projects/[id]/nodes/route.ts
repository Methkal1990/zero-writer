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

  // Ensure default structure exists: draft folder, plus files world/characters/plot/outline
  const ensureDefaults = async () => {
    const { count } = await supabase
      .from("project_nodes")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);
    if ((count ?? 0) > 0) return;

    // Create draft folder
    const { data: draftFolder } = await supabase
      .from("project_nodes")
      .insert({ project_id: projectId, kind: "folder", name: "draft" })
      .select("id")
      .single();

    const rootFiles = ["world", "characters", "plot", "outline"];
    if (draftFolder) {
      // no chapters by default
    }
    for (const name of rootFiles) {
      await supabase
        .from("project_nodes")
        .insert({ project_id: projectId, kind: "file", name });
    }
  };

  await ensureDefaults();

  const { data: nodes } = await supabase
    .from("project_nodes")
    .select("id, project_id, parent_id, kind, name, chapter_id, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

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
