import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Project = {
  id: string;
  title: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AppHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Your Projects</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            {projects?.length
              ? "Continue writing or start something new."
              : "Create a new project to start writing."}
          </p>
        </div>
        <Link
          href="/app/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-3 bg-[#F5B942] text-[#1C2B3A] hover:bg-[#e2a83b] transition shadow font-medium"
        >
          New Project
        </Link>
      </div>

      {projects?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              href={`/app/project/${project.id}`}
              className="block p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-[#F5B942] dark:hover:border-[#F5B942] transition-colors shadow-sm hover:shadow-md"
            >
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {project.title || "Untitled Project"}
              </h3>
              {project.description && (
                <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Updated {formatDate(project.updated_at)}</span>
                <span className="text-[#F5B942]">Fiction</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-neutral-400 dark:text-neutral-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            No projects yet
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Start your writing journey by creating your first project.
          </p>
          <Link
            href="/app/new"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 bg-[#F5B942] text-[#1C2B3A] hover:bg-[#e2a83b] transition shadow font-medium"
          >
            Create Your First Project
          </Link>
        </div>
      )}
    </div>
  );
}
