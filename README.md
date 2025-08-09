# ZeroWriter

An AI-assisted book writing web application that helps authors overcome writer's block, speed up drafting, and structure their books using AI brainstorming, chapter generation, and real-time autocomplete.

## Overview

ZeroWriter is designed for professional authors wanting faster first drafts and aspiring writers needing structure and creative momentum. The application provides a distraction-free writing environment with intelligent AI assistance to enhance the creative writing process.

### Key Features

- **AI Chat Assistant**: Side-by-side chat panel for brainstorming, Q&A, and creative idea generation
- **Smart Autocomplete**: Real-time AI-powered writing suggestions with multiple options
- **Chapter Generator**: Create chapter drafts from your notes and outlines
- **Project Structure**: Organize chapters, plot elements, worldbuilding, and AI instructions
- **Rich Text Editor**: Clean, book-like writing experience with TipTap editor
- **Flexible Setup**: Skip any setup steps and start writing immediately

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database & Auth**: Supabase with Google OAuth
- **Rich Text Editor**: TipTap
- **AI**: OpenAI GPT-4o with Vercel AI SDK
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Validation**: Zod
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd zerowriter
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: API Security
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

4. Set up the database:

   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of `supabase.sql` to create the database schema with Row Level Security policies

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Available Scripts

- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Authentication pages
│   ├── api/                # API routes
│   │   ├── ai/             # OpenAI integration
│   │   ├── projects/       # Project CRUD
│   │   ├── chapters/       # Chapter management
│   │   └── auth/           # Auth callback
│   └── app/                # Protected application workspace
├── components/
│   └── workspace/          # Main editing interface
│       ├── Editor.tsx      # TipTap rich text editor
│       ├── ChatPanel.tsx   # AI chat assistant
│       └── StructurePanel.tsx # Project navigation
├── lib/
│   └── supabase/           # Supabase client configuration
└── middleware.ts           # Auth and security middleware
```

### Database Schema

The application uses Supabase with the following main tables:

- `projects` - User's writing projects (fiction/non-fiction)
- `chapters` - Individual chapters with content
- `project_nodes` - Hierarchical structure (folders/files/chapters)

All tables implement Row Level Security (RLS) to ensure users can only access their own data.

### Authentication

- Google OAuth via Supabase
- Server-side session validation
- Client-side auth state management
- Automatic redirects for protected routes

### AI Integration

- OpenAI GPT-4o for text generation and assistance
- Vercel AI SDK for streaming responses
- Real-time autocomplete with multiple suggestions
- Context-aware chat assistance

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the existing code style
4. Run linting: `npm run lint`
5. Test your changes thoroughly
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Open a Pull Request using our PR template

### Development Guidelines

- Follow the existing code conventions and patterns
- Ensure all new features work with the authentication system
- Test database changes with RLS policies
- Verify AI features work correctly
- Update documentation as needed

## Security

- Row Level Security (RLS) enforces data isolation
- Server routes validate project ownership
- CORS protection via `ALLOWED_ORIGINS`
- Security headers in middleware
- No sensitive data in client-side code

## License

This project is private and proprietary.

## Support

For questions or support, please open an issue in the GitHub repository.
