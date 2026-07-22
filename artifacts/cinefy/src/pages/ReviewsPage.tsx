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
    return () => window.removeEventListener('storage', loadReviews);
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
                <div key={review.id} className="glass-panel p-5 rounded-2xl flex flex-col gap-4 text-left w-full">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-1">
                    {review.moviePosterPath ? (
                      <img src={`https://image.tmdb.org/t/p/w92${review.moviePosterPath}`} alt={review.movieTitle} className="w-10 h-14 object-cover rounded-md" />
                    ) : (
                      <div className="w-10 h-14 bg-white/5 rounded-md" />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-white">Editing: {review.movieTitle}</h4>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Rating</label>
                    <StarRating value={editForm.rating} onChange={(val) => setEditForm(prev => ({ ...prev, rating: val }))} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Review</label>
                    <textarea 
                      value={editForm.text}
                      onChange={e => setEditForm(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 focus:bg-white/10 transition-all min-h-[100px] resize-none text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                       type="button"
                       onClick={() => setEditForm(prev => ({ ...prev, isSpoiler: !prev.isSpoiler }))}
                       className={`size-5 rounded flex items-center justify-center transition-all ${editForm.isSpoiler ? 'bg-[#E50914] text-white' : 'bg-white/10 border border-white/20'}`}
                    >
                      {editForm.isSpoiler && <Check className="size-3" />}
                    </button>
                    <span className="text-xs text-slate-300 cursor-pointer select-none" onClick={() => setEditForm(prev => ({ ...prev, isSpoiler: !prev.isSpoiler }))}>
                      Contains spoilers
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                    <button 
                      onClick={saveEdit}
                      className="px-4 py-1.5 rounded-full bg-[#E50914] text-white text-xs font-medium hover:bg-[#D81F26] transition-all flex items-center gap-1.5"
                    >
                      <Check className="size-3.5" /> Save
                    </button>
                    <button 
                      onClick={cancelEdit}
                      className="px-4 py-1.5 rounded-full bg-white/10 text-slate-300 text-xs font-medium hover:bg-white/20 transition-all flex items-center gap-1.5"
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
