import { useState, useEffect } from 'react';
import { isFavorite, addFavorite, removeFavorite, isWatchlisted, addToWatchlist, removeFromWatchlist, subscribeToStorage } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

export function useMovieActions(
  movieId: number, 
  movieDetails?: { 
    title: string; 
    posterPath: string;
    releaseDate?: string;
    voteAverage?: number;
    genres?: string[];
  }
) {
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
    try {
      if (favorite) {
        await removeFavorite(movieId);
        setFavorite(false);
        toast({
          title: "Favorites Updated",
          description: `Removed "${movieDetails?.title || 'Movie'}" from favorites.`
        });
      } else if (movieDetails) {
        await addFavorite({
          movieId,
          movieTitle: movieDetails.title,
          posterPath: movieDetails.posterPath,
          addedAt: new Date().toISOString(),
          releaseDate: movieDetails.releaseDate || '',
          voteAverage: movieDetails.voteAverage !== undefined ? String(movieDetails.voteAverage) : '0',
          genres: movieDetails.genres ? movieDetails.genres.join(',') : ''
        });
        setFavorite(true);
        toast({
          title: "Favorites Updated",
          description: `Added "${movieDetails.title}" to favorites.`
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to Update Favorites",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
    window.dispatchEvent(new Event('storage'));
  };

  const toggleWatchlist = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      if (watchlisted) {
        removeFromWatchlist(movieId);
        setWatchlisted(false);
        toast({
          title: "Watchlist Updated",
          description: `Removed "${movieDetails?.title || 'Movie'}" from your watchlist.`
        });
      } else if (movieDetails) {
        addToWatchlist({
          movieId,
          movieTitle: movieDetails.title,
          posterPath: movieDetails.posterPath,
          addedAt: new Date().toISOString()
        });
        setWatchlisted(true);
        toast({
          title: "Watchlist Updated",
          description: `Added "${movieDetails.title}" to your watchlist.`
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to Update Watchlist",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
    window.dispatchEvent(new Event('storage'));
  };

  return { favorite, watchlisted, toggleFavorite, toggleWatchlist };
}
