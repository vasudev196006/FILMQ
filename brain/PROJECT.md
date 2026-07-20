# PROJECT — FILMQ

> **What this file answers**: "What is this project? What problem does it solve? **What do we explicitly NOT do?**"

---

## One-line definition

A modern, glassmorphic film discovery, review, and library web application (FILMQ) powered by TMDB (The Movie Database) API and a type-safe pnpm monorepo.

## Problem solved

Movie enthusiasts want a sleek, responsive, highly visual web app to discover trending/popular movies, watch trailers, write detailed reviews with spoiler tags, and maintain personal watchlists/favorites—without clutter or heavy auth friction.

FILMQ delivers a premium dark-themed experience with glassmorphism UI effects, Red/Slate/White branding based on `logo.png`, instant local-first state persistence (`localStorage`), and an OpenAPI-driven backend structure ready for database synchronization.

## What we explicitly DON'T do (non-goals)

- **No full movie video hosting or streaming**: We do not host or pirate video files. All video previews are embedded official YouTube trailers via TMDB API.
- **No mandatory account creation for core features**: Users can immediately browse, rate movies, write reviews, and save favorites using client-side `localStorage`. Backend sync is an optional enhancement layer.
- **No hardcoded API credentials in frontend source**: TMDB API key is never hardcoded in source code; it must be supplied strictly via environment variables (`VITE_TMDB_API_KEY`).

## Tech Stack

| Layer | Technologies |
|---|---|
| **Monorepo** | `pnpm` Workspaces, Node.js 24, TypeScript 5.9 |
| **Frontend App** (`artifacts/cinefy`) | React 19, Vite 7, TailwindCSS v4, Wouter routing, Framer Motion, Lucide React, TanStack Query |
| **Backend API** (`artifacts/api-server`) | Express 5, Node.js, esbuild |
| **Data & API Contract** (`lib/`) | PostgreSQL, Drizzle ORM (`lib/db`), OpenAPI 3.1 (`lib/api-spec`), Orval client codegen (`lib/api-client-react`, `lib/api-zod`) |
| **Design System** | Custom dark mode, Red (#E50914) & Obsidian Slate palette, CSS glassmorphism |

## Core Terminology

- **TMDB**: The Movie Database, external REST API providing movie metadata, posters, backdrops, cast, and video trailers.
- **FILMQ**: User-facing brand and React web application located in `artifacts/cinefy`.
- **Brand Asset**: Official logo image located at `logo.png` and served via `artifacts/cinefy/public/logo.png`.
- **Review**: User-generated movie rating (1–10 stars), text feedback, spoiler flag, and upvote counter.
- **Watchlist / Favorites**: Client-managed collections stored in `localStorage` under `cinefy_favorites` and `cinefy_watchlist`.
