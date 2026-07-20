const API_BASE = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const IMAGE_BASE = 'https://image.tmdb.org/t/p/';

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

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = API_KEY || import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_TMDB_API_KEY is not defined in environment variables.');
  }

  const searchParams = new URLSearchParams(params);
  searchParams.append('api_key', apiKey);
  
  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  const headers: HeadersInit = { accept: 'application/json' };

  if (apiKey.length > 50) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`TMDB API Error [${res.status}]: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTrending(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/trending/movie/week');
  return data.results || [];
}

export async function fetchPopular(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/popular');
  return data.results || [];
}

export async function fetchTopRated(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/top_rated');
  return data.results || [];
}

export async function fetchMovieDetails(id: string | number): Promise<TMDBMovieDetails> {
  return fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos' });
}

export async function fetchSearch(query: string): Promise<TMDBMovie[]> {
  if (!query || !query.trim()) return [];
  const data = await fetchTMDB('/search/movie', { query });
  return data.results || [];
}

export async function fetchMoviesByGenre(genreId: string): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/discover/movie', { with_genres: genreId });
  return data.results || [];
}

export async function fetchGenres(): Promise<{ id: number; name: string }[]> {
  const data = await fetchTMDB('/genre/movie/list');
  return data.genres || [];
}
