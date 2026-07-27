import { logger } from "./logger";

const API_BASE = "https://api.themoviedb.org/3";

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

// ── Fallback Dataset ───────────────────────────────────────

export const FALLBACK_MOVIES: TMDBMovieResult[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8WhK21W222xl28y9vW28822.jpg',
    release_date: '2024-02-27',
    vote_average: 8.3,
    vote_count: 4500,
    popularity: 280.5,
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
    vote_count: 7800,
    popularity: 195.2,
    genre_ids: [18, 36]
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to conquer space travel.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/p1LeeT8FLrmC25jTGB346H0d2x4.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    vote_count: 34000,
    popularity: 160.8,
    genre_ids: [878, 18, 12]
  },
  {
    id: 155,
    title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime with Harvey Dent and Lt. Jim Gordon.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKFu82Wv26wAK5w260jXmY2gX4.jpg',
    release_date: '2008-07-16',
    vote_average: 8.5,
    vote_count: 31000,
    popularity: 145.0,
    genre_ids: [28, 80, 18]
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who steals corporate secrets through dream-sharing technology, is given inception task.',
    poster_path: '/oYuLE29W9BmUh2Ph29R295vj22a.jpg',
    backdrop_path: '/s3TBrRGB1iav7ySaV03kAYMxs0x.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    vote_count: 35000,
    popularity: 130.4,
    genre_ids: [28, 878, 12]
  },
  {
    id: 335984,
    title: 'Blade Runner 2049',
    overview: 'Thirty years after the events of the first film, LAPD Officer K unearths a long-buried secret.',
    poster_path: '/gSMvCq2kS6x4v3sA24X10992a2a.jpg',
    backdrop_path: '/sAtoM222x34m3ySaV03kAYMxs0x.jpg',
    release_date: '2017-10-04',
    vote_average: 7.9,
    vote_count: 12800,
    popularity: 110.2,
    genre_ids: [878, 9648]
  },
  {
    id: 569094,
    title: 'Spider-Man: Across the Spider-Verse',
    overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.',
    poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj7sR4u.jpg',
    backdrop_path: '/4XM8222234m3ySaV03kAYMxs0x.jpg',
    release_date: '2023-05-31',
    vote_average: 8.4,
    vote_count: 6200,
    popularity: 175.6,
    genre_ids: [16, 28, 878]
  },
  {
    id: 603,
    title: 'The Matrix',
    overview: 'Set in the 22nd century, Neo joins underground insurgents fighting intelligent computers.',
    poster_path: '/f89U3w9rY9vW2882294X10992a2a.jpg',
    backdrop_path: '/7c9222234m3ySaV03kAYMxs0x.jpg',
    release_date: '1999-03-30',
    vote_average: 8.2,
    vote_count: 24500,
    popularity: 105.0,
    genre_ids: [28, 878]
  }
];

export const FALLBACK_TV: TMDBTVResult[] = [
  {
    id: 95396,
    name: 'Severance',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    poster_path: '/56v2Kx1L16t70z2234m3ySaV03k.jpg',
    backdrop_path: '/7q222234m3ySaV03kAYMxs0x.jpg',
    first_air_date: '2022-02-17',
    vote_average: 8.7,
    vote_count: 1450,
    popularity: 190.5,
    genre_ids: [878, 18, 9648]
  },
  {
    id: 125910,
    name: 'The Bear',
    overview: 'A young chef from the fine dining world comes home to Chicago to run his family sandwich shop.',
    poster_path: '/wE5222234m3ySaV03kAYMxs0x.jpg',
    backdrop_path: '/8q222234m3ySaV03kAYMxs0x.jpg',
    first_air_date: '2022-06-23',
    vote_average: 8.5,
    vote_count: 1200,
    popularity: 165.2,
    genre_ids: [18, 35]
  },
  {
    id: 100088,
    name: 'The Last of Us',
    overview: 'Twenty years after modern civilization has been destroyed, Joel is hired to smuggle Ellie out of an oppressive quarantine zone.',
    poster_path: '/uKv05322234m3ySaV03kAYMxs0x.jpg',
    backdrop_path: '/9q222234m3ySaV03kAYMxs0x.jpg',
    first_air_date: '2023-01-15',
    vote_average: 8.6,
    vote_count: 4800,
    popularity: 210.0,
    genre_ids: [18, 878, 28]
  },
  {
    id: 76331,
    name: 'Succession',
    overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world.',
    poster_path: '/77222234m3ySaV03kAYMxs0x.jpg',
    backdrop_path: '/10q222234m3ySaV03kAYMxs0x.jpg',
    first_air_date: '2018-06-03',
    vote_average: 8.6,
    vote_count: 3100,
    popularity: 140.8,
    genre_ids: [18]
  },
  {
    id: 94605,
    name: 'Arcane',
    overview: 'Amid the conflict between the twin cities of Piltover and Zaun, two sisters fight on opposing sides.',
    poster_path: '/fq222234m3ySaV03kAYMxs0x.jpg',
    backdrop_path: '/11q222234m3ySaV03kAYMxs0x.jpg',
    first_air_date: '2021-11-06',
    vote_average: 8.8,
    vote_count: 3800,
    popularity: 230.4,
    genre_ids: [16, 28, 878, 18]
  }
];

export const FALLBACK_GENRES: TMDBGenre[] = [
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

async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const apiKey = process.env["VITE_TMDB_API_KEY"] || process.env["TMDB_API_KEY"];
  if (!apiKey || apiKey === "your_tmdb_api_key_here") {
    if (endpoint.includes("/genre/")) {
      return { genres: FALLBACK_GENRES } as unknown as T;
    }
    if (endpoint.includes("/tv")) {
      return { results: FALLBACK_TV } as unknown as T;
    }
    if (endpoint.startsWith("/movie/")) {
      const parts = endpoint.split("/");
      const movieId = parseInt(parts[2], 10);
      const found = FALLBACK_MOVIES.find(m => m.id === movieId) || FALLBACK_MOVIES[0];
      return {
        ...found,
        genres: found.genre_ids.map(gid => ({ id: gid, name: FALLBACK_GENRES.find(g => g.id === gid)?.name || 'Drama' })),
      } as unknown as T;
    }
    return { results: FALLBACK_MOVIES } as unknown as T;
  }

  const searchParams = new URLSearchParams(params);
  searchParams.append("api_key", apiKey);

  const url = `${API_BASE}${endpoint}?${searchParams.toString()}`;
  const headers: Record<string, string> = { accept: "application/json" };

  if (apiKey.length > 50) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (endpoint.includes("/tv")) return { results: FALLBACK_TV } as unknown as T;
      return { results: FALLBACK_MOVIES, genres: FALLBACK_GENRES } as unknown as T;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    logger.warn({ err, url: endpoint }, "TMDB API request failed, using server fallback dataset");
    if (endpoint.includes("/tv")) return { results: FALLBACK_TV } as unknown as T;
    return { results: FALLBACK_MOVIES, genres: FALLBACK_GENRES } as unknown as T;
  }
}

// ── API Functions ──────────────────────────────────────────

export async function fetchMovieRecommendations(
  movieId: number,
): Promise<TMDBMovieResult[]> {
  const data = await fetchTMDB<{ results: TMDBMovieResult[] }>(
    `/movie/${movieId}/recommendations`,
  );
  return data.results || FALLBACK_MOVIES;
}

export async function discoverMovies(
  params: Record<string, string>,
): Promise<TMDBMovieResult[]> {
  const data = await fetchTMDB<{ results: TMDBMovieResult[] }>(
    "/discover/movie",
    params,
  );
  return data.results || FALLBACK_MOVIES;
}

export async function discoverTV(
  params: Record<string, string>,
): Promise<TMDBTVResult[]> {
  const data = await fetchTMDB<{ results: TMDBTVResult[] }>(
    "/discover/tv",
    params,
  );
  return data.results || FALLBACK_TV;
}

export async function fetchMovieGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>("/genre/movie/list");
  return data.genres || FALLBACK_GENRES;
}

export async function fetchTVGenres(): Promise<TMDBGenre[]> {
  const data = await fetchTMDB<{ genres: TMDBGenre[] }>("/genre/tv/list");
  return data.genres || FALLBACK_GENRES;
}

export async function fetchMovieDetails(movieId: number): Promise<{
  id: number;
  title: string;
  genres: TMDBGenre[];
}> {
  const data = await fetchTMDB<{ id: number; title: string; genres: TMDBGenre[] }>(`/movie/${movieId}`);
  return data;
}
