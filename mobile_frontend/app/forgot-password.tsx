import { useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { InputWithIcon } from '@/components/InputWithIcon';

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    scroll: { flexGrow: 1, backgroundColor: colors.background, padding: 24, paddingTop: 48 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: { fontSize: 20, fontWeight: '600', color: colors.foreground },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 8 },
    subtitle: { ...typography.body, color: colors.mutedForeground, marginBottom: 24 },
    error: { color: colors.destructive, marginBottom: 12, fontSize: 14 },
    label: { ...typography.label, color: colors.foreground, marginBottom: 8 },
    btnGold: {
      backgroundColor: colors.gold,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.button,
      alignItems: 'center',
      marginTop: 8,
    },
    btnDisabled: { opacity: 0.7 },
    btnGoldText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, alignSelf: 'flex-start' },
    backLinkText: { fontSize: 14, color: colors.mutedForeground },
    sentBlock: { alignItems: 'center' },
    sentIconWrap: { marginBottom: 16 },
    emailHighlight: { fontWeight: '600', color: colors.foreground },
    outlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: radius.button,
      marginTop: 24,
    },
    outlineBtnText: { color: colors.foreground, fontWeight: '500', fontSize: 16 },
  }));

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message || 'An unexpected error occurred');
      return;
    }
    setSent(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {/* Logo - same as web */}
      <Link href="/" asChild>
        <Pressable style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={22} color={colors.goldForeground} />
          </View>
          <Text style={styles.logoText}>Digital Will</Text>
        </Pressable>
      </Link>

      {sent ? (
        <View style={styles.sentBlock}>
          <View style={styles.sentIconWrap}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a password reset link to <Text style={styles.emailHighlight}>{email}</Text>. Please check your inbox and click the link to reset your password.
          </Text>
          <Link href="/login" asChild>
            <Pressable style={styles.outlineBtn}>
              <Ionicons name="arrow-back" size={18} color={colors.foreground} />
              <Text style={styles.outlineBtnText}>Back to Sign In</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>No worries, we'll send you reset instructions.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Email Address</Text>
          <InputWithIcon
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />}
            placeholder="john@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <Pressable style={[styles.btnGold, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.goldForeground} size="small" /> : <Text style={styles.btnGoldText}>Reset Password</Text>}
          </Pressable>
          <Link href="/login" asChild>
            <Pressable style={styles.backLink}>
              <Ionicons name="arrow-back" size={18} color={colors.mutedForeground} />
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </Pressable>
          </Link>
        </>
      )}
    </ScrollView>
  );
}