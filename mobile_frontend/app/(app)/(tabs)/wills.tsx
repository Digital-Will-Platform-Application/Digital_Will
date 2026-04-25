import { useState, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

type Will = { id: string; title: string; status: string; type: string; updated_at: string };

export default function WillsScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    list: { padding: 16, paddingBottom: 80 },
    empty: { color: colors.mutedForeground, textAlign: 'center', marginTop: 24 },
    card: { backgroundColor: colors.card, padding: 16, borderRadius: radius.card, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    title: { color: colors.foreground, fontWeight: '600', fontSize: 16 },
    meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 4 },
    fab: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: colors.gold, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center' },
    fabText: { color: colors.goldForeground, fontWeight: '600' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const [wills, setWills] = useState<Will[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWills = async () => {
    if (!user) return;
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(userId)) {
      setWills([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await backendApi.listWills({ user_id: userId });
      const rows = res.data ?? [];
      const mapped: Will[] = rows
        .filter((w) => w.type !== 'chat')
        .map((w) => ({
          id: String(w.id),
          title: w.title || 'Untitled',
          status: w.status || 'draft',
          type: w.type || 'text',
          updated_at: w.updated_at || w.created_at,
        }));
      setWills(mapped);
    } catch (e) {
      console.warn('fetchWills', e);
      setWills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWills();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWills(); }} tintColor={colors.gold} />}
        ListEmptyComponent={<Text style={styles.empty}>No wills yet. Create one from Dashboard.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/will/${item.id}`)}>
            <Text style={styles.title}>{item.title || 'Untitled'}</Text>
            <Text style={styles.meta}>{item.status} · {item.type}</Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/create')}>
        <Text style={styles.fabText}>+ Create Will</Text>
      </Pressable>
    </View>
  );
}