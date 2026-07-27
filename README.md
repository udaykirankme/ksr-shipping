# KSR Shipping Services

A full-stack Next.js application for KSR Shipping Services — public marketing site, shipment tracking, and admin dashboard in a single deployable app.

## Architecture

This project uses the **full-stack Next.js** pattern (App Router + Route Handlers):

```
src/
├── app/              # Pages and UI (App Router)
├── app/api/          # API routes (same origin, no separate server)
├── server/           # Express route handlers (mounted via Next.js API)
├── lib/              # Shared utilities, config, Prisma client
prisma/               # Database schema and seed
public/               # Static assets
```

**Why this structure?** Major companies (Vercel, Linear, Cal.com, etc.) use a single Next.js app with colocated API routes for faster development, simpler deployment, and no cross-origin complexity.

## Prerequisites

- Node.js 18+
- PostgreSQL (Docker Compose included)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL**
   ```bash
   npm run db:up
   ```
   Or use your own PostgreSQL instance and update `.env`.

3. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start development**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Demo Credentials

- **Admin URL**: http://localhost:3000/admin/login
- **Username**: `admin`
- **Password**: `admin123` (seed script message may say password123 — use admin123)
- **Sample tracking IDs**: `1234567890`, `0987654321`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (required on Vercel) |
| `JWT_SECRET` | Secret for admin auth tokens |
| `NEXT_PUBLIC_APP_URL` | Optional. Base URL for server-side API calls |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:setup` | Push schema and seed demo data |
| `npm run db:up` | Start PostgreSQL via Docker |

## Deploying to Vercel

1. In Vercel project **Settings → General**, set **Root Directory** to `.` (not `apps/web`).
2. Add environment variables under **Settings → Environment Variables**:
   - `DATABASE_URL` — cloud PostgreSQL URL ([Neon](https://neon.tech), Supabase, or Vercel Postgres)
   - `JWT_SECRET` — long random string
3. Redeploy the project.
4. From your machine, initialize the production database once:

```bash
DATABASE_URL="your-production-url" npm run db:setup
```

5. Log in at `/admin/login` with `admin` / `admin123`.

Check database connectivity: `GET /api/db-health`

## Built With

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Prisma ORM
- PostgreSQL
