import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordScreen() {
  const { updatePassword, isAdmin } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(err.message || 'Failed to update password');
      return;
    }
    setSuccess(true);
    const path = isAdmin ? '/admin' : '/dashboard';
    setTimeout(() => router.replace(path), 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set new password</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>Password updated. Redirecting...</Text> : null}
      <TextInput style={styles.input} placeholder="New password" placeholderTextColor="#5C6B7E" value={password} onChangeText={setPassword} secureTextEntry editable={!success} />
      <TextInput style={styles.input} placeholder="Confirm new password" placeholderTextColor="#5C6B7E" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry editable={!success} />
      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading || success}>
        {loading ? <ActivityIndicator color="#1E3A5F" /> : <Text style={styles.buttonText}>Update password</Text>}
      </Pressable>
      <Link href="/login" asChild>
        <Pressable>
          <Text style={styles.link}>Back to Sign In</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F7', padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2C3E5C', marginBottom: 24 },
  error: { color: '#ef4444', marginBottom: 12 },
  success: { color: '#16a34a', marginBottom: 12 },
  input: { backgroundColor: '#F0EDE8', borderWidth: 1, borderColor: '#E5E0D8', borderRadius: 8, padding: 14, color: '#2C3E5C', marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#C9A227', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#1E3A5F', fontWeight: '600', fontSize: 16 },
  link: { color: '#5C6B7E', marginTop: 16, textAlign: 'center' },
});
