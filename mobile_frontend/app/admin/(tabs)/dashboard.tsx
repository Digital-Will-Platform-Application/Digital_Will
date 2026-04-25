import { useCallback, useEffect, useMemo, useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { backendApi, SessionApiError } from '@/lib/backendApi';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboardScreen() {
  const { signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 24 },
    subtitle: { ...typography.body, color: colors.mutedForeground, marginBottom: 12 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 16, padding: 6 },
    refreshText: { fontSize: 14, color: colors.foreground, fontWeight: '500' },
    cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statLabel: { fontSize: 12, color: colors.mutedForeground, marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: '600', color: colors.foreground },
    panel: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    panelTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 4 },
    panelSubtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 12 },
    errorText: { color: colors.destructive, fontSize: 14, marginTop: 8 },
    periodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
    periodLabel: { color: colors.mutedForeground, fontSize: 13 },
    periodValue: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  }));

  const [stats, setStats] = useState<{
    totalUsers: number;
    usersToday: number;
    totalAssets: number;
    assetsToday: number;
    usersThisWeek?: number;
    usersThisMonth?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await backendApi.getAdminStats();
      setStats(json.data ?? null);
    } catch (e) {
      if (e instanceof SessionApiError && e.status === 401) {
        await signOut();
        setError('Session expired. Please login again.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load admin stats.');
      }
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const periodRows = useMemo(
    () => [
      { label: 'Today registrations', value: stats?.usersToday ?? 0 },
      { label: 'This week registrations', value: stats?.usersThisWeek ?? 0 },
      { label: 'This month registrations', value: stats?.usersThisMonth ?? 0 },
      { label: 'Assets added today', value: stats?.assetsToday ?? 0 },
    ],
    [stats],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Overview of users, logins, and signups.</Text>
      <Pressable style={styles.refreshBtn} onPress={() => void loadStats()} disabled={loading}>
        <Ionicons name="refresh" size={18} color={colors.foreground} />
        <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
      </Pressable>

      <View style={styles.cardsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total registered users</Text>
          <Text style={styles.statValue}>{loading ? '...' : (stats?.totalUsers ?? 0)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>New users today</Text>
          <Text style={styles.statValue}>{loading ? '...' : (stats?.usersToday ?? 0)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total assets</Text>
          <Text style={styles.statValue}>{loading ? '...' : (stats?.totalAssets ?? 0)}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Admin summary</Text>
        <Text style={styles.panelSubtitle}>Live counts from backend stats endpoint.</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          periodRows.map((row) => (
            <View key={row.label} style={styles.periodRow}>
              <Text style={styles.periodLabel}>{row.label}</Text>
              <Text style={styles.periodValue}>{row.value}</Text>
            </View>
          ))
        )}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}