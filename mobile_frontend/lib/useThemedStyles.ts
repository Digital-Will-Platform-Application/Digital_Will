import { useMemo } from 'react';
import type { AppColors } from './themeColors';
import { useAppTheme } from '@/contexts/ThemeContext';

/** Build styles that depend on theme colors (dark/light). */
export function useThemedStyles<T>(factory: (colors: AppColors) => T): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [colors]);
}
