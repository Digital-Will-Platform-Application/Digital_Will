import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { Footer } from '@/components/Footer';

const values = [
  { icon: 'shield-checkmark' as const, title: 'Security First', description: 'We prioritize the security and privacy of your sensitive information above all else.' },
  { icon: 'heart' as const, title: 'Compassionate Service', description: 'We understand the emotional importance of will planning and treat every user with care.' },
  { icon: 'people' as const, title: 'User-Centric', description: "Every feature is designed with our users' needs and peace of mind in mind." },
  { icon: 'rocket' as const, title: 'Innovation', description: 'We continuously improve our platform to provide the best digital will management experience.' },
];

const stats = [
  { label: 'Trusted Users', value: '50,000+', icon: 'people' as const },
  { label: 'Wills Created', value: '100,000+', icon: 'shield-checkmark' as const },
  { label: 'Countries Served', value: '50+', icon: 'location' as const },
  { label: 'Years of Service', value: '5+', icon: 'trophy' as const },
];

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    back: { fontSize: 14, color: colors.mutedForeground },
    hero: { marginBottom: 32 },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(201,162,39,0.2)', marginBottom: 16 },
    heroBadgeText: { fontSize: 14, fontWeight: '500', color: colors.foreground },
    heroTitle: { ...typography.headingDisplay, color: colors.foreground, marginBottom: 16 },
    heroBody: { fontSize: 16, lineHeight: 24, color: colors.mutedForeground },
    statsSection: { backgroundColor: 'rgba(240,237,232,0.5)', paddingVertical: 24, paddingHorizontal: 16, borderRadius: 12, marginBottom: 32 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
    statItem: { width: '47%', alignItems: 'center' },
    statIcon: { marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
    statLabel: { fontSize: 13, color: colors.mutedForeground },
    section: { marginBottom: 32 },
    sectionAlt: { backgroundColor: 'rgba(240,237,232,0.5)', padding: 20, borderRadius: 12 },
    sectionTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 16, textAlign: 'center' },
    subsectionTitle: { fontSize: 20, fontWeight: '600', color: colors.foreground, marginTop: 24, marginBottom: 12, textAlign: 'center' },
    paragraph: { fontSize: 16, lineHeight: 24, color: colors.mutedForeground, marginBottom: 12 },
    paragraphCenter: { fontSize: 16, lineHeight: 24, color: colors.mutedForeground, marginBottom: 12, textAlign: 'center' },
    valueCard: { backgroundColor: colors.card, padding: 20, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: colors.border },
    valueIconBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    valueTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
    valueDesc: { fontSize: 14, color: colors.mutedForeground, lineHeight: 22 },
    teamNote: { fontSize: 14, color: colors.mutedForeground, fontStyle: 'italic' },
    contactCards: { marginTop: 16, gap: 12 },
    contactCard: { backgroundColor: colors.card, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    contactIcon: { marginBottom: 12 },
    contactCardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    contactCardValue: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
    homeLink: { alignSelf: 'center', marginTop: 24 },
    homeLinkText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MobileHeader />
      <Link href="/" asChild>
        <Pressable style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
          <Text style={styles.back}>Back to Home</Text>
        </Pressable>
      </Link>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="business" size={16} color={colors.gold} />
          <Text style={styles.heroBadgeText}>About Digital Will</Text>
        </View>
        <Text style={styles.heroTitle}>Securing Wills, One Will at a Time</Text>
        <Text style={styles.heroBody}>
          Digital Will was founded with a simple mission: to make estate planning accessible,
          secure, and meaningful for everyone. We believe that everyone deserves peace of mind
          when it comes to protecting their will and ensuring their wishes are honored.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon} size={28} color={colors.gold} style={styles.statIcon} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Our Story */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Story</Text>
        <Text style={styles.paragraph}>
          Digital Will was born from a personal experience. Our founders recognized that
          traditional estate planning was often complicated, expensive, and emotionally
          challenging. They saw families struggling to document their wishes and ensure
          their loved ones would be taken care of.
        </Text>
        <Text style={styles.paragraph}>
          In response, we set out to create a platform that would democratize estate
          planning—making it accessible to everyone, regardless of their financial
          situation or technical expertise. We combined cutting-edge security technology
          with an intuitive, user-friendly interface to create something truly special.
        </Text>
        <Text style={styles.paragraph}>
          Today, Digital Will serves thousands of families worldwide, helping them secure
          their wills with confidence. We're proud of what we've built, but we're even
          more excited about what's to come as we continue to innovate and improve.
        </Text>
      </View>

      {/* Mission */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.paragraphCenter}>
          To empower individuals and families to protect their wills with confidence,
          ensuring that their wishes are documented, secure, and accessible to those who
          matter most.
        </Text>
        <Text style={styles.subsectionTitle}>Our Vision</Text>
        <Text style={styles.paragraphCenter}>
          A world where every person has the tools and confidence to plan their will,
          leaving behind not just assets, but peace of mind for their loved ones.
        </Text>
      </View>

      {/* Values */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Values</Text>
        <Text style={styles.paragraphCenter}>These core principles guide everything we do at Digital Will</Text>
        {values.map((v) => (
          <View key={v.title} style={styles.valueCard}>
            <View style={styles.valueIconBox}>
              <Ionicons name={v.icon} size={28} color={colors.goldForeground} />
            </View>
            <Text style={styles.valueTitle}>{v.title}</Text>
            <Text style={styles.valueDesc}>{v.description}</Text>
          </View>
        ))}
      </View>

      {/* Team */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionTitle}>Our Team</Text>
        <Text style={styles.paragraph}>
          We're a diverse team of passionate individuals dedicated to making estate planning
          accessible and secure. Our team combines expertise in technology, security,
          legal compliance, and user experience.
        </Text>
        <Text style={styles.teamNote}>Team member profiles will be updated here soon.</Text>
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Text style={styles.paragraphCenter}>Have questions? We'd love to hear from you.</Text>
        <View style={styles.contactCards}>
          <View style={styles.contactCard}>
            <Ionicons name="mail" size={28} color={colors.gold} style={styles.contactIcon} />
            <Text style={styles.contactCardTitle}>Email</Text>
            <Text style={styles.contactCardValue}>support@digitalwill.com</Text>
          </View>
          <View style={styles.contactCard}>
            <Ionicons name="call" size={28} color={colors.gold} style={styles.contactIcon} />
            <Text style={styles.contactCardTitle}>Phone</Text>
            <Text style={styles.contactCardValue}>+1 (555) 123-4567</Text>
          </View>
          <View style={styles.contactCard}>
            <Ionicons name="location" size={28} color={colors.gold} style={styles.contactIcon} />
            <Text style={styles.contactCardTitle}>Address</Text>
            <Text style={styles.contactCardValue}>123 Will Street{'\n'}San Francisco, CA 94105</Text>
          </View>
        </View>
      </View>

      <Link href="/" asChild>
        <Pressable style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Home</Text>
        </Pressable>
      </Link>

      <Footer />
    </ScrollView>
  );
}