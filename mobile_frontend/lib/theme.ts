/**
 * Design tokens: radius & typography match web (Legacy_wallet-main).
 * Colors come from themeColors (CSS variable parity) and useAppTheme() at runtime.
 */
import { Platform } from 'react-native';

export { lightColors, darkColors, type AppColors } from './themeColors';
export { AppThemeProvider, useAppTheme, type ThemePreference } from '../contexts/ThemeContext';

/** Web: --radius 0.875rem */
export const radius = { input: 14, button: 14, card: 14 } as const;

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

/** Web: heading-section uses Playfair on web; closest system serif on native */
export const typography = {
  headingSection: { fontSize: 24, fontWeight: '600' as const },
  headingDisplay: { fontSize: 28, fontWeight: '600' as const },
  headingSerif: { fontSize: 28, fontWeight: '600' as const, fontFamily: serif },
  headingSerifLarge: { fontSize: 32, fontWeight: '600' as const, fontFamily: serif },
  body: { fontSize: 16 },
  bodySmall: { fontSize: 14 },
  label: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12 },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 2 },
} as const;
