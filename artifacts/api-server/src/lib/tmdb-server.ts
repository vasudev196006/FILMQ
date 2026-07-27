import { logger } from "./logger";

const API_BASE = "https://api.themoviedb.org/3";
const DEFAULT_KEY = "352073776c9700394835d93aba802211";

function getApiKey(): string {
  return (
    process.env["VITE_TMDB_API_KEY"] ||
    process.env["TMDB_API_KEY"] ||
    DEFAULT_KEY
  );
}

async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams(params);
  searchParams.append("api_key", apiKey);

  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  const headers: Record<string, string> = { accept: "application/json" };

  if (apiKey.length > 50) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    logger.error(
      { status: res.status, url: endpoint },
      "TMDB API request failed",
    );
    throw new Error(`TMDB API Error [${res.status}]: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────

export interface TMDBMovieResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export interface TMDBTVResult {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

interface PagedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}

// ── API Functions ──────────────────────────────────────────

export async function fetchMovieRecommendations(
  movieId: number,
): Promise<TMDBMovieResult[]> {
  const data = await fetchTMDB<PagedResponse<TMDBMovieResult>>(
    `/movie/${movieId}/recommendations`,
  );
  return data.results || [];
}

export async function discoverMovies(
  params: Record<string, string>,
): Promise<TMDBMovieResult[]> {
  const data = await fetchTMDB<PagedResponse<TMDBMovieResult>>(
    "/discover/movie",
    params,
  );
  return data.results || [];
}

export async function discoverTV(
  params: Record<string, string>,
): Promise<TMDBTVResult[]> {
  const data = await fetchTMDB<PagedResponse<TMDBTVResult>>(
    "/discover/tv",
    params,
  );
  return data.results || [];
}

export async function fetchMovieGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>("/genre/movie/list");
  return data.genres || [];
}

export async function fetchTVGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>("/genre/tv/list");
  return data.genres || [];
}

export async function fetchMovieDetails(movieId: number): Promise<{
  id: number;
  title: string;
  genres: TMDBGenre[];
}> {
  return fetchTMDB(`/movie/${movieId}`);
}
