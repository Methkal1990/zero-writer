import Link from "next/link";

export default function AppHome() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-serif mb-3">Your Projects</h1>
      <p className="mb-8 text-neutral-600 dark:text-neutral-300">Create a new project to start writing.</p>
      <Link
        href="/app/new"
        className="inline-flex items-center gap-2 rounded-lg px-4 py-3 bg-[#F5B942] text-[#1C2B3A] hover:bg-[#e2a83b] transition shadow"
      >
        New Project
      </Link>
    </div>
  );
}
