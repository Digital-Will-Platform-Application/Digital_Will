import { useState, useEffect, useRef } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { InputWithIcon } from '@/components/InputWithIcon';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

type LoginMethod = 'email' | 'otp';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 24, paddingTop: 48 },
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
    methodToggle: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: colors.secondary, borderRadius: 8, marginBottom: 20 },
    methodTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
    methodTabActive: { backgroundColor: colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    methodTabText: { fontSize: 14, fontWeight: '500', color: colors.mutedForeground },
    methodTabTextActive: { color: colors.foreground },
    error: { color: colors.destructive, marginBottom: 12, fontSize: 14 },
    form: { marginBottom: 8 },
    phoneInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: 8 },
    phoneIcon: { marginRight: 10 },
    phoneInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.foreground },
    phoneHint: { fontSize: 12, color: colors.mutedForeground, marginBottom: 16 },
    otpSentBox: { backgroundColor: colors.secondary, padding: 16, borderRadius: 8, marginTop: 8 },
    otpSentText: { fontSize: 14, color: colors.mutedForeground },
    label: { ...typography.label, color: colors.foreground, marginBottom: 8 },
    passwordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    forgotLink: { fontSize: 14, fontWeight: '500', color: colors.gold },
    rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 },
    rememberText: { fontSize: 14, color: colors.mutedForeground },
    btnGold: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.button,
      marginTop: 16,
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
    verifyLink: { alignSelf: 'center', marginBottom: 8 },
    verifyLinkText: { fontSize: 13, fontWeight: '500', color: colors.mutedForeground },
    backLink: { alignSelf: 'center' },
    backLinkText: { fontSize: 14, color: colors.mutedForeground },
  }));

  const { signIn, signInWithOtpPhone, user, loading: authLoading, isAdmin, adminLoading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message || 'Invalid email or password');
      return;
    }
    // useEffect will redirect when user/auth state updates
  };

  const handleOtpSubmit = async () => {
    const phone = mobile.startsWith('+') ? mobile : `+91${mobile.replace(/\D/g, '')}`;
    if (phone.length < 10) {
      setError('Enter a valid mobile number with country code');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await signInWithOtpPhone(phone);
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to send OTP');
      return;
    }
    setOtpSent(true);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo - same as web */}
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => [styles.logoRow, pressed && { opacity: 0.8 }]}>
            <View style={styles.logoBox}>
              <Ionicons name="shield-checkmark" size={22} color={colors.goldForeground} />
            </View>
            <Text style={styles.logoText}>Digital Will</Text>
          </Pressable>
        </Link>

        {/* Header - same as web Login */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to manage your digital will</Text>
        </View>

        {/* Login method toggle - Email / Phone OTP (same as web) */}
        <View style={styles.methodToggle}>
          <Pressable
            style={({ pressed }) => [
              styles.methodTab,
              loginMethod === 'email' && styles.methodTabActive,
              pressed && { opacity: 0.82 },
            ]}
            onPress={() => { setLoginMethod('email'); setOtpSent(false); setError(''); }}
          >
            <Text style={[styles.methodTabText, loginMethod === 'email' && styles.methodTabTextActive]}>Email</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.methodTab,
              loginMethod === 'otp' && styles.methodTabActive,
              pressed && { opacity: 0.82 },
            ]}
            onPress={() => { setLoginMethod('otp'); setError(''); }}
          >
            <Text style={[styles.methodTabText, loginMethod === 'otp' && styles.methodTabTextActive]}>Phone OTP</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loginMethod === 'otp' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneInputWrap}>
              <Ionicons name="call-outline" size={20} color={colors.mutedForeground} style={styles.phoneIcon} />
              <TextInput
                style={styles.phoneInput}
                placeholder="+91 9876543210"
                placeholderTextColor={colors.mutedForeground}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                editable={!loading && !otpSent}
              />
            </View>
            <Text style={styles.phoneHint}>Enter your mobile number with country code (e.g. +91)</Text>
            {otpSent ? (
              <View style={styles.otpSentBox}>
                <Text style={styles.otpSentText}>We've sent a sign-in link to your phone. Click the link to sign in.</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.btnGold,
                  loading && styles.btnDisabled,
                  pressed && !loading && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleOtpSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.goldForeground} size="small" />
                ) : (
                  <Text style={styles.btnGoldText}>Send OTP</Text>
                )}
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.form}>
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

            <View style={styles.passwordRow}>
              <Text style={styles.label}>Password</Text>
              <Link href="/forgot-password" asChild>
                <Pressable>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </Link>
            </View>
            <InputWithIcon
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} />}
              rightIcon={
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
                </Pressable>
              }
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />

            <View style={styles.rememberRow}>
              <Text style={styles.rememberText}>Remember me</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.btnGold,
                loading && styles.btnDisabled,
                pressed && !loading && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.goldForeground} size="small" />
              ) : (
                <>
                  <Text style={styles.btnGoldText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.goldForeground} />
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Toggle - same as web */}
        <View style={styles.toggle}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Don't have an account?</Text>
          <View style={styles.divider} />
        </View>
        <Link href="/signup" asChild>
          <Pressable style={({ pressed }) => [styles.toggleLink, pressed && { opacity: 0.75 }]} disabled={loading}>
            <Text style={styles.toggleLinkText}>Create Account</Text>
          </Pressable>
        </Link>
        <Link href="/verify-email" asChild>
          <Pressable style={({ pressed }) => [styles.verifyLink, pressed && { opacity: 0.75 }]} disabled={loading}>
            <Text style={styles.verifyLinkText}>Already have token? Verify email</Text>
          </Pressable>
        </Link>
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => [styles.backLink, pressed && { opacity: 0.75 }]}>
            <Text style={styles.backLinkText}>Back to home</Text>
          </Pressable>
        </Link>
        </ScrollView>
      </KeyboardAvoidingView>
      <CookieConsentBanner />
    </View>
  );
}