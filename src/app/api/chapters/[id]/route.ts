import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.pathname.split("/").pop() as string;

  const { data, error } = await supabase
    .from("chapters")
    .select("id, title, content, project_id")
    .eq("id", id)
    .single();

  if (error || !data)
    return NextResponse.json(
      { error: error?.message ?? "Not found" },
      { status: 404 }
    );

  // Ensure ownership via join
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", data.project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    content: data.content ?? "",
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updates: { title?: string | null; content?: string | null } = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.content === "string") updates.content = body.content;

  // Ensure ownership
  const id = req.nextUrl.pathname.split("/").pop() as string;

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, project_id")
    .eq("id", id)
    .single();

  if (!chapter)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", chapter.project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("chapters")
    .update(updates)
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
