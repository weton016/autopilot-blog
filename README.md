# Automated Blog — Next.js + OpenAI + Unsplash + Supabase

An AI-powered blog that automatically generates SEO-optimized content, fetches cover images via Unsplash, and publishes posts on a schedule using Vercel Cron Jobs. Built to work as an organic acquisition channel for any SaaS product.

## How it works

```
Every Monday at 06:00 UTC:
  → Researches relevant keywords (DataForSEO)
  → Plans the week's posts (TOP / MIDDLE / BOTTOM of funnel)
  → Saves scheduled jobs to the database

Every day at 08:00 UTC:
  → Picks up pending jobs for the day
  → Generates full post content (OpenAI GPT-4o)
  → Finds a relevant cover image (Unsplash + GPT-4o-mini)
  → Publishes the post with full SEO (meta, OG tags, JSON-LD)
```

Posts cover all three stages of the sales funnel:
- **TOP** — educational, raises awareness of the problem
- **MIDDLE** — comparative, helps evaluate solutions
- **BOTTOM** — persuasive, converts readers who are ready to decide

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Text generation | OpenAI GPT-4o |
| Image query generation | OpenAI GPT-4o-mini |
| Cover images | Unsplash API |
| Keyword research | DataForSEO |
| Styling | Tailwind CSS + shadcn/ui |
| Deploy & Cron | Vercel |

## Prerequisites

- Node.js 20+ or Bun
- [Supabase](https://supabase.com) account
- [OpenAI](https://platform.openai.com/api-keys) API key
- [Unsplash](https://unsplash.com/developers) API key
- [DataForSEO](https://dataforseo.com) credentials (optional — improves post quality)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd personal-blog
bun install   # or npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used by cron jobs) |
| `OPENAI_API_KEY` | OpenAI API key |
| `UNSPLASH_ACCESS_KEY` | Unsplash access key |
| `DATAFORSEO_LOGIN` | DataForSEO login (optional) |
| `DATAFORSEO_PASSWORD` | DataForSEO password (optional) |
| `BLOG_TOPIC` | Description of your product/niche for AI context |
| `WEBSITE_URL` | Your site URL (e.g. `https://mysite.com`) |
| `NEXT_PUBLIC_WEBSITE_URL` | Same URL, exposed to the client |
| `POSTS_PER_DAY` | How many posts to generate per day (default: `3`) |
| `POST_CREATION_INTERVAL_DAYS` | Days between generation runs (default: `7`) |
| `CONTENT_LANGUAGE` | Content language (e.g. `pt-BR` or `en-US`) |
| `CRON_SECRET` | Secret to authenticate cron job requests |

To generate a secure `CRON_SECRET`:

```bash
bun run generate:secret
```

### 3. Set up the database

Run the migrations in the Supabase SQL editor or via CLI:

```bash
# Via Supabase CLI
supabase db push

# Or paste manually in the Supabase SQL Editor, in this order:
# supabase/migrations/001_blog.sql      → core tables
# supabase/migrations/002_storage.sql   → image bucket
# supabase/migrations/003_rls.sql       → Row Level Security policies
```

### 4. Run locally

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Triggering cron jobs manually

To test the full pipeline without waiting for the schedule:

```bash
# Plan the week's posts (run this before daily)
bun run cron:weekly

# Generate and publish the day's posts
bun run cron:daily
```

> These scripts use the `CRON_SECRET` from your `.env.local`. Make sure the local server is running (`bun run dev`).

## Deploying to Vercel

1. Import the repository in Vercel
2. Set all environment variables in the Vercel dashboard
3. The `vercel.json` file configures cron jobs automatically:
   - **Weekly** — every Monday at 06:00 UTC (`/api/cron/weekly-scheduler`)
   - **Daily** — every day at 08:00 UTC (`/api/cron/daily-executor`)

> Vercel Cron Jobs require a **Pro** plan or higher.

## Project structure

```
.
├── app/
│   ├── (blog)/
│   │   ├── page.tsx              # Home page with infinite scroll
│   │   └── [slug]/page.tsx       # Individual post page
│   └── api/
│       ├── cron/
│       │   ├── weekly-scheduler/ # Plans the week's jobs
│       │   └── daily-executor/   # Runs daily content generation
│       └── posts/                # Pagination API
├── src/
│   ├── domain/                   # Entities and business rules
│   ├── application/              # Use cases and DTOs
│   └── infrastructure/
│       ├── ai/                   # OpenAI, Unsplash, Gemini (backup)
│       ├── repositories/         # Supabase data access
│       ├── seo/                  # MetadataFactory, StructuredData
│       └── storage/              # Image upload
└── supabase/
    └── migrations/               # Database schema and policies
```

## Alternative image source: Google Imagen

The project includes `GeminiImageGenerator` as a drop-in alternative to Unsplash. To switch:

1. Set `GEMINI_API_KEY` and `GEMINI_IMAGE_MODEL=imagen-4.0-generate-001` in `.env.local`
2. In `app/api/cron/daily-executor/route.ts`, replace:

```ts
// From:
import { UnsplashImageGenerator } from '@/src/infrastructure/ai/UnsplashImageGenerator';
const imageGenerator = new UnsplashImageGenerator();
// buildImagePrompt: (t, e) => promptBuilder.buildUnsplashQuery(t, e)

// To:
import { GeminiImageGenerator } from '@/src/infrastructure/ai/GeminiImageGenerator';
const imageGenerator = new GeminiImageGenerator();
// buildImagePrompt: (t, e) => promptBuilder.buildImagePrompt(t, e)
```

## Testing

```bash
bun run test           # run all tests
bun run test:watch     # watch mode
bun run test:coverage  # with coverage report
```
