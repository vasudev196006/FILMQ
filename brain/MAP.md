# MAP — Project Map & Index

> **What this file answers**: "What does the project look like? Where do I find specific information?"
> **Who reads this**: **First thing every new session reads.**

---

## 1. Quick start

**Run frontend (FILMQ)**:
```bash
pnpm --filter @workspace/cinefy run dev
```
Starts Vite dev server (port 5173).

**Run API server**:
```bash
pnpm --filter @workspace/api-server run dev
```
Starts Express API server on `http://localhost:5000`.

**Workspace typecheck & build**:
```bash
pnpm run typecheck    # Check TypeScript across packages
pnpm run build        # Build all workspace packages
```

**Regenerate API Client & Zod Schemas**:
```bash
pnpm --filter @workspace/api-spec run codegen
```

**Database operations**:
```bash
pnpm --filter @workspace/db run push    # Push Drizzle schema to Postgres (dev)
```

---

## 2. Module list

| Module / Package | Responsibility | Location |
|---|---|---|
| **FILMQ Web App** | React 19 frontend UI (Home, Movie Detail, Search, Reviews, Favorites) | `artifacts/cinefy/` |
| **TMDB Client** | TMDB API fetcher & TypeScript interfaces | `artifacts/cinefy/src/lib/tmdb.ts` |
| **Local Storage Engine** | Client-side reviews, favorites, watchlist persistence | `artifacts/cinefy/src/lib/storage.ts` |
| **API Server** | Express 5 backend server | `artifacts/api-server/` |
| **Mockup Sandbox** | Design preview environment | `artifacts/mockup-sandbox/` |
| **API Contract (OpenAPI)** | OpenAPI 3.1 schema & Orval configuration | `lib/api-spec/` |
| **API React Hooks** | Auto-generated TanStack Query hooks | `lib/api-client-react/` |
| **API Zod Schemas** | Auto-generated Zod validation schemas | `lib/api-zod/` |
| **Database Layer** | Drizzle ORM PostgreSQL schema & migrations | `lib/db/` |

---

## 3. Dependency Structure

```
User Browser
 └─▶ Vite / React Frontend (@workspace/cinefy)
      ├──▶ TMDB External API (https://api.themoviedb.org/3) via VITE_TMDB_API_KEY
      ├──▶ localStorage (cinefy_reviews, cinefy_favorites, cinefy_watchlist)
      └──▶ Express API Server (@workspace/api-server :5000)
            └──▶ PostgreSQL Database (via Drizzle ORM @workspace/db)
```

---

## 4. Key Entry Points & Files

- **Frontend entry**: `artifacts/cinefy/src/main.tsx` & `App.tsx`
- **Frontend pages**: `artifacts/cinefy/src/pages/` (`HomePage`, `MovieDetailPage`, `SearchPage`, `ReviewsPage`, `FavoritesPage`)
- **TMDB integration**: `artifacts/cinefy/src/lib/tmdb.ts`
- **Backend entry**: `artifacts/api-server/src/index.ts`
- **Database schema**: `lib/db/src/schema/index.ts`
- **OpenAPI specification**: `lib/api-spec/openapi.yaml`
- **Design System (LOCKED)**: `artifacts/cinefy/src/index.css` & `artifacts/cinefy/src/lib/theme.ts` (Blood Red `#A30000` & Dark Charcoal Slate Gray `#13161C`)
