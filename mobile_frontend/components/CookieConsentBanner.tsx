import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { radius } from '@/lib/theme';

/** Same storage semantics as web `CookieConsent` (Legacy_wallet `localStorage` key). */
export const COOKIE_CONSENT_KEY = 'cookie-consent-choice';

/**
 * Fixed bottom-right notice (same content as web login/signup `CookieConsent`).
 * Non-blocking overlay; parent should be a flex:1 wrapper.
 */
export function CookieConsentBanner() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [visible, setVisible] = useState(false);

  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      anchor: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingTop: 16,
        paddingHorizontal: 16,
      },
      card: {
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.card,
        paddingTop: 16,
        paddingBottom: 14,
        paddingHorizontal: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
      closeBtn: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
        padding: 4,
      },
      closeText: {
        fontSize: 18,
        lineHeight: 20,
        color: c.mutedForeground,
      },
      title: {
        fontSize: 18,
        fontWeight: '600',
        color: c.foreground,
        paddingRight: 28,
        marginBottom: 8,
      },
      body: {
        fontSize: 14,
        lineHeight: 20,
        color: c.mutedForeground,
        marginBottom: 14,
      },
      row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
      btnOutline: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: radius.button,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.background,
        alignItems: 'center',
      },
      btnOutlineText: { fontSize: 14, fontWeight: '600', color: c.foreground },
      btnPrimary: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: radius.button,
        backgroundColor: c.gold,
        alignItems: 'center',
      },
      btnPrimaryText: { fontSize: 14, fontWeight: '600', color: c.goldForeground },
    }),
  );

  useEffect(() => {
    void AsyncStorage.getItem(COOKIE_CONSENT_KEY).then((stored) => {
      if (!stored) setVisible(true);
    });
  }, []);

  const handleChoice = (choice: 'accepted' | 'declined') => {
    void AsyncStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);
  };

  const dismissWithoutStoring = () => setVisible(false);

  if (!visible) return null;

  return (
    <View style={[styles.anchor, { paddingBottom: 16 + insets.bottom }]} pointerEvents="box-none">
      <View style={[styles.card, { maxWidth: Math.min(340, windowWidth - 32) }]} pointerEvents="auto">
        <Pressable
          style={styles.closeBtn}
          onPress={dismissWithoutStoring}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close cookie consent"
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <Text style={styles.title}>Welcome to Digital Will!</Text>
        <Text style={styles.body}>
          We use cookies to improve your experience and keep the platform secure.
        </Text>
        <View style={styles.row}>
          <Pressable style={styles.btnOutline} onPress={() => handleChoice('declined')}>
            <Text style={styles.btnOutlineText}>Decline</Text>
          </Pressable>
          <Pressable style={styles.btnPrimary} onPress={() => handleChoice('accepted')}>
            <Text style={styles.btnPrimaryText}>Accept All</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
