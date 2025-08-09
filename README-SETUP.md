ZeroWriter – Setup Guide

Prerequisites
- Node.js 18+
- Supabase project (Organization + Project)
- Google OAuth set up in Supabase

Environment
1) Copy .env.example to .env.local and fill:

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL=... from Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY=... from Supabase project
OPENAI_API_KEY=sk-...

Optional: restrict API origins
ALLOWED_ORIGINS=http://localhost:3000 https://yourdomain.com

Database
1) In Supabase SQL Editor, run supabase.sql from repo root to create tables and RLS policies.
2) Confirm RLS is enabled on projects and chapters tables and policies exist.

Auth (Google)
1) In Supabase Dashboard → Authentication → Providers → Google → Enable
2) Authorized redirect URL:
   - http://localhost:3000/auth/callback
   - https://yourdomain.com/auth/callback (for production)

Local Development
- Install deps: npm install
- Run dev server: npm run dev
- Open http://localhost:3000

Deploy
- Set the same env vars on your hosting (Vercel recommended)
- Ensure the domain is added to ALLOWED_ORIGINS

Notes
- RLS enforces per-user data access; server-side API routes also validate project ownership.
- Avoid committing .env files; .gitignore is configured.
- AI features call OpenAI GPT-4o-mini via server routes; they require OPENAI_API_KEY.
