import React, { useState, useEffect, useRef } from 'react';
import { THEMES, ThemeConfig, getActiveTheme, applyTheme } from '@/lib/theme';
import { Palette, Check, Sparkles, X } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(THEMES[0]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTheme(getActiveTheme());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (themeId: string) => {
    const updated = applyTheme(themeId);
    setCurrentTheme(updated);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Trigger Button labeled [REMOVABLE] */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 border border-black/15 dark:border-white/20 text-xs font-semibold text-slate-900 dark:text-white backdrop-blur-xl shadow-lg transition-all cursor-pointer group hover:scale-[1.02]"
        title="Switch color palette & typography [REMOVABLE]"
        data-testid="theme-switcher-btn"
      >
        <span
          className="size-2.5 rounded-full shadow-sm shrink-0 transition-colors duration-300 border border-black/10 dark:border-white/20"
          style={{ backgroundColor: currentTheme.primaryHex }}
        />
        <span className="truncate max-w-[100px] sm:max-w-none">{currentTheme.name}</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-primary/15 text-primary border border-primary/30">
          REMOVABLE
        </span>
        <Palette className="size-3.5 text-slate-600 dark:text-white/70 group-hover:text-primary transition-colors ml-0.5" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white/95 dark:bg-slate-950/95 border border-black/15 dark:border-white/20 backdrop-blur-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-white">
          <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h4 className="text-sm font-bold tracking-wide">Theme & Typography</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-white/50 mb-3 px-1">
            Curated light & dark themes from <span className="font-medium text-slate-800 dark:text-white">ui-ux-pro-max</span>.
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
            {THEMES.map((theme) => {
              const isSelected = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-slate-100/70 dark:bg-black/30 border-slate-200/80 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div
                      className="size-4 rounded-full mt-0.5 shrink-0 shadow-sm border border-black/10 dark:border-white/20"
                      style={{ backgroundColor: theme.primaryHex }}
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{theme.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-slate-600 dark:text-white/70 font-mono">
                          {theme.tag}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-white/60 truncate mt-0.5">
                        {theme.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-2 shadow-md">
                      <Check className="size-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-center">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              💡 Debug Control: Remove by deleting &lt;ThemeSwitcher /&gt; in Navbar.tsx
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
