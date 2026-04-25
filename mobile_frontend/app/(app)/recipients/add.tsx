import { useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

const RELATIONSHIPS = ['Spouse', 'Child', 'Sibling', 'Parent', 'Friend', 'Charity', 'Other'];

export default function AddRecipientScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    backText: { fontSize: 16, fontWeight: '600', color: colors.gold },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 20 },
    label: { ...typography.label, color: colors.foreground, marginBottom: 8 },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      marginBottom: 16,
    },
    relationshipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    chipText: { fontSize: 14, color: colors.foreground },
    chipTextActive: { color: colors.goldForeground, fontWeight: '600' },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 14,
      borderRadius: radius.button,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter full name.');
      return;
    }
    if (!user?.email) {
      Alert.alert('Error', 'User email not found. Please log in again.');
      return;
    }
    setLoading(true);
    try {
      const result = await backendApi.addRecipient({
        user_email: user.email,
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        relationship: relationship || undefined,
      });
      
      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to add recipient');
        return;
      }
      
      Alert.alert('Saved', 'Recipient added successfully. Email notification sent if email provided.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add recipient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={22} color={colors.gold} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Add Recipient</Text>
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor={colors.mutedForeground}
        value={fullName}
        onChangeText={setFullName}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="email@example.com"
        placeholderTextColor={colors.mutedForeground}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        placeholder="+91 9876543210"
        placeholderTextColor={colors.mutedForeground}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Relationship</Text>
      <View style={styles.relationshipRow}>
        {RELATIONSHIPS.map((r) => (
          <Pressable
            key={r}
            style={[styles.chip, relationship === r && styles.chipActive]}
            onPress={() => setRelationship(r)}
          >
            <Text style={[styles.chipText, relationship === r && styles.chipTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={[styles.saveBtn, loading && styles.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.goldForeground} size="small" />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color={colors.goldForeground} />
            <Text style={styles.saveBtnText}>Save Recipient</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}