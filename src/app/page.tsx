import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 bg-[#FAF9F6] dark:bg-[#121212] text-[#1C2B3A] dark:text-white">
      <main className="max-w-3xl mx-auto flex flex-col gap-6 items-start">
        <h1 className="text-4xl font-serif">ZeroWriter</h1>
        <p className="text-neutral-600 dark:text-neutral-300">AI-assisted writing workspace for drafting books.</p>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="rounded-lg px-4 py-3 bg-[#1C2B3A] text-white hover:bg-[#2a3e56] transition shadow">Get started</Link>
          <a href="https://github.com" className="rounded-lg px-4 py-3 border">GitHub</a>
        </div>
      </main>
    </div>
  );
}
