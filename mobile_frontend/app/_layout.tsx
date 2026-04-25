import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/hooks/useAuth';
import { AppThemeProvider, useAppTheme } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Do not block the tree on custom fonts — that delays first paint and feels like endless loading.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useAppTheme();

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.gold,
      },
    }),
    [colors, isDark],
  );

  return (
    <NavThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="go-home" options={{ headerShown: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="about" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="how-it-works" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="learn-more" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="verify-recipient" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </NavThemeProvider>
  );
}
