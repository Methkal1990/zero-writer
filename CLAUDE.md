# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the ZeroWriter codebase.

## Quick Reference

### Development Commands
- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Environment Setup
Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase project
- `OPENAI_API_KEY` for AI features (GPT-4o-mini)
- `ALLOWED_ORIGINS` for API security (optional)

Run `supabase.sql` in Supabase SQL Editor to create database schema with RLS policies.

## Project Overview

**What is ZeroWriter?**  
An AI-assisted book writing web app that helps authors overcome writer's block, speed up drafting, and structure their books using AI brainstorming, chapter generation, and real-time autocomplete.

**Target Users:**
- Professional authors wanting faster first drafts
- Aspiring writers needing structure and creative momentum

## Technical Architecture

### Tech Stack
- **Framework:** Next.js 15 with App Router
- **Database/Auth:** Supabase (Google OAuth only)
- **Rich Text:** TipTap editor
- **AI:** OpenAI GPT-4o with Vercel AI SDK
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Validation:** Zod

### Database Schema (Supabase)
- `projects` - User's writing projects (fiction/non-fiction)
- `chapters` - Individual chapters with content
- `project_nodes` - Hierarchical structure (folders/files/chapters)
- Row Level Security (RLS) enforces per-user data access

### Application Structure
- `/app` - Public pages (landing, auth)
- `/app/app` - Protected application workspace
- `/components/workspace` - Main editing interface:
  - `Editor.tsx` - TipTap rich text editor with AI integration
  - `ChatPanel.tsx` - AI chat assistant for writing help
  - `StructurePanel.tsx` - Project/chapter navigation

### API Routes (`/api`)
- `/ai/*` - OpenAI integration (autocomplete, chat, chapter generation)
- `/projects/*` - Project CRUD with ownership validation
- `/chapters/*` - Chapter management
- `/auth/callback` - Supabase authentication

### Security & Authentication
- Google OAuth via Supabase
- Server-side session validation + client-side auth state management
- RLS policies enforce data isolation
- Server routes validate project ownership
- CORS protection via `ALLOWED_ORIGINS`
- Security headers in middleware

## User Experience & Features

### Core User Journey
1. User logs in and starts a New Project
2. Selects fiction or non-fiction
3. Adds book details (title, description, optional plot for fiction) – all skippable
4. Lands in the Main Workspace:
   - **Left:** AI Chat Panel for book Q&A, brainstorming, and idea generation
   - **Center:** Rich Text Editor with AI autocomplete (multiple suggestions) and manual writing
   - **Right:** Project Structure Panel with chapters, plot, worldbuilding, AI instructions, etc.
5. Users can generate a chapter draft from notes, edit inline, and continue writing

### Key Features (v1)
- Project creation wizard (fiction/non-fiction, title, description, optional plot)
- AI chat panel (side-by-side with editor)
- Rich text editor (TipTap) with AI autocomplete and multiple suggestion options
- Chapter generator from user notes
- Project structure panel (files/folders for chapters, plot, worldbuilding, AI instructions)
- Skippable setup steps for flexibility

### Out of Scope (v1)
- Collaboration features
- Version history
- Export formats
- Custom AI style/tone settings

## Design Guidelines

### Visual Style
- **Overall:** Minimalist, distraction-free writing environment with subtle hints of creativity
- **Focus:** Clarity and spacious layouts

### Color Palette
- **Primary:** Deep ink blue (#1C2B3A) – focus & professionalism
- **Accent:** Warm gold (#F5B942) – creativity & achievement  
- **Background:** Soft off-white (#FAF9F6) light mode, charcoal grey (#121212) dark mode
- **Highlight/Selection:** Muted teal (#4BB3A4) – inspiring but calm

### Typography
- **Headings:** Merriweather (serif, classic literary feel)
- **Body:** Inter or Source Sans Pro (clean, readable, modern)
- **Editor Text:** Adjustable font size, default Merriweather for book-like writing experience

### UI Elements
- **Corners:** Rounded (8–12px)
- **Shadows:** Subtle depth effects
- **Interactions:** Gentle color shifts on hover
- **Dark Mode:** Reduced glare, high-contrast text
- **Icons:** Lucide React (line-based, modern, lightweight)
- **Animations:** Smooth, minimal transitions (avoid flashy effects)

## Implementation Guidelines

### Development Principles
- **No Mock Data:** Start with production-ready implementation
- **Research First:** Use web search for documentation/debugging when needed  
- **Verification:** Create/run scripts to verify functionality
- **Security First:** Close security gaps proactively
- **Documentation:** Create detailed docs when needed

### Database Requirements
- Add all SQL queries to single file
- Include security policies (RLS)
- Google OAuth only for v1
