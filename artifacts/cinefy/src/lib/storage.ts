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
  REVIEWS: 'cinefy_reviews',
  FAVORITES: 'cinefy_favorites',
  WATCHLIST: 'cinefy_watchlist',
};

// --- REVIEWS ---

export function getReviews(): Review[] {
  const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
  return data ? JSON.parse(data) : [];
}

export function getReviewsForMovie(movieId: number): Review[] {
  return getReviews().filter(r => r.movieId === movieId);
}

export function addReview(review: Review): void {
  const reviews = getReviews();
  reviews.push(review);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
}

export function updateReview(id: string, changes: Partial<Review>): void {
  const reviews = getReviews();
  const index = reviews.findIndex(r => r.id === id);
  if (index !== -1) {
    reviews[index] = { ...reviews[index], ...changes };
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }
}

export function deleteReview(id: string): void {
  const reviews = getReviews().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
}

// --- FAVORITES ---

export function getFavorites(): Favorite[] {
  const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  return data ? JSON.parse(data) : [];
}

export function addFavorite(favorite: Favorite): void {
  const favorites = getFavorites();
  if (!favorites.some(f => f.movieId === favorite.movieId)) {
    favorites.push(favorite);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }
}

export function removeFavorite(movieId: number): void {
  const favorites = getFavorites().filter(f => f.movieId !== movieId);
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

export function isFavorite(movieId: number): boolean {
  return getFavorites().some(f => f.movieId === movieId);
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
