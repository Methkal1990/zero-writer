"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useState } from "react";
import { BookOpen, File, Folder, Loader2 } from "lucide-react";

export default function Editor({ projectId, nodeId, fontSize }: { projectId: string; nodeId: string | null; fontSize: number }) {
  const [selectedNode, setSelectedNode] = useState<{id: string, kind: string, name: string, isChapter: boolean} | null>(null);
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CharacterCount,
      Placeholder.configure({ placeholder: "Start writing..." }),
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

  // Load selected node content
  useEffect(() => {
    if (!editor) return;
    if (!nodeId) {
      setSelectedNode(null);
      editor.commands.setContent("");
      return;
    }
    
    const loadNodeData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nodes/${nodeId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Set selected node info
        setSelectedNode({ 
          id: data.id, 
          kind: data.kind, 
          name: data.name, 
          isChapter: data.isChapter || false 
        });
        
        // Only load content if it's a file or chapter, not a folder
        if (data.kind === 'folder') {
          editor.commands.setContent("");
          return;
        }
        editor.commands.setContent(data.content || "");
        // Initialize last saved snapshot to avoid immediate save
        lastSavedHtmlRef.current = data.content || "";
        suppressNextUpdateRef.current = true;
      } finally {
        setLoading(false);
      }
    };
    
    loadNodeData();
  }, [editor, nodeId]);

  // Debounced autosave on content change
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHtmlRef = useRef<string>("");
  const suppressNextUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!editor) return;
    if (!nodeId) return;

    const handleUpdate = () => {
      if (suppressNextUpdateRef.current) {
        suppressNextUpdateRef.current = false;
        return;
      }
      const html = editor.getHTML();
      if (html === lastSavedHtmlRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!nodeId) return;
        const latestHtml = editor.getHTML();
        if (latestHtml === lastSavedHtmlRef.current) return;
        await fetch(`/api/nodes/${nodeId}`, {
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
  }, [editor, nodeId]);

  // Simple autocomplete button
  const requestSuggestions = async () => {
    if (!editor || !nodeId) return;
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

  // Render appropriate icon for node type
  const getNodeIcon = (node: {kind: string, isChapter: boolean}) => {
    if (node.kind === 'folder') {
      return <Folder size={16} className="text-[#4BB3A4]" />;
    }
    if (node.isChapter) {
      return <BookOpen size={16} className="text-[#F5B942]" />;
    }
    return <File size={16} className="text-neutral-500 dark:text-neutral-400" />;
  };

  // Get display type for node
  const getNodeType = (node: {kind: string, isChapter: boolean}) => {
    if (node.kind === 'folder') return 'folder';
    if (node.isChapter) return 'chapter';
    return 'file';
  };

  if (!nodeId || !selectedNode) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
        <div className="text-center space-y-2">
          <BookOpen size={48} className="mx-auto opacity-50" />
          <p className="text-sm">Select a file or chapter to start writing</p>
        </div>
      </div>
    );
  }

  if (selectedNode.kind === 'folder') {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
        <div className="text-center space-y-2">
          <Folder size={48} className="mx-auto text-[#4BB3A4] opacity-50" />
          <p className="text-sm">Folders are for organization</p>
          <p className="text-xs">Select a file or chapter to edit its content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with node info */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-[#4BB3A4]" />
            ) : (
              getNodeIcon(selectedNode)
            )}
            <div>
              <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                {selectedNode.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                {getNodeType(selectedNode)}
                {selectedNode.isChapter && <span className="ml-1 text-[#F5B942]">📖</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={requestSuggestions} 
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium bg-white dark:bg-neutral-800 hover:bg-[#4BB3A4] hover:text-white hover:border-[#4BB3A4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              AI Suggest
            </button>
          </div>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 relative overflow-auto">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
              <Loader2 size={20} className="animate-spin text-[#4BB3A4]" />
              <span className="text-sm">Loading content...</span>
            </div>
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      {/* AI suggestions popup */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg p-3 w-80 space-y-2 z-10">
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">AI Suggestions</div>
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => { editor?.commands.insertContent(s); setShowSuggestions(false); }} 
              className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              {s}
            </button>
          ))}
          <button 
            onClick={()=> setShowSuggestions(false)} 
            className="block w-full text-center text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
