import { useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { useRouter } from 'expo-router';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

/**
 * Root-level redirect screen. Navigate here after logout so we land on the real home (app/index).
 * Replaces itself with '/' immediately.
 */
export default function GoHomeScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    text: { marginTop: 12, fontSize: 16, color: colors.mutedForeground },
  }));

  const router = useRouter();

  useEffect(() => {
    router.replace(Platform.OS === 'web' ? '/' : '/login');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.text}>Taking you home…</Text>
    </View>
  );
}