import React, { useEffect, useRef } from 'react';

export const GlassFilter: React.FC = () => {
  return (
    <svg className="fixed pointer-events-none w-0 h-0" aria-hidden="true" data-testid="glass-filter">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence 
            id="liquid-turbulence" 
            type="fractalNoise" 
            baseFrequency="0.05 0.05" 
            numOctaves="1" 
            seed="1" 
            result="turbulence" 
          />
          <feGaussianBlur 
            id="liquid-noise-blur" 
            in="turbulence" 
            stdDeviation="2" 
            result="blurredNoise" 
          />
          <feDisplacementMap 
            id="liquid-displacement" 
            in="SourceGraphic" 
            in2="blurredNoise" 
            scale="35" 
            xChannelSelector="R" 
            yChannelSelector="B" 
            result="displaced" 
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
};

export function useScrollDistortion() {
  const displacementRef = useRef<SVGFEDisplacementMapElement | null>(null);
  const lastScrollY = useRef(window.scrollY);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef(0);

  useEffect(() => {
    displacementRef.current = document.getElementById('liquid-displacement') as any;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;
      velocityRef.current = Math.min(Math.max(delta * 2, -100), 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const loop = () => {
      velocityRef.current *= 0.9; // decay
      if (displacementRef.current) {
        // scale based on velocity
        const scale = Math.abs(velocityRef.current);
        displacementRef.current.setAttribute('scale', scale.toFixed(2));
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
}
