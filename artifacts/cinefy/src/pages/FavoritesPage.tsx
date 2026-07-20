import React, { useState, useEffect } from 'react';
import { getFavorites, Favorite } from '@/lib/storage';
import { MovieCard } from '@/components/MovieCard';
import { EmptyState } from '@/components/EmptyState';
import { Heart } from 'lucide-react';
import { IMAGE_BASE } from '@/lib/tmdb';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    loadFavorites();
    window.addEventListener('storage', loadFavorites);
    return () => window.removeEventListener('storage', loadFavorites);
  }, []);

  const loadFavorites = () => {
    setFavorites(getFavorites().reverse()); // newest first usually
  };

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
                  year: 0, // Not stored in short favorite model, could fetch details if needed
                  rating: 0,
                  genre: [],
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
