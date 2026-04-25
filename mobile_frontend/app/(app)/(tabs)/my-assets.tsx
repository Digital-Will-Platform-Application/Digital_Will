import { useState, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

type Asset = { id: string; name: string; category: string; estimated_value: number | null };

function formatIndianNumber(n: number): string {
  const x = Math.round(Number.isFinite(n) ? n : 0);
  const sign = x < 0 ? '-' : '';
  const s = String(Math.abs(x));
  if (s.length <= 3) return `${sign}${s}`;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${sign}${parts.join(',')},${last3}`;
}

function formatINR(value: number): string {
  return `₹${formatIndianNumber(value)}`;
}

export default function MyAssetsTabScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    summary: { padding: 16, backgroundColor: colors.card, marginBottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
    summaryLabel: { color: colors.mutedForeground },
    summaryValue: { color: colors.foreground, fontWeight: '600', marginTop: 4 },
    list: { padding: 16, paddingBottom: 80 },
    card: { backgroundColor: colors.card, padding: 16, borderRadius: radius.card, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    name: { color: colors.foreground, fontWeight: '600', flex: 1 },
    assignBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    assignBtnText: { fontSize: 13, color: colors.gold, fontWeight: '600' },
    meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
    empty: { color: colors.mutedForeground, textAlign: 'center', marginTop: 24 },
    fab: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: colors.gold, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center' },
    fabText: { color: colors.goldForeground, fontWeight: '600' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  useLocalSearchParams<{ flow?: string }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssets = async () => {
    if (!user) return;
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(userId)) {
      setAssets([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await backendApi.getUserAssets(userId);
      const rows = res.data ?? [];
      setAssets(
        rows.map((a) => ({
          id: String(a.id),
          name: a.name,
          category: a.category || 'other',
          estimated_value: a.estimated_value == null ? null : Number(a.estimated_value),
        })),
      );
    } catch (e) {
      console.warn('fetchAssets', e);
      setAssets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAssets();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const totalValue = assets.reduce((s, a) => s + (Number.isFinite(a.estimated_value as number) ? (a.estimated_value as number) : 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total assets: {assets.length}</Text>
        <Text style={styles.summaryValue}>Total value: {formatINR(totalValue)}</Text>
      </View>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchAssets(); }} tintColor={colors.gold} />}
        ListEmptyComponent={<Text style={styles.empty}>No assets. Add from onboarding or dashboard.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{item.name}</Text>
              <Pressable
                style={styles.assignBtn}
                onPress={() => router.push({ pathname: '/assign-recipients', params: { assetId: item.id } })}
              >
                <Ionicons name="people" size={16} color={colors.gold} />
                <Text style={styles.assignBtnText}>Assign Recipients</Text>
              </Pressable>
            </View>
            <Text style={styles.meta}>{item.category} · {formatINR(item.estimated_value ?? 0)}</Text>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/asset-add')}>
        <Text style={styles.fabText}>Add Asset</Text>
      </Pressable>
    </View>
  );
}

