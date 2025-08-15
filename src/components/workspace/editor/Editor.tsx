"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  File,
  Folder,
  Loader2,
  Plus,
  Minus,
  Edit3,
} from "lucide-react";

export default function Editor({
  projectId,
  nodeId,
  fontSize,
}: {
  projectId: string;
  nodeId: string | null;
  fontSize: number;
}) {
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    kind: string;
    name: string;
    isChapter: boolean;
  } | null>(null);
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
          isChapter: data.isChapter || false,
        });

        // Only load content if it's a file or chapter, not a folder
        if (data.kind === "folder") {
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

  // Check if current selected file is an outline
  const isOutlineFile =
    selectedNode?.name === "outline" && selectedNode?.kind === "file";

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

  // Handle AI suggest button click
  const handleAISuggest = () => {
    if (isOutlineFile) {
      setShowOutlineModal(true);
      setOutlineNotes("");
      setGeneratedOutline(null);
    } else {
      requestSuggestions();
    }
  };

  // Generate outline based on user notes
  const generateOutline = async () => {
    if (!projectId) return;
    setIsGeneratingOutline(true);
    try {
      const res = await fetch("/api/ai/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, notes: outlineNotes }),
      });
      if (!res.ok) throw new Error("Failed to generate outline");
      const data = await res.json();
      setGeneratedOutline(data.outline || null);
    } catch (error) {
      console.error("Error generating outline:", error);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Convert outline JSON to HTML for editor
  const convertOutlineToHTML = (outline: typeof generatedOutline) => {
    if (!outline) return "";

    let html = `<h1>${outline.title}</h1>`;

    outline.parts.forEach((part) => {
      if (part.title) {
        html += `<h2>${part.title}</h2>`;
      }

      part.chapters.forEach((chapter) => {
        html += `<h3>Chapter ${chapter.number}: ${chapter.title}</h3>`;
        html += `<p><em>${chapter.description}</em></p>`;

        if (chapter.keyPoints.length > 0) {
          html += `<ul>`;
          chapter.keyPoints.forEach((point) => {
            html += `<li>${point}</li>`;
          });
          html += `</ul>`;
        }
      });
    });

    return html;
  };

  // Outline editing functions
  const updateOutlineTitle = (newTitle: string) => {
    if (!generatedOutline) return;
    setGeneratedOutline({
      ...generatedOutline,
      title: newTitle,
    });
  };

  const updatePartTitle = (partIndex: number, newTitle: string) => {
    if (!generatedOutline) return;
    const newParts = [...generatedOutline.parts];
    newParts[partIndex] = { ...newParts[partIndex], title: newTitle };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const addPart = () => {
    if (!generatedOutline) return;
    const newPart = {
      title: "New Part",
      chapters: [],
    };
    setGeneratedOutline({
      ...generatedOutline,
      parts: [...generatedOutline.parts, newPart],
    });
  };

  const removePart = (partIndex: number) => {
    if (!generatedOutline || generatedOutline.parts.length <= 1) return;
    const newParts = generatedOutline.parts.filter(
      (_, index) => index !== partIndex
    );
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const updateChapter = (
    partIndex: number,
    chapterIndex: number,
    updates: Partial<{
      number: number;
      title: string;
      description: string;
      keyPoints: string[];
    }>
  ) => {
    if (!generatedOutline) return;
    const newParts = [...generatedOutline.parts];
    const newChapters = [...newParts[partIndex].chapters];
    newChapters[chapterIndex] = { ...newChapters[chapterIndex], ...updates };
    newParts[partIndex] = { ...newParts[partIndex], chapters: newChapters };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const addChapter = (partIndex: number) => {
    if (!generatedOutline) return;
    const newChapter = {
      number: generatedOutline.parts[partIndex].chapters.length + 1,
      title: "New Chapter",
      description: "Chapter description",
      keyPoints: [],
    };
    const newParts = [...generatedOutline.parts];
    newParts[partIndex] = {
      ...newParts[partIndex],
      chapters: [...newParts[partIndex].chapters, newChapter],
    };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const removeChapter = (partIndex: number, chapterIndex: number) => {
    if (!generatedOutline) return;
    const newParts = [...generatedOutline.parts];
    newParts[partIndex] = {
      ...newParts[partIndex],
      chapters: newParts[partIndex].chapters.filter(
        (_, index) => index !== chapterIndex
      ),
    };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const addKeyPoint = (partIndex: number, chapterIndex: number) => {
    if (!generatedOutline) return;
    const newParts = [...generatedOutline.parts];
    const newChapters = [...newParts[partIndex].chapters];
    newChapters[chapterIndex] = {
      ...newChapters[chapterIndex],
      keyPoints: [...newChapters[chapterIndex].keyPoints, "New key point"],
    };
    newParts[partIndex] = { ...newParts[partIndex], chapters: newChapters };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const removeKeyPoint = (
    partIndex: number,
    chapterIndex: number,
    pointIndex: number
  ) => {
    if (!generatedOutline) return;
    const newParts = [...generatedOutline.parts];
    const newChapters = [...newParts[partIndex].chapters];
    newChapters[chapterIndex] = {
      ...newChapters[chapterIndex],
      keyPoints: newChapters[chapterIndex].keyPoints.filter(
        (_, index) => index !== pointIndex
      ),
    };
    newParts[partIndex] = { ...newParts[partIndex], chapters: newChapters };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  const updateKeyPoint = (
    partIndex: number,
    chapterIndex: number,
    pointIndex: number,
    newPoint: string
  ) => {
    if (!generatedOutline) return;
    const newParts = [...generatedOutline.parts];
    const newChapters = [...newParts[partIndex].chapters];
    const newKeyPoints = [...newChapters[chapterIndex].keyPoints];
    newKeyPoints[pointIndex] = newPoint;
    newChapters[chapterIndex] = {
      ...newChapters[chapterIndex],
      keyPoints: newKeyPoints,
    };
    newParts[partIndex] = { ...newParts[partIndex], chapters: newChapters };
    setGeneratedOutline({ ...generatedOutline, parts: newParts });
  };

  // Accept generated outline and add to file
  const acceptOutline = async () => {
    if (!editor || !nodeId || !generatedOutline) return;

    // Convert outline to HTML
    const outlineHTML = convertOutlineToHTML(generatedOutline);

    // Add the generated outline to the editor
    const currentContent = editor.getHTML();
    const newContent = currentContent.trim()
      ? currentContent + "<br><br>" + outlineHTML
      : outlineHTML;

    editor.commands.setContent(newContent);

    // Close modal and reset states
    setShowOutlineModal(false);
    setOutlineNotes("");
    setGeneratedOutline(null);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Outline modal states
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const [outlineNotes, setOutlineNotes] = useState("");
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<{
    title: string;
    parts: Array<{
      title: string;
      chapters: Array<{
        number: number;
        title: string;
        description: string;
        keyPoints: string[];
      }>;
    }>;
  } | null>(null);

  // Render appropriate icon for node type
  const getNodeIcon = (node: { kind: string; isChapter: boolean }) => {
    if (node.kind === "folder") {
      return <Folder size={16} className="text-[#4BB3A4]" />;
    }
    if (node.isChapter) {
      return <BookOpen size={16} className="text-[#F5B942]" />;
    }
    return (
      <File size={16} className="text-neutral-500 dark:text-neutral-400" />
    );
  };

  // Get display type for node
  const getNodeType = (node: { kind: string; isChapter: boolean }) => {
    if (node.kind === "folder") return "folder";
    if (node.isChapter) return "chapter";
    return "file";
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

  if (selectedNode.kind === "folder") {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
        <div className="text-center space-y-2">
          <Folder size={48} className="mx-auto text-[#4BB3A4] opacity-50" />
          <p className="text-sm">Folders are for organization</p>
          <p className="text-xs">
            Select a file or chapter to edit its content
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
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
                {selectedNode.isChapter && (
                  <span className="ml-1 text-[#F5B942]">📖</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAISuggest}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium bg-white dark:bg-neutral-800 hover:bg-[#4BB3A4] hover:text-white hover:border-[#4BB3A4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOutlineFile ? "Generate Outline" : "AI Suggest"}
            </button>
          </div>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-white/50 dark:bg-neutral-900/50">
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
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            AI Suggestions
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                editor?.commands.insertContent(s);
                setShowSuggestions(false);
              }}
              className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setShowSuggestions(false)}
            className="block w-full text-center text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            Close
          </button>
        </div>
      )}

      {/* Outline Generation Modal */}
      {showOutlineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Generate Book Outline
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Describe your book idea and structure preferences to generate a
                comprehensive outline
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Input Section */}
              <div>
                <label
                  htmlFor="outline-notes"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Book Outline Notes
                </label>
                <textarea
                  id="outline-notes"
                  value={outlineNotes}
                  onChange={(e) => setOutlineNotes(e.target.value)}
                  placeholder="Describe your book concept, target audience, key themes, preferred structure, number of chapters, or any specific requirements..."
                  className="w-full h-32 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#4BB3A4] focus:border-transparent resize-none"
                />
              </div>

              {/* Generate Button */}
              {!generatedOutline && (
                <div className="flex justify-center">
                  <button
                    onClick={generateOutline}
                    disabled={isGeneratingOutline || !outlineNotes.trim()}
                    className="px-6 py-3 bg-[#4BB3A4] text-white rounded-lg font-medium hover:bg-[#3a9488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingOutline && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {isGeneratingOutline ? "Generating..." : "Generate Outline"}
                  </button>
                </div>
              )}

              {/* Generated Outline Preview */}
              {generatedOutline && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                      Generated Outline
                    </h3>
                    <button
                      onClick={() => setGeneratedOutline(null)}
                      className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700 max-h-96 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Book Title - Editable */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={generatedOutline.title}
                          onChange={(e) => updateOutlineTitle(e.target.value)}
                          className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 bg-transparent border-none outline-none focus:bg-white dark:focus:bg-neutral-800 focus:px-2 focus:py-1 focus:rounded-md transition-all flex-1"
                        />
                        <Edit3 size={16} className="text-neutral-400" />
                      </div>

                      {/* Parts and Chapters */}
                      {generatedOutline.parts.map((part, partIndex) => (
                        <div key={partIndex} className="space-y-4">
                          {/* Part Header with Edit/Delete */}
                          <div className="flex items-center gap-2 group">
                            {part.title ? (
                              <input
                                type="text"
                                value={part.title}
                                onChange={(e) =>
                                  updatePartTitle(partIndex, e.target.value)
                                }
                                className="text-xl font-semibold text-[#4BB3A4] bg-transparent border-none outline-none focus:bg-white dark:focus:bg-neutral-800 focus:px-2 focus:py-1 focus:rounded-md transition-all flex-1 border-b border-neutral-200 dark:border-neutral-600 pb-2"
                              />
                            ) : (
                              <div className="text-xl font-semibold text-[#4BB3A4] flex-1 border-b border-neutral-200 dark:border-neutral-600 pb-2">
                                <button
                                  onClick={() =>
                                    updatePartTitle(partIndex, "New Part")
                                  }
                                  className="text-neutral-400 hover:text-[#4BB3A4] transition-colors text-sm"
                                >
                                  + Add part title
                                </button>
                              </div>
                            )}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              {generatedOutline.parts.length > 1 && (
                                <button
                                  onClick={() => removePart(partIndex)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title="Remove part"
                                >
                                  <Minus size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Chapters */}
                            {part.chapters.map((chapter, chapterIndex) => (
                              <div
                                key={chapterIndex}
                                className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-600 group"
                              >
                                <div className="space-y-3">
                                  {/* Chapter Title and Number */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="number"
                                        value={chapter.number}
                                        onChange={(e) =>
                                          updateChapter(
                                            partIndex,
                                            chapterIndex,
                                            {
                                              number:
                                                parseInt(e.target.value) || 1,
                                            }
                                          )
                                        }
                                        className="bg-[#F5B942] text-[#1C2B3A] px-2 py-1 rounded-md text-sm font-bold w-12 text-center"
                                        min="1"
                                      />
                                      <input
                                        type="text"
                                        value={chapter.title}
                                        onChange={(e) =>
                                          updateChapter(
                                            partIndex,
                                            chapterIndex,
                                            { title: e.target.value }
                                          )
                                        }
                                        className="text-lg font-medium text-neutral-900 dark:text-neutral-100 bg-transparent border-none outline-none focus:bg-neutral-50 dark:focus:bg-neutral-700 focus:px-2 focus:py-1 focus:rounded-md transition-all flex-1"
                                      />
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeChapter(partIndex, chapterIndex)
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      title="Remove chapter"
                                    >
                                      <Minus size={14} />
                                    </button>
                                  </div>

                                  {/* Chapter Description */}
                                  <textarea
                                    value={chapter.description}
                                    onChange={(e) =>
                                      updateChapter(partIndex, chapterIndex, {
                                        description: e.target.value,
                                      })
                                    }
                                    className="w-full text-sm text-neutral-600 dark:text-neutral-400 italic bg-transparent border-none outline-none focus:bg-neutral-50 dark:focus:bg-neutral-700 focus:px-2 focus:py-1 focus:rounded-md transition-all resize-none"
                                    rows={2}
                                  />

                                  {/* Key Points */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Key Points:
                                      </h4>
                                      <button
                                        onClick={() =>
                                          addKeyPoint(partIndex, chapterIndex)
                                        }
                                        className="text-xs text-[#4BB3A4] hover:bg-[#4BB3A4] hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1"
                                      >
                                        <Plus size={12} />
                                        Add point
                                      </button>
                                    </div>
                                    <ul className="space-y-1">
                                      {chapter.keyPoints.map(
                                        (point, pointIndex) => (
                                          <li
                                            key={pointIndex}
                                            className="text-sm text-neutral-600 dark:text-neutral-400 flex items-start gap-2 group"
                                          >
                                            <span className="text-[#4BB3A4] mt-1.5 flex-shrink-0">
                                              •
                                            </span>
                                            <input
                                              type="text"
                                              value={point}
                                              onChange={(e) =>
                                                updateKeyPoint(
                                                  partIndex,
                                                  chapterIndex,
                                                  pointIndex,
                                                  e.target.value
                                                )
                                              }
                                              className="flex-1 bg-transparent border-none outline-none focus:bg-neutral-50 dark:focus:bg-neutral-700 focus:px-2 focus:py-1 focus:rounded-md transition-all"
                                            />
                                            <button
                                              onClick={() =>
                                                removeKeyPoint(
                                                  partIndex,
                                                  chapterIndex,
                                                  pointIndex
                                                )
                                              }
                                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                              title="Remove key point"
                                            >
                                              <Minus size={12} />
                                            </button>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add Chapter Button */}
                            <button
                              onClick={() => addChapter(partIndex)}
                              className="w-full p-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-500 hover:text-[#4BB3A4] hover:border-[#4BB3A4] transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
                              Add Chapter
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Part Button */}
                      <button
                        onClick={addPart}
                        className="w-full p-3 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-500 hover:text-[#F5B942] hover:border-[#F5B942] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Add Part
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowOutlineModal(false);
                  setOutlineNotes("");
                  setGeneratedOutline(null);
                }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {generatedOutline && (
                <button
                  onClick={acceptOutline}
                  className="px-4 py-2 text-sm font-medium bg-[#F5B942] text-[#1C2B3A] hover:bg-[#e6a73a] rounded-lg transition-colors"
                >
                  Add to Outline
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
