import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

const steps = [
  { number: '01', icon: 'person-add' as const, title: 'Create Your Account', description: 'Sign up securely with email, phone, or your favorite social account. Your data is protected from day one.' },
  { number: '02', icon: 'mic' as const, title: 'Record Your Wishes', description: 'Choose audio, video, a manual form, or write a note to express your final wishes. Our tools help organize everything.' },
  { number: '03', icon: 'people' as const, title: 'Assign Recipients', description: 'Add beneficiaries and specify what each person receives. Set conditions and delivery preferences.' },
  { number: '04', icon: 'shield-checkmark' as const, title: 'Secure & Share', description: 'Your will is encrypted and stored securely. Recipients are notified when the time comes.' },
];

export default function HowItWorksScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 48 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    back: { fontSize: 14, color: colors.mutedForeground },
    header: { marginBottom: 32 },
    headerLabel: { fontSize: 14, fontWeight: '500', color: colors.gold, marginBottom: 8, textTransform: 'uppercase' },
    headerTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 12 },
    headerBody: { fontSize: 16, color: colors.mutedForeground, lineHeight: 24 },
    stepsSection: { marginBottom: 32 },
    stepCard: { alignItems: 'center', marginBottom: 28 },
    stepIconWrap: { position: 'relative', marginBottom: 16 },
    stepIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    stepNumberBadge: { position: 'absolute', top: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    stepNumberText: { fontSize: 12, fontWeight: '700', color: colors.primaryForeground },
    stepTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 8, textAlign: 'center' },
    stepDesc: { fontSize: 14, color: colors.mutedForeground, lineHeight: 22, textAlign: 'center' },
    ctaCard: { backgroundColor: colors.card, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    ctaTitle: { fontSize: 20, fontWeight: '600', color: colors.foreground, marginBottom: 8, textAlign: 'center' },
    ctaBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 20 },
    ctaButtons: { gap: 12 },
    ctaBtnPrimary: { backgroundColor: colors.gold, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center' },
    ctaBtnPrimaryText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    ctaBtnOutline: { borderWidth: 1, borderColor: colors.foreground, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center' },
    ctaBtnOutlineText: { color: colors.foreground, fontWeight: '600', fontSize: 16 },
    homeLink: { alignSelf: 'center', marginTop: 24 },
    homeLinkText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
          <Text style={styles.back}>Back to Home</Text>
        </Pressable>
      </Link>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>How It Works</Text>
        <Text style={styles.headerTitle}>Create Your Will in Minutes</Text>
        <Text style={styles.headerBody}>A simple four-step process designed to be completed in under 10 minutes.</Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsSection}>
        {steps.map((step, index) => (
          <View key={step.number} style={styles.stepCard}>
            <View style={styles.stepIconWrap}>
              <View style={styles.stepIconCircle}>
                <Ionicons name={step.icon} size={32} color={colors.goldForeground} />
              </View>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDesc}>{step.description}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaBody}>Create your digital will in minutes and secure your legacy for your loved ones.</Text>
        <View style={styles.ctaButtons}>
          <Link href="/login" asChild>
            <Pressable style={styles.ctaBtnPrimary}>
              <Text style={styles.ctaBtnPrimaryText}>Get Started</Text>
            </Pressable>
          </Link>
          <Link href="/learn-more" asChild>
            <Pressable style={styles.ctaBtnOutline}>
              <Text style={styles.ctaBtnOutlineText}>Learn More</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <Link href="/" asChild>
        <Pressable style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}