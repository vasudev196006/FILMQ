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

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  popularity?: number;
}

// ── Fallback Dataset for Local Testing ────────────────────

export const FALLBACK_MOVIES: TMDBMovie[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8WhK21W222xl28y9vW28822.jpg',
    release_date: '2024-02-27',
    vote_average: 8.3,
    genre_ids: [878, 28, 12]
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/fm6KqXrmjM2pvrmNV3TGlMA9L8e.jpg',
    release_date: '2023-07-19',
    vote_average: 8.1,
    genre_ids: [18, 36]
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/p1LeeT8FLrmC25jTGB346H0d2x4.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    genre_ids: [878, 18, 12]
  },
  {
    id: 155,
    title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKFu82Wv26wAK5w260jXmY2gX4.jpg',
    release_date: '2008-07-16',
    vote_average: 8.5,
    genre_ids: [28, 80, 18]
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who steals corporate secrets through dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.',
    poster_path: '/oYuLE29W9BmUh2Ph29R295vj22a.jpg',
    backdrop_path: '/s3TBrRGB1iav7ySaV03kAYMxs0x.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    genre_ids: [28, 878, 12]
  },
  {
    id: 335984,
    title: 'Blade Runner 2049',
    overview: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos.',
    poster_path: '/gSMvCq2kS6x4v3sA24X10992a2a.jpg',
    backdrop_path: '/sAtoM222x34m3ySaV03kAYMxs0x.jpg',
    release_date: '2017-10-04',
    vote_average: 7.9,
    genre_ids: [878, 9648]
  },
  {
    id: 569094,
    title: 'Spider-Man: Across the Spider-Verse',
    overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj7sR4u.jpg',
    backdrop_path: '/4XM8222234m3ySaV03kAYMxs0x.jpg',
    release_date: '2023-05-31',
    vote_average: 8.4,
    genre_ids: [16, 28, 878]
  },
  {
    id: 603,
    title: 'The Matrix',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the intelligent computers that now rule the earth.',
    poster_path: '/f89U3w9rY9vW2882294X10992a2a.jpg',
    backdrop_path: '/7c9222234m3ySaV03kAYMxs0x.jpg',
    release_date: '1999-03-30',
    vote_average: 8.2,
    genre_ids: [28, 878]
  },
  {
    id: 940721,
    title: 'Godzilla Minus One',
    overview: 'Postwar Japan is at its lowest point when a new crisis emerges in the form of a giant monster, baptized in the horrific power of the atomic bomb.',
    poster_path: '/hk9222234m3ySaV03kAYMxs0x.jpg',
    backdrop_path: '/9m222234m3ySaV03kAYMxs0x.jpg',
    release_date: '2023-11-03',
    vote_average: 7.9,
    genre_ids: [878, 27, 28]
  },
  {
    id: 792307,
    title: 'Poor Things',
    overview: 'Brought back to life by an unorthodox scientist, a young woman runs off with a debauched lawyer on a whirlwind adventure across the continents.',
    poster_path: '/kCGl222234m3ySaV03kAYMxs0x.jpg',
    backdrop_path: '/6m222234m3ySaV03kAYMxs0x.jpg',
    release_date: '2023-12-07',
    vote_average: 7.8,
    genre_ids: [35, 878, 10749]
  }
];

export const FALLBACK_GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' },
  { id: 53, name: 'Thriller' },
  { id: 10749, name: 'Romance' },
  { id: 9648, name: 'Mystery' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 36, name: 'History' }
];

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = API_KEY || import.meta.env.VITE_TMDB_API_KEY;
  
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    // Return fallback structured data when TMDB API key is not configured
    if (endpoint.includes('/genre/movie/list')) {
      return { genres: FALLBACK_GENRES };
    }
    if (endpoint.startsWith('/movie/')) {
      const movieIdStr = endpoint.split('/')[2];
      const movieId = parseInt(movieIdStr, 10);
      const found = FALLBACK_MOVIES.find(m => m.id === movieId) || FALLBACK_MOVIES[0];
      return {
        ...found,
        runtime: 166,
        tagline: 'The story continues.',
        genres: found.genre_ids.map(gid => ({ id: gid, name: FALLBACK_GENRES.find(g => g.id === gid)?.name || 'Drama' })),
        credits: {
          cast: [
            { id: 1, name: 'Timothée Chalamet', character: 'Paul Atreides', profile_path: null },
            { id: 2, name: 'Zendaya', character: 'Chani', profile_path: null },
            { id: 3, name: 'Rebecca Ferguson', character: 'Lady Jessica', profile_path: null },
            { id: 4, name: 'Javier Bardem', character: 'Stilgar', profile_path: null }
          ]
        },
        videos: {
          results: [
            { id: 'v1', key: 'Way9Dexny3w', name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }
          ]
        }
      };
    }
    return { results: FALLBACK_MOVIES };
  }

  const searchParams = new URLSearchParams(params);
  searchParams.append('api_key', apiKey);
  
  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  const headers: HeadersInit = { accept: 'application/json' };

  if (apiKey.length > 50) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return { results: FALLBACK_MOVIES, genres: FALLBACK_GENRES };
    }
    return res.json();
  } catch (err) {
    console.warn('TMDB API request failed, using fallback dataset:', err);
    return { results: FALLBACK_MOVIES, genres: FALLBACK_GENRES };
  }
}

export async function fetchTrending(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/trending/movie/week');
  return data.results || FALLBACK_MOVIES;
}

export async function fetchPopular(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/popular');
  return data.results || FALLBACK_MOVIES;
}

export async function fetchTopRated(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/top_rated');
  return data.results || FALLBACK_MOVIES;
}

export async function fetchMovieDetails(id: string | number): Promise<TMDBMovieDetails> {
  return fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos' });
}

export async function fetchSearch(query: string): Promise<TMDBMovie[]> {
  if (!query || !query.trim()) return FALLBACK_MOVIES;
  const data = await fetchTMDB('/search/movie', { query });
  const results = data.results || [];
  if (results.length === 0) {
    const q = query.toLowerCase();
    return FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
  }
  return results;
}

export async function fetchMoviesByGenre(genreId: string): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/discover/movie', { with_genres: genreId });
  const results = data.results || [];
  if (results.length === 0) {
    const gid = parseInt(genreId, 10);
    return FALLBACK_MOVIES.filter(m => m.genre_ids.includes(gid));
  }
  return results;
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
      queryParams['vote_count.gte'] = '100';
    } else if (params.sortBy === 'recent') {
      sortVal = 'primary_release_date.desc';
      queryParams['primary_release_date.lte'] = '2026-07-23';
    } else if (params.sortBy === 'release_year') {
      sortVal = 'primary_release_date.desc';
    }
    queryParams['sort_by'] = sortVal;
  }
  
  const data = await fetchTMDB('/discover/movie', queryParams);
  const results = data.results || [];
  if (results.length === 0) {
    let filtered = [...FALLBACK_MOVIES];
    if (params.genreId) {
      const gid = parseInt(params.genreId, 10);
      filtered = filtered.filter(m => m.genre_ids.includes(gid));
    }
    if (params.decade) {
      const decadeStart = parseInt(params.decade);
      filtered = filtered.filter(m => {
        const y = parseInt(m.release_date.substring(0, 4), 10);
        return y >= decadeStart && y <= decadeStart + 9;
      });
    }
    return filtered.length > 0 ? filtered : FALLBACK_MOVIES;
  }
  return results;
}

export async function fetchGenres(): Promise<{ id: number; name: string }[]> {
  const data = await fetchTMDB('/genre/movie/list');
  return data.genres || FALLBACK_GENRES;
}

export async function fetchUpcoming(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB('/movie/upcoming');
  return data.results || FALLBACK_MOVIES;
}
