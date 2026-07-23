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

export async function fetchDiscover(params: {
  genreId?: string;
  decade?: string | null;
  sortBy?: string;
}): Promise<TMDBMovie[]> {
  const queryParams: Record<string, string> = {};
  
  if (params.genreId) {
    queryParams['with_genres'] = params.genreId;
  }
  
  if (params.decade) {
    const decadeStart = parseInt(params.decade);
    queryParams['primary_release_date.gte'] = `${decadeStart}-01-01`;
    queryParams['primary_release_date.lte'] = `${decadeStart + 9}-12-31`;
  }
  
  if (params.sortBy) {
    let sortVal = 'popularity.desc';
    if (params.sortBy === 'top_rated') {
      sortVal = 'vote_average.desc';
      queryParams['vote_count.gte'] = '100'; // Avoid high ratings with few votes
    } else if (params.sortBy === 'recent') {
      sortVal = 'primary_release_date.desc';
      queryParams['primary_release_date.lte'] = '2026-07-23';
    } else if (params.sortBy === 'release_year') {
      sortVal = 'primary_release_date.desc';
    }
    queryParams['sort_by'] = sortVal;
  }
  
  const data = await fetchTMDB('/discover/movie', queryParams);
  return data.results || [];
}

export async function fetchGenres(): Promise<{ id: number; name: string }[]> {
  const data = await fetchTMDB('/genre/movie/list');
  return data.genres || [];
}

export async function fetchUpcoming(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/upcoming');
  return data.results || [];
}
