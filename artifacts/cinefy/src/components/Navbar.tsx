import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import FluidGlass from '@/components/FluidGlass';

export const Navbar: React.FC = () => {
  const [location] = useLocation();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Search' },
    { href: '/reviews', label: 'My Reviews' },
    { href: '/favorites', label: 'Favorites' },
  ];

  const activeHref = hoveredHref ?? location;

  return (
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
                  {/* 3D Liquid Glass Sphere Lens Indicator */}
                  {isTarget && (
                    <motion.div
                      layoutId="fluid-glass-nav-pill"
                      className="absolute inset-0 rounded-full overflow-hidden -z-10 pointer-events-none border border-white/50 backdrop-blur-xl shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.85),0_4px_16px_rgba(255,255,255,0.15)] bg-white/5"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 35
                      }}
                    >
                      <FluidGlass
                        mode="lens"
                        lensProps={{
                          scale: 1.6,
                          ior: 1.25,
                          thickness: 1.2,
                          roughness: 0.05
                        }}
                        className="w-full h-full"
                      />
                    </motion.div>
                  )}
                  {link.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile Fluid Glass Nav */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar glass-panel bg-black/40 backdrop-blur-2xl border border-white/15 rounded-full px-3 py-1.5 text-sm font-medium text-slate-300">
          {navLinks.map(link => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href} className="cursor-pointer whitespace-nowrap relative px-3 py-1">
                {active && (
                  <motion.div
                    layoutId="fluid-glass-mobile-pill"
                    className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.3)] -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className={active ? 'font-bold text-white' : 'text-slate-300'}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
};
