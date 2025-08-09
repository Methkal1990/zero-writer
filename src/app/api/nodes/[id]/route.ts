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

  const nodeId = req.nextUrl.pathname.split("/").slice(-1)[0];

  // Get node and verify ownership through project
  const { data: node } = await supabase
    .from("project_nodes")
    .select(`
      id, 
      kind, 
      name, 
      content,
      chapter_id,
      project_id,
      parent_id
    `)
    .eq("id", nodeId)
    .single();

  if (!node) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", node.project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if node is a chapter (under draft folder)
  const isChapter = await checkIfNodeIsChapter(supabase, node, node.project_id);

  async function checkIfNodeIsChapter(
    supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>, 
    node: { id: string; parent_id: string | null; kind: string }, 
    projectId: string
  ): Promise<boolean> {
    if (node.kind === 'folder') return false;
    
    // Find the draft folder
    const { data: draftFolder } = await supabase
      .from("project_nodes")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", "draft")
      .eq("kind", "folder")
      .is("parent_id", null)
      .single();
    
    if (!draftFolder) return false;

    // Check if this node is under the draft folder
    let currentNode: { id: string; parent_id: string | null } | null = node;
    while (currentNode) {
      if (currentNode.parent_id === draftFolder.id) {
        return true;
      }
      if (!currentNode.parent_id) break;
      
      const { data: parent } = await supabase
        .from("project_nodes")
        .select("id, parent_id")
        .eq("id", currentNode.parent_id)
        .single();
      
      currentNode = parent as { id: string; parent_id: string | null } | null;
    }
    
    return false;
  }

  // For chapters, get content from chapters table
  if (node.kind === "chapter" && node.chapter_id) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("content")
      .eq("id", node.chapter_id)
      .single();
    
    return NextResponse.json({ 
      id: node.id,
      kind: node.kind,
      name: node.name,
      content: chapter?.content || "",
      isChapter
    });
  }

  // For files, get content from project_nodes table
  if (node.kind === "file") {
    return NextResponse.json({
      id: node.id,
      kind: node.kind,
      name: node.name,
      content: node.content || "",
      isChapter
    });
  }

  // For folders, return empty content
  return NextResponse.json({
    id: node.id,
    kind: node.kind,
    name: node.name,
    content: "",
    isChapter
  });
}

const updateSchema = z.object({
  content: z.string(),
});

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const nodeId = req.nextUrl.pathname.split("/").slice(-1)[0];
  const body = updateSchema.parse(await req.json());

  // Get node and verify ownership through project
  const { data: node } = await supabase
    .from("project_nodes")
    .select(`
      id, 
      kind, 
      chapter_id,
      project_id
    `)
    .eq("id", nodeId)
    .single();

  if (!node) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", node.project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // For chapters, update content in chapters table
  if (node.kind === "chapter" && node.chapter_id) {
    const { error } = await supabase
      .from("chapters")
      .update({ content: body.content })
      .eq("id", node.chapter_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // For files, update content in project_nodes table
  if (node.kind === "file") {
    const { error } = await supabase
      .from("project_nodes")
      .update({ content: body.content })
      .eq("id", nodeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Folders don't have content
  return NextResponse.json({ error: "Folders cannot have content" }, { status: 400 });
}