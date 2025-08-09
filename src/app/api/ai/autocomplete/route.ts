import { NextRequest } from "next/server";
import OpenAI from "openai";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/env";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

import { ensureAllowedOrigin } from "@/middleware/secure-origin";

export async function POST(req: NextRequest) {
  const forbidden = ensureAllowedOrigin(req);
  if (forbidden) return forbidden as Response;

  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const { projectId, prefix } = await req.json();

  // Ensure ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id)
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  const openai = createOpenAI({ apiKey: env.server.OPENAI_API_KEY });
  const { text } = await generateText({
    model: openai.chat("gpt-4o-mini"),
    system:
      "Provide 3 short autocomplete suggestions for the ongoing sentence. Return them separated by \n---\n",
    prompt: prefix ?? "",
    temperature: 0.9,
  });
  const suggestions = text
    .split(/\n\s*---\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return new Response(JSON.stringify({ suggestions }), {
    headers: { "Content-Type": "application/json" },
  });
}
