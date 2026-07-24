# KSR Shipping Services - Monorepo

This is the full monorepo for the KSR Shipping Services platform. It contains a shared configuration package, a PostgreSQL database schema with Prisma, a Node.js/Express backend server, and two Next.js 14 frontend applications.

## Project Structure

- `apps/web`: The public-facing marketing and shipment tracking application (Next.js 14, Tailwind, Framer Motion).
- `apps/admin`: The private admin dashboard for managing shipments and viewing inquiries (Next.js 14, Tailwind).
- `server/api`: The shared backend API (Node.js, Express, Prisma Client).
- `packages/config`: Shared business configuration (contact details, SEO strings) used across both apps and the backend.
- `database`: Prisma schema, migrations, and seed scripts.

## Prerequisites

- Node.js 18+
- npm workspaces enabled (default in recent npm versions)
- PostgreSQL database (Local or Hosted)

## Getting Started

1. **Install Dependencies**
   Run the following from the root directory to install all dependencies across the monorepo workspaces:
   ```bash
   npm install
   ```

2. **Database Setup**
   - Ensure your PostgreSQL database is running (a `docker-compose.yml` is provided at the root if you prefer Docker).
   - The connection string is already configured in `database/.env`.
   - Run the database migrations and seed script:
   ```bash
   cd database
   npx prisma db push
   npm run db:seed
   ```
   *Note: The seed script creates demo shipments and a demo admin user.*

3. **Start the Development Servers**
   From the root of the project, you can start all applications concurrently:
   ```bash
   npm run dev
   ```
   Alternatively, run them individually:
   - Backend API: `cd server/api && npm run dev` (Runs on port 5000)
   - Admin App: `cd apps/admin && npm run dev` (Runs on port 3000)
   - Public Web App: `cd apps/web && npm run dev` (Runs on port 3001)

## Demo Credentials

The database seed script generates a demo administrator account for you to access the Admin Dashboard:

- **URL**: `http://localhost:3000/login`
- **Username**: `admin`
- **Password**: `password123`

## Built With

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Framer Motion
- Node.js & Express
- Prisma ORM
- PostgreSQL
