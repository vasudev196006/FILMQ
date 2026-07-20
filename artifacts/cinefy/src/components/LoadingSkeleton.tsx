import React from 'react';

export const LoadingSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full" data-testid="loading-skeleton">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[2/3] rounded-3xl glass-panel animate-pulse overflow-hidden">
        <div className="w-full h-full bg-white/5" />
      </div>
    ))}
  </div>
);
