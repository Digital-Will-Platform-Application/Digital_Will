import { useCallback, useEffect, useMemo, useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { backendApi, SessionApiError, type AdminUserRow } from '@/lib/backendApi';
import { useAuth } from '@/hooks/useAuth';

type UserSort = 'newest' | 'name' | 'email';

export default function AdminUserManagementScreen() {
  const { signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 24 },
    subtitle: { ...typography.body, color: colors.mutedForeground, marginBottom: 12 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 16 },
    refreshText: { fontSize: 14, color: colors.foreground, fontWeight: '500' },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondary,
      borderRadius: radius.input,
      paddingHorizontal: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.foreground },
    panel: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    panelTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 12 },
    errorText: { color: colors.destructive, fontSize: 14 },
    userCard: {
      backgroundColor: colors.background,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 10,
    },
    userName: { fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    userMeta: { color: colors.mutedForeground, fontSize: 12, marginBottom: 2 },
    sortRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    sortChip: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    sortChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortChipText: { color: colors.foreground, fontSize: 12, fontWeight: '600' },
    sortChipTextActive: { color: colors.primaryForeground },
  }));

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<UserSort>('name');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await backendApi.getAdminUsers(sortBy);
      setUsers(json.data?.users ?? []);
    } catch (e) {
      if (e instanceof SessionApiError && e.status === 401) {
        await signOut();
        setError('Session expired. Please login again.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load users.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [signOut, sortBy]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((row) => {
      return (
        String(row.id).includes(q) ||
        row.username?.toLowerCase().includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        (row.mobile ?? '').toLowerCase().includes(q)
      );
    });
  }, [search, users]);

  const sortOptions: Array<{ key: UserSort; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'newest', label: 'Newest' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Manage and view all registered users</Text>
      <Pressable style={styles.refreshBtn} onPress={() => void loadUsers()} disabled={loading}>
        <Ionicons name="refresh" size={18} color={colors.foreground} />
        <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
      </Pressable>

      <View style={styles.sortRow}>
        {sortOptions.map((option) => {
          const isActive = option.key === sortBy;
          return (
            <Pressable
              key={option.key}
              style={[styles.sortChip, isActive && styles.sortChipActive]}
              onPress={() => setSortBy(option.key)}
            >
              <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name, email, mobile..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Users ({filteredUsers.length})</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredUsers.length === 0 ? (
          <Text style={styles.errorText}>No users found.</Text>
        ) : (
          filteredUsers.map((row) => (
            <View key={row.id} style={styles.userCard}>
              <Text style={styles.userName}>{row.username || 'Unknown user'}</Text>
              <Text style={styles.userMeta}>Email: {row.email || 'N/A'}</Text>
              <Text style={styles.userMeta}>Mobile: {row.mobile || 'N/A'}</Text>
              <Text style={styles.userMeta}>
                Joined: {row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}