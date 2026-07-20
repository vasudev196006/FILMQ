import React, { useState } from 'react';
import { Link } from 'wouter';
import { BookmarkCheck, BookmarkPlus, Heart, Film } from 'lucide-react';
import { useMovieActions } from '@/hooks/useMovieActions';
import { IMAGE_BASE } from '@/lib/tmdb';

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number; // out of 10
  genre: string[];
  poster: string; // image URL, portrait orientation
  href?: string;
}

export const MovieCard: React.FC<{
  movie: Movie;
  onQuickRate?: (id: string, rating: number) => void;
}> = ({ movie, onQuickRate }) => {
  const { favorite, watchlisted, toggleFavorite, toggleWatchlist } = useMovieActions(Number(movie.id), {
    title: movie.title,
    posterPath: movie.poster.replace(IMAGE_BASE + 'w500', '') // basic strip
  });

  const [isHoveringRate, setIsHoveringRate] = useState(false);

  const innerContent = (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/15 bg-slate-950 group transition-all duration-500 hover:scale-[1.03] hover:border-white/30 transform-gpu shadow-xl" data-testid={`movie-card-${movie.id}`}>
      {movie.poster && movie.poster.includes('null') ? (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.08]">
          <Film className="size-16 text-white/20" />
        </div>
      ) : (
        <img
          src={movie.poster}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08] transform-gpu"
          loading="lazy"
        />
      )}
      
      {/* Gradient Scrim */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0) 70%)'
        }}
      />

      {/* Quick Actions Overlay */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button
          onClick={toggleWatchlist}
          className={`size-9 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-xl transition-all duration-300 ${
            watchlisted
              ? 'bg-emerald-500/80 border border-emerald-300/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-110'
              : 'bg-black/40 hover:bg-black/60 border border-white/20 text-white/80 hover:text-white'
          }`}
          title="Watchlist"
          data-testid={`btn-watchlist-${movie.id}`}
        >
          {watchlisted ? <BookmarkCheck className="size-4" /> : <BookmarkPlus className="size-4" />}
        </button>

        <button
          onClick={toggleFavorite}
          className={`size-9 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-xl transition-all duration-300 ${
            favorite
              ? 'bg-[#E50914] text-white shadow-md animate-heart-pop'
              : 'bg-black/40 hover:bg-black/60 border border-white/20 text-white/70 hover:text-[#E50914]'
          }`}
          title="Favorite"
          data-testid={`btn-favorite-${movie.id}`}
        >
          <Heart className={`size-4 ${favorite ? 'fill-white' : 'fill-transparent'}`} />
        </button>
      </div>

      {/* Glass Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 border-t border-white/15 rounded-b-3xl bg-black/60 backdrop-blur-xl">
        <div className="flex justify-between items-end gap-2">
          <div className="flex-1 overflow-hidden">
            <h3 className="text-white font-semibold truncate text-lg">{movie.title}</h3>
            <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
              <span>{movie.year}</span>
              {movie.genre.length > 0 && (
                <>
                  <span className="size-1 bg-white/30 rounded-full" />
                  <span className="truncate">{movie.genre[0]}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="relative" onMouseEnter={() => setIsHoveringRate(true)} onMouseLeave={() => setIsHoveringRate(false)}>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-xs font-bold text-white cursor-pointer backdrop-blur-md transition-all glass-pill">
              <span className="text-[#E50914]">★</span> {movie.rating.toFixed(1)}
            </div>
            
            {/* Hover Popover for quick rate (Optional implementation) */}
            {isHoveringRate && onQuickRate && (
              <div className="absolute bottom-full right-0 mb-2 backdrop-blur-2xl bg-slate-900/90 border border-white/20 rounded-2xl p-3 shadow-2xl flex items-center gap-1 z-30" onClick={(e) => e.preventDefault()}>
                {/* A simplified mini star rater could go here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (movie.href) {
    return (
      <Link href={movie.href} className="block aspect-[2/3] w-full cursor-pointer no-underline text-current">
        {innerContent}
      </Link>
    );
  }

  return (
    <div className="aspect-[2/3] w-full">
      {innerContent}
    </div>
  );
};
