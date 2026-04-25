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
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

interface Will {
  id: string;
  title: string;
  type: 'audio' | 'video' | 'text' | 'chat';
  status: string;
  content: string | null;
  audio_url: string | null;
  video_url: string | null;
  transcript: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  estimated_value: number | null;
  description: string | null;
  documents_url: string | null;
}

interface Recipient {
  id: string;
  full_name: string;
  email: string | null;
  relationship: string | null;
  is_verified: boolean;
}

interface Allocation {
  id: string;
  asset_id: string;
  recipient_id: string;
  allocation_percentage: number;
}

export default function ReviewWillScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  
    backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    backText: { color: colors.gold, fontWeight: '600' },
  
    progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    progressStep: { flexDirection: 'row', alignItems: 'center' },
    progressCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressActive: { backgroundColor: colors.gold },
    progressNumber: { fontSize: 14, fontWeight: '600', color: colors.foreground },
    progressLine: { width: 32, height: 2, backgroundColor: colors.gold, marginHorizontal: 4 },
  
    header: { alignItems: 'center', marginBottom: 32 },
    headerIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: { ...typography.headingSection, color: colors.foreground, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  
    sectionsList: { gap: 16, marginBottom: 24 },
  
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    sectionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    sectionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    sectionInfo: { flex: 1 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 2 },
    sectionDetails: { fontSize: 12, color: colors.mutedForeground },
    sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusComplete: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusTextComplete: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    statusPending: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusTextPending: { fontSize: 12, color: colors.gold, fontWeight: '500' },
  
    sectionContent: { padding: 16, paddingTop: 0 },
  
    willDetails: { gap: 8 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: 14, color: colors.mutedForeground },
    detailValue: { fontSize: 14, color: colors.foreground, fontWeight: '500' },
    transcriptSection: { marginTop: 12 },
    transcriptLabel: { fontSize: 14, color: colors.mutedForeground, marginBottom: 4 },
    transcriptText: { fontSize: 14, color: colors.foreground, backgroundColor: colors.secondary, padding: 12, borderRadius: 8, lineHeight: 20 },
  
    emptySection: { alignItems: 'center', paddingVertical: 24 },
    emptyText: { fontSize: 14, color: colors.mutedForeground, marginBottom: 12, textAlign: 'center' },
    emptyButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.secondary, borderRadius: radius.button },
    emptyButtonText: { fontSize: 14, color: colors.foreground, fontWeight: '500' },
  
    assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    assetInfo: { flex: 1 },
    assetName: { fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 2 },
    assetCategory: { fontSize: 12, color: colors.mutedForeground, textTransform: 'capitalize', marginBottom: 2 },
    assetValue: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    assetRecipients: { alignItems: 'flex-end' },
    recipientTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
    recipientTag: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    recipientTagText: { fontSize: 10, color: colors.foreground },
    moreRecipients: { fontSize: 10, color: colors.mutedForeground },
    noAllocation: { fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic' },
  
    recipientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    recipientInfo: { flex: 1 },
    recipientName: { fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 2 },
    recipientRelationship: { fontSize: 12, color: colors.mutedForeground, textTransform: 'capitalize', marginBottom: 2 },
    recipientEmail: { fontSize: 12, color: colors.mutedForeground },
    recipientStatus: { alignItems: 'flex-end' },
    verifiedStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    verifiedText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    pendingText: { fontSize: 12, color: colors.mutedForeground },
  
    securityCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.secondary,
      padding: 16,
      borderRadius: radius.card,
      marginBottom: 24,
    },
    securityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityContent: { flex: 1 },
    securityTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    securityText: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  
    agreementContainer: { marginBottom: 24 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: colors.gold, borderColor: colors.gold },
    agreementText: { flex: 1, fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  
    actionsContainer: { alignItems: 'center', gap: 12 },
    finalizeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.gold,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.button,
      width: '100%',
    },
    finalizeButtonDisabled: { opacity: 0.6 },
    finalizeButtonText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    disclaimerText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isFlowMode = params.flow === 'true';

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [will, setWill] = useState<Will | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    will: true,
    assets: true,
    recipients: true,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(userId)) {
      setLoading(false);
      return;
    }
    try {
      const [wRes, aRes, rRes] = await Promise.all([
        backendApi.listWills({ user_id: userId }),
        backendApi.getUserAssets(userId),
        backendApi.getRecipientsByEmail(user.email),
      ]);
      const wRows = wRes.data ?? [];
      const latest = wRows[0];
      setWill(
        latest
          ? {
              id: String(latest.id),
              title: latest.title || 'Untitled',
              type: (latest.type as Will['type']) || 'text',
              status: latest.status || 'draft',
              content: latest.content,
              audio_url: latest.audio_url,
              video_url: latest.video_url,
              transcript: latest.transcript,
              notes: latest.notes,
              created_at: latest.created_at,
              updated_at: latest.updated_at || latest.created_at,
            }
          : null,
      );
      setAssets(
        (aRes.data ?? []).map((a) => ({
          id: String(a.id),
          name: a.name,
          category: a.category || 'other',
          estimated_value: a.estimated_value,
          description: a.description ?? null,
          documents_url: null,
        })),
      );
      setRecipients(
        (rRes.data ?? []).map((r) => ({
          id: String(r.id),
          full_name: r.full_name,
          email: r.email,
          relationship: r.relationship,
          is_verified: Boolean(r.is_verified),
        })),
      );
      setAllocations([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load will data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getWillIcon = () => {
    if (!will) return 'mic';
    switch (will.type) {
      case 'video':
        return 'videocam';
      case 'chat':
        return 'chatbubbles';
      default:
        return 'mic';
    }
  };

  const getWillTypeLabel = () => {
    if (!will) return 'Not created';
    switch (will.type) {
      case 'video':
        return 'Video Recording';
      case 'chat':
        return 'Chat-based Will';
      case 'text':
        return 'Written Will';
      default:
        return 'Audio Recording';
    }
  };

  // Display in INR (assume stored value is USD: 1 USD = 83 INR)
  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    const inr = value * 83;
    return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
  };

  const getTotalValue = () => {
    return assets.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
  };

  const getRecipientName = (recipientId: string) => {
    return recipients.find((r) => r.id === recipientId)?.full_name || 'Unknown';
  };

  const getAssetAllocations = (assetId: string) => {
    return allocations.filter((a) => a.asset_id === assetId);
  };

  const sections = [
    {
      key: 'will',
      icon: getWillIcon(),
      title: getWillTypeLabel(),
      status: will ? 'complete' : 'pending',
      details: will ? `Last updated ${new Date(will.updated_at).toLocaleDateString()}` : 'No will created yet',
    },
    {
      key: 'assets',
      icon: 'folder-open',
      title: 'Assets',
      status: assets.length > 0 ? 'complete' : 'pending',
      details: `${assets.length} asset${assets.length !== 1 ? 's' : ''} • ${formatCurrency(getTotalValue())} total`,
    },
    {
      key: 'recipients',
      icon: 'people',
      title: 'Recipients',
      status: recipients.length > 0 ? 'complete' : 'pending',
      details: `${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} • ${recipients.filter((r) => r.is_verified).length} verified`,
    },
  ];

  const handleSubmit = async () => {
    if (!will || !user) {
      Alert.alert('Error', 'Please create a will before saving');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = parseInt(user.id, 10);
      if (Number.isNaN(userId)) throw new Error('Invalid session');
      await backendApi.saveWill({
        user_id: userId,
        user_email: user.email ?? undefined,
        transcript: will.transcript || will.content || 'Will review checkpoint',
        content: will.content || will.transcript || '',
        title: will.title,
        type: will.type,
        notes: will.notes ?? undefined,
      });
      Alert.alert('Success', 'Your will has been saved! You can finalize it later from the dashboard.');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error saving will:', error);
      Alert.alert('Error', 'Failed to save will');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const renderSection = ({ item: section }: { item: typeof sections[0] }) => (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => toggleSection(section.key)}
      >
        <View style={styles.sectionLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name={section.icon as any} size={20} color={colors.foreground} />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDetails}>{section.details}</Text>
          </View>
        </View>
        <View style={styles.sectionRight}>
          {section.status === 'complete' ? (
            <View style={styles.statusComplete}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.statusTextComplete}>Complete</Text>
            </View>
          ) : (
            <View style={styles.statusPending}>
              <Ionicons name="alert-circle" size={16} color={colors.gold} />
              <Text style={styles.statusTextPending}>Pending</Text>
            </View>
          )}
          <Ionicons
            name={expandedSections[section.key] ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.mutedForeground}
          />
        </View>
      </Pressable>

      {expandedSections[section.key] && (
        <View style={styles.sectionContent}>
          {section.key === 'will' && will && (
            <View style={styles.willDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title:</Text>
                <Text style={styles.detailValue}>{will.title}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{will.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{will.status}</Text>
              </View>
              {will.transcript && (
                <View style={styles.transcriptSection}>
                  <Text style={styles.transcriptLabel}>Transcript preview:</Text>
                  <Text style={styles.transcriptText} numberOfLines={3}>
                    {will.transcript}
                  </Text>
                </View>
              )}
            </View>
          )}
          {section.key === 'will' && !will && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No will has been created yet.</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/create')}>
                <Text style={styles.emptyButtonText}>Create Your Will</Text>
              </Pressable>
            </View>
          )}

          {section.key === 'assets' && assets.length > 0 && (
            <FlatList
              data={assets}
              keyExtractor={(item) => item.id}
              renderItem={({ item: asset }) => {
                const assetAllocations = getAssetAllocations(asset.id);
                return (
                  <View style={styles.assetRow}>
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetCategory}>{asset.category.replace('_', ' ')}</Text>
                      <Text style={styles.assetValue}>{formatCurrency(asset.estimated_value)}</Text>
                    </View>
                    <View style={styles.assetRecipients}>
                      {assetAllocations.length > 0 ? (
                        <View style={styles.recipientTags}>
                          {assetAllocations.slice(0, 2).map((a) => (
                            <View key={a.id} style={styles.recipientTag}>
                              <Text style={styles.recipientTagText}>
                                {getRecipientName(a.recipient_id)}
                              </Text>
                            </View>
                          ))}
                          {assetAllocations.length > 2 && (
                            <Text style={styles.moreRecipients}>+{assetAllocations.length - 2} more</Text>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.noAllocation}>Not assigned</Text>
                      )}
                    </View>
                  </View>
                );
              }}
              scrollEnabled={false}
            />
          )}
          {section.key === 'assets' && assets.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No assets have been added yet.</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/asset-add')}>
                <Text style={styles.emptyButtonText}>Add Assets</Text>
              </Pressable>
            </View>
          )}

          {section.key === 'recipients' && recipients.length > 0 && (
            <FlatList
              data={recipients}
              keyExtractor={(item) => item.id}
              renderItem={({ item: recipient }) => (
                <View style={styles.recipientRow}>
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>{recipient.full_name}</Text>
                    <Text style={styles.recipientRelationship}>
                      {recipient.relationship || '—'}
                    </Text>
                    <Text style={styles.recipientEmail}>{recipient.email || '—'}</Text>
                  </View>
                  <View style={styles.recipientStatus}>
                    {recipient.is_verified ? (
                      <View style={styles.verifiedStatus}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <Text style={styles.pendingText}>Pending</Text>
                    )}
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
          {section.key === 'recipients' && recipients.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No recipients have been added yet.</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/recipients')}>
                <Text style={styles.emptyButtonText}>Add Recipients</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      {/* Back Button */}
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.gold} />
        <Text style={styles.backText}>Back to Recipients</Text>
      </Pressable>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={styles.progressStep}>
            <View style={[styles.progressCircle, step <= 4 ? styles.progressActive : null]}>
              {step < 4 ? (
                <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
              ) : (
                <Text style={styles.progressNumber}>{step}</Text>
              )}
            </View>
            {step < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Review Your Will</Text>
        <Text style={styles.subtitle}>
          Please review all sections before finalizing your digital will.
        </Text>
      </View>

      {/* Summary Cards */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        scrollEnabled={false}
        contentContainerStyle={styles.sectionsList}
      />

      {/* Security Notice */}
      <View style={styles.securityCard}>
        <View style={styles.securityIcon}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
        </View>
        <View style={styles.securityContent}>
          <Text style={styles.securityTitle}>Your Data is Secure</Text>
          <Text style={styles.securityText}>
            All your recordings, documents, and personal information are encrypted with bank-level 256-bit encryption.
            Only verified recipients will be able to access your will when conditions are met.
          </Text>
        </View>
      </View>

      {/* Agreement */}
      <View style={styles.agreementContainer}>
        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={16} color={colors.goldForeground} />}
          </View>
          <Text style={styles.agreementText}>
            I confirm that all the information provided is accurate and represents my true wishes.
            I understand that this digital will can be updated at any time and that recipients will
            only receive access under the conditions I have specified.
          </Text>
        </Pressable>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.finalizeButton, (!agreed || isSubmitting || !will) && styles.finalizeButtonDisabled]}
          onPress={handleSubmit}
          disabled={!agreed || isSubmitting || !will}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.goldForeground} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.goldForeground} />
              <Text style={styles.finalizeButtonText}>Save & Continue to Dashboard</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.disclaimerText}>
          You can make changes to your will at any time and finalize it later from the dashboard
        </Text>
      </View>
    </ScrollView>
  );
}