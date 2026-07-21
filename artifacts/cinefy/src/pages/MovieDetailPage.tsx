import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { fetchMovieDetails, IMAGE_BASE } from '@/lib/tmdb';
import { StarRating } from '@/components/StarRating';
import { ReviewCard } from '@/components/ReviewCard';
import { useMovieActions } from '@/hooks/useMovieActions';
import { getReviewsForMovie, addReview, deleteReview, updateReview, Review } from '@/lib/storage';
import { Play, Heart, BookmarkPlus, BookmarkCheck, ChevronLeft, Send, Check } from 'lucide-react';
import { Link } from 'wouter';

export const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieDetails(id!),
    enabled: !!id
  });

  const { favorite, watchlisted, toggleFavorite, toggleWatchlist } = useMovieActions(
    Number(id), 
    movie ? { title: movie.title, posterPath: movie.poster_path || '' } : undefined
  );

  const [reviews, setReviews] = useState<Review[]>(() => getReviewsForMovie(Number(id)));
  
  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewIsSpoiler, setReviewIsSpoiler] = useState(false);

  const trailer = movie?.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  
  const avgCommunityRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : null;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie || !reviewName.trim() || reviewRating === 0) return;

    const newReview: Review = {
      id: crypto.randomUUID(),
      movieId: movie.id,
      movieTitle: movie.title,
      moviePosterPath: movie.poster_path || '',
      reviewerName: reviewName.trim(),
      rating: reviewRating,
      text: reviewText.trim(),
      isSpoiler: reviewIsSpoiler,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0
    };

    addReview(newReview);
    setReviews(getReviewsForMovie(movie.id));
    
    // Reset form
    setReviewName('');
    setReviewRating(0);
    setReviewText('');
    setReviewIsSpoiler(false);
  };

  const handleUpvote = (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (rev) {
      updateReview(reviewId, { upvotes: (rev.upvotes || 0) + 1 });
      setReviews(getReviewsForMovie(Number(id)));
    }
  };

  const handleDownvote = (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (rev) {
      updateReview(reviewId, { downvotes: (rev.downvotes || 0) + 1 });
      setReviews(getReviewsForMovie(Number(id)));
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      deleteReview(reviewId);
      setReviews(getReviewsForMovie(Number(id)));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-app pt-24 pb-12 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div></div>;
  }

  if (!movie) return <div className="min-h-screen bg-app text-white text-center pt-32">Movie not found</div>;

  return (
    <div className="min-h-screen bg-app relative pb-32">
      {/* Dynamic Backdrop */}
      <div className="absolute inset-0 top-0 h-[70vh] z-0 overflow-hidden pointer-events-none">
        {movie.backdrop_path && (
          <img 
            src={`${IMAGE_BASE}original${movie.backdrop_path}`} 
            alt="backdrop" 
            className="w-full h-full object-cover opacity-30 filter blur-sm scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-app/50 via-app/80 to-app"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 pt-24 relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="size-4" /> Back to browse
        </Link>

        {/* Top Hero Layout */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mb-16">
          {/* Poster */}
          <div className="w-full max-w-[300px] mx-auto md:mx-0 shrink-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden glass-panel relative">
              {movie.poster_path && (
                <img 
                  src={`${IMAGE_BASE}w500${movie.poster_path}`} 
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-end pt-4">
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">{movie.title}</h1>
            {movie.tagline && <p className="text-xl text-primary font-serif italic mb-4">{movie.tagline}</p>}
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/80 mb-6">
              <span className="font-semibold text-foreground">{movie.release_date?.substring(0, 4)}</span>
              <span>•</span>
              <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
              <span>•</span>
              <div className="flex flex-wrap gap-2">
                {movie.genres.map(g => (
                  <span key={g.id} className="glass-pill px-3 py-1 text-xs text-foreground font-medium border border-black/10 dark:border-white/15">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-8">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-foreground mb-1">{movie.vote_average.toFixed(1)}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">TMDB Score</span>
              </div>
              
              {avgCommunityRating !== null && (
                <>
                  <div className="w-px h-10 bg-black/10 dark:bg-white/10"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-primary mb-1">{avgCommunityRating.toFixed(1)}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Community</span>
                  </div>
                </>
              )}

              <div className="w-px h-10 bg-black/10 dark:bg-white/10"></div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFavorite}
                  className={`size-12 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-xl transition-all duration-300 ${
                    favorite
                      ? 'bg-primary text-white shadow-md animate-heart-pop'
                      : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/15 dark:border-white/20 text-foreground'
                  }`}
                  data-testid="detail-favorite"
                >
                  <Heart className={`size-5 ${favorite ? 'fill-white' : 'fill-transparent'}`} />
                </button>

                <button
                  onClick={toggleWatchlist}
                  className={`size-12 rounded-full flex items-center justify-center cursor-pointer backdrop-blur-xl transition-all duration-300 ${
                    watchlisted
                      ? 'bg-primary border border-primary/50 text-white shadow-md'
                      : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-black/15 dark:border-white/20 text-foreground'
                  }`}
                  data-testid="detail-watchlist"
                >
                  {watchlisted ? <BookmarkCheck className="size-5" /> : <BookmarkPlus className="size-5" />}
                </button>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl text-slate-800 dark:text-slate-200 leading-relaxed max-w-3xl border border-black/10 dark:border-white/15">
              {movie.overview}
            </div>
          </div>
        </div>

        {/* Cast */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-serif text-foreground mb-6">Top Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {movie.credits.cast.slice(0, 10).map(actor => (
                <div key={actor.id} className="min-w-[120px] max-w-[120px] text-center">
                  <div className="size-24 mx-auto rounded-full overflow-hidden mb-3 border-2 border-black/10 dark:border-white/10">
                    {actor.profile_path ? (
                      <img src={`${IMAGE_BASE}w185${actor.profile_path}`} alt={actor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-foreground/40 text-xl font-bold">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground truncate">{actor.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trailer */}
        {trailer && (
          <div className="mb-16">
            <h2 className="text-2xl font-serif text-foreground mb-6">Official Trailer</h2>
            <div className="max-w-4xl glass-panel p-2 rounded-3xl overflow-hidden aspect-video border border-black/10 dark:border-white/15">
              <iframe 
                src={`https://www.youtube.com/embed/${trailer.key}?controls=1&rel=0&playsinline=1&modestbranding=1`}
                title="Trailer"
                className="w-full h-full rounded-2xl"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-16">
          {/* Reviews List */}
          <div>
            <h2 className="text-2xl font-serif text-foreground mb-6">Community Reviews ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <ReviewCard 
                    key={review.id} 
                    review={review} 
                    onUpvote={handleUpvote}
                    onDownvote={handleDownvote}
                    onDelete={handleDeleteReview}
                  />
                ))
              ) : (
                <div className="glass-panel p-8 text-center rounded-2xl text-slate-500 dark:text-slate-400 border border-black/10 dark:border-white/15">
                  No reviews yet. Be the first to review this movie!
                </div>
              )}
            </div>
          </div>

          {/* Write a Review Form */}
          <div className="sticky top-24">
            <h2 className="text-2xl font-serif text-foreground mb-6">Write a Review</h2>
            <form onSubmit={handleReviewSubmit} className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border border-black/10 dark:border-white/15">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/10 rounded-xl px-4 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rating</label>
                <div className="glass-panel inline-flex p-3 rounded-xl border border-black/10 dark:border-white/15">
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Review</label>
                <textarea 
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[120px] resize-none"
                  placeholder="What did you think of the movie?"
                ></textarea>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setReviewIsSpoiler(!reviewIsSpoiler)}
                  className={`size-6 rounded flex items-center justify-center transition-all ${reviewIsSpoiler ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/20'}`}
                >
                  {reviewIsSpoiler && <Check className="size-4" />}
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none" onClick={() => setReviewIsSpoiler(!reviewIsSpoiler)}>
                  Contains spoilers
                </span>
              </div>

              <button 
                type="submit"
                disabled={!reviewName.trim() || reviewRating === 0}
                className="relative group overflow-hidden px-6 py-3 rounded-full font-semibold text-sm text-white transition-all duration-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:opacity-90 shadow-md"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Send className="size-4" /> Publish Review
                </div>
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
