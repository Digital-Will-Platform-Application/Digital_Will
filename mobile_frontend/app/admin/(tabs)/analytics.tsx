import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { backendApi, SessionApiError, type AdminStats } from '@/lib/backendApi';
import { useAuth } from '@/hooks/useAuth';

export default function AdminAnalyticsScreen() {
  const { signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 24 },
    subtitle: { ...typography.body, color: colors.mutedForeground, marginBottom: 12 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 16 },
    refreshText: { fontSize: 14, color: colors.foreground, fontWeight: '500' },
    cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    periodCard: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 4 },
    periodSub: { fontSize: 12, color: colors.mutedForeground, marginBottom: 8 },
    periodStat: { fontSize: 13, color: colors.foreground },
    card: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      gap: 8,
    },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.foreground },
    cardStat: { fontSize: 13, color: colors.foreground },
    positive: { color: colors.success },
    negative: { color: colors.destructive },
    panel: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    panelTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 12 },
    tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    th: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.mutedForeground },
    td: { flex: 1, fontSize: 13, color: colors.foreground },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: radius.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.foreground,
      marginBottom: 12,
    },
    errorText: { color: colors.destructive, fontSize: 13, marginTop: 8 },
  }));

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupDate, setLookupDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [lookupCount, setLookupCount] = useState<number | null>(null);

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
        setError(e instanceof Error ? e.message : 'Failed to load analytics.');
      }
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  const loadLookup = useCallback(async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lookupDate)) {
      setLookupCount(null);
      return;
    }
    setLookupLoading(true);
    try {
      const json = await backendApi.getAdminRegistrationsOnDate(lookupDate);
      setLookupCount(typeof json.data?.count === 'number' ? json.data.count : 0);
    } catch (e) {
      if (e instanceof SessionApiError && e.status === 401) {
        await signOut();
      }
      setLookupCount(null);
    } finally {
      setLookupLoading(false);
    }
  }, [lookupDate, signOut]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadLookup();
  }, [loadLookup]);

  const monthCount = useMemo(() => stats?.usersThisMonth ?? 0, [stats?.usersThisMonth]);
  const weekCount = useMemo(() => stats?.usersThisWeek ?? 0, [stats?.usersThisWeek]);
  const todayCount = useMemo(() => stats?.usersToday ?? 0, [stats?.usersToday]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Logins and signups by period with comparison.</Text>
      <Pressable style={styles.refreshBtn} onPress={() => void loadStats()} disabled={loading}>
        <Ionicons name="refresh" size={18} color={colors.foreground} />
        <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
      </Pressable>

      <View style={styles.cardsRow}>
        <View style={styles.periodCard}>
          <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
          <Text style={styles.periodTitle}>1 Day</Text>
          <Text style={styles.periodSub}>Today (UTC)</Text>
          <Text style={styles.periodStat}>New signups: {todayCount}</Text>
        </View>
        <View style={styles.periodCard}>
          <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
          <Text style={styles.periodTitle}>1 Week</Text>
          <Text style={styles.periodSub}>This week (UTC)</Text>
          <Text style={styles.periodStat}>New signups: {weekCount}</Text>
        </View>
        <View style={styles.periodCard}>
          <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
          <Text style={styles.periodTitle}>1 Month</Text>
          <Text style={styles.periodSub}>This month (UTC)</Text>
          <Text style={styles.periodStat}>New signups: {monthCount}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="bar-chart-outline" size={20} color={colors.mutedForeground} />
        <Text style={styles.cardTitle}>This week vs last week</Text>
        <Text style={styles.cardStat}>New signups: {weekCount}</Text>
      </View>
      <View style={styles.card}>
        <Ionicons name="bar-chart-outline" size={20} color={colors.mutedForeground} />
        <Text style={styles.cardTitle}>This month vs last month</Text>
        <Text style={[styles.cardStat, monthCount > 0 ? styles.positive : styles.negative]}>
          New signups: {monthCount}
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Report summary</Text>
        <TextInput
          style={styles.dateInput}
          value={lookupDate}
          onChangeText={setLookupDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
        />
        <Text style={styles.td}>
          Selected date registrations:{' '}
          {lookupLoading ? 'Loading...' : (lookupCount == null ? '—' : lookupCount)}
        </Text>
        <View style={styles.tableRow}>
          <Text style={styles.th}>Period</Text>
          <Text style={styles.th}>New signups</Text>
          <Text style={styles.th}>Comparison</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.td}>1 Day</Text>
          <Text style={styles.td}>{todayCount}</Text>
          <Text style={styles.td}>—</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.td}>1 Week</Text>
          <Text style={styles.td}>{weekCount}</Text>
          <Text style={[styles.td, styles.negative]}>vs last week</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.td}>1 Month</Text>
          <Text style={styles.td}>{monthCount}</Text>
          <Text style={[styles.td, monthCount > 0 ? styles.positive : styles.negative]}>
            {monthCount > 0 ? 'Growth' : 'No change'}
          </Text>
        </View>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}