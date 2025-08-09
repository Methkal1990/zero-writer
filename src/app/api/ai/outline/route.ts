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
    .select("id, user_id, kind, title, description")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get project context for better outline generation
  const projectContext = [
    `Project Type: ${project.kind || "Unknown"}`,
    project.title ? `Title: ${project.title}` : "",
    project.description ? `Description: ${project.description}` : "",
  ].filter(Boolean).join("\n");

  const openai = createOpenAI({ apiKey: env.server.OPENAI_API_KEY });
  const { text } = await generateText({
    model: openai.chat("gpt-4o-mini"),
    system: `You are an expert book outliner. Generate a structured book outline in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "title": "Book Title",
  "parts": [
    {
      "title": "Part I: Part Title (optional, omit if no parts)",
      "chapters": [
        {
          "number": 1,
          "title": "Chapter Title",
          "description": "Brief description of what this chapter covers",
          "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
        }
      ]
    }
  ]
}

For books without parts, use a single part with empty title. Focus on creating practical, actionable chapter breakdowns.`,
    prompt: `Project Context:
${projectContext}

User's outline notes:
${notes || "Generate a comprehensive book outline."}`,
    temperature: 0.3,
  });

  try {
    const outlineData = JSON.parse(text || "{}");
    return NextResponse.json({ outline: outlineData });
  } catch {
    // Fallback if JSON parsing fails
    return NextResponse.json({ 
      outline: {
        title: "Generated Outline",
        parts: [{
          title: "",
          chapters: [{
            number: 1,
            title: "Chapter 1",
            description: "Unable to parse AI response",
            keyPoints: [text || "No content generated"]
          }]
        }]
      }
    });
  }
}