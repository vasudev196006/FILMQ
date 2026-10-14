import React, { useState, useEffect } from 'react';
import { getReviews, deleteReview, updateReview, Review } from '@/lib/storage';
import { ReviewCard } from '@/components/ReviewCard';
import { EmptyState } from '@/components/EmptyState';
import { StarRating } from '@/components/StarRating';
import { MessageSquare, Check, X } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ rating: number; text: string; isSpoiler: boolean }>({ rating: 0, text: '', isSpoiler: false });

  const loadReviews = async () => {
    try {
      const allReviews = await getReviews();
      allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(allReviews);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReviews();
    window.addEventListener('storage', loadReviews);
    window.addEventListener('filmq:reviews-updated', loadReviews);
    return () => {
      window.removeEventListener('storage', loadReviews);
      window.removeEventListener('filmq:reviews-updated', loadReviews);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(id);
        await loadReviews();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({
      rating: review.rating,
      text: review.text,
      isSpoiler: review.isSpoiler
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (editingId) {
      try {
        await updateReview(editingId, editForm);
        setEditingId(null);
        await loadReviews();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-app pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-4xl font-serif text-white mb-8">My Reviews</h1>
        
        {reviews.length === 0 ? (
          <EmptyState 
            icon={MessageSquare}
            title="No reviews yet"
            message="You haven't written any reviews. Go to a movie page and share your thoughts!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {reviews.map(review => (
              editingId === review.id ? (
                <div key={review.id} className="relative w-full rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 p-4 sm:p-5 flex flex-col gap-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden">
                  <div className="flex items-center gap-3.5 border-b border-white/10 pb-3">
                    {review.moviePosterPath ? (
                      <img src={`https://image.tmdb.org/t/p/w185${review.moviePosterPath}`} alt={review.movieTitle} className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-xl shadow-md border border-white/10 ring-1 ring-white/5 shrink-0" />
                    ) : (
                      <div className="w-12 h-16 sm:w-14 sm:h-20 bg-white/5 border border-white/10 rounded-xl shrink-0 flex items-center justify-center text-white/30 text-xs">
                        No Poster
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Editing Review</span>
                      <h4 className="text-sm sm:text-base font-semibold text-white truncate leading-snug">{review.movieTitle}</h4>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Rating</label>
                    <StarRating value={editForm.rating} onChange={(val) => setEditForm(prev => ({ ...prev, rating: val }))} className="items-start" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Review</label>
                    <textarea 
                      value={editForm.text}
                      onChange={e => setEditForm(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary/60 focus:bg-black/60 transition-all min-h-[110px] resize-none text-sm placeholder:text-slate-500"
                      placeholder="Share your thoughts..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                       type="button"
                       onClick={() => setEditForm(prev => ({ ...prev, isSpoiler: !prev.isSpoiler }))}
                       className={`size-5 rounded flex items-center justify-center transition-all cursor-pointer ${editForm.isSpoiler ? 'bg-[#E50914] text-white shadow-sm' : 'bg-white/10 border border-white/20'}`}
                    >
                      {editForm.isSpoiler && <Check className="size-3" />}
                    </button>
                    <span className="text-xs text-slate-300 cursor-pointer select-none" onClick={() => setEditForm(prev => ({ ...prev, isSpoiler: !prev.isSpoiler }))}>
                      Contains spoilers
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 pt-3 border-t border-white/10">
                    <button 
                      onClick={saveEdit}
                      className="px-4 py-1.5 rounded-full bg-[#E50914] text-white text-xs font-medium hover:bg-[#D81F26] active:scale-95 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="size-3.5" /> Save
                    </button>
                    <button 
                      onClick={cancelEdit}
                      className="px-4 py-1.5 rounded-full bg-white/10 text-slate-300 text-xs font-medium hover:bg-white/15 active:scale-95 transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      <X className="size-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  showMovieContext 
                  onEdit={() => startEdit(review)}
                  onDelete={() => handleDelete(review.id)}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
