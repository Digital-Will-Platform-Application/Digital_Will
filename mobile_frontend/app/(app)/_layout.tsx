import { useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Platform, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { UniqueLoading } from '@/components/ui/UniqueLoading';

export default function AppLayout() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  }));

  const { user, loading, isAdmin, adminLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || adminLoading) return;
    if (!user) {
      // Leave the app stack.
      // On mobile, go straight to login (avoid rendering web-style landing page).
      // On web, keep the marketing home.
      queueMicrotask(() => router.replace(Platform.OS === 'web' ? '/go-home' : '/login'));
      return;
    }
    if (isAdmin) {
      queueMicrotask(() => router.replace('/admin'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit router to prevent redirect loop
  }, [user, loading, isAdmin, adminLoading]);

  if (loading || adminLoading) {
    return (
      <View style={styles.centered}>
        <UniqueLoading />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (isAdmin) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="create" />
      <Stack.Screen name="recipients" />
      <Stack.Screen name="review" />
      <Stack.Screen name="will/[id]" />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="assign-recipients" />
      <Stack.Screen name="assets-manage" />
    </Stack>
  );
}