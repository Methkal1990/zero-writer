"use client";
import { useState } from "react";
import { BookOpenText, MessageSquare, Files } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./editor/Editor"), { ssr: false });
const ChatPanel = dynamic(() => import("./chat/ChatPanel"), { ssr: false });
const StructurePanel = dynamic(() => import("./structure/StructurePanel"), {
  ssr: false,
});

export type Project = {
  id: string;
  kind: string;
  title: string | null;
  description: string | null;
};

export default function Workspace({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<"chat" | "editor" | "structure">(
    "editor"
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);

  return (
    <div className="h-[calc(100vh-0px)] grid grid-cols-12 gap-4 p-4">
      {/* Left Panel - AI Chat */}
      <div className="col-span-3 hidden lg:flex flex-col min-h-0 rounded-xl bg-white dark:bg-neutral-900 shadow-sm border">
        <div className="p-3 border-b text-sm font-medium flex items-center gap-2 flex-shrink-0">
          <MessageSquare size={16} /> AI Chat
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatPanel
            projectId={project.id}
            selectedChapterId={selectedNodeId}
          />
        </div>
      </div>

      {/* Middle Panel - Editor */}
      <div className="col-span-12 lg:col-span-6 rounded-xl bg-white dark:bg-neutral-900 shadow-sm border flex flex-col min-h-0">
        <div className="p-3 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <BookOpenText size={16} /> {project.title ?? "Untitled Project"}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              Font
              <input
                type="range"
                min={14}
                max={24}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </label>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Editor
            projectId={project.id}
            nodeId={selectedNodeId}
            fontSize={fontSize}
          />
        </div>
      </div>

      {/* Right Panel - Project Structure */}
      <div className="col-span-3 hidden lg:flex flex-col min-h-0 rounded-xl bg-white dark:bg-neutral-900 shadow-sm border">
        <div className="p-3 border-b text-sm font-medium flex items-center gap-2 flex-shrink-0">
          <Files size={16} /> Project
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <StructurePanel
            projectId={project.id}
            selectedId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden col-span-12 grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`p-2 rounded-lg border ${
            activeTab === "chat" ? "bg-[#F5B942] text-[#1C2B3A]" : ""
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("editor")}
          className={`p-2 rounded-lg border ${
            activeTab === "editor" ? "bg-[#F5B942] text-[#1C2B3A]" : ""
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab("structure")}
          className={`p-2 rounded-lg border ${
            activeTab === "structure" ? "bg-[#F5B942] text-[#1C2B3A]" : ""
          }`}
        >
          Structure
        </button>
        <div
          className="col-span-3 rounded-xl bg-white dark:bg-neutral-900 shadow-sm border p-2 min-h-0 overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {activeTab === "chat" && (
            <ChatPanel
              projectId={project.id}
              selectedChapterId={selectedNodeId}
            />
          )}
          {activeTab === "editor" && (
            <Editor
              projectId={project.id}
              nodeId={selectedNodeId}
              fontSize={fontSize}
            />
          )}
          {activeTab === "structure" && (
            <StructurePanel
              projectId={project.id}
              selectedId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
