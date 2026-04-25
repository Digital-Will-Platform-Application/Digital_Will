import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { backendApi } from '@/lib/backendApi';
import { radius } from '@/lib/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center' },
      title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 10 },
      subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16, lineHeight: 20 },
      input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: colors.foreground,
        backgroundColor: colors.card,
        marginBottom: 12,
      },
      button: {
        backgroundColor: colors.primary,
        borderRadius: radius.button,
        paddingVertical: 12,
        alignItems: 'center',
      },
      buttonText: { color: colors.primaryForeground, fontWeight: '600', fontSize: 15 },
      result: { marginTop: 12, color: colors.foreground, fontSize: 13 },
      error: { marginTop: 12, color: colors.destructive, fontSize: 13 },
      backBtn: { marginTop: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
      backText: { color: colors.mutedForeground, fontWeight: '600' },
    }),
  );

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await backendApi.verifyEmail(token.trim());
      const msg = typeof result.message === 'string' ? result.message : 'Email verified successfully.';
      setMessage(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>
        Paste the verification token from your email and confirm to complete verification.
      </Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        placeholder="Enter verification token"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
      />
      <Pressable style={[styles.button, (!token.trim() || loading) && { opacity: 0.6 }]} onPress={() => void handleVerify()} disabled={!token.trim() || loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </Pressable>
      {message ? (
        <Text style={styles.result}>
          <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} /> {message}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.backBtn} onPress={() => router.replace('/login')}>
        <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
        <Text style={styles.backText}>Back to login</Text>
      </Pressable>
    </View>
  );
}
