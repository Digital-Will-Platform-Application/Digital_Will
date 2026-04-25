import { useState, useEffect, useCallback } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';

const USD_TO_INR = 83;
function formatINR(value: number | null): string {
  if (value == null) return '—';
  const inr = value * USD_TO_INR;
  return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  property: 'home',
  vehicle: 'car',
  bank_account: 'card',
  investment: 'trending-up',
  jewelry: 'gift',
  digital_asset: 'phone-portrait',
  insurance: 'shield-checkmark',
  business: 'briefcase',
  other: 'folder-open',
};

type Asset = {
  id: string;
  name: string;
  category: string;
  estimated_value: number | null;
  description: string | null;
  documents_url: string | null;
};

type Allocation = { id: string; asset_id: string; recipient_id: string; recipient?: { full_name: string } };

export default function AssetsManageScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 20, paddingBottom: 48 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    backWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    back: { color: colors.mutedForeground, fontWeight: '500' },
    progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
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
    headerTitleBlock: { marginBottom: 16 },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.mutedForeground },
    headerButtonsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    manageRecipientsBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 0,
    },
    manageRecipientsText: { fontSize: 13, fontWeight: '600', color: colors.foreground },
    addAssetBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: radius.button,
      backgroundColor: colors.gold,
      minWidth: 0,
    },
    addAssetBtnText: { fontSize: 13, fontWeight: '600', color: colors.goldForeground },
    pillWrap: { marginBottom: 16 },
    pill: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999, backgroundColor: colors.gold },
    pillText: { fontSize: 14, fontWeight: '600', color: colors.goldForeground },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, gap: 8 },
    assetName: { fontSize: 16, fontWeight: '600', color: colors.foreground, flex: 1, minWidth: 0 },
    assetValue: { fontSize: 14, fontWeight: '600', color: colors.gold },
    assetCategory: { fontSize: 13, color: colors.mutedForeground, textTransform: 'capitalize', marginBottom: 4 },
    assetDesc: { fontSize: 13, color: colors.mutedForeground, marginBottom: 10 },
    cardActions: { gap: 8 },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    linkText: { fontSize: 14, color: colors.gold, fontWeight: '500' },
    linkTextSmall: { fontSize: 13, color: colors.gold, fontWeight: '500' },
    docRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    docName: { flex: 1, fontSize: 13, color: colors.mutedForeground, minWidth: 0 },
    docAction: { padding: 4 },
    assignedRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    assignedChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: colors.secondary, maxWidth: 120 },
    assignedChipText: { fontSize: 12, fontWeight: '500', color: colors.foreground },
    deleteBtn: { padding: 8, marginLeft: 4 },
    emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { ...typography.headingSection, color: colors.foreground, marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 20 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gold, paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.button },
    emptyBtnText: { fontSize: 16, fontWeight: '600', color: colors.goldForeground },
    flowNav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 10 },
    flowBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, minWidth: 0 },
    flowBtnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
    flowBtnText: { color: colors.foreground, fontWeight: '600', fontSize: 13 },
    flowBtnTextPrimary: { color: colors.goldForeground, fontWeight: '600', fontSize: 13 },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const insets = useSafeAreaInsets();
  const isFlowMode = params.flow === 'true';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchData = useCallback(async () => {
    if (!user) return;
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(userId)) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const assetsRes = await backendApi.getUserAssets(userId);
      const rows = assetsRes.data ?? [];
      setAssets(
        rows.map((a) => ({
          id: String(a.id),
          name: a.name,
          category: a.category || 'other',
          estimated_value: a.estimated_value,
          description: a.description ?? null,
          documents_url: (a as { documents_url?: string | null }).documents_url ?? null,
        })),
      );
      const allocRows = await backendApi
        .listAssetAllocations(userId)
        .then((r) => r.data ?? [])
        .catch(() => []);
      // allocations endpoint may include recipient join on some backends; keep it optional.
      setAllocations(
        allocRows.map((a: any) => ({
          id: String(a.id),
          asset_id: String(a.asset_id),
          recipient_id: String(a.recipient_id),
          recipient: a.recipient && typeof a.recipient === 'object'
            ? { full_name: String((a.recipient as any).full_name ?? '') }
            : undefined,
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (user && !loading) fetchData();
    }, [user, fetchData])
  );

  const getAssetAllocations = (assetId: string) => allocations.filter((a) => a.asset_id === assetId);
  const getCategoryIcon = (category: string) => CATEGORY_ICONS[category] || 'folder-open';

  const handleDeleteAsset = (asset: Asset) => {
    Alert.alert('Delete Asset', `Delete "${asset.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const userId = user ? parseInt(user.id, 10) : NaN;
            if (Number.isNaN(userId)) throw new Error('Invalid session');
            await backendApi.deleteAsset(parseInt(asset.id, 10), userId);
            setAssets((prev) => prev.filter((a) => a.id !== asset.id));
            setAllocations((prev) => prev.filter((a) => a.asset_id !== asset.id));
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete asset');
          }
        },
      },
    ]);
  };

  const handleUploadDocument = async (_assetId: string) => {
    Alert.alert(
      'Use the web app',
      'Attaching documents to assets is available on the web dashboard for now. Your assets still sync from the same backend.',
    );
  };

  const handleRemoveDocument = async (_assetId: string, _documentPath: string) => {
    Alert.alert(
      'Use the web app',
      'Removing asset documents is available on the web dashboard for now.',
    );
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.gold} />}
      >
      <Pressable onPress={() => router.back()} style={styles.backWrap}>
        <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        <Text style={styles.back}>{isFlowMode ? 'Back to Method Selection' : 'Back to Dashboard'}</Text>
      </Pressable>

      {isFlowMode && (
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={styles.progressStepWrap}>
              <View style={[styles.progressStep, step === 3 ? styles.progressActive : step < 3 ? styles.progressDone : null]}>
                {step < 3 ? <Ionicons name="checkmark" size={16} color={colors.primaryForeground} /> : <Text style={styles.progressNum}>{step}</Text>}
              </View>
              {step < 4 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>
      )}

      {/* Title and subtitle - full width for mobile */}
      <View style={styles.headerTitleBlock}>
        <Text style={styles.title}>Manage Your Assets</Text>
        <Text style={styles.subtitle}>Add assets and assign them to recipients.</Text>
      </View>

      {/* Manage Recipients + Add Asset - row that fits mobile */}
      <View style={styles.headerButtonsRow}>
        <Pressable style={styles.manageRecipientsBtn} onPress={() => router.push(isFlowMode ? '/recipients?flow=true' : '/recipients')}>
          <Ionicons name="people-outline" size={18} color={colors.foreground} />
          <Text style={styles.manageRecipientsText} numberOfLines={1}>Manage Recipients</Text>
        </Pressable>
        <Pressable style={styles.addAssetBtn} onPress={() => router.push(isFlowMode ? '/asset-add?flow=true&returnTo=assets-manage' : '/asset-add')}>
          <Ionicons name="add" size={18} color={colors.goldForeground} />
          <Text style={styles.addAssetBtnText}>Add Asset</Text>
        </Pressable>
      </View>

      <View style={styles.pillWrap}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>All Assets ({assets.length})</Text>
        </View>
      </View>

      {assets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="folder-open-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No assets yet</Text>
          <Text style={styles.emptySubtitle}>Start by adding your first asset.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push(isFlowMode ? '/asset-add?flow=true&returnTo=assets-manage' : '/asset-add')}>
            <Ionicons name="add" size={20} color={colors.goldForeground} />
            <Text style={styles.emptyBtnText}>Add Your First Asset</Text>
          </Pressable>
        </View>
      ) : (
        assets.map((asset) => {
          const assetAllocs = getAssetAllocations(asset.id);
          const hasAssigned = assetAllocs.length > 0;
          return (
            <View key={asset.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={getCategoryIcon(asset.category)} size={24} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.assetName} numberOfLines={1}>{asset.name}</Text>
                  <Text style={styles.assetValue} numberOfLines={1}>{formatINR(asset.estimated_value)}</Text>
                </View>
                <Text style={styles.assetCategory}>{asset.category.replace('_', ' ')}</Text>
                {asset.description ? <Text style={styles.assetDesc} numberOfLines={2}>{asset.description}</Text> : null}
                <View style={styles.cardActions}>
                  {asset.documents_url ? (
                    <View style={styles.docRow}>
                      <Ionicons name="document-text" size={16} color={colors.gold} />
                      <Text style={styles.docName} numberOfLines={1}>{asset.documents_url.split('/').pop()}</Text>
                      <Pressable onPress={() => handleRemoveDocument(asset.id, asset.documents_url!)} style={styles.docAction}>
                        <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.linkRow} onPress={() => handleUploadDocument(asset.id)}>
                      <Ionicons name="cloud-upload-outline" size={16} color={colors.gold} />
                      <Text style={styles.linkText}>Upload document (web)</Text>
                    </Pressable>
                  )}
                  {hasAssigned ? (
                    <View style={styles.assignedRow}>
                      <Ionicons name="people" size={16} color={colors.mutedForeground} />
                      {assetAllocs.map((a) => (
                        <View key={a.id} style={styles.assignedChip}>
                          <Text style={styles.assignedChipText} numberOfLines={1}>{a.recipient?.full_name || '—'}</Text>
                        </View>
                      ))}
                      <Pressable style={styles.linkRow} onPress={() => router.push({ pathname: '/assign-recipients', params: { assetId: asset.id } })}>
                        <Text style={styles.linkTextSmall}>Edit</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.linkRow} onPress={() => router.push({ pathname: '/assign-recipients', params: { assetId: asset.id } })}>
                      <Ionicons name="person-add" size={16} color={colors.gold} />
                      <Text style={styles.linkText}>Assign recipients</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => handleDeleteAsset(asset)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="trash-outline" size={22} color={colors.destructive} />
              </Pressable>
            </View>
          );
        })
      )}

      {isFlowMode && (
        <View style={styles.flowNav}>
          <Pressable style={styles.flowBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            <Text style={styles.flowBtnText}>Back</Text>
          </Pressable>
          <Pressable style={[styles.flowBtn, styles.flowBtnPrimary]} onPress={() => router.push('/recipients?flow=true')}>
            <Text style={styles.flowBtnTextPrimary}>Continue to Recipients</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.goldForeground} />
          </Pressable>
        </View>
      )}
      </ScrollView>
    </Screen>
  );
}