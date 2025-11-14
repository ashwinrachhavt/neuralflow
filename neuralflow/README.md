# NeuralFlow

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
- `prisma/seed.ts` – demo entities (user, board, task, note)
- `src/lib/prisma.ts` – Prisma client singleton
- `src/lib/get-or-create-user.ts` – Clerk ↔️ database bridge

---

Happy shipping!
