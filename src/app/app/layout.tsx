import { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#121212] text-[#1C2B3A] dark:text-white">
      {children}
    </div>
  );
}
