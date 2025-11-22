# Dao

Productivity workspace built with Next.js App Router, Clerk auth, and Prisma.

## Prerequisites

- Node.js 20.19.0 (use `nvm use 20.19.0`)
- Docker Desktop or compatible container runtime
- npm 10+

## 1. Local Postgres (with pgvector)

```bash
npm run db:bootstrap
```

This script will:

1. Start an `ankane/pgvector` container on `localhost:5432`.
2. Generate the Prisma client.
3. Apply existing migrations, or push the schema on the first run.
4. Seed demo data (board, task, note).

If you prefer manual control, the underlying Docker service uses these credentials:

```
POSTGRES_DB=neuralflow
POSTGRES_USER=neuralflow
POSTGRES_PASSWORD=neuralflow
```

Stop the container at any time with `npm run db:down`.

## 2. Environment Variables

Copy the sample file and adjust as needed:

```bash
cp .env.example .env.local
```

At minimum set:

- `DATABASE_URL` (local connection already supplied)
- `SHADOW_DATABASE_URL` (for Prisma migrations)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`

Optional seed helpers (for Clerk + tenant seeding in `prisma/seed.ts`):

- Demo user (sample data): `SEED_CLERK_USER_ID`, `SEED_CLERK_NAME`, `SEED_CLERK_EMAIL`, `SEED_CLERK_IMAGE`
- Ashwin (your real Clerk account): `SEED_ASHWIN_USER_ID`, `SEED_ASHWIN_NAME`, `SEED_ASHWIN_EMAIL`, `SEED_ASHWIN_IMAGE`
- Tenant metadata: `SEED_TENANT_SLUG`, `SEED_TENANT_NAME`

## 3. Prisma Setup

Generate client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

The initial migration creates all tables described in `prisma/schema.prisma` and enables the `vector` extension.

Inspect sample data without leaving the terminal:

```bash
npm run db:show
```

You can still run commands individually:

```bash
npm run db:up
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

## 4. Development Server

Install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The app expects a Clerk session; use the built-in `/sign-in` and `/sign-up` routes.

## 5. Database Utilities

- Connect via psql: `npm run db:psql`
- Clean volume: `npm run db:down && docker volume rm neuralflow-db-data`

## 6. Switching to Supabase Later

1. Create a Supabase project and enable the `vector` extension.
2. Copy the provided connection string (non-pooled) into `DATABASE_URL`.
3. Deploy existing schema: `npm run prisma:migrate -- --name supabase-initial && npm run prisma:migrate deploy`.
4. Update `.env.local` with Supabase keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) if you plan to use Supabase client SDK.
5. Remove local Docker container or keep it for offline dev.

## 7. Key Files

- `docker-compose.yml` – local Postgres + pgvector
- `prisma/schema.prisma` – data models
- `prisma/seed.ts` – demo entities and optional Clerk profile + tenant seed
- `src/lib/prisma.ts` – Prisma client singleton
- `src/lib/get-or-create-user.ts` – Clerk ↔️ database bridge
- `src/lib/tenancy.ts` – helper to create a default tenant + membership for a user

---

## 8. Analytics

- **Vercel Analytics** – the app now loads `@vercel/analytics/react` in `src/app/layout.tsx`, so any deployment that enables Vercel Web Analytics will start receiving page views without additional code. Just flip the analytics toggle for this project inside the Vercel dashboard.
- **Free product analytics (Plausible)** – a lightweight Plausible snippet loads whenever `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. To use it:
  1. Sign up at [https://plausible.io](https://plausible.io) (free for small apps) and add your domain.
  2. Add a `.env.local` entry like `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourcustomdomain.com`.
  3. Restart the dev server so the client component picks up the variable.
  4. Plausible automatically tracks SPA navigation, and the component reruns `plausible("pageview")` whenever the Next.js path or query string changes.
- **Custom product signals** – `src/hooks/use-product-analytics.ts` exposes a `trackEvent` helper that mirrors events to both Vercel Analytics and Plausible (if enabled). The Flomodor todo widget (`src/components/todos/flomodor.tsx`) now tracks quick adds, completions, deletes, AI enrich requests, and card openings so you can see how people move tasks through the workflow. Use it elsewhere like:

```tsx
const { trackEvent } = useProductAnalytics();
trackEvent("note_create", { surface: "daily-brief" });
```

If you ever switch to another provider, replace the `ProductAnalytics` component or gate it behind a different env var so only one script is injected.

Happy shipping!

## 9. Deploying on Vercel

The repo now includes everything needed for a one-click Vercel flow:

- `vercel.json` pins Node 20, reuses the PNPM scripts (`pnpm run build`/`pnpm run dev`), and disables the default telemetry so local and hosted behavior match.
- `.github/workflows/vercel-deploy.yml` runs lint + build on every push/PR and, after successful checks, deploys through the Vercel CLI. Preview deployments run for feature branches, while pushes to `main` promote the build with `--prod`.

### Required secrets

Add these GitHub Actions secrets (Settings → Secrets → Actions):

- `VERCEL_TOKEN` – Personal token from the Vercel dashboard.
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` – Find them via `vercel whoami --scope <org>` and `vercel projects ls`, or copy from the project settings UI.

Once the secrets exist, the workflow will automatically:

1. Pull the right environment configuration (`vercel pull --environment preview|production`).
2. Build the project with Turbopack (`vercel build`).
3. Publish the prebuilt artifacts (`vercel deploy --prebuilt [--prod]`).

You can still deploy manually with the Vercel Git integration, but keeping this workflow ensures every deployment passes the same lint/build gates you use locally (`pnpm lint`, `pnpm build`).
