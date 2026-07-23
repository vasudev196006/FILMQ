import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export interface FilterState {
  selectedGenre: string;
  sortBy: 'trending' | 'top_rated' | 'recent' | 'release_year';
  selectedDecade: string | null;
  viewMode: 'grid' | 'list';
}

export const FilterBar: React.FC<{
  genres: {id: number, name: string}[];
  filterState: FilterState;
  onFilterChange: (newState: Partial<FilterState>) => void;
}> = ({ genres, filterState, onFilterChange }) => {
  
  const decades = [
    { label: 'All Time', value: null },
    { label: '80s', value: '1980' },
    { label: '90s', value: '1990' },
    { label: '2000s', value: '2000' },
    { label: '2010s', value: '2010' },
    { label: '2020s', value: '2020' },
  ];

  return (
    <div className="w-full flex flex-col gap-4 mb-8" data-testid="filter-bar">
      
      {/* Genres Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 mask-linear-fade w-full">
        <button
          onClick={() => onFilterChange({ selectedGenre: '' })}
          className={
            filterState.selectedGenre === ''
              ? 'px-4 py-2 rounded-full text-xs font-semibold bg-white/20 dark:bg-white/15 text-white border border-white/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-md cursor-pointer whitespace-nowrap scale-105 transition-all'
              : 'px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/15 text-slate-300 hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap'
          }
        >
          All Genres
        </button>
        {genres.map(genre => (
          <button
            key={genre.id}
            onClick={() => onFilterChange({ selectedGenre: genre.id.toString() })}
            className={
              filterState.selectedGenre === genre.id.toString()
                ? 'px-4 py-2 rounded-full text-xs font-semibold bg-white/20 dark:bg-white/15 text-white border border-white/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-md cursor-pointer whitespace-nowrap scale-105 transition-all'
                : 'px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md bg-white/10 dark:bg-white/5 border border-white/15 text-slate-300 hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap'
            }
          >
            {genre.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Decade Pills */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {decades.map(decade => (
            <button
              key={decade.label}
              onClick={() => onFilterChange({ selectedDecade: decade.value })}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer border ${
                filterState.selectedDecade === decade.value
                  ? 'bg-white/20 dark:bg-white/15 border-white/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] text-white font-bold backdrop-blur-md'
                  : 'border-transparent hover:border-white/30 hover:text-white'
              }`}
            >
              {decade.label}
            </button>
          ))}
        </div>

        {/* View Mode Segmented Control */}
        <div className="inline-flex items-center p-1 rounded-full backdrop-blur-xl bg-black/20 dark:bg-white/5 border border-white/10 shadow-inner">
          <button
            onClick={() => onFilterChange({ viewMode: 'grid' })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              filterState.viewMode === 'grid'
                ? 'bg-white/20 dark:bg-white/15 text-white shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] border border-white/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => onFilterChange({ viewMode: 'list' })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              filterState.viewMode === 'list'
                ? 'bg-white/20 dark:bg-white/15 text-white shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] border border-white/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="size-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>
    </div>
  );
};
