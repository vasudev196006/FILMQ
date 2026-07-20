import React from 'react';
import { Link, useLocation } from 'wouter';

export const Navbar: React.FC = () => {
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Search' },
    { href: '/reviews', label: 'My Reviews' },
    { href: '/favorites', label: 'Favorites' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 pointer-events-none transition-all duration-300">
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer glass-panel px-3.5 py-1.5 rounded-full border border-white/15 bg-black/40 backdrop-blur-2xl shadow-2xl">
          <div className="size-8 rounded-full overflow-hidden border border-white/20 shrink-0 flex items-center justify-center bg-black/60 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="FILMQ Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif text-xl tracking-wider text-white font-bold">FILMQ</span>
        </Link>

        <div className="hidden md:flex items-center gap-1.5 glass-panel bg-black/40 backdrop-blur-2xl rounded-full border border-white/15 p-1.5 shadow-2xl">
          {navLinks.map(link => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href} className="cursor-pointer">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all block ${
                  active 
                    ? 'bg-[#E50914] text-white shadow-md' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex md:hidden items-center gap-3 overflow-x-auto no-scrollbar glass-panel bg-black/40 backdrop-blur-2xl border border-white/15 rounded-full px-3 py-1.5 text-sm font-medium text-slate-300">
          {navLinks.map(link => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href} className="cursor-pointer whitespace-nowrap">
                <span className={active ? "text-white font-bold text-[#E50914]" : ""}>
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
