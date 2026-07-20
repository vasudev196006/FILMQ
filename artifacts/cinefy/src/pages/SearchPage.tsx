import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { fetchSearch, fetchGenres, fetchTrending, TMDBMovie, IMAGE_BASE } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { FilterBar, FilterState } from '@/components/FilterBar';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Search, Film } from 'lucide-react';
import { useScrollDistortion } from '@/components/GlassFilter';

export const SearchPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({
    selectedGenre: '',
    sortBy: 'trending',
    selectedDecade: null,
    viewMode: 'grid',
  });

  useScrollDistortion();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: genres = [] } = useQuery({ 
    queryKey: ['genres'], 
    queryFn: fetchGenres 
  });

  // If query is empty, we show trending (or popular) as a default discovery view
  const { data: trendingMovies = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: fetchTrending,
    enabled: !debouncedQuery
  });

  const { data: searchResults = [], isLoading: isLoadingSearch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => fetchSearch(debouncedQuery),
    enabled: !!debouncedQuery
  });

  const isLoading = debouncedQuery ? isLoadingSearch : isLoadingTrending;
  let displayedMovies = debouncedQuery ? searchResults : trendingMovies;

  // Apply filters locally (since we don't have a full backend, we filter the current result set)
  if (filterState.selectedGenre) {
    displayedMovies = displayedMovies.filter(m => m.genre_ids.includes(parseInt(filterState.selectedGenre)));
  }

  if (filterState.selectedDecade) {
    const decadeStart = parseInt(filterState.selectedDecade);
    displayedMovies = displayedMovies.filter(m => {
      if (!m.release_date) return false;
      const year = parseInt(m.release_date.substring(0, 4));
      return year >= decadeStart && year < decadeStart + 10;
    });
  }

  return (
    <div className="min-h-screen bg-app pt-32 pb-20">
      
      {/* Scroll-Reactive Liquid Glass Search Bar */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full relative group rounded-full overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
          
          {/* Multi-stage 3D Liquid Glass Refraction Shadow Overlay */}
          <div className="absolute inset-0 z-0 h-full w-full rounded-full pointer-events-none
            shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]" 
          />

          {/* Liquid Glass Backdrop Layer */}
          <div 
            className="absolute inset-0 -z-10 h-full w-full rounded-full bg-black/30 backdrop-blur-2xl border border-white/20 overflow-hidden"
            style={{ backdropFilter: 'url("#container-glass")', WebkitBackdropFilter: 'url("#container-glass")' }}
          />

          {/* Crisp Foreground Search Input Content */}
          <div className="relative z-10 flex items-center">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
              <Search className="size-5 text-white/70" />
            </div>
            <input
              type="search"
              className="w-full bg-transparent rounded-full py-4 pl-14 pr-6 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E50914]/60 transition-all font-medium"
              placeholder="Search movies, directors, actors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="search-input"
            />
          </div>

        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-12">
        <FilterBar 
          genres={genres}
          filterState={filterState}
          onFilterChange={(newState) => setFilterState(prev => ({ ...prev, ...newState }))}
        />

        {isLoading ? (
          <LoadingSkeleton count={8} />
        ) : displayedMovies.length > 0 ? (
          <div 
            className={`grid gap-6 ${
              filterState.viewMode === 'grid' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                : filterState.viewMode === 'list'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'columns-2 md:columns-3 lg:columns-4 space-y-6' /* simplified masonry */
            }`}
          >
            {displayedMovies.map(movie => {
              // Convert TMDB genre ids to string names if possible
              const movieGenres = movie.genre_ids.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) as string[];
              
              return (
                <div key={movie.id} className={filterState.viewMode === 'masonry' ? 'break-inside-avoid' : ''}>
                  <MovieCard 
                    movie={{
                      id: movie.id.toString(),
                      title: movie.title,
                      year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0,
                      rating: movie.vote_average,
                      genre: movieGenres,
                      poster: movie.poster_path ? `${IMAGE_BASE}w500${movie.poster_path}` : '',
                      href: `/movie/${movie.id}`
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={Film}
            title="No movies found"
            message={debouncedQuery ? `We couldn't find any matches for "${debouncedQuery}"` : "Try adjusting your filters to discover more movies."}
          />
        )}
      </div>
    </div>
  );
};
