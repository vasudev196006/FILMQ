import { useState, useEffect } from 'react';
import { isFavorite, addFavorite, removeFavorite, isWatchlisted, addToWatchlist, removeFromWatchlist, subscribeToStorage } from '@/lib/storage';

export function useMovieActions(movieId: number, movieDetails?: { title: string, posterPath: string }) {
  const [favorite, setFavorite] = useState(false);
  const [watchlisted, setWatchlisted] = useState(() => isWatchlisted(movieId));

  const checkFavorite = async () => {
    try {
      const fav = await isFavorite(movieId);
      setFavorite(fav);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkFavorite();
    setWatchlisted(isWatchlisted(movieId));
    
    const unsub = subscribeToStorage(() => {
      checkFavorite();
      setWatchlisted(isWatchlisted(movieId));
    });
    return unsub;
  }, [movieId]);

  const toggleFavorite = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (favorite) {
      await removeFavorite(movieId);
      setFavorite(false);
    } else if (movieDetails) {
      await addFavorite({
        movieId,
        movieTitle: movieDetails.title,
        posterPath: movieDetails.posterPath,
        addedAt: new Date().toISOString()
      });
      setFavorite(true);
    }
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
