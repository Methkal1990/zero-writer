import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Workspace from "@/components/workspace/Workspace";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { data: project } = await supabase
    .from("projects")
    .select("id, kind, title, description")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) return notFound();

  return <Workspace project={project} />;
}
