import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Film } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Search' },
    { href: '/reviews', label: 'My Reviews' },
    { href: '/favorites', label: 'Favorites' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-black/60 backdrop-blur-xl border-white/10 shadow-lg py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform">
            <Film className="size-4 text-white" />
          </div>
          <span className="font-serif text-2xl tracking-wide text-white">Cinefy</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 p-1">
          {navLinks.map(link => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href} className="cursor-pointer">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all block ${
                  active 
                    ? 'bg-white/15 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Mobile menu could be added here, but keep it simple with bottom nav or horizontal scroll on mobile for now */}
        <div className="flex md:hidden items-center gap-4 overflow-x-auto no-scrollbar mask-linear-fade pb-1 text-sm font-medium text-slate-300 max-w-[200px]">
          {navLinks.map(link => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href} className="cursor-pointer whitespace-nowrap">
                <span className={active ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}>
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
