import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  total?: number;
  className?: string;
  starSize?: string;
}

export const StarRating = ({
  value,
  onChange,
  readOnly = false,
  total = 10,
  className = "",
  starSize
}: StarRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const sizeClass = starSize || (readOnly ? 'size-4' : 'size-6');
  
  return (
    <div className={`flex flex-col gap-2 items-center ${className}`} data-testid="star-rating">
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: total }).map((_, i) => {
          const ratingValue = i + 1;
          const isFilled = (hover || value) >= ratingValue;
          return (
            <Star
              key={i}
              className={`${sizeClass} ${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-all ${isFilled ? 'fill-[#E50914] text-[#E50914]' : 'fill-transparent text-slate-600/50'}`}
              onClick={() => !readOnly && onChange?.(ratingValue)}
              onMouseEnter={() => !readOnly && setHover(ratingValue)}
              data-testid={`star-${ratingValue}`}
            />
          );
        })}
      </div>
      {!readOnly && (
        <span className="text-xs font-semibold text-[#E50914] min-h-4">
          {(hover || value) > 0 ? `${hover || value} / ${total}` : 'Rate this movie'}
        </span>
      )}
    </div>
  );
};
