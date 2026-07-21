export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  primary: string;
  primaryHex: string;
  background: string;
  bgHex: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  glassSurfaceBase: string;
  glassBorder: string;
  fontSerif: string;
  fontSans: string;
  tag: string;
  mode: 'light' | 'dark';
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'blood-red-dark-gray',
    name: 'Blood Red & Dark Slate Gray',
    description: 'Deep Blood Red Accent with Richer Dark Slate Charcoal Gray Background',
    primary: '355 100% 32%',
    primaryHex: '#A30000',
    background: '220 16% 9%',
    bgHex: '#13161C',
    foreground: '210 20% 95%',
    card: '220 16% 13%',
    cardForeground: '210 20% 95%',
    border: '220 14% 20%',
    glassSurfaceBase: 'rgba(19, 22, 28, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    fontSerif: "'DM Serif Display', serif",
    fontSans: "'Inter', sans-serif",
    tag: 'Blood Red & Dark Gray',
    mode: 'dark'
  }
];

const STORAGE_KEY = 'cinefy_active_theme';

export function getActiveTheme(): ThemeConfig {
  return THEMES[0];
}

export function applyTheme(_themeId?: string): ThemeConfig {
  const theme = THEMES[0];
  
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    // Clear stale theme from localStorage
    localStorage.removeItem(STORAGE_KEY);

    // Set HSL CSS variables for Blood Red & Dark Slate Charcoal Gray
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.primary);
    root.style.setProperty('--accent', theme.primary);
    root.style.setProperty('--ring', theme.primary);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.foreground);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--card-foreground', theme.cardForeground);
    root.style.setProperty('--popover', theme.card);
    root.style.setProperty('--popover-foreground', theme.cardForeground);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--input', theme.border);

    // Set Glass variables
    root.style.setProperty('--glass-surface-base', theme.glassSurfaceBase);
    root.style.setProperty('--glass-border', theme.glassBorder);
    
    // Set Font CSS variables
    root.style.setProperty('--app-font-serif', theme.fontSerif);
    root.style.setProperty('--app-font-sans', theme.fontSans);

    // Always enforce dark class for sleek dark theme
    root.classList.add('dark');
  }

  return theme;
}

export function initTheme(): ThemeConfig {
  return applyTheme();
}
