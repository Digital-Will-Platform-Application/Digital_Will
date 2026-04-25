import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, StatusBar } from 'react-native';
import type { AppColors } from '@/lib/themeColors';
import { darkColors, lightColors } from '@/lib/themeColors';

const STORAGE_KEY = '@digital-will/theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  toggleLightDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemDark, setSystemDark] = useState(() => Appearance.getColorScheme() === 'dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, []);

  const isDark = useMemo(() => {
    if (preference === 'dark') return true;
    if (preference === 'light') return false;
    return systemDark;
  }, [preference, systemDark]);

  const colors = isDark ? darkColors : lightColors;

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const toggleLightDark = useCallback(() => {
    const next: ThemePreference = isDark ? 'light' : 'dark';
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, [isDark]);

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark]);

  const value = useMemo(
    () => ({
      colors,
      isDark,
      preference,
      setPreference,
      toggleLightDark,
    }),
    [colors, isDark, preference, setPreference, toggleLightDark],
  );

  if (!hydrated) {
    return (
      <ThemeContext.Provider
        value={{
          colors: lightColors,
          isDark: false,
          preference: 'system',
          setPreference,
          toggleLightDark,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
