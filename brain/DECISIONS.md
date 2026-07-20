# DECISIONS — Architecture & Design Decision Log

> **What this file answers**: "Why is the system designed this way? What alternatives were rejected?"
> **Rule**: Append-only log. Every entry requires context, decision, rejected alternatives, and consequences.

---

## [ADR-001] Client-First LocalStorage State for Reviews & Watchlist

- **Date**: 2026-07-20
- **Status**: Accepted
- **Context**: The frontend needs instant user interactivity for rating movies, submitting reviews, and saving favorites without requiring mandatory backend login or network latency.
- **Decision**: Store reviews, favorites, and watchlist items in browser `localStorage` (`cinefy_reviews`, `cinefy_favorites`, `cinefy_watchlist`) with cross-tab event listeners.
- **Rejected Alternatives**:
  - *Mandatory backend API auth on initial load*: Rejected due to user friction and setup overhead before exploring the application.
- **Consequences**: Fast, offline-friendly user experience. Future backend sync can migrate or sync `localStorage` contents to PostgreSQL seamlessly.

---

## [ADR-002] Environment Variable Key Injection for TMDB API

- **Date**: 2026-07-20
- **Status**: Accepted
- **Context**: TMDB API requests require an API key or Bearer token.
- **Decision**: Use `import.meta.env.VITE_TMDB_API_KEY` in `artifacts/cinefy/src/lib/tmdb.ts` to dynamically inject keys at runtime/build-time without committing credentials to version control.
- **Rejected Alternatives**:
  - *Hardcoding a shared demo API key in code*: Rejected to prevent key leakage, rate-limiting abuse, and security violations.
- **Consequences**: Keeps source code clean and secure. Users or deployers must configure `VITE_TMDB_API_KEY` in their environment.

---

## [ADR-003] Monorepo Code Generation Pipeline (OpenAPI → Orval → React Query / Zod)

- **Date**: 2026-07-20
- **Status**: Accepted
- **Context**: Ensuring 100% type safety between API specifications, backend endpoints, and frontend React components.
- **Decision**: Use `lib/api-spec/openapi.yaml` as the single source of truth for API contracts, generated via Orval into `@workspace/api-client-react` and `@workspace/api-zod`.
- **Rejected Alternatives**:
  - *Manual TypeScript interface duplication across frontend and backend*: Rejected due to high risk of drift and out-of-sync types.
- **Consequences**: Type safety enforced at build time (`pnpm run typecheck`).
