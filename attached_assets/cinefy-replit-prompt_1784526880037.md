Build "Cinefy" — a movie REVIEW web app prototype using TMDB for movie data. This is a frontend-only prototype: no backend database, no third-party authentication. User reviews, ratings, and favorites persist in localStorage only.

IMPORTANT — DESIGN
Before writing any UI code, read the attached ui.md file (and the accompanying code file also attached) and follow it as the source of truth for layout, spacing, typography, colors, components, and interaction patterns. Do not invent a different visual style, and do not default to glassmorphism or any other look unless ui.md actually specifies it. If something isn't covered by ui.md, keep it simple and consistent with what ui.md does specify rather than adding your own design flourishes.

TECH STACK
- Vite + React 18 + TypeScript
- TailwindCSS
- Framer Motion (only where ui.md calls for animation/motion)
- Lucide React (icons)
- React Router (pages)
- TMDB API — fetch client-side using a key stored in a .env variable VITE_TMDB_API_KEY (I will paste in my own key)

CORE CONCEPT
Cinefy is a place for users to look up movies (via TMDB data) and write/read reviews and ratings — closer to Letterboxd than to a streaming discovery homepage. Reviews are user-generated content stored locally, TMDB only supplies movie metadata (posters, backdrops, cast, trailers, overview, TMDB's own score for reference).

PAGES
1. Home (/)
   - Navbar (logo, nav links, search)
   - Hero/featured section showcasing a trending movie (styled per ui.md)
   - Sections for Trending / Popular / Top Rated movies, each pulling from TMDB
   - Recent user reviews section (pulled from localStorage, most recent first)
   - Footer
2. Movie details (/movie/:id)
   - Movie info from TMDB: backdrop, poster, title, tagline, TMDB rating, runtime, genres, overview, cast, trailer
   - User review section: list of existing reviews for this movie (from localStorage), a form to submit a new review (star rating + written text), average user rating shown alongside TMDB's score
3. Search (/search)
   - Live TMDB search-as-you-type, debounced
   - Results grid linking into movie details
4. My Reviews (/reviews)
   - Grid/list of all reviews the user has written, editable and deletable
5. Favorites (/favorites)
   - Grid of movies saved to localStorage, with remove action

REQUIREMENTS
- Reusable typed components matching ui.md's component structure (e.g. Navbar, MovieCard, ReviewCard, ReviewForm, StarRating, SearchBar, Footer, LoadingSkeleton, EmptyState)
- Loading skeletons for async TMDB content, graceful empty/error states (e.g. missing poster → styled placeholder, no reviews yet → empty state)
- Fully responsive: desktop / tablet / mobile
- Clean folder structure: components/, pages/, lib/ (TMDB fetch utilities + localStorage review/favorites utilities), hooks/, types/
- No mock movie data — all movie content comes live from TMDB; reviews are real user input saved locally
- README with setup steps (where to put the TMDB key, npm install, npm run dev)

Build this fully working end to end — every page, every component, real TMDB data wired in, review CRUD working against localStorage — not just a homepage shell. Get it running with `npm install && npm run dev` with only the TMDB key needing to be supplied.

----------------------------------------------------
BACKEND PROMPT (use once the frontend prototype above is done)
----------------------------------------------------

Add a simple backend to the existing Cinefy frontend so reviews and favorites are stored in a real database instead of localStorage. This is a college project — keep it straightforward, no authentication, no login, no user accounts. Every review/favorite is just public data, no ownership check.

TECH STACK
- Node.js + Express
- MongoDB with Mongoose
- Server runs separately from the frontend (e.g. on port 5000), frontend calls it via fetch

DATABASE MODELS
1. Review
   - movieId (TMDB id, number)
   - movieTitle (string, store for convenience so we don't have to re-fetch TMDB just to list reviews)
   - reviewerName (string — just a free-text name field, not a real user account)
   - rating (number, 1–5)
   - text (string)
   - createdAt (timestamp)
2. Favorite
   - movieId (TMDB id, number)
   - movieTitle, posterPath (store basic display info alongside the id)
   - createdAt (timestamp)

API ROUTES
- GET /api/reviews/:movieId — all reviews for a movie
- POST /api/reviews — create a review (body: movieId, movieTitle, reviewerName, rating, text)
- PUT /api/reviews/:id — edit a review
- DELETE /api/reviews/:id — delete a review
- GET /api/reviews — all reviews (for a "My Reviews"/recent reviews page)
- GET /api/favorites — list all favorites
- POST /api/favorites — add a favorite
- DELETE /api/favorites/:movieId — remove a favorite

REQUIREMENTS
- Basic input validation (required fields, rating between 1–5) — just enough to not crash, not production-grade
- CORS enabled so the frontend (running on a different port) can call the API
- .env file for MONGODB_URI
- Simple error handling: return proper status codes (400/404/500) with a short error message, no need for elaborate error middleware
- No auth, no sessions, no JWT, no login pages — skip all of it
- README with setup: npm install, add MONGODB_URI to .env, npm run dev

FRONTEND INTEGRATION
- Replace the existing localStorage read/write calls in the review and favorites utilities with fetch calls to this API, keeping the same function signatures so the components don't need to change
- Keep it simple: no caching layer, no React Query needed unless it's already in the project

Keep this minimal and functional — the goal is to demonstrate a working full-stack CRUD flow for a class project, not to build something production-ready.
