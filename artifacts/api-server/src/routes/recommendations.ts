import { Router } from "express";
import { db, reviewsTable, favoritesTable } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  fetchMovieRecommendations,
  discoverMovies,
  discoverTV,
  fetchMovieGenres,
  fetchTVGenres,
  fetchMovieDetails,
  type TMDBMovieResult,
  type TMDBTVResult,
  type TMDBGenre,
} from "../lib/tmdb-server";

const router = Router();

// ── In-memory cache (5-minute TTL) ─────────────────────────

interface CachedResult {
  data: RecommendationResponse;
  expiresAt: number;
}

let cache: CachedResult | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Types ──────────────────────────────────────────────────

interface GenreAffinity {
  id: number;
  name: string;
  score: number;
}

interface RecommendationResponse {
  movies: TMDBMovieResult[];
  tvShows: TMDBTVResult[];
  profile: {
    topGenres: GenreAffinity[];
    basedOn: { reviewCount: number; favoriteCount: number };
  };
}

// ── Genre ID resolution helpers ────────────────────────────

let genreMapCache: Map<number, string> | null = null;

async function getGenreMap(): Promise<Map<number, string>> {
  if (genreMapCache) return genreMapCache;

  const [movieGenres, tvGenres] = await Promise.all([
    fetchMovieGenres(),
    fetchTVGenres(),
  ]);

  const map = new Map<number, string>();
  for (const g of movieGenres) map.set(g.id, g.name);
  for (const g of tvGenres) map.set(g.id, g.name);
  genreMapCache = map;

  // Refresh every 24 hours
  setTimeout(() => {
    genreMapCache = null;
  }, 24 * 60 * 60 * 1000);

  return map;
}

// Parse genres string from favorites table ("Action,Comedy,Drama" or "28,35,18")
function parseFavoriteGenres(
  genresStr: string,
  genreMap: Map<number, string>,
): number[] {
  if (!genresStr) return [];

  return genresStr
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => {
      // If it's a number, use it directly
      const num = parseInt(g, 10);
      if (!isNaN(num)) return num;

      // If it's a name, look up the ID
      for (const [id, name] of genreMap.entries()) {
        if (name.toLowerCase() === g.toLowerCase()) return id;
      }
      return -1;
    })
    .filter((id) => id > 0);
}

// ── Build genre affinity profile ───────────────────────────

async function buildGenreProfile(
  reviews: { movieId: number; rating: number }[],
  favorites: { movieId: number; genres: string }[],
  genreMap: Map<number, string>,
): Promise<GenreAffinity[]> {
  const scores = new Map<number, number>();

  // Score from favorites: +2 points per genre
  for (const fav of favorites) {
    const genreIds = parseFavoriteGenres(fav.genres, genreMap);
    for (const gid of genreIds) {
      scores.set(gid, (scores.get(gid) || 0) + 2);
    }
  }

  // Score from reviews: need to resolve genre IDs for reviewed movies
  // Batch-fetch movie details for reviewed movies that aren't in favorites
  const favMovieIds = new Set(favorites.map((f) => f.movieId));
  const reviewMovieIds = [
    ...new Set(reviews.map((r) => r.movieId).filter((id) => !favMovieIds.has(id))),
  ];

  // Fetch details in parallel (capped at 10 to avoid rate limits)
  const movieDetailsPromises = reviewMovieIds.slice(0, 10).map(async (id) => {
    try {
      const details = await fetchMovieDetails(id);
      return { movieId: id, genreIds: details.genres.map((g: TMDBGenre) => g.id) };
    } catch {
      return { movieId: id, genreIds: [] as number[] };
    }
  });

  const movieDetails = await Promise.allSettled(movieDetailsPromises);
  const reviewGenreMap = new Map<number, number[]>();

  for (const result of movieDetails) {
    if (result.status === "fulfilled") {
      reviewGenreMap.set(result.value.movieId, result.value.genreIds);
    }
  }

  // Also use favorites' genre data for reviewed movies that are also favorites
  for (const fav of favorites) {
    if (!reviewGenreMap.has(fav.movieId)) {
      reviewGenreMap.set(
        fav.movieId,
        parseFavoriteGenres(fav.genres, genreMap),
      );
    }
  }

  // Apply review scores
  for (const review of reviews) {
    const genreIds = reviewGenreMap.get(review.movieId) || [];
    for (const gid of genreIds) {
      if (review.rating >= 7) {
        // Positive signal: weight by rating
        scores.set(gid, (scores.get(gid) || 0) + review.rating / 10);
      } else if (review.rating < 5) {
        // Negative signal
        scores.set(gid, (scores.get(gid) || 0) - 1);
      }
      // Ratings 5-6 are neutral — no signal
    }
  }

  // Convert to sorted array, filter out negative scores
  const affinities: GenreAffinity[] = [];
  for (const [id, score] of scores.entries()) {
    if (score > 0) {
      affinities.push({
        id,
        name: genreMap.get(id) || `Genre ${id}`,
        score: Math.round(score * 100) / 100,
      });
    }
  }

  affinities.sort((a, b) => b.score - a.score);
  return affinities.slice(0, 5); // Top 5 genres
}

// ── Main endpoint ──────────────────────────────────────────

router.get("/recommendations", async (_req, res, next) => {
  try {
    // Check cache
    if (cache && Date.now() < cache.expiresAt) {
      res.json(cache.data);
      return;
    }

    // 1. Fetch all reviews and favorites from DB
    const [reviews, favorites] = await Promise.all([
      db.select({
        movieId: reviewsTable.movieId,
        rating: reviewsTable.rating,
      }).from(reviewsTable),
      db.select({
        movieId: favoritesTable.movieId,
        genres: favoritesTable.genres,
      }).from(favoritesTable),
    ]);

    // If no user data at all, return empty
    if (reviews.length === 0 && favorites.length === 0) {
      const emptyResponse: RecommendationResponse = {
        movies: [],
        tvShows: [],
        profile: {
          topGenres: [],
          basedOn: { reviewCount: 0, favoriteCount: 0 },
        },
      };
      res.json(emptyResponse);
      return;
    }

    // 2. Build genre affinity profile
    const genreMap = await getGenreMap();
    const topGenres = await buildGenreProfile(reviews, favorites, genreMap);

    // 3. Fetch recommendations from TMDB in parallel
    const excludeMovieIds = new Set([
      ...reviews.map((r) => r.movieId),
      ...favorites.map((f) => f.movieId),
    ]);

    // 3a. Movie recommendations based on top favorited movies (up to 5)
    const topFavorites = favorites.slice(0, 5);
    const movieRecPromises = topFavorites.map((fav) =>
      fetchMovieRecommendations(fav.movieId).catch(() => [] as TMDBMovieResult[]),
    );

    // 3b. Genre-based movie discovery (top 3 genres)
    const topGenreIds = topGenres.slice(0, 3).map((g) => g.id);
    const genreMoviePromises = topGenreIds.map((gid) =>
      discoverMovies({
        with_genres: String(gid),
        sort_by: "popularity.desc",
        "vote_count.gte": "50",
      }).catch(() => [] as TMDBMovieResult[]),
    );

    // 3c. Genre-based TV discovery (top 3 genres)
    const genreTVPromises = topGenreIds.map((gid) =>
      discoverTV({
        with_genres: String(gid),
        sort_by: "popularity.desc",
        "vote_count.gte": "30",
      }).catch(() => [] as TMDBTVResult[]),
    );

    const [movieRecResults, genreMovieResults, genreTVResults] =
      await Promise.all([
        Promise.all(movieRecPromises),
        Promise.all(genreMoviePromises),
        Promise.all(genreTVPromises),
      ]);

    // 4. Merge, deduplicate, and score movies
    const seenMovieIds = new Set<number>();
    const allMovies: (TMDBMovieResult & { affinityScore: number })[] = [];

    const genreScoreMap = new Map(topGenres.map((g) => [g.id, g.score]));

    function scoreMovie(movie: TMDBMovieResult): number {
      let score = movie.popularity / 100; // Base from TMDB popularity
      for (const gid of movie.genre_ids) {
        score += genreScoreMap.get(gid) || 0;
      }
      return score;
    }

    // Add recommendation-based movies (higher base priority)
    for (const batch of movieRecResults) {
      for (const movie of batch) {
        if (!excludeMovieIds.has(movie.id) && !seenMovieIds.has(movie.id) && movie.poster_path) {
          seenMovieIds.add(movie.id);
          allMovies.push({ ...movie, affinityScore: scoreMovie(movie) + 2 });
        }
      }
    }

    // Add genre-discovered movies
    for (const batch of genreMovieResults) {
      for (const movie of batch) {
        if (!excludeMovieIds.has(movie.id) && !seenMovieIds.has(movie.id) && movie.poster_path) {
          seenMovieIds.add(movie.id);
          allMovies.push({ ...movie, affinityScore: scoreMovie(movie) });
        }
      }
    }

    // Sort by affinity score and take top 20
    allMovies.sort((a, b) => b.affinityScore - a.affinityScore);
    const topMovies = allMovies.slice(0, 20);

    // 5. Merge and deduplicate TV shows
    const seenTVIds = new Set<number>();
    const allTV: TMDBTVResult[] = [];

    for (const batch of genreTVResults) {
      for (const show of batch) {
        if (!seenTVIds.has(show.id) && show.poster_path) {
          seenTVIds.add(show.id);
          allTV.push(show);
        }
      }
    }

    // Sort TV by popularity and take top 10
    allTV.sort((a, b) => b.popularity - a.popularity);
    const topTV = allTV.slice(0, 10);

    // 6. Build response
    const response: RecommendationResponse = {
      movies: topMovies,
      tvShows: topTV,
      profile: {
        topGenres,
        basedOn: {
          reviewCount: reviews.length,
          favoriteCount: favorites.length,
        },
      },
    };

    // Cache the result
    cache = {
      data: response,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    logger.info(
      {
        movieCount: topMovies.length,
        tvCount: topTV.length,
        topGenres: topGenres.map((g) => g.name),
      },
      "Recommendations generated",
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
