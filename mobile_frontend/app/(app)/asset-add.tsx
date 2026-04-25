import { useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { validateAssetName, validateNumericValue } from '@/lib/validation';

const CATEGORIES = [
  { id: 'property', label: 'Property' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'bank_account', label: 'Bank' },
  { id: 'investment', label: 'Investment' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'digital_asset', label: 'Digital' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'business', label: 'Business' },
  { id: 'other', label: 'Other' },
];

export default function AssetAddScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    back: { color: colors.mutedForeground, marginBottom: 20 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
    progressStepWrap: { flexDirection: 'row', alignItems: 'center' },
    progressStep: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressActive: { backgroundColor: colors.gold },
    progressDone: { backgroundColor: colors.gold },
    progressNum: { fontSize: 12, fontWeight: '600', color: colors.foreground },
    progressLine: { width: 24, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 8 },
    hint: { fontSize: 14, color: colors.mutedForeground, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.input,
      padding: 14,
      fontSize: 16,
      color: colors.foreground,
      marginBottom: 16,
    },
    textArea: { minHeight: 80 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.goldLight, borderColor: colors.gold },
    chipText: { fontSize: 14, color: colors.mutedForeground },
    chipTextActive: { color: colors.goldForeground, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.gold, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center', marginTop: 8 },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    flowNav: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
    flowBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border },
    flowBtnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
    flowBtnText: { color: colors.foreground, fontWeight: '600' },
    flowBtnTextPrimary: { color: colors.goldForeground, fontWeight: '600' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isFlowMode = params.flow === 'true';
  const returnTo = params.returnTo as string | undefined;
  const [name, setName] = useState('');
  const [category, setCategory] = useState('property');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    const nameVal = validateAssetName(name);
    if (!nameVal.isValid) {
      Alert.alert('Validation', nameVal.error);
      return;
    }
    const valueVal = validateNumericValue(estimatedValue);
    if (!valueVal.isValid) {
      Alert.alert('Validation', valueVal.error);
      return;
    }
    setSaving(true);
    try {
      const userId = parseInt(user.id, 10);
      if (Number.isNaN(userId)) throw new Error('Invalid user');
      await backendApi.addAsset({
        user_id: userId,
        user_email: user.email ?? undefined,
        name: nameVal.sanitized,
        category,
        estimated_value: valueVal.sanitized,
        description: description.trim() || undefined,
      });
      Alert.alert('Success', 'Asset added successfully!');
      if (isFlowMode && returnTo === 'assets-manage') {
        router.replace('/assets-manage?flow=true');
      } else if (isFlowMode) {
        router.push('/recipients?flow=true');
      } else {
        router.back();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add asset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      {/* Progress Indicator - Only show in flow mode (4 steps: Create, Add Assets, Add Recipients, Review) */}
      {isFlowMode && (
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={styles.progressStepWrap}>
              <View style={[styles.progressStep, step === 2 ? styles.progressActive : step < 2 ? styles.progressDone : null]}>
                {step < 2 ? <Ionicons name="checkmark" size={16} color={colors.primaryForeground} /> : <Text style={styles.progressNum}>{step}</Text>}
              </View>
              {step < 4 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.title}>Add Asset</Text>
      <Text style={styles.hint}>List your asset with name, category, and optional value.</Text>

      <Text style={styles.label}>Asset name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Family home, Savings account"
        placeholderTextColor={colors.mutedForeground}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, category === c.id && styles.chipActive]}
            onPress={() => setCategory(c.id)}
          >
            <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Estimated value (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 100000"
        placeholderTextColor={colors.mutedForeground}
        value={estimatedValue}
        onChangeText={setEstimatedValue}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Brief description"
        placeholderTextColor={colors.mutedForeground}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.goldForeground} /> : <Text style={styles.saveBtnText}>Save Asset</Text>}
      </Pressable>

      {/* Flow Navigation */}
      {isFlowMode && (
        <View style={styles.flowNav}>
          <Pressable style={styles.flowBtn} onPress={() => router.push('/create')}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            <Text style={styles.flowBtnText}>Back to Will Creation</Text>
          </Pressable>
          <Pressable style={[styles.flowBtn, styles.flowBtnPrimary]} onPress={() => router.push(returnTo === 'assets-manage' ? '/assets-manage?flow=true' : '/recipients?flow=true')}>
            <Text style={styles.flowBtnTextPrimary}>{returnTo === 'assets-manage' ? 'Back to Assets' : 'Skip to Recipients'}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.goldForeground} />
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}