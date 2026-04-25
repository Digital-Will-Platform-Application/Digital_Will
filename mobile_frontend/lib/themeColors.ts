/**
 * Semantic colors from Legacy_wallet-main/src/index.css (:root and .dark).
 * Converts CSS hsl(H S% L%) triples to hex for React Native.
 */

function hslToHex(h: number, s: number, l: number): string {
  const hh = h / 360;
  const ss = s / 100;
  const ll = l / 100;
  let r: number;
  let g: number;
  let b: number;
  if (ss === 0) {
    r = g = b = ll;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function T(h: number, s: number, l: number): string {
  return hslToHex(h, s, l);
}

export type AppColors = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  gold: string;
  /** Text/icons on solid `gold` surfaces (CTAs, chips on gold, etc.) */
  goldForeground: string;
  goldLight: string;
  navy: string;
  navyLight: string;
  sage: string;
  sageDark: string;
  border: string;
  input: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  /** App shell sidebar rail (dark strip like web UserLayout) */
  appSidebarTop: string;
  appSidebarMid: string;
  tabBarBorder: string;
};

/** :root tokens from web index.css */
export const lightColors: AppColors = {
  background: T(210, 40, 98),
  foreground: T(222, 47, 14),
  card: T(210, 38, 99),
  cardForeground: T(222, 47, 14),
  primary: T(172, 56, 30),
  primaryForeground: T(210, 50, 98),
  secondary: T(205, 28, 93),
  secondaryForeground: T(222, 40, 18),
  muted: T(210, 24, 94),
  mutedForeground: T(220, 14, 40),
  accent: T(24, 72, 46),
  accentForeground: T(24, 25, 12),
  gold: T(24, 72, 46),
  goldForeground: '#FFFFFF',
  goldLight: T(24, 68, 62),
  navy: T(215, 48, 22),
  navyLight: T(205, 38, 36),
  sage: T(165, 22, 88),
  sageDark: T(165, 18, 72),
  border: T(210, 22, 88),
  input: T(210, 22, 88),
  destructive: T(0, 72, 48),
  destructiveForeground: T(210, 50, 98),
  success: '#16a34a',
  appSidebarTop: T(222, 48, 9),
  appSidebarMid: T(220, 42, 11),
  tabBarBorder: T(210, 22, 88),
};

/** .dark tokens from web index.css */
export const darkColors: AppColors = {
  background: T(222, 44, 9),
  foreground: T(210, 32, 96),
  card: T(222, 40, 12),
  cardForeground: T(210, 32, 96),
  primary: T(172, 52, 52),
  primaryForeground: T(222, 48, 8),
  secondary: T(220, 32, 18),
  secondaryForeground: T(210, 28, 95),
  muted: T(220, 28, 16),
  mutedForeground: T(215, 16, 68),
  accent: T(24, 72, 56),
  accentForeground: T(222, 48, 8),
  gold: T(24, 72, 56),
  goldForeground: '#FFFFFF',
  goldLight: T(24, 65, 68),
  navy: T(205, 40, 72),
  navyLight: T(205, 35, 58),
  sage: T(165, 22, 22),
  sageDark: T(165, 18, 30),
  border: T(220, 26, 20),
  input: T(220, 26, 20),
  destructive: T(0, 58, 48),
  destructiveForeground: T(210, 50, 98),
  success: '#22c55e',
  appSidebarTop: T(222, 48, 7),
  appSidebarMid: T(220, 44, 9),
  tabBarBorder: T(220, 26, 20),
};
