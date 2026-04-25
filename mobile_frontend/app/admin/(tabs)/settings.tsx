import { useCallback, useEffect, useMemo, useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { backendApi, SessionApiError, type AdminSubAdminRow } from '@/lib/backendApi';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSettingsScreen() {
  const { signOut } = useAuth();
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 24 },
    subtitle: { ...typography.body, color: colors.mutedForeground, marginBottom: 20 },
    card: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground },
    cardDesc: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16, lineHeight: 20 },
    label: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.input,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.background,
      marginBottom: 12,
    },
    hint: { fontSize: 12, color: colors.mutedForeground, marginBottom: 12 },
    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: radius.button,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.primaryForeground, fontWeight: '600', fontSize: 16 },
    errorText: { color: colors.destructive, fontSize: 14, marginTop: 8 },
    adminRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: 12,
      marginBottom: 10,
      backgroundColor: colors.background,
    },
    adminName: { color: colors.foreground, fontWeight: '600', marginBottom: 2 },
    adminMeta: { color: colors.mutedForeground, fontSize: 12 },
    removeBtn: {
      marginTop: 8,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.button,
      backgroundColor: colors.destructive,
    },
    removeBtnText: { color: colors.destructiveForeground, fontSize: 12, fontWeight: '600' },
  }));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<AdminSubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const canSave = useMemo(
    () => Boolean(fullName.trim() && email.trim() && password.trim().length >= 8),
    [email, fullName, password],
  );

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await backendApi.listSubAdmins();
      setAdmins(json.data?.admins ?? []);
    } catch (e) {
      if (e instanceof SessionApiError && e.status === 401) {
        await signOut();
        setError('Session expired. Please login again.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load admins.');
      }
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const handleCreateAdmin = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await backendApi.createSubAdmin({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setFullName('');
      setEmail('');
      setPassword('');
      await loadAdmins();
    } catch (e) {
      if (e instanceof SessionApiError && e.status === 401) {
        await signOut();
        setError('Session expired. Please login again.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to create admin.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    setError(null);
    try {
      await backendApi.deleteSubAdmin(id);
      await loadAdmins();
    } catch (e) {
      if (e instanceof SessionApiError && e.status === 401) {
        await signOut();
        setError('Session expired. Please login again.');
      } else {
        setError(e instanceof Error ? e.message : 'Failed to remove admin.');
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Create admins here. New admins will sign in and be redirected to the Admin Panel (same layout without Admin Settings).
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-add-outline" size={22} color={colors.foreground} />
          <Text style={styles.cardTitle}>Create admin</Text>
        </View>
        <Text style={styles.cardDesc}>
          Enter name, email, and password. A new account is created and added as Admin. When they log in with these credentials they are redirected to the Admin Panel (same as Super Admin except Admin Settings is hidden).
        </Text>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="Jane Doe"
          placeholderTextColor={colors.mutedForeground}
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="admin@example.com"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 8 chars, upper, lower, number, special"
          placeholderTextColor={colors.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text style={styles.hint}>Same rules as user signup (strong password, not leaked).</Text>
        <Pressable style={[styles.primaryBtn, !canSave && { opacity: 0.5 }]} onPress={() => void handleCreateAdmin()} disabled={!canSave || saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Creating...' : 'Save — Create admin'}</Text>
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={22} color={colors.foreground} />
          <Text style={styles.cardTitle}>Admins ({admins.length})</Text>
        </View>
        <Text style={styles.cardDesc}>Super Admin and created admins. Only Super Admin can add or remove.</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : admins.length === 0 ? (
          <Text style={styles.errorText}>No secondary admins yet.</Text>
        ) : (
          admins.map((admin) => (
            <View key={admin.id} style={styles.adminRow}>
              <Text style={styles.adminName}>{admin.username || 'Admin'}</Text>
              <Text style={styles.adminMeta}>{admin.email}</Text>
              <Text style={styles.adminMeta}>Added: {new Date(admin.created_at).toLocaleString()}</Text>
              <Pressable
                style={[styles.removeBtn, removingId === admin.id && { opacity: 0.6 }]}
                onPress={() => void handleRemove(admin.id)}
                disabled={removingId === admin.id}
              >
                <Text style={styles.removeBtnText}>
                  {removingId === admin.id ? 'Removing...' : 'Remove'}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}