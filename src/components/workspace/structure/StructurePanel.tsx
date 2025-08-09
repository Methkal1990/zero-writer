"use client";
import { useEffect, useMemo, useState } from "react";
import { Folder, File, BookOpen, Edit2, Plus } from "lucide-react";

type NodeKind = "folder" | "file" | "chapter";
interface Node { id: string; parent_id: string | null; kind: NodeKind; name: string; chapter_id: string | null; content: string | null }

export default function StructurePanel({ projectId, selectedId, onSelectNode }: { projectId: string; selectedId: string | null; onSelectNode: (id: string) => void }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");

  const reload = async () => {
    const res = await fetch(`/api/projects/${projectId}/nodes`);
    if (res.ok) {
      const data = await res.json();
      setNodes(data.nodes);
    }
  };

  useEffect(() => { reload(); }, [projectId]);

  const tree = useMemo(() => {
    const byParent: Record<string, Node[]> = {};
    for (const n of nodes) {
      const k = n.parent_id ?? "root";
      (byParent[k] ||= []).push(n);
    }
    return byParent;
  }, [nodes]);

  const childrenOf = (parentId: string | null) => (tree[parentId ?? "root"] ?? []);

  // Check if a node is under the "draft" folder (making it a chapter)
  const isNodeAChapter = (node: Node): boolean => {
    if (node.kind === 'folder') return false;
    
    // Find the draft folder
    const draftFolder = nodes.find(n => n.name === 'draft' && n.kind === 'folder' && !n.parent_id);
    if (!draftFolder) return false;

    // Check if this node or any of its ancestors is the draft folder
    let current: Node | undefined = node;
    while (current) {
      if (current.parent_id === draftFolder.id || current.id === draftFolder.id) {
        return true;
      }
      current = nodes.find(n => n.id === current?.parent_id);
    }
    return false;
  };

  const createNode = async (kind: NodeKind) => {
    setLoading(true);
    try {
      const current = selectedId ? nodes.find(n => n.id === selectedId) ?? null : null;
      const parentId = current ? (current.kind === "folder" ? current.id : current.parent_id) : null;
      
      // Generate untitled name based on type
      const untitledName = kind === 'folder' ? 'Untitled Folder' : 'Untitled File';
      
      const res = await fetch(`/api/projects/${projectId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, kind, name: untitledName })
      });
      if (res.ok) {
        const data = await res.json();
        await reload();
        // Auto-trigger rename for the newly created node
        if (data.id) {
          setRenamingId(data.id);
          setRenameVal(untitledName);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const renameNode = async (nodeId: string) => {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    const res = await fetch(`/api/projects/${projectId}/nodes?nodeId=${nodeId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renameVal.trim() }) });
    if (res.ok) {
      setRenamingId(null);
      setRenameVal("");
      await reload();
    }
  };

  const renderList = (parentId: string | null, depth = 0) => (
    <div className="space-y-1">
      {childrenOf(parentId).map((n) => (
        <div key={n.id}>
          <div 
            style={{ paddingLeft: depth * 16 }} 
            className={`
              group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
              ${selectedId === n.id 
                ? 'bg-[#F5B942] text-[#1C2B3A] shadow-sm' 
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:shadow-sm'
              }
            `}
          >
            <button
              className="text-left flex-1 flex items-center gap-2 text-sm font-medium"
              onClick={() => { onSelectNode(n.id); }}
            >
              {renamingId === n.id ? (
                <input 
                  autoFocus 
                  value={renameVal} 
                  onChange={(e)=> setRenameVal(e.target.value)} 
                  onBlur={()=> renameNode(n.id)} 
                  onKeyDown={(e)=> { if (e.key==='Enter') renameNode(n.id); }} 
                  className="rounded-md border border-neutral-300 dark:border-neutral-600 px-2 py-1 text-sm w-full bg-white dark:bg-neutral-800" 
                />
              ) : (
                <>
                  {n.kind === 'folder' ? (
                    <Folder size={16} className="text-[#4BB3A4] flex-shrink-0" />
                  ) : isNodeAChapter(n) ? (
                    <BookOpen size={16} className="text-[#F5B942] flex-shrink-0" />
                  ) : (
                    <File size={16} className="text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                  )}
                  <span className="truncate">{n.name}</span>
                </>
              )}
            </button>
            {renamingId !== n.id && (
              <button 
                onClick={()=> { setRenamingId(n.id); setRenameVal(n.name); }} 
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700"
                title="Rename"
              >
                <Edit2 size={14} className="text-neutral-500 dark:text-neutral-400" />
              </button>
            )}
          </div>
          {n.kind === 'folder' && renderList(n.id, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button 
            disabled={loading} 
            onClick={()=> createNode('folder')} 
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium transition-colors hover:bg-[#4BB3A4] hover:text-white hover:border-[#4BB3A4] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            <Folder size={14} />
            Folder
          </button>
          <button 
            disabled={loading} 
            onClick={()=> createNode('file')} 
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium transition-colors hover:bg-neutral-600 hover:text-white hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            <File size={14} />
            File
          </button>
        </div>
      </div>

      <div className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        💡 Click to create, then rename. Files in <span className="font-medium text-[#F5B942]">draft</span> folder become chapters automatically.
      </div>

      <div className="space-y-1">
        {renderList(null)}
      </div>
    </div>
  );
}
