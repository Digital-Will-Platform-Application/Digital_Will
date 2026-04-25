import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { useAppTheme } from '@/lib/theme';

export function Footer() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((c) => StyleSheet.create({
    footer: {
      backgroundColor: c.primary,
      marginHorizontal: -20,
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 24,
    },
    footerTopLine: {
      height: 1,
      backgroundColor: 'rgba(250,249,247,0.18)',
      marginBottom: 18,
    },
    footerGrid: {
      flexDirection: 'column',
      gap: 24,
      marginBottom: 24,
    },
    footerBrand: { width: '100%' },
    footerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    footerLogoBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: c.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerLogoText: { fontSize: 20, fontWeight: '700', letterSpacing: 0.25, color: c.primaryForeground },
    footerDesc: { fontSize: 13, color: 'rgba(250,249,247,0.7)', lineHeight: 20 },
    socialWrap: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: 'rgba(250,249,247,0.14)',
    },
    socialLabel: {
      fontSize: 11,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      fontWeight: '700',
      color: 'rgba(250,249,247,0.9)',
      marginBottom: 8,
    },
    socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    socialLink: { fontSize: 13, color: 'rgba(250,249,247,0.78)', fontWeight: '600' },
    socialDot: { color: 'rgba(250,249,247,0.32)', fontSize: 13 },
    footerColumn: { width: '100%' },
    footerHeading: { fontSize: 14, fontWeight: '600', color: c.primaryForeground, marginBottom: 12 },
    footerLink: { fontSize: 13, color: 'rgba(250,249,247,0.7)', marginBottom: 8 },
    footerBottom: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(250,249,247,0.2)',
      paddingTop: 16,
    },
    footerCopyright: { fontSize: 12, color: 'rgba(250,249,247,0.6)' },
  }));

  return (
    <View style={styles.footer}>
      <View style={styles.footerTopLine} />
      <View style={styles.footerGrid}>
        <View style={styles.footerBrand}>
          <Link href="/" asChild>
            <Pressable style={({ pressed }) => [styles.footerLogoRow, pressed && { opacity: 0.82 }]}>
              <View style={styles.footerLogoBox}>
                <Ionicons name="shield-checkmark" size={22} color={colors.goldForeground} />
              </View>
              <Text style={styles.footerLogoText}>Digital Will</Text>
            </Pressable>
          </Link>
          <Text style={styles.footerDesc}>
            Secure your will with modern digital will management. Peace of mind for you and your loved ones.
          </Text>
          <View style={styles.socialWrap}>
            <Text style={styles.socialLabel}>Social</Text>
            <View style={styles.socialRow}>
              <Text style={styles.socialLink}>Twitter</Text>
              <Text style={styles.socialDot}>·</Text>
              <Text style={styles.socialLink}>LinkedIn</Text>
            </View>
          </View>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerHeading}>Product</Text>
          <Link href="/how-it-works" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>How It Works</Text></Pressable></Link>
          <Link href="/pricing" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Pricing</Text></Pressable></Link>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Features</Text></Pressable></Link>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Security</Text></Pressable></Link>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerHeading}>Company</Text>
          <Link href="/about" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>About Us</Text></Pressable></Link>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Blog</Text></Pressable></Link>
          <Link href="/contact" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Careers</Text></Pressable></Link>
          <Link href="/contact" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Contact</Text></Pressable></Link>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerHeading}>Legal</Text>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Privacy Policy</Text></Pressable></Link>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Terms of Service</Text></Pressable></Link>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>GDPR Compliance</Text></Pressable></Link>
          <Link href="/learn-more" asChild><Pressable style={({ pressed }) => [pressed && { opacity: 0.72 }]}><Text style={styles.footerLink}>Accessibility</Text></Pressable></Link>
        </View>
      </View>
      <View style={styles.footerBottom}>
        <Text style={styles.footerCopyright}>
          © {new Date().getFullYear()} Digital Will. All rights reserved.
        </Text>
      </View>
    </View>
  );
}
