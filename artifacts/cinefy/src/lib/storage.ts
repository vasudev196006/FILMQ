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
}

export interface WatchlistItem {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: string;
}

const STORAGE_KEYS = {
  WATCHLIST: 'cinefy_watchlist',
};

// --- REVIEWS ---

export async function getReviews(): Promise<Review[]> {
  const res = await fetch('/api/reviews');
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function getReviewsForMovie(movieId: number): Promise<Review[]> {
  const res = await fetch(`/api/reviews/${movieId}`);
  if (!res.ok) throw new Error('Failed to fetch reviews for movie');
  return res.json();
}

export async function addReview(review: Review): Promise<void> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) throw new Error('Failed to add review');
}

export async function updateReview(id: string, changes: Partial<Review>): Promise<void> {
  const res = await fetch(`/api/reviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error('Failed to update review');
}

export async function deleteReview(id: string): Promise<void> {
  const res = await fetch(`/api/reviews/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete review');
}

// --- FAVORITES ---

export async function getFavorites(): Promise<Favorite[]> {
  const res = await fetch('/api/favorites');
  if (!res.ok) throw new Error('Failed to fetch favorites');
  const data = await res.json();
  return data.map((fav: any) => ({
    movieId: fav.movieId,
    movieTitle: fav.movieTitle,
    posterPath: fav.posterPath,
    addedAt: fav.createdAt || fav.addedAt,
  }));
}

export async function addFavorite(favorite: Favorite): Promise<void> {
  const res = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(favorite),
  });
  if (!res.ok) throw new Error('Failed to add favorite');
}

export async function removeFavorite(movieId: number): Promise<void> {
  const res = await fetch(`/api/favorites/${movieId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove favorite');
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
