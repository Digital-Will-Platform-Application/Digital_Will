import { useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { Footer } from '@/components/Footer';

const features = [
  { icon: 'document-text' as const, title: 'Digital Will Creation', description: 'Create your will using Record Audio, Record Video, Fill a Form, Write a Note, or text. Our platform guides you through the process step by step, ensuring nothing is missed.' },
  { icon: 'people' as const, title: 'Recipient Management', description: 'Easily add and manage beneficiaries. Set up verification for recipients and assign assets to specific people with clear allocation percentages.' },
  { icon: 'shield-checkmark' as const, title: 'Bank-Level Security', description: 'Your sensitive information is protected with 256-bit encryption. We use industry-standard security practices to keep your data safe.' },
  { icon: 'time' as const, title: 'Update Anytime', description: 'Life changes, and so can your will. Update your will, recipients, and asset allocations at any time with just a few clicks.' },
];

const benefits = [
  'Peace of mind knowing your wishes are documented',
  'Easy to update as your life circumstances change',
  'Secure digital storage accessible to trusted recipients',
  'Multiple format options (Record Audio, Record Video, Fill a Form, Write a Note, and text)',
  'Comprehensive asset management and allocation',
  'Recipient verification for added security',
  'Professional guidance through the process',
  '24/7 access to your will from anywhere',
];

const faqs = [
  { q: 'Is my digital will legally binding?', a: 'While Digital Will provides a secure platform to create and store your will, we recommend consulting with a legal professional in your jurisdiction to ensure your will meets all local legal requirements. Laws vary by location, and some jurisdictions may require specific formalities like witnesses or notarization.' },
  { q: 'Can I change my plan later?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges. Your data is always preserved when switching plans.' },
  { q: 'What happens if I cancel my subscription?', a: 'Your data remains secure and accessible. You can export your will and recipient information at any time. Basic plan features remain available even after cancellation, ensuring you never lose access to your important documents.' },
  { q: 'How secure is my information?', a: 'We use 256-bit SSL encryption to protect all data in transit and at rest. Your passwords are hashed using industry-standard algorithms, and we implement multiple layers of security including rate limiting and leaked password protection. We never share your information with third parties.' },
  { q: 'Can I add multiple wills?', a: 'Yes! With Professional and Legacy plans, you can create unlimited wills. This is useful if you want separate wills for different purposes or need to create wills for different time periods.' },
  { q: 'How do recipients access the will?', a: 'Recipients receive email notifications with verification links. Once they verify their identity, they can access the information you\'ve shared with them. You control what each recipient can see.' },
  { q: 'What types of assets can I include?', a: 'You can include any type of asset: property, investments, bank accounts, vehicles, jewelry, digital assets, insurance policies, business interests, and more. Our platform supports comprehensive asset categorization and allocation.' },
  { q: 'Do you offer refunds?', a: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 30 days for a full refund. No questions asked.' },
  { q: 'Can I record video messages for my loved ones?', a: 'Yes! Our video will feature allows you to record personal messages for your beneficiaries. These videos are stored securely and can be shared with recipients when appropriate.' },
  { q: 'What if I need legal advice?', a: 'While Digital Will provides tools to create and manage your will, we always recommend consulting with a qualified estate planning attorney in your jurisdiction for complex situations or to ensure full legal compliance.' },
  { q: 'How long does it take to create a will?', a: 'Most users complete their will in under 10 minutes. The process is designed to be simple and straightforward, with guided steps for creating your will, adding recipients, and allocating assets.' },
  { q: 'Is my data backed up?', a: 'Yes, all data is automatically backed up with redundancy across multiple secure servers. Your information is protected against data loss and is accessible 24/7.' },
];

export default function LearnMoreScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    back: { fontSize: 14, color: colors.mutedForeground },
    header: { marginBottom: 32 },
    headerLabel: { fontSize: 14, fontWeight: '500', color: colors.gold, marginBottom: 8, textTransform: 'uppercase' },
    headerTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 12 },
    headerBody: { fontSize: 16, color: colors.mutedForeground, lineHeight: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.foreground, marginBottom: 16 },
    featureCard: { backgroundColor: colors.card, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    featureIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    featureTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
    featureDesc: { fontSize: 14, color: colors.mutedForeground, lineHeight: 22 },
    benefitsSection: { backgroundColor: 'rgba(240,237,232,0.6)', padding: 20, borderRadius: 12 },
    benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    benefitIcon: { marginRight: 12, marginTop: 2 },
    benefitText: { flex: 1, fontSize: 14, color: colors.mutedForeground },
    securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    securityIconBox: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    securityText: { flex: 1 },
    securityTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    securitySub: { fontSize: 14, color: colors.mutedForeground },
    securityGrid: { gap: 16 },
    securityItem: { marginBottom: 8 },
    securityItemTitle: { fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    securityItemDesc: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
    faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    faqSub: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16 },
    faqItem: { backgroundColor: colors.card, padding: 16, borderRadius: radius.card, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestion: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.foreground, marginRight: 8 },
    faqAnswer: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20, marginTop: 12 },
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

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MobileHeader />
      <Link href="/" asChild>
        <Pressable style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
          <Text style={styles.back}>Back to Home</Text>
        </Pressable>
      </Link>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Learn More</Text>
        <Text style={styles.headerTitle}>Everything You Need to Know About Digital Will</Text>
        <Text style={styles.headerBody}>Discover how Digital Will helps you secure your legacy and protect what matters most to you and your loved ones.</Text>
      </View>

      {/* Key Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        {features.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <View style={styles.featureIconBox}>
              <Ionicons name={f.icon} size={24} color={colors.goldForeground} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.description}</Text>
          </View>
        ))}
      </View>

      {/* Why Choose */}
      <View style={[styles.section, styles.benefitsSection]}>
        <Text style={styles.sectionTitle}>Why Choose Digital Will?</Text>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.gold} style={styles.benefitIcon} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* Security */}
      <View style={styles.section}>
        <View style={styles.securityHeader}>
          <View style={styles.securityIconBox}>
            <Ionicons name="lock-closed" size={32} color={colors.primaryForeground} />
          </View>
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Your Security is Our Priority</Text>
            <Text style={styles.securitySub}>We take security seriously to protect your sensitive information</Text>
          </View>
        </View>
        <View style={styles.securityGrid}>
          <View style={styles.securityItem}>
            <Text style={styles.securityItemTitle}>256-bit Encryption</Text>
            <Text style={styles.securityItemDesc}>All data is encrypted using industry-standard AES-256 encryption, the same level used by banks and financial institutions.</Text>
          </View>
          <View style={styles.securityItem}>
            <Text style={styles.securityItemTitle}>Secure Authentication</Text>
            <Text style={styles.securityItemDesc}>Multi-factor authentication options and leaked password protection ensure your account stays secure.</Text>
          </View>
          <View style={styles.securityItem}>
            <Text style={styles.securityItemTitle}>Privacy First</Text>
            <Text style={styles.securityItemDesc}>We never share your information with third parties. Your data belongs to you, and you control who can access it.</Text>
          </View>
        </View>
      </View>

      {/* FAQs */}
      <View style={styles.section}>
        <View style={styles.faqHeader}>
          <Ionicons name="help-circle" size={24} color={colors.gold} />
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>
        <Text style={styles.faqSub}>Find answers to common questions about Digital Will</Text>
        {faqs.map((faq, i) => (
          <Pressable key={i} style={styles.faqItem} onPress={() => setOpenFaq(openFaq === i ? null : i)}>
            <View style={styles.faqQuestionRow}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Ionicons name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
            </View>
            {openFaq === i ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
          </Pressable>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
        <Text style={styles.ctaBody}>Create your digital will in minutes and secure your legacy for your loved ones. Start with our free plan today.</Text>
        <View style={styles.ctaButtons}>
          <Link href="/pricing" asChild>
            <Pressable style={styles.ctaBtnPrimary}>
              <Text style={styles.ctaBtnPrimaryText}>View Pricing</Text>
            </Pressable>
          </Link>
          <Link href="/login" asChild>
            <Pressable style={styles.ctaBtnOutline}>
              <Text style={styles.ctaBtnOutlineText}>Get Started Free</Text>
            </Pressable>
          </Link>
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