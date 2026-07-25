import React, { useState, useEffect } from 'react';
import { getFavorites, Favorite } from '@/lib/storage';
import { MovieCard } from '@/components/MovieCard';
import { EmptyState } from '@/components/EmptyState';
import { Heart } from 'lucide-react';
import { IMAGE_BASE, fetchMovieDetails } from '@/lib/tmdb';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      const reversed = favs.reverse(); // newest first
      setFavorites(reversed);

      // Fetch missing metadata dynamically in the browser for legacy favorites
      const updatedFavs = await Promise.all(
        reversed.map(async (fav) => {
          if (!fav.releaseDate || fav.voteAverage === '0' || fav.voteAverage === '0.0') {
            try {
              const details = await fetchMovieDetails(fav.movieId.toString());
              if (details) {
                return {
                  ...fav,
                  releaseDate: details.release_date || '',
                  voteAverage: details.vote_average !== undefined ? String(details.vote_average) : '0',
                  genres: details.genres ? details.genres.map((g: any) => g.name).join(',') : ''
                };
              }
            } catch (err) {
              console.error(`Failed to fetch details for movie ${fav.movieId}:`, err);
            }
          }
          return fav;
        })
      );
      setFavorites(updatedFavs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFavorites();
    window.addEventListener('storage', loadFavorites);
    return () => window.removeEventListener('storage', loadFavorites);
  }, []);

  return (
    <div className="min-h-screen bg-app pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-4xl font-serif text-white mb-8">My Favorites</h1>
        
        {favorites.length === 0 ? (
          <EmptyState 
            icon={Heart}
            title="No favorites yet"
            message="Movies you mark as favorite will appear here."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map(favorite => (
              <MovieCard 
                key={favorite.movieId}
                movie={{
                  id: favorite.movieId.toString(),
                  title: favorite.movieTitle,
                  year: favorite.releaseDate ? parseInt(favorite.releaseDate.substring(0, 4)) || 0 : 0,
                  rating: favorite.voteAverage ? parseFloat(favorite.voteAverage) || 0 : 0,
                  genre: favorite.genres ? favorite.genres.split(',').filter(Boolean) : [],
                  poster: favorite.posterPath ? `${IMAGE_BASE}w500${favorite.posterPath}` : '',
                  href: `/movie/${favorite.movieId}`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
