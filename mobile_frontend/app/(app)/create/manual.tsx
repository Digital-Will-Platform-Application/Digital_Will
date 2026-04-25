import { useMemo, useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';

type Step = 1 | 2 | 3 | 4;

type AssetRow = { id: string; category: string; details: string; estimatedValue: string };
type RecipientRow = { id: string; name: string; email: string; phone: string };

const makeId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function CreateManualWillScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24 },
    backWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    back: { color: colors.mutedForeground, fontWeight: '500', fontSize: 15 },
    stepBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 9999,
      backgroundColor: colors.sage + '40',
      marginBottom: 14,
    },
    stepBadgeText: { fontSize: 14, fontWeight: '600', color: colors.foreground },
    title: { ...typography.headingSection, color: colors.foreground, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.mutedForeground, textAlign: 'center', lineHeight: 22, marginBottom: 18, paddingHorizontal: 8 },
    card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 12 },
    label: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: 12, fontSize: 16, color: colors.foreground, backgroundColor: colors.background, marginBottom: 12 },
    textarea: { minHeight: 88, textAlignVertical: 'top' as any },
    row2: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    block: { backgroundColor: colors.background, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 12 },
    blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    blockTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.button, alignSelf: 'flex-start' },
    outlineBtnText: { color: colors.foreground, fontWeight: '600' },
    previewBox: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: radius.card, padding: 12, marginBottom: 12 },
    previewText: { color: colors.foreground, fontSize: 13, lineHeight: 18 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.gold, paddingVertical: 16, paddingHorizontal: 24, borderRadius: radius.button },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.goldForeground },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [workStatus, setWorkStatus] = useState('');

  // Step 2
  const [assets, setAssets] = useState<AssetRow[]>([{ id: makeId(), category: '', details: '', estimatedValue: '' }]);

  // Step 3
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);

  const canNext = useMemo(() => {
    if (step === 1) return fullName.trim().length > 1;
    if (step === 2) return assets.some((a) => (a.category.trim() || a.details.trim()));
    if (step === 3) return recipients.length > 0;
    return true;
  }, [step, fullName, assets, recipients.length]);

  const buildContent = () => {
    const lines: string[] = [];
    lines.push(`Manual Will - ${fullName.trim() || 'Manual Will'}`);
    lines.push('');
    lines.push('Step 1 - Personal Details');
    lines.push(`Full name: ${fullName.trim()}`);
    if (gender.trim()) lines.push(`Gender: ${gender.trim()}`);
    if (age.trim()) lines.push(`Age: ${age.trim()}`);
    if (dateOfBirth.trim()) lines.push(`Date of Birth: ${dateOfBirth.trim()}`);
    if (maritalStatus.trim()) lines.push(`Marital Status: ${maritalStatus.trim()}`);
    if (workStatus.trim()) lines.push(`Current Status: ${workStatus.trim()}`);
    lines.push('');
    lines.push('Step 2 - Assets');
    assets.forEach((a, idx) => {
      if (!(a.category.trim() || a.details.trim() || a.estimatedValue.trim())) return;
      lines.push(`${idx + 1}. ${a.category.trim() || 'Asset'} | ${a.details.trim() || '—'} | Value: ${a.estimatedValue.trim() || '—'}`);
    });
    lines.push('');
    lines.push('Step 3 - Recipients');
    recipients.forEach((r, idx) => {
      lines.push(`${idx + 1}. ${r.name.trim()} | ${r.email.trim() || '—'} | ${r.phone.trim() || '—'}`);
    });
    lines.push('');
    lines.push('Notes: Manual 4-step form submission (mobile)');
    return lines.join('\n').trim();
  };

  const addAsset = () => setAssets((prev) => [...prev, { id: makeId(), category: '', details: '', estimatedValue: '' }]);
  const removeAsset = (id: string) => setAssets((prev) => prev.filter((a) => a.id !== id));
  const updateAsset = (id: string, patch: Partial<AssetRow>) =>
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const addRecipient = () => setRecipients((prev) => [...prev, { id: makeId(), name: '', email: '', phone: '' }]);
  const removeRecipient = (id: string) => setRecipients((prev) => prev.filter((r) => r.id !== id));
  const updateRecipient = (id: string, patch: Partial<RecipientRow>) =>
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const goNext = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const handleSave = async () => {
    if (!user?.email) {
      Alert.alert('Sign in required', 'Please sign in to continue.');
      return;
    }
    const content = buildContent();
    if (content.length < 30) {
      Alert.alert('More details needed', 'Please add more details in the manual form (at least 30 characters).');
      return;
    }
    setSaving(true);
    const res = await backendApi.saveWill({
      user_email: user.email,
      title: 'Manual Will',
      transcript: content,
      content,
      type: 'text',
    });
    setSaving(false);
    if (!res.success) {
      Alert.alert('Error', res.message || res.error || 'Failed to save manual will');
      return;
    }
    Alert.alert('Saved', 'Your manual will has been saved.');
    router.replace('/(app)/(tabs)/wills');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => (step === 1 ? router.back() : goBack())} style={styles.backWrap}>
        <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        <Text style={styles.back}>Back</Text>
      </Pressable>

      <View style={styles.stepBadge}>
        <Ionicons name="sparkles" size={18} color={colors.gold} />
        <Text style={styles.stepBadgeText}>Step {step} of 4</Text>
      </View>

      <Text style={styles.title}>Manual Form Will</Text>
      <Text style={styles.subtitle}>Fill structured fields and we’ll save your will as text.</Text>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
          <Text style={styles.cardSubtitle}>Enter your details (as per official ID where possible).</Text>
          <Text style={styles.label}>Full name</Text>
          <TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholder="Full name" placeholderTextColor={colors.mutedForeground} />
          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={styles.label}>Gender</Text>
              <TextInput value={gender} onChangeText={setGender} style={styles.input} placeholder="Gender" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Age</Text>
              <TextInput value={age} onChangeText={setAge} style={styles.input} placeholder="Age" keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} />
          <Text style={styles.label}>Marriage Status</Text>
          <TextInput value={maritalStatus} onChangeText={setMaritalStatus} style={styles.input} placeholder="Single/Married/..." placeholderTextColor={colors.mutedForeground} />
          <Text style={styles.label}>Current Status</Text>
          <TextInput value={workStatus} onChangeText={setWorkStatus} style={styles.input} placeholder="Working/Retired/..." placeholderTextColor={colors.mutedForeground} />
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assets</Text>
          <Text style={styles.cardSubtitle}>Add assets you want to include in your will.</Text>
          {assets.map((a, idx) => (
            <View key={a.id} style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Asset {idx + 1}</Text>
                {assets.length > 1 && (
                  <Pressable onPress={() => removeAsset(a.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.label}>Asset Type</Text>
              <TextInput value={a.category} onChangeText={(v) => updateAsset(a.id, { category: v })} style={styles.input} placeholder="Property / Bank / Gold..." placeholderTextColor={colors.mutedForeground} />
              <Text style={styles.label}>Asset Details</Text>
              <TextInput value={a.details} onChangeText={(v) => updateAsset(a.id, { details: v })} style={[styles.input, styles.textarea]} multiline placeholder="Write details..." placeholderTextColor={colors.mutedForeground} />
              <Text style={styles.label}>Estimated Value (Optional)</Text>
              <TextInput value={a.estimatedValue} onChangeText={(v) => updateAsset(a.id, { estimatedValue: v })} style={styles.input} placeholder="e.g. 500000" keyboardType="number-pad" placeholderTextColor={colors.mutedForeground} />
            </View>
          ))}
          <Pressable style={styles.outlineBtn} onPress={addAsset}>
            <Ionicons name="add" size={18} color={colors.foreground} />
            <Text style={styles.outlineBtnText}>Add another asset</Text>
          </Pressable>
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recipients</Text>
          <Text style={styles.cardSubtitle}>Add the people who will receive your assets.</Text>
          {recipients.length === 0 && (
            <Pressable style={styles.outlineBtn} onPress={addRecipient}>
              <Ionicons name="add" size={18} color={colors.foreground} />
              <Text style={styles.outlineBtnText}>Add recipient</Text>
            </Pressable>
          )}
          {recipients.map((r, idx) => (
            <View key={r.id} style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Recipient {idx + 1}</Text>
                <Pressable onPress={() => removeRecipient(r.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                </Pressable>
              </View>
              <Text style={styles.label}>Full name</Text>
              <TextInput value={r.name} onChangeText={(v) => updateRecipient(r.id, { name: v })} style={styles.input} placeholder="Recipient name" placeholderTextColor={colors.mutedForeground} />
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput value={r.email} onChangeText={(v) => updateRecipient(r.id, { email: v })} style={styles.input} placeholder="recipient@email.com" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" />
              <Text style={styles.label}>Mobile (Optional)</Text>
              <TextInput value={r.phone} onChangeText={(v) => updateRecipient(r.id, { phone: v })} style={styles.input} placeholder="+91 9876543210" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" />
            </View>
          ))}
          {recipients.length > 0 && (
            <Pressable style={styles.outlineBtn} onPress={addRecipient}>
              <Ionicons name="add" size={18} color={colors.foreground} />
              <Text style={styles.outlineBtnText}>Add another recipient</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === 4 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review</Text>
          <Text style={styles.cardSubtitle}>Confirm details before saving.</Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{buildContent()}</Text>
          </View>
          <Pressable style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={colors.goldForeground} /> : <Ionicons name="save-outline" size={18} color={colors.goldForeground} />}
            <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Manual Will'}</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom navigation */}
      {step < 4 && (
        <Pressable
          style={[styles.primaryBtn, (!canNext || saving) && styles.primaryBtnDisabled]}
          onPress={goNext}
          disabled={!canNext || saving}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.goldForeground} />
        </Pressable>
      )}
    </ScrollView>
  );
}