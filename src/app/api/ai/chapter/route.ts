import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/env";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

import { ensureAllowedOrigin } from "@/middleware/secure-origin";

export async function POST(req: NextRequest) {
  const forbidden = ensureAllowedOrigin(req);
  if (forbidden) return forbidden;

  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, notes } = await req.json();

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const openai = createOpenAI({ apiKey: env.server.OPENAI_API_KEY });
  const { text } = await generateText({
    model: openai.chat("gpt-4o-mini"),
    system:
      "Draft a book chapter based on the user's notes. Output clean prose.",
    prompt: notes ?? "",
    temperature: 0.8,
  });
  const draft = text ?? "";

  // Optionally save a new chapter
  const { data } = await supabase
    .from("chapters")
    .insert({ project_id: projectId, title: "AI Draft", content: draft })
    .select("id")
    .single();

  return NextResponse.json({ id: data?.id, draft });
}
