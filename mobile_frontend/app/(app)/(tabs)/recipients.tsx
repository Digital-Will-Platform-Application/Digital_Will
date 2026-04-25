import { useState, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

type Recipient = { id: string; full_name: string; email: string | null; phone: string | null; relationship: string | null; is_verified: boolean; image_url?: string | null };

export default function RecipientsTabScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: { marginBottom: 24 },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 4 },
    subtitle: { color: colors.mutedForeground },
    listContainer: { marginBottom: 24 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyTitle: { ...typography.headingSection, color: colors.foreground, marginTop: 16, marginBottom: 8, fontSize: 20 },
    emptySubtitle: { color: colors.mutedForeground, textAlign: 'center', maxWidth: 280 },
    card: { backgroundColor: colors.card, padding: 16, borderRadius: radius.card, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: colors.goldForeground, fontWeight: '600', fontSize: 18 },
    cardInfo: { flex: 1 },
    name: { color: colors.foreground, fontWeight: '600', fontSize: 16 },
    relationship: { color: colors.mutedForeground, fontSize: 14, marginTop: 2 },
    verifiedBadge: { marginLeft: 8 },
    cardContact: { gap: 4 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { color: colors.mutedForeground, fontSize: 14, flex: 1 },
    addBtn: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 14,
      borderRadius: radius.button,
    },
    addBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecipients = async () => {
    if (!user?.email) return;
    try {
      const res = await backendApi.getRecipientsByEmail(user.email);
      const rows = res.data ?? [];
      setRecipients(
        rows.map((r) => ({
          id: String(r.id),
          full_name: r.full_name,
          email: r.email,
          phone: r.phone,
          relationship: r.relationship,
          is_verified: Boolean(r.is_verified),
          image_url: r.image_url ?? null,
        })),
      );
    } catch (e) {
      console.warn('fetchRecipients', e);
      setRecipients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecipients(); }} tintColor={colors.gold} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipients</Text>
        <Text style={styles.subtitle}>Manage the people who will receive your legacy</Text>
      </View>

      {recipients.length > 0 ? (
        <View style={styles.listContainer}>
          <FlatList
            data={recipients}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.full_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    {item.relationship ? (
                      <Text style={styles.relationship}>{String(item.relationship)}</Text>
                    ) : null}
                  </View>
                  {item.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                  )}
                </View>
                <View style={styles.cardContact}>
                  {item.email ? (
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} />
                      <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
                    </View>
                  ) : null}
                  {item.phone ? (
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={14} color={colors.mutedForeground} />
                      <Text style={styles.contactText} numberOfLines={1}>{item.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No recipients yet</Text>
          <Text style={styles.emptySubtitle}>Add people who will receive your legacy assets and messages.</Text>
        </View>
      )}

      <Pressable style={styles.addBtn} onPress={() => router.push('/recipients/add')}>
        <Ionicons name="add" size={24} color={colors.goldForeground} />
        <Text style={styles.addBtnText}>Add Recipient</Text>
      </Pressable>
    </ScrollView>
  );
}