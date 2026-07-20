import React, { useState } from 'react';
import { Eye, MessageCircle, Share2, ThumbsDown, ThumbsUp, Trash, Edit2 } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Review } from '@/lib/storage';
import { format } from 'date-fns';

interface ReviewCardProps {
  review: Review;
  onUpvote?: (id: string) => void;
  onDownvote?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showMovieContext?: boolean; // If true, shows the movie title/poster (for the reviews list page)
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  onUpvote, 
  onDownvote, 
  onEdit, 
  onDelete,
  showMovieContext 
}) => {
  const [shroudOpen, setShroudOpen] = useState(false);
  const isBlurred = review.isSpoiler && !shroudOpen;

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 text-left w-full relative group" data-testid={`review-card-${review.id}`}>
      
      {showMovieContext && (
        <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-1">
          {review.moviePosterPath ? (
            <img src={`https://image.tmdb.org/t/p/w92${review.moviePosterPath}`} alt={review.movieTitle} className="w-10 h-14 object-cover rounded-md" />
          ) : (
            <div className="w-10 h-14 bg-white/5 rounded-md" />
          )}
          <div>
            <h4 className="text-sm font-semibold text-white">{review.movieTitle}</h4>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={review.rating} readOnly className="items-start" />
              <span className="text-xs text-slate-400">• {format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        {!showMovieContext && (
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center font-bold text-xs">
                {review.reviewerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{review.reviewerName}</h4>
                <p className="text-xs text-slate-400">{format(new Date(review.createdAt), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="mt-2">
              <StarRating value={review.rating} readOnly className="items-start" />
            </div>
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => onEdit(review.id)} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors">
                <Edit2 className="size-4" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(review.id)} className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-400 hover:text-red-400 transition-colors">
                <Trash className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden mt-1">
        <p className={`text-slate-200 text-sm leading-relaxed whitespace-pre-wrap ${isBlurred ? 'filter blur-md select-none pointer-events-none opacity-40 transition-all duration-500' : 'transition-all duration-500 blur-0 opacity-100'}`}>
          {review.text}
        </p>

        {isBlurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-xl bg-slate-950/60 p-4 border border-red-500/30 rounded-xl z-10">
            <button 
              onClick={() => setShroudOpen(true)}
              className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-200 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Eye className="size-3.5" /> Reveal Spoiler
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
        <button 
          onClick={() => onUpvote?.(review.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-400/40 hover:text-emerald-300 text-slate-300 transition-all cursor-pointer"
        >
          <ThumbsUp className="size-3.5" />
          <span>{review.upvotes || 0}</span>
        </button>
        <button 
          onClick={() => onDownvote?.(review.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-400/40 hover:text-red-300 text-slate-400 transition-all cursor-pointer"
        >
          <ThumbsDown className="size-3.5" />
          <span>{review.downvotes || 0}</span>
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/15 text-slate-300 transition-all cursor-pointer">
          <MessageCircle className="size-3.5" />
          Reply
        </button>
        <button className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer ml-auto">
          <Share2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
