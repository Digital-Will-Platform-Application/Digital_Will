import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/lib/theme';

type Props = {
  title?: string;
  subtitle?: string;
};

export function UniqueLoading({ title = 'Preparing your secure will', subtitle = 'Encrypting and syncing your data…' }: Props) {
  const { colors, isDark } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [drift, pulse]);

  const blobA = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.55] }),
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-8, 14] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 12] }) },
        { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
      ],
    }),
    [drift, pulse],
  );

  const blobB = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.38] }),
      transform: [
        { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [10, -12] }) },
        { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [16, -6] }) },
        { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1] }) },
      ],
    }),
    [drift, pulse],
  );

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    gradient: { ...StyleSheet.absoluteFillObject },
    content: { flex: 1, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    logoWrap: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      overflow: 'hidden',
    },
    ring: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.gold,
      opacity: 0.85,
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.foreground, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
    blobs: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    blob: { position: 'absolute', width: 260, height: 260, borderRadius: 260 },
    blobA: { top: -110, right: -90, backgroundColor: colors.goldLight },
    blobB: { bottom: -130, left: -120, backgroundColor: colors.primary },
    footer: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
    footerText: { fontSize: 11, color: colors.mutedForeground, letterSpacing: 1.6, fontWeight: '600' },
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={
          isDark
            ? [colors.background, 'rgba(255, 255, 255, 0.03)', colors.background]
            : ['#F7DCA6', colors.background, colors.background]
        }
        locations={[0, 0.55, 1]}
        style={styles.gradient}
      />

      <View style={styles.blobs} pointerEvents="none">
        <Animated.View style={[styles.blob, styles.blobA, blobA]} />
        <Animated.View style={[styles.blob, styles.blobB, blobB]} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={{
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }],
            }}
          >
            <View style={styles.ring} />
          </Animated.View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>DIGITAL WILL</Text>
      </View>
    </View>
  );
}

