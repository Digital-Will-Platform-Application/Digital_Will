import { useState, useEffect, useRef } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { InputWithIcon } from '@/components/InputWithIcon';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

export default function SignUpScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 24, paddingTop: 48, paddingBottom: 48 },
    loadingText: { marginTop: 12, fontSize: 16, color: colors.mutedForeground },
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
    header: { marginBottom: 24 },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 8 },
    subtitle: { ...typography.body, color: colors.mutedForeground },
    error: { color: colors.destructive, marginBottom: 12, fontSize: 14 },
    success: { color: colors.success, marginBottom: 12, fontSize: 14 },
    form: { marginBottom: 8 },
    label: { ...typography.label, color: colors.foreground, marginBottom: 8 },
    btnGold: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.button,
      marginTop: 24,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    btnGoldText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    toggle: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 16 },
    divider: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.mutedForeground, paddingHorizontal: 8, textTransform: 'uppercase' },
    toggleLink: { alignSelf: 'center', marginBottom: 8 },
    toggleLinkText: { fontSize: 14, fontWeight: '600', color: colors.gold },
    backLink: { alignSelf: 'center' },
    backLinkText: { fontSize: 14, color: colors.mutedForeground },
  }));

  const { signUp, user, loading: authLoading, isAdmin, adminLoading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (user) {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;
      const path = isAdmin ? '/admin' : '/dashboard';
      queueMicrotask(() => router.replace(path));
    } else {
      hasRedirectedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit router to prevent redirect loop
  }, [user, authLoading, adminLoading, isAdmin]);

  if (user && !authLoading && !adminLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter email');
      return;
    }
    if (email.trim().toLowerCase() === 'admin@legacywallet.com') {
      setError('This email is reserved for administration. Please use a different email to create an account.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    const { error: err } = await signUp({
      username: fullName.trim(),
      email: email.trim(),
      password,
      confirm_password: confirmPassword,
      ...(mobile.trim() ? { mobile: mobile.trim() } : {}),
    });
    setLoading(false);
    if (err) {
      setError(err.message || 'Sign up failed');
      return;
    }
    setSuccess('Account created successfully!');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start securing your will today</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <InputWithIcon
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.mutedForeground} />}
            placeholder="John Smith"
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />

          <Text style={styles.label}>Email id</Text>
          <InputWithIcon
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />}
            placeholder="john@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Mobile (optional)</Text>
          <InputWithIcon
            leftIcon={<Ionicons name="call-outline" size={20} color={colors.mutedForeground} />}
            placeholder="+91 9876543210"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <InputWithIcon
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} />}
            placeholder="Create a strong password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>Confirm password</Text>
          <InputWithIcon
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} />}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable
            style={[styles.btnGold, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.goldForeground} size="small" />
            ) : (
              <>
                <Text style={styles.btnGoldText}>Register</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.goldForeground} />
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.toggle}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Already have an account?</Text>
          <View style={styles.divider} />
        </View>
        <Link href="/login" asChild>
          <Pressable style={styles.toggleLink} disabled={loading}>
            <Text style={styles.toggleLinkText}>Sign In</Text>
          </Pressable>
        </Link>
        <Link href="/" asChild>
          <Pressable style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to home</Text>
          </Pressable>
        </Link>
        </ScrollView>
      </KeyboardAvoidingView>
      <CookieConsentBanner />
    </View>
  );
}