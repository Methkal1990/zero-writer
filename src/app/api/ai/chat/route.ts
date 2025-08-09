import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { env } from "@/env";
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

  const { projectId, messages, selectedChapterId } = await req.json();

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = new OpenAI({ apiKey: env.server.OPENAI_API_KEY });

  const systemMsg = {
    role: "system" as const,
    content:
      "You are ZeroWriter, an assistant helping outline and draft books. Keep responses concise and practical. If the user's request could benefit from seeing the currently open chapter, you MUST call the function tool read_current before answering.",
  };

  const first = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [systemMsg, ...messages],
    temperature: 0.7,
    tool_choice: "auto",
    tools: [
      {
        type: "function",
        function: {
          name: "read_current",
          description:
            "Read the full HTML content of the currently opened chapter.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
    ],
  });

  const choice = first.choices[0];
  const toolCalls = choice.message.tool_calls ?? [];

  if (toolCalls.length === 0) {
    const reply = choice.message.content ?? "";
    return NextResponse.json({ reply });
  }

  // Execute tool calls
  const toolResultMessages: Array<{
    role: "tool";
    tool_call_id: string;
    content: string;
  }> = [];
  for (const call of toolCalls) {
    // OpenAI v1 returns tool calls with type and function fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fnName = (call as unknown as { function?: { name?: string } })
      .function?.name as string | undefined;
    if (fnName === "read_current") {
      if (!selectedChapterId) {
        toolResultMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: "No chapter is currently selected.",
        });
        continue;
      }
      const { data: chapter } = await supabase
        .from("chapters")
        .select("id, title, content, project_id")
        .eq("id", selectedChapterId)
        .single();
      if (!chapter) {
        toolResultMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: "Selected chapter not found.",
        });
        continue;
      }
      const { data: proj } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", chapter.project_id)
        .single();
      if (!proj || proj.user_id !== user.id) {
        toolResultMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: "Forbidden.",
        });
        continue;
      }
      const payload = {
        title: chapter.title ?? "Untitled Chapter",
        content: chapter.content ?? "",
      };
      toolResultMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(payload),
      });
    }
  }

  // Ask the model to answer with tool results
  const followUp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [systemMsg, ...messages, choice.message, ...toolResultMessages],
    temperature: 0.7,
  });

  const reply = followUp.choices[0]?.message?.content ?? "";
  return NextResponse.json({ reply });
}
