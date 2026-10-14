import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, Search, MessageSquare, Heart, Sparkles } from 'lucide-react';
import liquidGL, { type LiquidGLLens } from 'liquid-gl';
import gsap from 'gsap';

export const Navbar: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [mobileTouchHref, setMobileTouchHref] = useState<string | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const lensInstanceRef = useRef<LiquidGLLens | null>(null);

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

  const activeMobileHref = mobileTouchHref ?? location;

  const tabRect = (i: number) => {
    const tab = tabRefs.current[i];
    if (!tab) return { left: 6, width: 84 };
    return {
      left: tab.offsetLeft,
      width: tab.offsetWidth,
    };
  };

  const snapTo = (i: number, animate = true) => {
    if (!lensRef.current) return;
    activeIndexRef.current = i;
    const r = tabRect(i);
    if (animate) {
      gsap.to(lensRef.current, {
        left: r.left,
        width: r.width,
        duration: 0.65,
        ease: 'elastic.out(1, 0.7)',
        overwrite: 'auto',
      });
    } else {
      gsap.set(lensRef.current, { left: r.left, width: r.width });
    }
  };

  // ── liquidGL Desktop Menu Bar Integration ───────────────────
  useEffect(() => {
    let currentIdx = navLinks.findIndex((l) => l.href === location);
    if (currentIdx === -1) currentIdx = 0;
    activeIndexRef.current = currentIdx;

    // Initial position
    snapTo(currentIdx, false);

    let lastX = 0;

    // Wait for DOM layout to settle before initializing liquidGL
    const rafId = requestAnimationFrame(() => {
      snapTo(currentIdx, false);

      try {
        const tabs = tabRefs.current.filter(Boolean) as HTMLElement[];
        if (tabs.length > 0 && typeof liquidGL?.registerDynamic === 'function') {
          liquidGL.registerDynamic(tabs);
        }

        if (lensRef.current) {
          lensInstanceRef.current = liquidGL({
            target: lensRef.current,
            snapshot: 'body',
            resolution: 2,
            refraction: 0.018,
            aberration: 0.85,
            bevelDepth: 0.016,
            bevelWidth: 0.075,
            frost: 0,
            shadow: true,
            specular: true,
            reveal: 'none',
            tilt: false,
            draggable: true,
            interaction: 'fluid',
            interactionStrength: 0.5,
            interactionRadius: 3,
            interactionViscosity: 0.25,
            magnify: 1.05,
            tint: 'rgba(229, 9, 20, 0.16)', // Netflix crimson red tint matching FILMQ
            on: {
              dragstart: () => {
                if (!lensRef.current) return;
                gsap.killTweensOf(lensRef.current);
                lastX = 0;
                gsap.to(lensRef.current, {
                  scale: 1.15,
                  duration: 0.25,
                  ease: 'power2.out',
                });
              },
              drag: (_lens, info) => {
                if (!lensRef.current || !barRef.current) return;
                const lr = lensRef.current.getBoundingClientRect();
                const barRect = barRef.current.getBoundingClientRect();
                const minLeft = barRect.left + 6;
                const maxLeft = barRect.right - 6 - lr.width;
                const clamped = Math.min(Math.max(lr.left, minLeft), maxLeft);
                gsap.set(lensRef.current, { x: info.x + (clamped - lr.left), y: 0 });

                if (lastX) {
                  const stretch = Math.min(Math.abs(info.clientX - lastX) * 0.02, 0.32);
                  const baseWidth = tabRect(activeIndexRef.current).width;
                  gsap.set(lensRef.current, { width: baseWidth * (1 + stretch) });
                }
                lastX = info.clientX;
              },
              dragend: (lensRefObj) => {
                if (!lensRef.current) return;
                const lr = lensRef.current.getBoundingClientRect();
                const center = lr.left + lr.width / 2;
                const restingLeft =
                  lensRef.current.offsetLeft +
                  (gsap.getProperty(lensRef.current, 'x') as number);

                lensRefObj.clearDrag();
                lensRef.current.style.left = `${restingLeft}px`;
                gsap.set(lensRef.current, { x: 0, y: 0 });

                const validTabs = tabRefs.current.filter(Boolean) as HTMLElement[];
                let nearest = 0;
                let best = Infinity;
                validTabs.forEach((tab, i) => {
                  const tr = tab.getBoundingClientRect();
                  const d = Math.abs(tr.left + tr.width / 2 - center);
                  if (d < best) {
                    best = d;
                    nearest = i;
                  }
                });

                snapTo(nearest);
                gsap.to(lensRef.current, {
                  scale: 1,
                  duration: 0.65,
                  ease: 'elastic.out(1, 0.7)',
                });

                const targetNav = navLinks[nearest];
                if (targetNav && targetNav.href !== location) {
                  setLocation(targetNav.href);
                }
              },
            },
          });
        }
      } catch (err) {
        console.warn('liquidGL init notice:', err);
      }
    });

    const handleResize = () => snapTo(activeIndexRef.current, false);
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (!e.repeat && lensRef.current) {
        gsap.to(lensRef.current, { scale: 1.15, duration: 0.25, ease: 'power2.out' });
      }
      if (e.key === 'ArrowLeft') {
        const nextIdx = Math.max(activeIndexRef.current - 1, 0);
        snapTo(nextIdx);
        setLocation(navLinks[nextIdx].href);
      } else {
        const nextIdx = Math.min(activeIndexRef.current + 1, navLinks.length - 1);
        snapTo(nextIdx);
        setLocation(navLinks[nextIdx].href);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (lensRef.current) {
        gsap.to(lensRef.current, { scale: 1, duration: 0.65, ease: 'elastic.out(1, 0.7)' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      try {
        lensInstanceRef.current?.destroy();
      } catch {}
    };
  }, []);

  // Update lens position whenever route changes
  useEffect(() => {
    let currentIdx = navLinks.findIndex((l) => l.href === location);
    if (currentIdx === -1) currentIdx = 0;
    snapTo(currentIdx, true);
  }, [location]);

  // ── Mobile Touch Tracking Handlers ─────────────────────────
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
          <Link
            href="/"
            className="glass-button flex items-center gap-2.5 group cursor-pointer px-3.5 py-1.5 rounded-full border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/40 backdrop-blur-2xl shadow-2xl shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98]"
          >
            <div className="size-8 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shrink-0 flex items-center justify-center bg-black/10 dark:bg-black/60 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="FILMQ Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif text-xl tracking-wider text-slate-900 dark:text-white font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.25)]">
              FILMQ
            </span>
          </Link>

          {/* Desktop Menu Bar with Draggable Liquid Glass Lens */}
          <div
            ref={barRef}
            id="desktop-menu-bar"
            className="hidden md:flex items-center gap-1.5 glass-panel bg-black/40 dark:bg-black/60 backdrop-blur-2xl rounded-full border border-white/15 p-1.5 shadow-[0_25px_50px_rgba(0,0,0,0.35)] relative select-none"
          >
            {/* The liquidGL WebGPU/WebGL refracting lens */}
            <div
              ref={lensRef}
              id="liquid-nav-lens"
              className="liquid-nav-lens"
              title="Drag or click to navigate"
            />

            {/* Menu Tabs */}
            {navLinks.map((link, i) => {
              const isCurrentPage = location === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  onClick={() => snapTo(i)}
                  onPointerDown={() => {
                    if (lensRef.current) {
                      gsap.to(lensRef.current, { scale: 1.15, duration: 0.25, ease: 'power2.out' });
                    }
                  }}
                  onPointerUp={() => {
                    if (lensRef.current) {
                      gsap.to(lensRef.current, { scale: 1, duration: 0.65, ease: 'elastic.out(1, 0.7)' });
                    }
                  }}
                  className="cursor-pointer relative z-10 block select-none"
                >
                  <div
                    className={`glass-button relative px-4 py-2 rounded-full text-sm transition-all duration-200 block border ${
                      isCurrentPage
                        ? 'border-white/20 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)]'
                        : 'border-white/5 hover:border-white/15 text-slate-300 hover:text-white bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 pointer-events-none">
                      <Icon
                        className={`size-4 transition-transform duration-200 ${
                          isCurrentPage ? 'text-white scale-105' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      <span
                        className={`glass-button-text ${
                          isCurrentPage ? 'font-semibold text-white' : 'font-medium text-slate-300'
                        }`}
                      >
                        {link.label}
                      </span>
                    </div>
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
          className="glass-panel bg-black/60 backdrop-blur-2xl border border-white/15 rounded-full p-2.5 shadow-[0_25px_50px_rgba(0,0,0,0.25)] flex items-center justify-around select-none touch-none"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {navLinks.map((link) => {
            const active = activeMobileHref === link.href;
            const Icon = link.icon;

            return (
              <div
                key={link.href}
                data-mobile-nav-href={link.href}
                onClick={(e) => handleMobileItemClick(e, link.href)}
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' }}
                className="glass-button flex flex-col items-center justify-center relative py-1.5 px-2 w-1/5 select-none touch-none rounded-full active:scale-[0.96] active:translate-y-[1px]"
              >
                {active && (
                  <motion.div
                    layoutId="fluid-glass-mobile-pill"
                    className="absolute inset-0 rounded-full bg-white/20 dark:bg-white/15 border border-white/20 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-md -z-10 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon
                  className={`size-5 mb-1 transition-all duration-200 ${
                    active ? 'text-white scale-110' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`glass-button-text text-[10px] tracking-[-0.01em] transition-colors duration-200 ${
                    active ? 'text-white font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
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
