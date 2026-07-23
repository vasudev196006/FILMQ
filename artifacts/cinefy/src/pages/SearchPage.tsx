import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { fetchSearch, fetchGenres, fetchTrending, fetchDiscover, TMDBMovie, IMAGE_BASE } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { FilterBar, FilterState } from '@/components/FilterBar';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Search, Film } from 'lucide-react';
import GlassSurface from '@/components/GlassSurface';

export const SearchPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({
    selectedGenre: '',
    sortBy: 'trending',
    selectedDecade: null,
    viewMode: 'grid',
  });

  // Parse query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genreParam = params.get('genre');
    const decadeParam = params.get('decade');
    
    if (genreParam || decadeParam) {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: genreParam || prev.selectedGenre,
        selectedDecade: decadeParam || prev.selectedDecade,
      }));
    }
  }, [location]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: genres = [] } = useQuery({ 
    queryKey: ['genres'], 
    queryFn: fetchGenres 
  });

  const isDefaultTrending = !debouncedQuery && !filterState.selectedGenre && !filterState.selectedDecade && filterState.sortBy === 'trending';
  const isDiscovering = !debouncedQuery && !isDefaultTrending;

  // If query is empty, we show trending (or popular) as a default discovery view
  const { data: trendingMovies = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: fetchTrending,
    enabled: isDefaultTrending
  });

  const { data: discoverMovies = [], isLoading: isLoadingDiscover } = useQuery({
    queryKey: ['discover', filterState.selectedGenre, filterState.selectedDecade, filterState.sortBy],
    queryFn: () => fetchDiscover({
      genreId: filterState.selectedGenre,
      decade: filterState.selectedDecade,
      sortBy: filterState.sortBy
    }),
    enabled: isDiscovering
  });

  const { data: searchResults = [], isLoading: isLoadingSearch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => fetchSearch(debouncedQuery),
    enabled: !!debouncedQuery
  });

  const isLoading = debouncedQuery 
    ? isLoadingSearch 
    : isDefaultTrending 
      ? isLoadingTrending 
      : isLoadingDiscover;

  let displayedMovies = debouncedQuery 
    ? searchResults 
    : isDefaultTrending 
      ? trendingMovies 
      : discoverMovies;

  // Apply filters locally only for search results (since the TMDB search API doesn't support them)
  if (debouncedQuery) {
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
  }

  return (
    <div className="min-h-screen bg-app pt-32 pb-20">
      
      {/* React Bits GlassSurface Search Bar */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none flex justify-center">
        <GlassSurface
          width="100%"
          height={56}
          borderRadius={28}
          borderWidth={0.07}
          brightness={55}
          opacity={0.85}
          blur={10}
          displace={0}
          backgroundOpacity={0}
          saturation={1.2}
          distortionScale={-150}
          redOffset={2}
          greenOffset={8}
          blueOffset={15}
          className="pointer-events-auto shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
        >
          <div className="relative w-full flex items-center h-full">
            <div className="absolute left-4 flex items-center pointer-events-none z-20">
              <Search className="size-5 text-white/70" />
            </div>
            <input
              type="search"
              className="w-full bg-transparent border-none py-3 pl-12 pr-6 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#E50914]/60 rounded-full font-medium"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </GlassSurface>
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
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {displayedMovies.map(movie => {
              // Convert TMDB genre ids to string names if possible
              const movieGenres = movie.genre_ids.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) as string[];
              
              return (
                <div key={movie.id}>
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
