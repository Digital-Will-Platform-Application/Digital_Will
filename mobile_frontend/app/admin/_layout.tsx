import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function AdminLayout() {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (loading || adminLoading) return;
    if (!user) {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      queueMicrotask(() => router.replace('/login'));
      return;
    }
    if (!isAdmin) {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      queueMicrotask(() => router.replace('/dashboard'));
    } else {
      hasRedirectedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit router to prevent redirect loop
  }, [user, loading, isAdmin, adminLoading]);

  if (loading || adminLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C9A227" />
      </View>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F7' },
});
