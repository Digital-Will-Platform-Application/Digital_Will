import { useState, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

type Asset = { id: string; name: string; category: string; estimated_value: number | null };
type Recipient = { id: string; full_name: string; email: string | null; relationship: string | null };
export default function AssignRecipientsScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    backText: { color: colors.gold, fontWeight: '600' },
    header: { marginBottom: 24 },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 4 },
    subtitle: { fontSize: 16, color: colors.mutedForeground, marginBottom: 8 },
    hint: { fontSize: 14, color: colors.mutedForeground },
    list: { gap: 12, marginBottom: 24 },
    recipientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    recipientRowSelected: { borderColor: colors.gold },
    recipientInfo: { flex: 1 },
    recipientName: { fontSize: 16, fontWeight: '600', color: colors.foreground },
    recipientMeta: { fontSize: 13, color: colors.mutedForeground, marginTop: 2, textTransform: 'capitalize' },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: colors.gold, borderColor: colors.gold },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 14,
      borderRadius: radius.button,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginTop: 16 },
    emptyDesc: { fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' },
    btnGold: {
      backgroundColor: colors.gold,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: radius.button,
      marginTop: 20,
    },
    btnGoldText: { color: colors.goldForeground, fontWeight: '600' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assetId || !user?.email) return;
    const aid = parseInt(String(assetId), 10);
    if (Number.isNaN(aid)) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const [assetRes, recRes] = await Promise.all([
          backendApi.getAssetById(aid),
          backendApi.getRecipientsByEmail(user.email!),
        ]);
        const row = assetRes.data;
        if (row) {
          setAsset({
            id: String(row.id),
            name: row.name,
            category: row.category || 'other',
            estimated_value: row.estimated_value,
          });
        }
        const rrows = recRes.data ?? [];
        setRecipients(
          rrows.map((r) => ({
            id: String(r.id),
            full_name: r.full_name,
            email: r.email,
            relationship: r.relationship,
          })),
        );
        setSelectedIds(new Set());
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [assetId, user]);

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!assetId || !user || selectedIds.size === 0) {
      Alert.alert('Select at least one recipient');
      return;
    }
    setSaving(true);
    try {
      Alert.alert(
        'Use the web app',
        'Saving asset-to-recipient allocations is not in the mobile API yet. Assign recipients from the web dashboard; your data uses the same backend.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !asset) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (recipients.length === 0) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No recipients yet</Text>
          <Text style={styles.emptyDesc}>Add recipients first, then assign them to this asset.</Text>
          <Pressable style={styles.btnGold} onPress={() => router.push('/recipients')}>
            <Text style={styles.btnGoldText}>Add Recipients</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.gold} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.title}>Assign Recipients</Text>
        <Text style={styles.subtitle}>{asset.name}</Text>
        <Text style={styles.hint}>Select who should receive this asset. They will get equal shares.</Text>
      </View>
      <View style={styles.list}>
        {recipients.map((r) => {
          const isSelected = selectedIds.has(r.id);
          return (
            <Pressable
              key={r.id}
              style={[styles.recipientRow, isSelected && styles.recipientRowSelected]}
              onPress={() => toggleRecipient(r.id)}
            >
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>{r.full_name}</Text>
                {r.relationship ? (
                  <Text style={styles.recipientMeta}>{r.relationship}</Text>
                ) : null}
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Ionicons name="checkmark" size={18} color={colors.goldForeground} />}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[styles.saveBtn, (saving || selectedIds.size === 0) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving || selectedIds.size === 0}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.goldForeground} />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color={colors.goldForeground} />
            <Text style={styles.saveBtnText}>Save allocations</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}