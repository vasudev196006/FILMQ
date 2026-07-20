import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrending, fetchPopular, fetchTopRated, IMAGE_BASE, TMDBMovie } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { ReviewCard } from '@/components/ReviewCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getReviews } from '@/lib/storage';
import { Link } from 'wouter';
import { Star, Play, Edit3, Film } from 'lucide-react';

const HorizontalScrollRow: React.FC<{ title: string, movies: TMDBMovie[], isLoading: boolean }> = ({ title, movies, isLoading }) => {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
          {title}
          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
        </h2>
        
        {isLoading ? (
          <div className="flex gap-6 overflow-x-hidden">
            <LoadingSkeleton count={4} />
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8 -mb-8 no-scrollbar snap-x pt-4">
            {movies.map(movie => (
              <div key={movie.id} className="min-w-[160px] md:min-w-[220px] lg:min-w-[260px] snap-start">
                <MovieCard 
                  movie={{
                    id: movie.id.toString(),
                    title: movie.title,
                    year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0,
                    rating: movie.vote_average,
                    genre: [], // TMDB gives ids, resolving names would require a mapping or append
                    poster: movie.poster_path ? `${IMAGE_BASE}w500${movie.poster_path}` : '',
                    href: `/movie/${movie.id}`
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const HomePage: React.FC = () => {
  const { data: trending, isLoading: isLoadingTrending } = useQuery({ queryKey: ['trending'], queryFn: fetchTrending });
  const { data: popular, isLoading: isLoadingPopular } = useQuery({ queryKey: ['popular'], queryFn: fetchPopular });
  const { data: topRated, isLoading: isLoadingTopRated } = useQuery({ queryKey: ['topRated'], queryFn: fetchTopRated });

  const heroMovie = trending?.[0];
  const recentReviews = getReviews().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-end pb-20 pt-32">
        {heroMovie && (
          <>
            <div className="absolute inset-0 z-0">
              <img 
                src={`${IMAGE_BASE}original${heroMovie.backdrop_path || heroMovie.poster_path}`} 
                alt={heroMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14] via-[#0A0D14]/50 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 md:px-8 relative z-10 w-full">
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass-pill px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                    #1 Trending
                  </div>
                  <div className="glass-pill px-3 py-1 flex items-center gap-1 text-amber-300 text-xs font-bold">
                    <Star className="size-3.5 fill-amber-300" />
                    {heroMovie.vote_average.toFixed(1)} TMDB
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 leading-tight drop-shadow-lg">
                  {heroMovie.title}
                </h1>
                
                <p className="text-lg text-slate-300 mb-8 line-clamp-3 leading-relaxed max-w-xl">
                  {heroMovie.overview}
                </p>
                
                <div className="flex items-center gap-4">
                  <Link href={`/movie/${heroMovie.id}`} className="cursor-pointer">
                    <div className="relative group overflow-hidden px-6 py-3 rounded-full font-semibold text-sm text-white transition-all duration-300 flex items-center gap-2">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90 group-hover:opacity-100 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-0"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-0"></div>
                      <Play className="size-4 relative z-10 fill-white" />
                      <span className="relative z-10">Movie Details</span>
                    </div>
                  </Link>
                  
                  <Link href={`/movie/${heroMovie.id}`} className="cursor-pointer">
                    <div className="px-6 py-3 rounded-full glass-panel hover:bg-white/10 text-white text-sm font-semibold transition-all flex items-center gap-2 border border-white/20">
                      <Edit3 className="size-4" />
                      Write a Review
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Carousels */}
      <div className="-mt-10 relative z-20">
        <HorizontalScrollRow title="Trending This Week" movies={trending || []} isLoading={isLoadingTrending} />
        <HorizontalScrollRow title="Popular Now" movies={popular || []} isLoading={isLoadingPopular} />
        <HorizontalScrollRow title="Top Rated Classics" movies={topRated || []} isLoading={isLoadingTopRated} />
      </div>

      {/* Community Reviews */}
      {recentReviews.length > 0 && (
        <section className="py-12 container mx-auto px-4 md:px-8">
          <h2 className="text-2xl font-serif text-white mb-8 flex items-center gap-3">
            Recent Community Reviews
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentReviews.map(review => (
              <ReviewCard key={review.id} review={review} showMovieContext />
            ))}
          </div>
        </section>
      )}

      <footer className="container mx-auto px-4 py-12 mt-12 border-t border-white/5 text-center text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Film className="size-5" />
          <span className="font-serif text-xl text-white">Cinefy</span>
        </div>
        <p className="text-sm">Powered by TMDB API. Built for cinephiles.</p>
      </footer>
    </div>
  );
};
