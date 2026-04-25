import { useState, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/ui/Screen';

type Recipient = { id: string; full_name: string; email: string | null; phone: string | null; relationship: string | null; is_verified: boolean; image_url?: string | null };

const RELATIONSHIPS = ['Spouse', 'Child', 'Sibling', 'Parent', 'Friend', 'Charity', 'Other'];

export default function RecipientsScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 16, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    header: { marginBottom: 16 },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { color: colors.gold, fontWeight: '600', marginLeft: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
    titleBlock: { flex: 1, minWidth: 0 },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 4 },
    subtitle: { color: colors.mutedForeground, fontSize: 14 },
    addRecipientBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.gold,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: radius.button,
    },
    addRecipientBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 14 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
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
    list: { paddingBottom: 16 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyTitle: { ...typography.headingSection, color: colors.foreground, marginTop: 16, marginBottom: 8, fontSize: 20 },
    emptySubtitle: { color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
    emptyAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: radius.button,
    },
    emptyAddBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    card: { backgroundColor: colors.card, padding: 16, borderRadius: radius.card, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    cardLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText: { color: colors.primaryForeground, fontWeight: '600', fontSize: 18 },
    cardInfo: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
    name: { color: colors.foreground, fontWeight: '600', fontSize: 16 },
    relationshipInline: { color: colors.mutedForeground, fontSize: 14 },
    cardContact: { gap: 4, marginTop: 6 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { color: colors.mutedForeground, fontSize: 14, flex: 1 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    sendVerificationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    sendVerificationText: { color: colors.gold, fontWeight: '600', fontSize: 13 },
    actionBtn: { padding: 8, borderRadius: 6 },
    flowNav: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24, gap: 10 },
    flowBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, minWidth: 0 },
    flowBtnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
    flowBtnText: { color: colors.foreground, fontWeight: '600', fontSize: 13 },
    flowBtnTextPrimary: { color: colors.goldForeground, fontWeight: '600', fontSize: 13 },
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: colors.card, borderRadius: radius.card, padding: 24, width: '90%', maxWidth: 400 },
    modalTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: 12, marginBottom: 12, color: colors.foreground, backgroundColor: colors.background },
    label: { color: colors.foreground, fontWeight: '600', marginBottom: 8 },
    relationshipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    chipText: { color: colors.foreground, fontSize: 14 },
    chipTextActive: { color: colors.goldForeground },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.button, alignItems: 'center' },
    modalBtnSecondary: { borderWidth: 1, borderColor: colors.border },
    modalBtnPrimary: { backgroundColor: colors.gold },
    modalBtnDisabled: { opacity: 0.6 },
    modalBtnTextSecondary: { color: colors.foreground, fontWeight: '600' },
    modalBtnTextPrimary: { color: colors.goldForeground, fontWeight: '600' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isFlowMode = params.flow === 'true';

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingVerificationId, setSendingVerificationId] = useState<string | null>(null);
  const [newRecipient, setNewRecipient] = useState({
    full_name: '',
    email: '',
    phone: '',
    relationship: '',
  });

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
      console.error('Error fetching recipients:', e);
      Alert.alert('Error', 'Failed to load recipients');
      setRecipients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchRecipients();
  }, [user]);

  const handleSaveRecipient = async () => {
    if (!user?.email) return;
    if (!newRecipient.full_name.trim()) {
      Alert.alert('Required', 'Please enter full name.');
      return;
    }

    setSaving(true);
    try {
      if (editingRecipient) {
        await backendApi.updateRecipient(parseInt(editingRecipient.id, 10), {
          user_email: user.email,
          full_name: newRecipient.full_name.trim(),
          email: newRecipient.email.trim() || undefined,
          phone: newRecipient.phone.trim() || undefined,
          relationship: newRecipient.relationship || undefined,
        });
        Alert.alert('Success', 'Recipient updated successfully.');
      } else {
        await backendApi.addRecipient({
          user_email: user.email,
          full_name: newRecipient.full_name.trim(),
          email: newRecipient.email.trim() || undefined,
          phone: newRecipient.phone.trim() || undefined,
          relationship: newRecipient.relationship || undefined,
        });
        Alert.alert('Success', 'Recipient added successfully.');
      }

      setShowAddModal(false);
      setEditingRecipient(null);
      setNewRecipient({ full_name: '', email: '', phone: '', relationship: '' });
      fetchRecipients();
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save recipient');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipient = async (recipient: Recipient) => {
    Alert.alert(
      'Delete Recipient',
      `Are you sure you want to delete ${recipient.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.email) return;
              await backendApi.deleteRecipient(parseInt(recipient.id, 10), { user_email: user.email });
              fetchRecipients();
            } catch (error: unknown) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete recipient');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setNewRecipient({
      full_name: recipient.full_name,
      email: recipient.email || '',
      phone: recipient.phone || '',
      relationship: recipient.relationship || '',
    });
    setShowAddModal(true);
  };

  const sendVerificationEmail = async (recipientId: string) => {
    setSendingVerificationId(recipientId);
    try {
      Alert.alert(
        'Verification email',
        'Sending recipient verification from the mobile app is not wired to the API yet. Use the web app to send verification emails.',
      );
    } finally {
      setSendingVerificationId(null);
    }
  };

  const handleBack = () => {
    if (isFlowMode) router.push('/assets-manage?flow=true');
    else router.replace('/dashboard');
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecipients(); }} tintColor={colors.gold} />}
      >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gold} />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Add Recipients</Text>
            <Text style={styles.subtitle}>Specify who will receive your assets and messages.</Text>
          </View>
          <Pressable style={styles.addRecipientBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="person-add" size={20} color={colors.goldForeground} />
            <Text style={styles.addRecipientBtnText}>Add Recipient</Text>
          </Pressable>
        </View>
      </View>

      {/* Progress Indicator - Only show in flow mode (4 steps, step 3 = Recipients) */}
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

      {/* Recipients List */}
      {recipients.length > 0 ? (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.full_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.full_name}</Text>
                      {item.relationship ? (
                        <Text style={styles.relationshipInline}> {item.relationship}</Text>
                      ) : null}
                    </View>
                    <View style={styles.cardContact}>
                      {item.email ? (
                        <View style={styles.contactRow}>
                          <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} />
                          <Text style={styles.contactText}>{item.email}</Text>
                        </View>
                      ) : null}
                      {item.phone ? (
                        <View style={styles.contactRow}>
                          <Ionicons name="call-outline" size={14} color={colors.mutedForeground} />
                          <Text style={styles.contactText}>{item.phone}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {!item.is_verified && item.email ? (
                    <Pressable
                      style={styles.sendVerificationBtn}
                      onPress={() => sendVerificationEmail(item.id)}
                      disabled={sendingVerificationId === item.id}
                    >
                      {sendingVerificationId === item.id ? (
                        <ActivityIndicator size="small" color={colors.gold} />
                      ) : (
                        <>
                          <Ionicons name="mail-outline" size={16} color={colors.gold} />
                          <Text style={styles.sendVerificationText}>Send Verification</Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => openEditModal(item)} style={styles.actionBtn} hitSlop={8}>
                    <Ionicons name="pencil" size={20} color={colors.mutedForeground} />
                  </Pressable>
                  <Pressable onPress={() => handleDeleteRecipient(item)} style={styles.actionBtn} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No recipients yet</Text>
          <Text style={styles.emptySubtitle}>Add your first recipient to get started</Text>
          <Pressable style={styles.emptyAddBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="person-add" size={20} color={colors.goldForeground} />
            <Text style={styles.emptyAddBtnText}>Add Recipient</Text>
          </Pressable>
        </View>
      )}

      {/* Flow Navigation */}
      {isFlowMode && (
        <View style={styles.flowNav}>
          <Pressable style={styles.flowBtn} onPress={() => router.push('/assets-manage?flow=true')}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            <Text style={styles.flowBtnText}>Back to Assets</Text>
          </Pressable>
          <Pressable style={[styles.flowBtn, styles.flowBtnPrimary]} onPress={() => router.push('/review')}>
            <Text style={styles.flowBtnTextPrimary}>Review Will</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.goldForeground} />
          </Pressable>
        </View>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={colors.mutedForeground}
              value={newRecipient.full_name}
              onChangeText={(text) => setNewRecipient({ ...newRecipient, full_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.mutedForeground}
              value={newRecipient.email}
              onChangeText={(text) => setNewRecipient({ ...newRecipient, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor={colors.mutedForeground}
              value={newRecipient.phone}
              onChangeText={(text) => setNewRecipient({ ...newRecipient, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Relationship</Text>
            <View style={styles.relationshipGrid}>
              {RELATIONSHIPS.map((rel) => (
                <Pressable
                  key={rel}
                  style={[styles.chip, newRecipient.relationship === rel && styles.chipActive]}
                  onPress={() => setNewRecipient({ ...newRecipient, relationship: rel })}
                >
                  <Text style={[styles.chipText, newRecipient.relationship === rel && styles.chipTextActive]}>
                    {rel}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingRecipient(null);
                  setNewRecipient({ full_name: '', email: '', phone: '', relationship: '' });
                }}
              >
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary, saving && styles.modalBtnDisabled]}
                onPress={handleSaveRecipient}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.goldForeground} size="small" />
                ) : (
                  <Text style={styles.modalBtnTextPrimary}>
                    {editingRecipient ? 'Update' : 'Add'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
      </ScrollView>
    </Screen>
  );
}