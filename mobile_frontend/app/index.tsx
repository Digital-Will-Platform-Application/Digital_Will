import { useEffect, useState, useRef } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { Footer } from '@/components/Footer';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 12 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16 },
  
    hero: { marginBottom: 36, alignItems: 'center' },
    trustBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.sage,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.gold,
      marginBottom: 20,
    },
    trustBadgeText: { color: colors.foreground, fontWeight: '600', fontSize: 14 },
    heroHeading: { marginBottom: 14, minHeight: 56, justifyContent: 'center' },
    heroHeadingText: { fontSize: 28, fontWeight: '600', color: colors.foreground, textAlign: 'center' },
    heroHeadingGold: { color: colors.gold },
    cursor: { color: colors.gold },
    heroBody: {
      fontSize: 17,
      color: colors.mutedForeground,
      lineHeight: 26,
      textAlign: 'center',
      marginBottom: 22,
      paddingHorizontal: 8,
    },
    ctaRow: { gap: 12, marginBottom: 20, width: '100%', alignItems: 'center' },
    btnHero: {
      backgroundColor: colors.gold,
      paddingVertical: 16,
      paddingHorizontal: 28,
      borderRadius: 12,
      width: '100%',
      maxWidth: 280,
      alignItems: 'center',
    },
    btnHeroText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    btnHeroOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 2,
      borderColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      width: '100%',
      maxWidth: 280,
    },
    btnHeroOutlineText: { color: colors.primary, fontWeight: '600', fontSize: 16 },
    trustBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
    trustBadgeSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    trustBadgeSmallText: { fontSize: 13, color: colors.foreground },
    demoSection: { width: '100%', marginTop: 18, marginBottom: 4 },
    demoCard: {
      width: '100%',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    demoVideoPlaceholder: {
      minHeight: 180,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: 16,
    },
    demoPlayBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(250,249,247,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(250,249,247,0.25)',
    },
    demoTitle: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600', textAlign: 'center' },
    demoSub: { color: 'rgba(250,249,247,0.82)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
    demoFooter: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    demoFooterText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center' },
  
    featuresSection: {
      backgroundColor: colors.secondary,
      marginHorizontal: -20,
      paddingHorizontal: 20,
      paddingVertical: 28,
      marginBottom: 24,
    },
    featuresLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.gold,
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    featuresTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 10,
    },
    featuresDescription: {
      fontSize: 16,
      color: colors.mutedForeground,
      lineHeight: 24,
      marginBottom: 20,
    },
    featureCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureIconBox: {
      width: 52,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    featureCardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 6 },
    featureCardDesc: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  
    testimonialsSection: {
      backgroundColor: colors.primary,
      marginHorizontal: -20,
      paddingHorizontal: 20,
      paddingVertical: 32,
      paddingBottom: 36,
      marginBottom: 24,
    },
    testimonialsLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.gold,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 8,
      textAlign: 'center',
    },
    testimonialsTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.primaryForeground,
      marginBottom: 10,
      textAlign: 'center',
    },
    testimonialsDescription: {
      fontSize: 16,
      color: 'rgba(250,249,247,0.8)',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    testimonialsGrid: { gap: 16 },
    testimonialCard: {
      backgroundColor: 'rgba(250,249,247,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(250,249,247,0.15)',
      borderRadius: 12,
      padding: 20,
      position: 'relative',
    },
    testimonialQuote: { position: 'absolute', top: 16, right: 16 },
    testimonialStars: { flexDirection: 'row', gap: 4, marginBottom: 12 },
    testimonialContent: {
      fontSize: 15,
      color: 'rgba(250,249,247,0.9)',
      lineHeight: 22,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    testimonialAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    testimonialAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    testimonialAvatarText: { fontSize: 16, fontWeight: '600', color: colors.goldForeground },
    testimonialName: { fontSize: 15, fontWeight: '600', color: colors.primaryForeground },
    testimonialRole: { fontSize: 13, color: 'rgba(250,249,247,0.65)' },
  
    ctaSection: { alignItems: 'center', marginBottom: 28 },
    ctaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.gold,
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    ctaBadgeText: { fontSize: 13, fontWeight: '500', color: colors.foreground },
    ctaTitle: { fontSize: 24, fontWeight: '600', color: colors.foreground, marginBottom: 10, textAlign: 'center' },
    ctaBody: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 18,
      paddingHorizontal: 8,
    },
    ctaButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 8 },
    ctaDisclaimer: { fontSize: 12, color: colors.mutedForeground, marginTop: 12, textAlign: 'center' },
    partnerStrip: {
      marginHorizontal: -20,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginBottom: 26,
    },
    partnerTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 10,
    },
    partnerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    partnerPill: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    partnerPillText: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  }));

  const { user, loading, isAdmin, adminLoading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = 'Your Will, Secured Today';
  const regularPart = 'Your Will, ';
  const goldPart = 'Secured';
  const afterGold = ' Today';

  useEffect(() => {
    if (loading || adminLoading) return;
    if (user) {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      const path = isAdmin ? '/admin' : '/dashboard';
      queueMicrotask(() => router.replace(path));
    } else {
      hasRedirectedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit router to prevent redirect loop (router ref can change after nav)
  }, [user, loading, isAdmin, adminLoading]);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const t = setTimeout(() => {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [currentIndex]);

  // Wait for Supabase session and (when signed in) admin resolve — avoids flashing home then "Redirecting..." for a long time.
  if (loading || (user != null && adminLoading)) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
      </View>
    );
  }

  // When logged in, redirect in useEffect; show Redirecting to avoid rendering links that could cause double navigation
  if (user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Redirecting...</Text>
      </View>
    );
  }

  const showRegular = displayedText.length <= regularPart.length ? displayedText : regularPart;
  const showGold = displayedText.length > regularPart.length && displayedText.length <= regularPart.length + goldPart.length
    ? displayedText.slice(regularPart.length)
    : displayedText.length > regularPart.length + goldPart.length
    ? goldPart
    : '';
  const showAfter = displayedText.length > regularPart.length + goldPart.length
    ? displayedText.slice(regularPart.length + goldPart.length)
    : '';
  const showCursor = currentIndex < fullText.length;

  const trustBadges = [
    { icon: 'lock-closed' as const, text: 'End-to-End Encrypted' },
    { icon: 'shield-checkmark' as const, text: 'GDPR Compliant' },
    { icon: 'checkmark-circle' as const, text: 'Bank-Level Security' },
  ];

  const features = [
    { icon: 'mic' as const, title: 'Audio Recording', description: 'Record your wishes naturally with your voice. Our AI transcribes and organizes everything.' },
    { icon: 'videocam' as const, title: 'Video Messages', description: 'Create personal video messages for your loved ones to be shared when the time is right.' },
    { icon: 'create' as const, title: 'Manual Form', description: 'Fill a structured form and write your will directly, with clear fields you can edit anytime.' },
    { icon: 'document-text' as const, title: 'Write a Note', description: 'Pick a language and capture your wishes in a simple note, then assign a recipient.' },
    { icon: 'folder-open' as const, title: 'Asset Management', description: 'Organize and categorize all your assets—property, investments, digital assets, and more.' },
    { icon: 'people' as const, title: 'Recipient Portal', description: 'Secure access for beneficiaries with verification and controlled release of information.' },
    { icon: 'notifications' as const, title: 'Smart Notifications', description: 'Automated reminders to keep your will updated and notify recipients when needed.' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MobileHeader />

      {/* Hero – trust badge, heading (Your Will, Secured Today – only Secured in gold), body, CTAs, security badges */}
      <View style={styles.hero}>
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={18} color={colors.gold} />
          <Text style={styles.trustBadgeText}>Trusted by 50,000+ families</Text>
        </View>
        <View style={styles.heroHeading}>
          <Text style={styles.heroHeadingText}>
            {showRegular}
            {showGold ? <Text style={styles.heroHeadingGold}>{showGold}</Text> : null}
            {showAfter}
            {showCursor ? <Text style={styles.cursor}>|</Text> : null}
          </Text>
        </View>
        <Text style={styles.heroBody}>
          Create, manage, and share your digital will with complete peace of mind. Use audio, video, a manual form, or a written note—all encrypted and securely stored.
        </Text>
        <View style={styles.ctaRow}>
          <Pressable
            style={({ pressed }) => [styles.btnHero, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.btnHeroText}>Start Your Will</Text>
          </Pressable>
          <Link href="/how-it-works" asChild>
            <Pressable style={({ pressed }) => [styles.btnHeroOutline, pressed && { opacity: 0.82 }]}>
              <Text style={styles.btnHeroOutlineText}>Learn More</Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.trustBadgesRow}>
          {trustBadges.map((b) => (
            <View key={b.text} style={styles.trustBadgeSmall}>
              <Ionicons name={b.icon} size={16} color={colors.gold} />
              <Text style={styles.trustBadgeSmallText}>{b.text}</Text>
            </View>
          ))}
        </View>
        <View style={styles.demoSection}>
          <View style={styles.demoCard}>
            <View style={styles.demoVideoPlaceholder}>
              <Pressable
                style={({ pressed }) => [styles.demoPlayBtn, pressed && { opacity: 0.84, transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push('/learn-more')}
              >
                <Ionicons name="play" size={24} color={colors.primaryForeground} />
              </Pressable>
              <Text style={styles.demoTitle}>Watch How Digital Will Works</Text>
              <Text style={styles.demoSub}>
                A quick guided walkthrough of audio/video/manual/note will creation.
              </Text>
            </View>
            <View style={styles.demoFooter}>
              <Text style={styles.demoFooterText}>
                Demo highlights: secure sharing, recipient verification, and guided finalization.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresLabel}>FEATURES</Text>
        <Text style={styles.featuresTitle}>Everything You Need to Secure Your Will</Text>
        <Text style={styles.featuresDescription}>
          Create your digital will in the way that feels most natural—audio, video, manual form, or a written note.
        </Text>
        {features.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.gold }]}>
              <Ionicons name={f.icon} size={26} color={colors.primaryForeground} />
            </View>
            <Text style={styles.featureCardTitle}>{f.title}</Text>
            <Text style={styles.featureCardDesc}>{f.description}</Text>
          </View>
        ))}
      </View>

      {/* Testimonials – same as web: navy bg, title, subtitle, 3 cards with quote, stars, content, avatar, name, role */}
      <View style={styles.testimonialsSection}>
        <Text style={styles.testimonialsLabel}>Testimonials</Text>
        <Text style={styles.testimonialsTitle}>Trusted by Families Everywhere</Text>
        <Text style={styles.testimonialsDescription}>See why thousands have chosen Digital Will to secure their will.</Text>
        <View style={styles.testimonialsGrid}>
          {[
            { name: 'Margaret Thompson', role: 'Retired Teacher', content: 'Digital Will gave me peace of mind I didn\'t know I was missing. Recording my wishes through video felt so personal and meaningful.', rating: 5 },
            { name: 'David Chen', role: 'Business Owner', content: 'Managing assets across different categories was seamless. The interface is intuitive, and the security features are top-notch.', rating: 5 },
            { name: 'Sarah Williams', role: 'Financial Advisor', content: 'I recommend Digital Will to all my clients. It\'s the most comprehensive yet accessible digital will platform I\'ve seen.', rating: 5 },
          ].map((t) => (
            <View key={t.name} style={styles.testimonialCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color="rgba(201,162,39,0.3)" style={styles.testimonialQuote} />
              <View style={styles.testimonialStars}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Ionicons key={i} name="star" size={16} color={colors.gold} />
                ))}
              </View>
              <Text style={styles.testimonialContent}>"{t.content}"</Text>
              <View style={styles.testimonialAuthor}>
                <View style={styles.testimonialAvatar}>
                  <Text style={styles.testimonialAvatarText}>{t.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.testimonialName}>{t.name}</Text>
                  <Text style={styles.testimonialRole}>{t.role}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* CTA – Start Free Today badge, heading, two buttons: Create Your Will Now → + Learn More */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.gold} />
          <Text style={styles.ctaBadgeText}>Start Free Today</Text>
        </View>
        <Text style={styles.ctaTitle}>Ready to Secure Your Will?</Text>
        <Text style={styles.ctaBody}>
          Join thousands of families who trust Digital Will to protect what matters most. Create your first will in under 10 minutes.
        </Text>
        <View style={styles.ctaButtonsRow}>
          <Pressable
            style={({ pressed }) => [styles.btnHero, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.btnHeroText}>Create Your Will Now</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.goldForeground} />
          </Pressable>
          <Link href="/how-it-works" asChild>
            <Pressable style={({ pressed }) => [styles.btnHeroOutline, pressed && { opacity: 0.82 }]}>
              <Text style={styles.btnHeroOutlineText}>Learn More</Text>
            </Pressable>
          </Link>
        </View>
        <Text style={styles.ctaDisclaimer}>No credit card required • Free plan available • Cancel anytime</Text>
      </View>

      <View style={styles.partnerStrip}>
        <Text style={styles.partnerTitle}>Trusted Security & Compliance Stack</Text>
        <View style={styles.partnerRow}>
          {['End-to-End Encryption', 'Neon Postgres', 'Role-based Access', 'Secure API'].map((p) => (
            <View key={p} style={styles.partnerPill}>
              <Text style={styles.partnerPillText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}