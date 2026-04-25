import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';

const CATEGORIES = ['property', 'investment', 'bank_account', 'vehicle', 'jewelry', 'digital_asset', 'insurance', 'business', 'other'] as const;

export default function OnboardingScreen() {
  const { user, updateUserMetadata } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddAsset = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const userId = parseInt(user.id, 10);
      if (Number.isNaN(userId)) return;
      await backendApi.addAsset({
        user_id: userId,
        user_email: user.email ?? undefined,
        name: name.trim(),
        category,
        estimated_value: value ? parseFloat(value) || undefined : undefined,
      });
      setName('');
      setValue('');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      updateUserMetadata({ ...user.user_metadata, onboarding_completed: true });
      router.replace('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add your assets</Text>
      <Text style={styles.subtitle}>You can add more later from Assets.</Text>
      <TextInput style={styles.input} placeholder="Asset name" placeholderTextColor="#5C6B7E" value={name} onChangeText={setName} />
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput style={styles.input} placeholder="Estimated value (optional)" placeholderTextColor="#5C6B7E" value={value} onChangeText={setValue} keyboardType="numeric" />
      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleAddAsset} disabled={saving}>
        {saving ? <ActivityIndicator color="#1E3A5F" /> : <Text style={styles.buttonText}>Add asset</Text>}
      </Pressable>
      <Pressable style={[styles.primaryButton, saving && styles.buttonDisabled]} onPress={handleComplete} disabled={saving}>
        <Text style={styles.primaryButtonText}>Done — go to Dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F7' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E5C', marginBottom: 8 },
  subtitle: { color: '#5C6B7E', marginBottom: 24 },
  input: { backgroundColor: '#F0EDE8', borderRadius: 8, padding: 14, color: '#2C3E5C', marginBottom: 12, fontSize: 16 },
  label: { color: '#5C6B7E', marginBottom: 8 },
  chipRow: { marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0EDE8', marginRight: 8 },
  chipActive: { backgroundColor: '#C9A227' },
  chipText: { color: '#5C6B7E' },
  chipTextActive: { color: '#1E3A5F', fontWeight: '600' },
  button: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#2C3E5C', fontWeight: '600' },
  primaryButton: { backgroundColor: '#C9A227', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#1E3A5F', fontWeight: '600' },
});
