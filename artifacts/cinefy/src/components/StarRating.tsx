import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({ value, onChange, readOnly = false, total = 10, className = "" }: { value: number, onChange?: (val: number) => void, readOnly?: boolean, total?: number, className?: string }) => {
  const [hover, setHover] = useState<number | null>(null);
  
  return (
    <div className={`flex flex-col gap-2 items-center ${className}`} data-testid="star-rating">
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: total }).map((_, i) => {
          const ratingValue = i + 1;
          const isFilled = (hover || value) >= ratingValue;
          return (
            <Star
              key={i}
              className={`size-6 cursor-pointer transition-all ${isFilled ? 'fill-[#E50914] text-[#E50914]' : 'fill-transparent text-slate-600/50'} ${readOnly ? 'cursor-default size-4' : ''}`}
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
