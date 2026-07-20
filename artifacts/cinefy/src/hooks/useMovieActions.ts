import { useState, useEffect } from 'react';
import { isFavorite, addFavorite, removeFavorite, isWatchlisted, addToWatchlist, removeFromWatchlist, subscribeToStorage } from '@/lib/storage';

export function useMovieActions(movieId: number, movieDetails?: { title: string, posterPath: string }) {
  const [favorite, setFavorite] = useState(() => isFavorite(movieId));
  const [watchlisted, setWatchlisted] = useState(() => isWatchlisted(movieId));

  useEffect(() => {
    setFavorite(isFavorite(movieId));
    setWatchlisted(isWatchlisted(movieId));
    const unsub = subscribeToStorage(() => {
      setFavorite(isFavorite(movieId));
      setWatchlisted(isWatchlisted(movieId));
    });
    return unsub;
  }, [movieId]);

  const toggleFavorite = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (favorite) {
      removeFavorite(movieId);
      setFavorite(false);
    } else if (movieDetails) {
      addFavorite({
        movieId,
        movieTitle: movieDetails.title,
        posterPath: movieDetails.posterPath,
        addedAt: new Date().toISOString()
      });
      setFavorite(true);
    }
    // trigger storage event manually in case it's same window
    window.dispatchEvent(new Event('storage'));
  };

  const toggleWatchlist = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (watchlisted) {
      removeFromWatchlist(movieId);
      setWatchlisted(false);
    } else if (movieDetails) {
      addToWatchlist({
        movieId,
        movieTitle: movieDetails.title,
        posterPath: movieDetails.posterPath,
        addedAt: new Date().toISOString()
      });
      setWatchlisted(true);
    }
    window.dispatchEvent(new Event('storage'));
  };

  return { favorite, watchlisted, toggleFavorite, toggleWatchlist };
}
