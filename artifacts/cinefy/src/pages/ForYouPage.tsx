import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Sparkles, Search, TrendingUp, Film, Tv } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { TVShowCard, type TVShow } from '@/components/TVShowCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { IMAGE_BASE, type TMDBMovie, type TMDBTVShow } from '@/lib/tmdb';

// ── Types ──────────────────────────────────────────────────

interface GenreAffinity {
  id: number;
  name: string;
  score: number;
}

interface RecommendationResponse {
  movies: TMDBMovie[];
  tvShows: TMDBTVShow[];
  profile: {
    topGenres: GenreAffinity[];
    basedOn: { reviewCount: number; favoriteCount: number };
  };
}

// ── Fetch ──────────────────────────────────────────────────

async function fetchRecommendations(): Promise<RecommendationResponse> {
  const res = await fetch('/api/recommendations', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

// ── Sub-components ─────────────────────────────────────────

const GenreBar: React.FC<{ genre: GenreAffinity; maxScore: number }> = ({ genre, maxScore }) => {
  const percentage = Math.min((genre.score / maxScore) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-white/80 w-20 text-right shrink-0 truncate">
        {genre.name}
      </span>
      <div className="flex-1 h-2.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#ff4d56] transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-white/50 w-10 shrink-0">{genre.score.toFixed(1)}</span>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="size-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E50914]/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
        <Sparkles className="size-10 text-[#E50914]" />
      </div>

      <h2 className="text-2xl font-serif text-white mb-3">
        We Don't Know You Yet
      </h2>
      <p className="text-white/60 text-sm leading-relaxed mb-8">
        Rate some movies and add favorites so we can learn your taste. The more you interact, the smarter your recommendations become.
      </p>

      <Link href="/search" className="cursor-pointer">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E50914] hover:bg-[#E50914]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#E50914]/20">
          <Search className="size-4" />
          Discover Movies
        </div>
      </Link>
    </div>
  </div>
);

const HorizontalScrollRow: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <section className="py-8">
    <div className="container mx-auto px-4 md:px-8">
      <h2 className="text-2xl font-serif text-foreground mb-6 flex items-center gap-3">
        {icon}
        {title}
        <div className="flex-1 h-px bg-gradient-to-r from-foreground/15 to-transparent ml-4" />
      </h2>
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 -mb-8 no-scrollbar snap-x pt-4">
        {children}
      </div>
    </div>
  </section>
);

// ── Page ───────────────────────────────────────────────────

export const ForYouPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 5 * 60 * 1000, // Match server cache TTL
  });

  const hasData = data && (data.movies.length > 0 || data.tvShows.length > 0);
  const isEmpty = data && data.movies.length === 0 && data.tvShows.length === 0;

  return (
    <div className="min-h-screen bg-app pb-20">
      {/* Hero */}
      <section className="relative pt-28 md:pt-32 pb-8 md:pb-12">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/8 via-transparent to-indigo-600/8 animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E50914]/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#ff4d56] flex items-center justify-center shadow-lg shadow-[#E50914]/30">
              <Sparkles className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-foreground leading-tight">
                Picked For You
              </h1>
              <p className="text-sm text-foreground/60 mt-0.5">
                Personalized recommendations based on your taste
              </p>
            </div>
          </div>

          {/* Genre affinity pills */}
          {data?.profile.topGenres && data.profile.topGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {data.profile.topGenres.map((genre) => (
                <div
                  key={genre.id}
                  className="glass-pill px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/90 border border-white/15 bg-white/5 backdrop-blur-md"
                >
                  {genre.name}
                </div>
              ))}
              <div className="glass-pill px-3.5 py-1.5 rounded-full text-xs text-white/50 border border-white/10 bg-white/3 backdrop-blur-md">
                {data.profile.basedOn.favoriteCount} favorites · {data.profile.basedOn.reviewCount} reviews
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <div className="relative z-20">
        {isLoading && (
          <div className="container mx-auto px-4 md:px-8 py-8">
            <h2 className="text-2xl font-serif text-foreground mb-6 flex items-center gap-3">
              <Sparkles className="size-5 text-[#E50914]" />
              Loading your recommendations...
            </h2>
            <div className="flex gap-4 md:gap-6 overflow-x-hidden">
              <LoadingSkeleton count={4} />
            </div>
          </div>
        )}

        {error && (
          <div className="container mx-auto px-4 md:px-8 py-16 text-center">
            <p className="text-white/60">Something went wrong loading recommendations. Please try again later.</p>
          </div>
        )}

        {isEmpty && <EmptyState />}

        {hasData && (
          <>
            {/* Recommended Movies */}
            {data.movies.length > 0 && (
              <HorizontalScrollRow
                title="Recommended Movies"
                icon={<Film className="size-5 text-[#E50914]" />}
              >
                {data.movies.map((movie) => (
                  <div key={movie.id} className="w-[calc((100%-1rem)/2)] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)] shrink-0 snap-start">
                    <MovieCard
                      movie={{
                        id: movie.id.toString(),
                        title: movie.title,
                        year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0,
                        rating: movie.vote_average,
                        genre: [],
                        poster: movie.poster_path ? `${IMAGE_BASE}w500${movie.poster_path}` : '',
                        href: `/movie/${movie.id}`,
                      }}
                    />
                  </div>
                ))}
              </HorizontalScrollRow>
            )}

            {/* TV Shows */}
            {data.tvShows.length > 0 && (
              <HorizontalScrollRow
                title="TV Shows You'll Love"
                icon={<Tv className="size-5 text-indigo-400" />}
              >
                {data.tvShows.map((show) => (
                  <div key={show.id} className="w-[calc((100%-1rem)/2)] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)] shrink-0 snap-start">
                    <TVShowCard
                      show={{
                        id: show.id,
                        name: show.name,
                        firstAirDate: show.first_air_date,
                        rating: show.vote_average,
                        poster: show.poster_path ? `${IMAGE_BASE}w500${show.poster_path}` : '',
                      }}
                    />
                  </div>
                ))}
              </HorizontalScrollRow>
            )}

            {/* Taste Profile Card */}
            {data.profile.topGenres.length > 0 && (
              <section className="py-12 container mx-auto px-4 md:px-8">
                <h2 className="text-2xl font-serif text-foreground mb-8 flex items-center gap-3">
                  <TrendingUp className="size-5 text-[#E50914]" />
                  Your Taste Profile
                  <div className="flex-1 h-px bg-gradient-to-r from-foreground/15 to-transparent ml-4" />
                </h2>

                <div className="max-w-lg mx-auto p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl">
                  <div className="flex flex-col gap-3">
                    {data.profile.topGenres.map((genre) => (
                      <GenreBar
                        key={genre.id}
                        genre={genre}
                        maxScore={data.profile.topGenres[0].score}
                      />
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>Based on {data.profile.basedOn.favoriteCount} favorites & {data.profile.basedOn.reviewCount} reviews</span>
                    <span className="text-[#E50914]/60">Updated live</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <footer className="container mx-auto px-4 py-12 mt-12 border-t border-black/10 dark:border-white/5 text-center text-slate-500">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="size-9 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shrink-0 flex items-center justify-center bg-black/10 dark:bg-black/60">
            <img src="/logo.png" alt="FILMQ Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif text-xl text-foreground font-bold">FILMQ</span>
        </div>
        <p className="text-sm">Powered by TMDB API. Built for cinephiles.</p>
      </footer>
    </div>
  );
};
