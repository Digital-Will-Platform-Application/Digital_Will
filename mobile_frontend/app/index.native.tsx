import { useEffect, useRef } from 'react';
import { Image, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { UniqueLoading } from '@/components/ui/UniqueLoading';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * Native entry screen.
 * - Shows a professional boot animation (with app icon)
 * - Hydrates auth/session, then routes to login/dashboard
 * - Prevents rendering the web-style landing page on mobile
 */
export default function NativeIndex() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const didNavRef = useRef(false);
  const didHideSplashRef = useRef(false);

  useEffect(() => {
    // Hide the OS splash once we are ready to paint our own boot screen.
    if (didHideSplashRef.current) return;
    didHideSplashRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 250);
    });
  }, []);

  useEffect(() => {
    if (didNavRef.current) return;
    if (loading || adminLoading) return;
    didNavRef.current = true;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(isAdmin ? '/admin' : '/dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isAdmin, adminLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <UniqueLoading title="Digital Will" subtitle="Securing your legacy…" />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: Platform.select({ ios: 88, android: 72, default: 72 }),
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../assets/images/icon.png')}
          style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: 'transparent' }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

