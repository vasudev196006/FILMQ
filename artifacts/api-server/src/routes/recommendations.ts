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

// ── Cache Management ───────────────────────────────────────

interface CachedResult {
  data: RecommendationResponse;
  expiresAt: number;
  favCount: number;
  revCount: number;
}

let cache: CachedResult | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearRecommendationCache() {
  cache = null;
}

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

  try {
    const [movieGenres, tvGenres] = await Promise.all([
      fetchMovieGenres(),
      fetchTVGenres(),
    ]);

    const map = new Map<number, string>();
    for (const g of movieGenres) map.set(g.id, g.name);
    for (const g of tvGenres) map.set(g.id, g.name);
    genreMapCache = map;

    setTimeout(() => {
      genreMapCache = null;
    }, 24 * 60 * 60 * 1000);

    return map;
  } catch {
    return new Map<number, string>();
  }
}

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
      const num = parseInt(g, 10);
      if (!isNaN(num)) return num;

      for (const [id, name] of genreMap.entries()) {
        if (name.toLowerCase() === g.toLowerCase()) return id;
      }
      return -1;
    })
    .filter((id) => id > 0);
}

// ── Build genre affinity profile across ALL user items ─────

async function buildGenreProfile(
  reviews: { movieId: number; rating: number }[],
  favorites: { movieId: number; genres: string }[],
  genreMap: Map<number, string>,
): Promise<GenreAffinity[]> {
  const scores = new Map<number, number>();

  // Score from ALL favorites: +3 points per genre
  for (const fav of favorites) {
    const genreIds = parseFavoriteGenres(fav.genres, genreMap);
    for (const gid of genreIds) {
      scores.set(gid, (scores.get(gid) || 0) + 3);
    }
  }

  // Resolve genres for reviewed movies not in favorites
  const favMovieIds = new Set(favorites.map((f) => f.movieId));
  const reviewMovieIds = [
    ...new Set(reviews.map((r) => r.movieId).filter((id) => !favMovieIds.has(id))),
  ];

  // Fetch details for ALL reviewed movies
  const movieDetailsPromises = reviewMovieIds.map(async (id) => {
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
        scores.set(gid, (scores.get(gid) || 0) + review.rating / 10);
      } else if (review.rating < 5) {
        scores.set(gid, (scores.get(gid) || 0) - 1.5);
      }
    }
  }

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
  return affinities.slice(0, 10); // Top 10 genres
}

// ── Batch helper for concurrent requests ──────────────────

async function batchFetch<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map((item) => fn(item).catch(() => null as unknown as R)));
    results.push(...chunkResults.filter(Boolean));
  }
  return results;
}

// ── Main endpoint ──────────────────────────────────────────

router.get("/recommendations", async (_req, res, next) => {
  try {
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

    // Check cache invalidation against item counts
    if (
      cache &&
      Date.now() < cache.expiresAt &&
      cache.favCount === favorites.length &&
      cache.revCount === reviews.length
    ) {
      res.json(cache.data);
      return;
    }

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

    const excludeMovieIds = new Set([
      ...reviews.map((r) => r.movieId),
      ...favorites.map((f) => f.movieId),
    ]);

    // 3. Fetch TMDB recommendations for ALL favorited movies (no 5-movie cap!)
    const movieRecBatches = await batchFetch(
      favorites,
      10, // Process in concurrent batches of 10
      (fav) => fetchMovieRecommendations(fav.movieId),
    );

    // 4. Genre-based movie & TV discovery for top 5 genres
    const topGenreIds = topGenres.slice(0, 5).map((g) => g.id);

    const genreMoviePromises = topGenreIds.map((gid) =>
      discoverMovies({
        with_genres: String(gid),
        sort_by: "popularity.desc",
        "vote_count.gte": "50",
      }).catch(() => [] as TMDBMovieResult[]),
    );

    const genreTVPromises = topGenreIds.map((gid) =>
      discoverTV({
        with_genres: String(gid),
        sort_by: "popularity.desc",
        "vote_count.gte": "30",
      }).catch(() => [] as TMDBTVResult[]),
    );

    const [genreMovieResults, genreTVResults] = await Promise.all([
      Promise.all(genreMoviePromises),
      Promise.all(genreTVPromises),
    ]);

    // 5. Merge, deduplicate, and score movies
    const seenMovieIds = new Set<number>();
    const allMovies: (TMDBMovieResult & { affinityScore: number })[] = [];
    const genreScoreMap = new Map(topGenres.map((g) => [g.id, g.score]));

    function scoreMovie(movie: TMDBMovieResult, boost: number = 0): number {
      let score = (movie.popularity || 0) / 100 + boost;
      for (const gid of movie.genre_ids || []) {
        score += genreScoreMap.get(gid) || 0;
      }
      return score;
    }

    // Add recommendations from ALL user favorites
    for (const batch of movieRecBatches) {
      if (Array.isArray(batch)) {
        for (const movie of batch) {
          if (movie && !excludeMovieIds.has(movie.id) && !seenMovieIds.has(movie.id) && movie.poster_path) {
            seenMovieIds.add(movie.id);
            allMovies.push({ ...movie, affinityScore: scoreMovie(movie, 3) });
          }
        }
      }
    }

    // Add genre-discovered movies
    for (const batch of genreMovieResults) {
      if (Array.isArray(batch)) {
        for (const movie of batch) {
          if (movie && !excludeMovieIds.has(movie.id) && !seenMovieIds.has(movie.id) && movie.poster_path) {
            seenMovieIds.add(movie.id);
            allMovies.push({ ...movie, affinityScore: scoreMovie(movie, 0) });
          }
        }
      }
    }

    // Sort by affinity score and scale up output capacity to top 50 movies
    allMovies.sort((a, b) => b.affinityScore - a.affinityScore);
    const topMovies = allMovies.slice(0, 50);

    // 6. Merge and deduplicate TV shows, scale up output capacity to top 30 TV shows
    const seenTVIds = new Set<number>();
    const allTV: TMDBTVResult[] = [];

    for (const batch of genreTVResults) {
      if (Array.isArray(batch)) {
        for (const show of batch) {
          if (show && !seenTVIds.has(show.id) && show.poster_path) {
            seenTVIds.add(show.id);
            allTV.push(show);
          }
        }
      }
    }

    allTV.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const topTV = allTV.slice(0, 30);

    // 7. Response payload
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

    cache = {
      data: response,
      expiresAt: Date.now() + CACHE_TTL_MS,
      favCount: favorites.length,
      revCount: reviews.length,
    };

    logger.info(
      {
        totalFavoritesProcessed: favorites.length,
        movieRecommendationsCount: topMovies.length,
        tvRecommendationsCount: topTV.length,
        topGenres: topGenres.map((g) => g.name),
      },
      "Scaled recommendations generated for all user favorites",
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
