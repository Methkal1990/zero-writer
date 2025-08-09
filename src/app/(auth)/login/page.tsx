"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // no-op
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#121212] text-[#1C2B3A] dark:text-white">
      <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white/90 dark:bg-neutral-900">
        <h1 className="text-3xl font-serif mb-6">ZeroWriter</h1>
        <p className="mb-6 text-neutral-600 dark:text-neutral-300">Sign in to start writing.</p>
        <button
          disabled={loading}
          onClick={signInWithGoogle}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-[#1C2B3A] text-white hover:bg-[#2a3e56] transition shadow"
        >
          <LogIn size={18} /> Sign in with Google
        </button>
        <div className="text-xs text-neutral-500 mt-6">
          By continuing, you agree to our <Link href="#">Terms</Link> and <Link href="#">Privacy</Link>.
        </div>
      </div>
    </div>
  );
}
