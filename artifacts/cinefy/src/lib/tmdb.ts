const API_BASE = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const IMAGE_BASE = 'https://image.tmdb.org/t/p/';

function getAuthHeaders() {
  return {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  };
}

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  // If API_KEY is a simple key, it's passed as a query param. 
  // If it's a bearer token, passed in headers.
  // We'll support both by passing as query param for robustness, assuming it's a typical v3 key.
  // Actually, VITE_TMDB_API_KEY could be bearer or simple. Let's use Authorization header for bearer and ?api_key=... for simple.
  // It's safer to pass as query param ?api_key=... for TMDB v3 unless it's a long v4 token.
  
  const searchParams = new URLSearchParams(params);
  // Just in case it's a normal API key:
  if (API_KEY && !API_KEY.includes(' ')) {
     searchParams.append('api_key', API_KEY);
  }
  
  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  const headers: HeadersInit = { accept: 'application/json' };
  
  if (API_KEY && API_KEY.length > 50) {
     headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.statusText}`);
  }
  return res.json();
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  tagline: string;
  genres: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  videos?: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
}

export async function fetchTrending(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/trending/movie/week');
  return data.results;
}

export async function fetchPopular(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/popular');
  return data.results;
}

export async function fetchTopRated(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/top_rated');
  return data.results;
}

export async function fetchMovieDetails(id: string | number): Promise<TMDBMovieDetails> {
  return fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos' });
}

export async function fetchSearch(query: string): Promise<TMDBMovie[]> {
  if (!query) return [];
  const data = await fetchTMDB('/search/movie', { query });
  return data.results;
}

export async function fetchMoviesByGenre(genreId: string): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/discover/movie', { with_genres: genreId });
  return data.results;
}

export async function fetchGenres(): Promise<{ id: number; name: string }[]> {
  const data = await fetchTMDB('/genre/movie/list');
  return data.genres;
}
