import { useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { MobileHeader } from '@/components/MobileHeader';
import { Footer } from '@/components/Footer';

const contactInfo = [
  { icon: 'mail' as const, label: 'Email', value: 'support@digitalwill.com', href: 'mailto:support@digitalwill.com' },
  { icon: 'call' as const, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: 'location' as const, label: 'Address', value: '123 Legacy Way, San Francisco, CA 94102', href: null },
];

export default function ContactScreen() {
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
    infoSection: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 },
    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    infoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 13, color: colors.mutedForeground, marginBottom: 4 },
    infoValue: { fontSize: 15, fontWeight: '500', color: colors.foreground },
    formSection: { marginBottom: 24 },
    formTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 16 },
    label: { ...typography.label, color: colors.foreground, marginBottom: 8 },
    input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.foreground, marginBottom: 16 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold, paddingVertical: 14, borderRadius: radius.button },
    submitBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    homeLink: { alignSelf: 'center', marginTop: 8 },
    homeLinkText: { fontSize: 14, fontWeight: '600', color: colors.gold },
  }));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    Alert.alert('Thank you', "We'll get back to you soon.");
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

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
          <Ionicons name="chatbubbles" size={16} color={colors.gold} />
          <Text style={styles.heroBadgeText}>Contact Us</Text>
        </View>
        <Text style={styles.heroTitle}>Get in Touch</Text>
        <Text style={styles.heroBody}>
          Have questions about Digital Will or need support? We're here to help. Reach out and we'll respond as soon as we can.
        </Text>
      </View>

      {/* Contact Info Cards */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        {contactInfo.map((item) => (
          <View key={item.label} style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name={item.icon} size={24} color={colors.primaryForeground} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Form */}
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Send us a Message</Text>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="How can we help?"
          placeholderTextColor={colors.mutedForeground}
          value={subject}
          onChangeText={setSubject}
        />
        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Your message..."
          placeholderTextColor={colors.mutedForeground}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
        />
        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Ionicons name="send" size={18} color={colors.goldForeground} />
          <Text style={styles.submitBtnText}>Submit</Text>
        </Pressable>
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