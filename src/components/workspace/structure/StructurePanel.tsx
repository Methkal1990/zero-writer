"use client";
import { useEffect, useMemo, useState } from "react";

type NodeKind = "folder" | "file" | "chapter";
interface Node { id: string; parent_id: string | null; kind: NodeKind; name: string; chapter_id: string | null }

export default function StructurePanel({ projectId, selectedId, onSelectChapter }: { projectId: string; selectedId: string | null; onSelectChapter: (id: string) => void }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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

  const createNode = async (kind: NodeKind) => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const current = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null;
      const parentId = current ? (current.kind === "folder" ? current.id : current.parent_id) : null;
      const res = await fetch(`/api/projects/${projectId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, kind, name: newName.trim() })
      });
      if (res.ok) {
        setNewName("");
        await reload();
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
        <div key={n.id} style={{ paddingLeft: depth * 12 }} className={`flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 ${selectedNodeId===n.id ? 'bg-neutral-100 dark:bg-neutral-800':''}`}>
          <button
            className="text-left flex-1 text-sm"
            onClick={() => { setSelectedNodeId(n.id); if (n.kind === 'chapter' && n.chapter_id) onSelectChapter(n.chapter_id); }}
          >
            {renamingId === n.id ? (
              <input autoFocus value={renameVal} onChange={(e)=> setRenameVal(e.target.value)} onBlur={()=> renameNode(n.id)} onKeyDown={(e)=> { if (e.key==='Enter') renameNode(n.id); }} className="rounded border px-1 py-0.5 text-sm w-full" />
            ) : (
              <span>{n.kind === 'folder' ? '📁 ' : n.kind === 'chapter' ? '📄 ' : '📝 '} {n.name}</span>
            )}
          </button>
          {renamingId !== n.id && (
            <button onClick={()=> { setRenamingId(n.id); setRenameVal(n.name); }} className="text-xs text-neutral-500">Rename</button>
          )}
        </div>
      ))}
      {childrenOf(parentId).filter(n => n.kind === 'folder').map(f => (
        <div key={`${f.id}-children`}>
          {renderList(f.id, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-2 space-y-3">
      <div className="flex items-center gap-2">
        <input value={newName} onChange={(e)=> setNewName(e.target.value)} placeholder="New name" className="flex-1 rounded border p-1 text-sm" />
        <button disabled={loading} onClick={()=> createNode('folder')} className="px-2 py-1 rounded border text-sm">+ Folder</button>
        <button disabled={loading} onClick={()=> createNode('file')} className="px-2 py-1 rounded border text-sm">+ File</button>
        <button disabled={loading} onClick={()=> createNode('chapter')} className="px-2 py-1 rounded border text-sm">+ Chapter</button>
      </div>

      <div className="text-xs text-neutral-500">Select a folder to create inside it. If a file is selected, new items are created alongside it.</div>

      {renderList(null)}
    </div>
  );
}
