"use client";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  kind: z.enum(["fiction", "non-fiction"]),
  title: z.string().optional(),
  description: z.string().optional(),
  plot: z.string().optional(),
});

export default function NewProject() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<z.infer<typeof formSchema>>({ kind: "fiction" });
  const [loading, setLoading] = useState(false);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const body = formSchema.parse(form);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = await res.json();
      router.push(`/app/project/${data.id}`);
    } catch (e) {
      console.error(e);
      alert("Could not create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-serif mb-6">New Project</h1>

      {step === 1 && (
        <div className="space-y-4">
          <div className="font-medium">Select type</div>
          <div className="flex gap-4">
            {(["fiction", "non-fiction"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setForm((f) => ({ ...f, kind: k }))}
                className={`px-4 py-2 rounded-lg border ${form.kind === k ? "bg-[#1C2B3A] text-white" : "bg-white"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={next} className="px-4 py-2 rounded-lg bg-[#F5B942] text-[#1C2B3A]">Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <label className="block">
            <div className="mb-1">Title (optional)</div>
            <input className="w-full rounded-lg border p-2" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="block">
            <div className="mb-1">Description (optional)</div>
            <textarea className="w-full rounded-lg border p-2" rows={4} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          <div className="flex justify-between">
            <button onClick={back} className="px-4 py-2 rounded-lg border">Back</button>
            <button onClick={next} className="px-4 py-2 rounded-lg bg-[#F5B942] text-[#1C2B3A]">Next</button>
          </div>
        </div>
      )}

      {step === 3 && form.kind === "fiction" && (
        <div className="space-y-4">
          <label className="block">
            <div className="mb-1">High-level plot (optional)</div>
            <textarea className="w-full rounded-lg border p-2" rows={6} value={form.plot ?? ""} onChange={(e) => setForm((f) => ({ ...f, plot: e.target.value }))} />
          </label>
          <div className="flex justify-between">
            <button onClick={back} className="px-4 py-2 rounded-lg border">Back</button>
            <button disabled={loading} onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-[#1C2B3A] text-white">Create</button>
          </div>
        </div>
      )}

      {step === 3 && form.kind === "non-fiction" && (
        <div className="space-y-4">
          <div className="text-neutral-600 dark:text-neutral-300">You can add more details later.</div>
          <div className="flex justify-between">
            <button onClick={back} className="px-4 py-2 rounded-lg border">Back</button>
            <button disabled={loading} onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-[#1C2B3A] text-white">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
