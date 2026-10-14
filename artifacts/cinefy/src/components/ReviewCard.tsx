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
    <div 
      className="group relative w-full rounded-2xl bg-slate-900/75 backdrop-blur-2xl border border-white/10 p-4 sm:p-5 flex flex-col gap-3.5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.35)] overflow-hidden transition-all duration-300 hover:border-white/20" 
      data-testid={`review-card-${review.id}`}
    >
      {/* Top Header Row with Media/Avatar, Title, Actions, and Metadata */}
      <div className="flex items-start gap-3.5 w-full">
        {showMovieContext ? (
          review.moviePosterPath ? (
            <img 
              src={`https://image.tmdb.org/t/p/w185${review.moviePosterPath}`} 
              alt={review.movieTitle} 
              className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-xl shrink-0 shadow-md border border-white/10 ring-1 ring-white/5" 
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-16 sm:w-14 sm:h-20 bg-white/5 border border-white/10 rounded-xl shrink-0 flex items-center justify-center text-white/30 text-xs">
              No Poster
            </div>
          )
        ) : (
          <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : 'U'}
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          {/* Title and Action Buttons */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm sm:text-base font-semibold text-white truncate leading-snug">
              {showMovieContext ? review.movieTitle : review.reviewerName}
            </h4>

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1.5 shrink-0 -mt-0.5">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(review.id)} 
                    className="size-7 sm:size-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-90 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Edit review"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(review.id)} 
                    className="size-7 sm:size-8 rounded-full bg-red-500/10 hover:bg-red-500/20 active:scale-90 border border-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
                    title="Delete review"
                  >
                    <Trash className="size-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rating and Date Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StarRating value={review.rating} readOnly starSize="size-3 sm:size-3.5" className="items-start" />
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 leading-none">
                {review.rating}/10
              </span>
            </div>

            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {format(new Date(review.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Review Body */}
      <div className={`relative rounded-xl overflow-hidden mt-1 w-full ${isBlurred ? 'min-h-[105px] border border-red-500/30 bg-red-950/15' : ''}`}>
        <p className={`text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-normal ${isBlurred ? 'filter blur-md select-none pointer-events-none opacity-20 p-3 line-clamp-3' : 'transition-all duration-300 blur-0 opacity-100'}`}>
          {review.text}
        </p>

        {isBlurred && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 backdrop-blur-md p-3 text-center z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              Spoiler Content
            </span>
            <button 
              onClick={() => setShroudOpen(true)}
              className="px-4 py-1.5 rounded-full bg-red-600/25 hover:bg-red-600/35 active:scale-95 border border-red-500/50 text-red-100 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-red-950/50"
            >
              <Eye className="size-3.5" /> Reveal Spoiler
            </button>
          </div>
        )}
      </div>

      {/* Apple-style Tactile Footer Actions */}
      <div className="flex items-center gap-2 mt-1 pt-3 border-t border-white/10">
        <button 
          onClick={() => onUpvote?.(review.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 hover:text-primary active:scale-95 text-slate-300 transition-all cursor-pointer"
        >
          <ThumbsUp className="size-3.5" />
          <span>{review.upvotes || 0}</span>
        </button>
        <button 
          onClick={() => onDownvote?.(review.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 hover:text-primary active:scale-95 text-slate-400 transition-all cursor-pointer"
        >
          <ThumbsDown className="size-3.5" />
          <span>{review.downvotes || 0}</span>
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-slate-300 transition-all cursor-pointer">
          <MessageCircle className="size-3.5" />
          Reply
        </button>
        <button className="size-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all cursor-pointer ml-auto flex items-center justify-center">
          <Share2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
