import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

export function ensureAllowedOrigin(request: NextRequest) {
  const allowed = env.getAllowedOrigins(env.client.NEXT_PUBLIC_SITE_URL);
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  if (!origin) return;
  try {
    const url = new URL(origin);
    const ok = allowed.some((o) => {
      try {
        const a = new URL(o);
        return a.origin === url.origin;
      } catch {
        return false;
      }
    });
    if (!ok) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
  }
}
