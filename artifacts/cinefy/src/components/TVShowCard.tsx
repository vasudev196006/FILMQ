import React from 'react';
import { Film, Tv } from 'lucide-react';
import { IMAGE_BASE } from '@/lib/tmdb';
import TiltedCard from '@/components/TiltedCard';

export interface TVShow {
  id: number;
  name: string;
  firstAirDate: string;
  rating: number;
  poster: string;
}

export const TVShowCard: React.FC<{ show: TVShow }> = ({ show }) => {
  const year = show.firstAirDate ? parseInt(show.firstAirDate.substring(0, 4)) : 0;
  const tmdbUrl = `https://www.themoviedb.org/tv/${show.id}`;

  return (
    <a
      href={tmdbUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block aspect-[2/3] w-full cursor-pointer no-underline text-current"
    >
      <TiltedCard
        containerWidth="100%"
        containerHeight="100%"
        imageWidth="100%"
        imageHeight="100%"
        rotateAmplitude={14}
        scaleOnHover={1.04}
        showMobileWarning={false}
        showTooltip={false}
      >
        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/15 bg-slate-950 shadow-xl">
          {show.poster && !show.poster.includes('null') ? (
            <img
              src={show.poster}
              alt={show.name}
              className="absolute inset-0 w-full h-full object-cover transform-gpu"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <Film className="size-16 text-white/20" />
            </div>
          )}

          {/* Gradient Scrim */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0) 70%)'
            }}
          />

          {/* TV Badge */}
          <div className="absolute top-3 left-3 z-20">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-xl border border-indigo-400/30 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              <Tv className="size-3" />
              TV
            </div>
          </div>

          {/* Glass Info Panel */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 border-t border-white/15 rounded-b-3xl bg-black/60 backdrop-blur-xl">
            <div className="flex justify-between items-end gap-2">
              <div className="flex-1 overflow-hidden">
                <h3 className="text-white font-semibold truncate text-lg">{show.name}</h3>
                <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                  {year > 0 && <span>{year}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/15 text-xs font-bold text-white backdrop-blur-md glass-pill">
                <span className="text-[#E50914]">★</span> {show.rating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </TiltedCard>
    </a>
  );
};
