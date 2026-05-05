# newbni

Structured split (no blind copy of `/admin` into marketing):

| App | Folder | Dev port | Role |
|-----|--------|----------|------|
| **Frontend** | `frontend/` | **3000** | Marketing, `/platform`, `/dashboard`, `/auth`, public APIs (`/api/platform`, `/api/forms`, …). Prisma schema lives here. |
| **Admin** | `admin/` | **3002** | `/admin/*` only + `/api/admin/*` exports/uploads used by admin. Imports shared UI/data helpers from `frontend/src` via `@/*`. |
| **Backend** | `backend/` | **3001** | Express + Sequelize (layout aligned with `task`: `app/config`, `app/models`, `app/controllers`, `app/routes`; entry `server.js`). |

## Environment quickstart

1. **Frontend:** copy busybni-style `.env` → `frontend/.env` (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, OAuth, cookies).

2. **Admin:** `cp admin/.env.example admin/.env` — set `NEXT_PUBLIC_APP_URL=http://localhost:3000` so links and trip-editor POST hit the manager app.

3. **Backend:** `backend/.env` — same `DATABASE_URL`, `FRONTEND_ORIGIN`, `ADMIN_ORIGIN`, optional `CORS_ORIGINS`.

## Scripts

```bash
cd backend && npm run dev          # :3001
cd frontend && npm run dev         # :3000
cd admin && npm run dev            # :3002 (runs prisma generate against ../frontend/prisma/schema.prisma)
```

## Architecture notes

- **Shared code:** `admin/tsconfig.json` maps `@/*` → `frontend/src/*`. Admin-only UI is under `admin/src/components/admin` (`@admin/components/admin/...`).
- **Bundler:** `admin` runs **`next dev --webpack` / `next build --webpack`** so `@/` resolves to `../frontend/src` via `next.config.ts` (`Turbopack` alone did not honor sibling imports).
- **Cross-app links:** Admin dropdown uses `NEXT_PUBLIC_APP_URL`. Trip editor posts to `{NEXT_PUBLIC_APP_URL}/api/platform/trips/save` so saves hit the manager Next server (cookies/session).
- **Backend migration:** Dashboard KPIs load from Sequelize (`/api/admin/dashboard-stats`). Other admin pages still use Prisma via shared `@/lib/prisma` until you move those reads/writes behind `:3001`.

## Backend folder layout (`backend/`)

Aligned with the **`task`** Express project style:

- `server.js` — app bootstrap, CORS, `express.json` / `urlencoded`, route registration.
- `app/config/db.config.js` — `createSequelize()` (`DATABASE_URL`, SSL, pool).
- `app/models/index.js` — attaches Sequelize + exports every model from `init-models.js`.
- `app/models/init-models.js` — Sequelize definitions / associations (mirrors busybni Prisma tables).
- `app/controllers/*.controller.js` — request handlers.
- `app/routes/*.routes.js` — `module.exports = (app) => { const router = require("express").Router(); … app.use(prefix, router); }`.

Endpoints: `GET /`, `GET /health`, `GET /api/health/db`, `GET /api/regions`, `GET /api/admin/dashboard-stats`.

## Static assets

`admin/public` is a symlink to `frontend/public` so `/assets/css/...` resolves identically.
