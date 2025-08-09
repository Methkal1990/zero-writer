"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useState } from "react";

export default function Editor({ projectId, chapterId, fontSize }: { projectId: string; chapterId: string | null; fontSize: number }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CharacterCount,
      Placeholder.configure({ placeholder: "Start writing your chapter..." }),
    ],
    editorProps: {
      attributes: {
        class: `prose prose-neutral max-w-none px-6 py-4 focus:outline-none`,
        style: `font-size: ${fontSize}px; font-family: Merriweather, serif;`,
      },
    },
    content: "",
    immediatelyRender: false,
  });

  // Load selected chapter content
  useEffect(() => {
    if (!editor) return;
    if (!chapterId) {
      editor.commands.setContent("");
      return;
    }
    (async () => {
      const res = await fetch(`/api/chapters/${chapterId}`);
      if (!res.ok) return;
      const data = await res.json();
      editor.commands.setContent(data.content || "");
      // Initialize last saved snapshot to avoid immediate save
      lastSavedHtmlRef.current = data.content || "";
      suppressNextUpdateRef.current = true;
    })();
  }, [editor, chapterId]);

  // Debounced autosave on content change
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHtmlRef = useRef<string>("");
  const suppressNextUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!editor) return;
    if (!chapterId) return;

    const handleUpdate = () => {
      if (suppressNextUpdateRef.current) {
        suppressNextUpdateRef.current = false;
        return;
      }
      const html = editor.getHTML();
      if (html === lastSavedHtmlRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!chapterId) return;
        const latestHtml = editor.getHTML();
        if (latestHtml === lastSavedHtmlRef.current) return;
        await fetch(`/api/chapters/${chapterId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: latestHtml }),
        });
        lastSavedHtmlRef.current = latestHtml;
      }, 800);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [editor, chapterId]);

  // Simple autocomplete button
  const requestSuggestions = async () => {
    if (!editor || !chapterId) return;
    const text = editor.getText().slice(-500);
    const res = await fetch("/api/ai/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, prefix: text }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSuggestions(data.suggestions || []);
    setShowSuggestions(true);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  return (
    <div className="h-full overflow-auto relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button onClick={requestSuggestions} className="px-3 py-1 rounded-md border text-sm bg-white dark:bg-neutral-800">Autocomplete</button>
      </div>
      <EditorContent editor={editor} />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-white dark:bg-neutral-800 border rounded-lg shadow p-2 w-80 space-y-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => { editor?.commands.insertContent(s); setShowSuggestions(false); }} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">
              {s}
            </button>
          ))}
          <button onClick={()=> setShowSuggestions(false)} className="block w-full text-center text-xs text-neutral-500">Close</button>
        </div>
      )}
    </div>
  );
}
