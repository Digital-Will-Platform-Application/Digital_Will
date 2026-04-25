import { useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, StyleSheet } from 'react-native';
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
      // Leave the app stack for public home (go-home clears stack then lands on `/`).
      queueMicrotask(() => router.replace('/go-home'));
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