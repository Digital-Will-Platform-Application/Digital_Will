import { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/lib/theme';

export function Screen({ children }: { children: ReactNode }) {
  const { colors, isDark } = useAppTheme();

  const gradientColors: readonly [string, string, string] = isDark
    ? [colors.background, 'rgba(255,255,255,0.03)', colors.background]
    : ['#F7DCA6', colors.background, colors.background];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.safeShadow} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeShadow: Platform.select({
    ios: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, shadowOpacity: 0.12, shadowRadius: 12 },
    android: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, elevation: 2 },
    default: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  }) as any,
});

