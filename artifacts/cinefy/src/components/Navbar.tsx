import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, Search, MessageSquare, Heart, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [mobileTouchHref, setMobileTouchHref] = useState<string | null>(null);

  const isTouchActiveRef = useRef(false);
  const justTouchHandledRef = useRef(false);
  const currentHighlightedHrefRef = useRef<string | null>(null);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/for-you', label: 'For You', icon: Sparkles },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/reviews', label: 'Reviews', icon: MessageSquare },
    { href: '/favorites', label: 'Favorites', icon: Heart },
  ];

  const activeHref = hoveredHref ?? location;
  const activeMobileHref = mobileTouchHref ?? location;

  const updateMobileTouchTarget = (clientX: number, clientY: number) => {
    const elem = document.elementFromPoint(clientX, clientY);
    const navElem = elem?.closest('[data-mobile-nav-href]');
    const targetHref = navElem?.getAttribute('data-mobile-nav-href') ?? null;
    currentHighlightedHrefRef.current = targetHref;
    setMobileTouchHref(targetHref);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      isTouchActiveRef.current = true;
      const touch = e.touches[0];
      updateMobileTouchTarget(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTouchActiveRef.current && e.touches.length > 0) {
      const touch = e.touches[0];
      updateMobileTouchTarget(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isTouchActiveRef.current) {
      isTouchActiveRef.current = false;
      justTouchHandledRef.current = true;
      setTimeout(() => {
        justTouchHandledRef.current = false;
      }, 100);

      const finalHref = currentHighlightedHrefRef.current;
      setMobileTouchHref(null);
      currentHighlightedHrefRef.current = null;

      if (finalHref && finalHref !== location) {
        setLocation(finalHref);
      }
    }
  };

  const handleTouchCancel = () => {
    isTouchActiveRef.current = false;
    currentHighlightedHrefRef.current = null;
    setMobileTouchHref(null);
  };

  const handleMobileItemClick = (e: React.MouseEvent, href: string) => {
    if (justTouchHandledRef.current) {
      e.preventDefault();
      return;
    }
    if (href !== location) {
      setLocation(href);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 pointer-events-none transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between pointer-events-auto gap-3">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer glass-panel px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/40 backdrop-blur-2xl shadow-2xl shrink-0">
            <div className="size-8 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shrink-0 flex items-center justify-center bg-black/10 dark:bg-black/60 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="FILMQ Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif text-xl tracking-wider text-slate-900 dark:text-white font-bold">FILMQ</span>
          </Link>

          {/* Desktop Fluid Glass Nav */}
          <div 
            className="hidden md:flex items-center gap-1 glass-panel bg-black/30 dark:bg-black/50 backdrop-blur-2xl rounded-full border border-white/15 p-1.5 shadow-2xl relative"
            onMouseLeave={() => setHoveredHref(null)}
          >
            {navLinks.map(link => {
              const isTarget = activeHref === link.href;
              const isCurrentPage = location === link.href;

              return (
                <Link key={link.href} href={link.href} className="cursor-pointer relative z-10">
                  <div
                    onMouseEnter={() => setHoveredHref(link.href)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 block relative select-none ${
                      isTarget || isCurrentPage
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {/* Glassmorphic hover transition indicator */}
                    {isTarget && (
                      <motion.div
                        layoutId="fluid-glass-nav-pill"
                        className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/15 border border-white/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-md -z-10 pointer-events-none"
                        transition={{
                          type: 'spring',
                          stiffness: 450,
                          damping: 35
                        }}
                      />
                    )}
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </nav>

      {/* Mobile Sticky Bottom Floating Glass Tab Bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-auto">
        <div 
          className="glass-panel bg-black/60 backdrop-blur-2xl border border-white/15 rounded-full p-2.5 shadow-2xl flex items-center justify-around select-none touch-none"
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {navLinks.map(link => {
            const active = activeMobileHref === link.href;
            const Icon = link.icon;

            return (
              <div
                key={link.href}
                data-mobile-nav-href={link.href}
                onClick={(e) => handleMobileItemClick(e, link.href)}
                className="cursor-pointer flex flex-col items-center justify-center relative py-1.5 px-2 w-1/5 select-none touch-none"
              >
                {active && (
                  <motion.div
                    layoutId="fluid-glass-mobile-pill"
                    className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/15 border border-white/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-md -z-10 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`size-5 mb-1 transition-colors duration-200 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${active ? 'text-white font-bold' : 'text-slate-400'}`}>
                  {link.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

