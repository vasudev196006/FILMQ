# System Architecture — FILMQ (Cinefy)

> **What this file answers**: Deep dive into FILMQ monorepo architecture, package relations, and TMDB integration details.

---

## 1. Monorepo Organization

The project uses `pnpm` workspaces configured in `pnpm-workspace.yaml`.

```
FILMQ Root
 ├── brain/                      # AI assistant project memory (project-brain protocol)
 ├── artifacts/
 │    ├── cinefy/                # Main Vite + React 19 web application (@workspace/cinefy)
 │    ├── api-server/            # Express 5 backend server (@workspace/api-server)
 │    └── mockup-sandbox/        # Prototyping sandbox (@workspace/mockup-sandbox)
 ├── lib/
 │    ├── api-spec/              # OpenAPI 3.1 contract (@workspace/api-spec)
 │    ├── api-zod/               # Auto-generated Zod schemas (@workspace/api-zod)
 │    ├── api-client-react/      # Auto-generated React Query client (@workspace/api-client-react)
 │    └── db/                    # Drizzle ORM Postgres schema & migrations (@workspace/db)
 └── scripts/                    # Shared workspace utility scripts
```

## 2. Supply-Chain Security Setting

In `pnpm-workspace.yaml`, supply-chain protection is enforced via:
```yaml
minimumReleaseAge: 1440 # 1 day (1440 mins) minimum age before package install
```
This prevents malicious immediate npm zero-day releases from infecting build environments. Exclusions are allowed only for trusted `@replit/*` scoped packages.

## 3. Frontend Architecture (`artifacts/cinefy`)

- **Routing**: `wouter` router mapped to top-level pages (`/`, `/movie/:id`, `/search`, `/reviews`, `/favorites`).
- **Styling**: TailwindCSS v4 with custom glassmorphism utilities (`GlassFilter.tsx`, `index.css`).
- **State**:
  - `TanStack Query` (`@tanstack/react-query`) for asynchronous TMDB API calls.
  - `localStorage` engine (`artifacts/cinefy/src/lib/storage.ts`) for offline-first user reviews, favorites, and watchlist items.
- **TMDB API Client** (`artifacts/cinefy/src/lib/tmdb.ts`):
  - Fetches trending, popular, top-rated, detailed info, cast credits, and YouTube trailers.
  - Reads `import.meta.env.VITE_TMDB_API_KEY`.
