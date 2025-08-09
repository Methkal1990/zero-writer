"use client";
import { useState } from "react";


export default function ChatPanel({ projectId, selectedChapterId }: { projectId: string; selectedChapterId: string | null }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, messages: [...messages, userMsg], selectedChapterId }),
      });
      if (!res.ok) throw new Error("AI error");
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  // Generate chapter from notes moved here
  const [notes, setNotes] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const generateChapter = async () => {
    if (!notes.trim()) return;
    setGenLoading(true);
    try {
      const res = await fetch("/api/ai/chapter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, notes }) });
      if (res.ok) {
        setNotes("");
        // Optionally notify user
        setMessages((m) => [...m, { role: "assistant", content: "Draft chapter created from your notes in the structure panel under 'draft'." }]);
      }
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-auto divide-y">
        {messages.map((m, i) => (
          <div key={i} className="p-3 text-sm">
            <div className="font-medium mb-1">{m.role === "user" ? "You" : "Assistant"}</div>
            <div className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{m.content}</div>
          </div>
        ))}
        {loading && <div className="p-3 text-sm text-neutral-500">Thinking…</div>}
      </div>
      <div className="p-2 border-t flex gap-2">
        <input
          value={input}
          onChange={(e)=> setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything about your book…"
          className="flex-1 rounded-lg border p-2"
        />
        <button onClick={send} className="px-3 rounded-lg bg-[#1C2B3A] text-white">Send</button>
      </div>

      <div className="p-2 border-t space-y-2">
        <div className="text-sm font-medium">Generate chapter from notes</div>
        <textarea value={notes} onChange={(e)=> setNotes(e.target.value)} rows={4} className="w-full rounded border p-2" placeholder="Paste bullet points or notes…" />
        <button disabled={genLoading} onClick={generateChapter} className="px-3 py-1 rounded bg-[#F5B942] text-[#1C2B3A]">{genLoading ? 'Generating…' : 'Generate'}</button>
      </div>
    </div>
  );
}
