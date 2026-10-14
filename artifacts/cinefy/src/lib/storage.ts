export interface Review {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePosterPath: string;
  reviewerName: string;
  rating: number; // 1–10
  text: string;
  isSpoiler: boolean;
  createdAt: string; // ISO date
  upvotes: number;
  downvotes?: number;
}

export interface Favorite {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: string;
  releaseDate?: string;
  voteAverage?: string;
  genres?: string;
}

export interface WatchlistItem {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: string;
}

const STORAGE_KEYS = {
  WATCHLIST: 'cinefy_watchlist',
  REVIEWS: 'filmq_cached_reviews',
  FAVORITES: 'filmq_cached_favorites',
};

// Real-time synchronization events
export function notifyReviewsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('filmq:reviews-updated'));
    window.dispatchEvent(new Event('storage'));
  }
}

export function notifyFavoritesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('filmq:favorites-updated'));
    window.dispatchEvent(new Event('storage'));
  }
}

// --- REVIEWS (Fast SWR Cache) ---

let reviewsCache: Review[] | null = null;
let reviewsPromise: Promise<Review[]> | null = null;

async function revalidateReviews(): Promise<Review[]> {
  if (reviewsPromise) return reviewsPromise;

  reviewsPromise = (async () => {
    try {
      const res = await fetch('/api/reviews', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const freshReviews: Review[] = await res.json();
      
      const prev = JSON.stringify(reviewsCache || []);
      const next = JSON.stringify(freshReviews);
      reviewsCache = freshReviews;
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, next);
      } catch {}

      if (prev !== next) {
        notifyReviewsUpdated();
      }
      return freshReviews;
    } finally {
      reviewsPromise = null;
    }
  })();

  return reviewsPromise;
}

export async function getReviews(): Promise<Review[]> {
  // 1. Instant in-memory cache
  if (reviewsCache && reviewsCache.length > 0) {
    revalidateReviews().catch(() => {});
    return [...reviewsCache];
  }

  // 2. Instant localStorage cache
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REVIEWS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        reviewsCache = parsed;
        revalidateReviews().catch(() => {});
        return [...parsed];
      }
    }
  } catch {}

  // 3. Fallback to network
  return revalidateReviews();
}

export async function getReviewsForMovie(movieId: number): Promise<Review[]> {
  const res = await fetch(`/api/reviews/${movieId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch reviews for movie');
  return res.json();
}

export async function addReview(review: Review): Promise<void> {
  // Optimistic update
  reviewsCache = [review, ...(reviewsCache || [])];
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviewsCache));
  } catch {}
  notifyReviewsUpdated();

  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    revalidateReviews().catch(() => {});
    throw new Error('Failed to add review');
  }
}

export async function updateReview(id: string, changes: Partial<Review>): Promise<void> {
  // Optimistic update
  if (reviewsCache) {
    reviewsCache = reviewsCache.map(r => r.id === id ? { ...r, ...changes } : r);
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviewsCache));
    } catch {}
    notifyReviewsUpdated();
  }

  const res = await fetch(`/api/reviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) {
    revalidateReviews().catch(() => {});
    throw new Error('Failed to update review');
  }
}

export async function deleteReview(id: string): Promise<void> {
  // Optimistic update
  if (reviewsCache) {
    reviewsCache = reviewsCache.filter(r => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviewsCache));
    } catch {}
    notifyReviewsUpdated();
  }

  const res = await fetch(`/api/reviews/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    revalidateReviews().catch(() => {});
    throw new Error('Failed to delete review');
  }
}

// --- FAVORITES (Fast SWR Cache) ---

let favoritesCache: Favorite[] | null = null;
let favoritesPromise: Promise<Favorite[]> | null = null;

async function revalidateFavorites(): Promise<Favorite[]> {
  if (favoritesPromise) return favoritesPromise;

  favoritesPromise = (async () => {
    try {
      const res = await fetch('/api/favorites', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      const mapped: Favorite[] = data.map((fav: any) => ({
        movieId: fav.movieId,
        movieTitle: fav.movieTitle,
        posterPath: fav.posterPath,
        addedAt: fav.createdAt || fav.addedAt,
        releaseDate: fav.releaseDate,
        voteAverage: fav.voteAverage,
        genres: fav.genres,
      }));

      const prev = JSON.stringify(favoritesCache || []);
      const next = JSON.stringify(mapped);
      favoritesCache = mapped;
      try {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, next);
      } catch {}

      if (prev !== next) {
        notifyFavoritesUpdated();
      }
      return mapped;
    } finally {
      favoritesPromise = null;
    }
  })();

  return favoritesPromise;
}

export async function getFavorites(): Promise<Favorite[]> {
  // 1. Instant in-memory cache
  if (favoritesCache && favoritesCache.length > 0) {
    revalidateFavorites().catch(() => {});
    return [...favoritesCache];
  }

  // 2. Instant localStorage cache
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.FAVORITES) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        favoritesCache = parsed;
        revalidateFavorites().catch(() => {});
        return [...parsed];
      }
    }
  } catch {}

  // 3. Fallback to network
  return revalidateFavorites();
}

export async function addFavorite(favorite: Favorite): Promise<void> {
  // Optimistic update
  favoritesCache = [...(favoritesCache || []).filter(f => f.movieId !== favorite.movieId), favorite];
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoritesCache));
  } catch {}
  notifyFavoritesUpdated();

  const res = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favorite),
  });
  if (!res.ok) {
    revalidateFavorites().catch(() => {});
    throw new Error('Failed to add favorite');
  }
}

export async function removeFavorite(movieId: number): Promise<void> {
  // Optimistic update
  if (favoritesCache) {
    favoritesCache = favoritesCache.filter(f => f.movieId !== movieId);
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoritesCache));
    } catch {}
    notifyFavoritesUpdated();
  }

  const res = await fetch(`/api/favorites/${movieId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    revalidateFavorites().catch(() => {});
    throw new Error('Failed to remove favorite');
  }
}

export async function isFavorite(movieId: number): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some(f => f.movieId === movieId);
  } catch (e) {
    console.error(e);
    return false;
  }
}

// --- WATCHLIST ---

export function getWatchlist(): WatchlistItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
  return data ? JSON.parse(data) : [];
}

export function addToWatchlist(item: WatchlistItem): void {
  const watchlist = getWatchlist();
  if (!watchlist.some(w => w.movieId === item.movieId)) {
    watchlist.push(item);
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  }
}

export function removeFromWatchlist(movieId: number): void {
  const watchlist = getWatchlist().filter(w => w.movieId !== movieId);
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
}

export function isWatchlisted(movieId: number): boolean {
  return getWatchlist().some(w => w.movieId === movieId);
}

// Listen for storage changes across tabs
export function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}
