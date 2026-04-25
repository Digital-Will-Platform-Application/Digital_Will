import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/lib/theme';

type Will = { id: string; title: string; status: string; type: string; updated_at: string; content?: string | null; transcript?: string | null; notes?: string | null };
type Asset = { id: string; name: string; category: string; estimated_value: number | null };
type Recipient = { id: string; full_name: string; email: string | null; phone?: string | null; relationship?: string | null };
type Allocation = { id: string; asset_id: string; recipient_id: string; allocation_percentage: number };

const USD_TO_INR = 83;
function formatINR(value: number): string {
  const inr = value * USD_TO_INR;
  return `₹${inr.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
}
function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    property: '#8b5cf6',
    investment: '#06b6d4',
    bank_account: '#10b981',
    vehicle: '#f59e0b',
    jewelry: '#ec4899',
    digital_asset: '#6366f1',
    insurance: '#14b8a6',
    business: '#f97316',
    other: '#64748b',
  };
  return map[category] || '#64748b';
}
function getRecipientColor(recipientId: string): string {
  const palette = ['#fbbf24', '#1e3a8a', '#065f46', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
  let hash = 0;
  for (let i = 0; i < recipientId.length; i++) hash = recipientId.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function getWillIcon(type: string): 'document-text' | 'videocam' | 'chatbubbles' | 'mic' {
  switch (type) {
    case 'video': return 'videocam';
    case 'chat': return 'chatbubbles';
    case 'audio': return 'mic';
    default: return 'document-text';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'in_progress': return 'In Progress';
    case 'review': return 'Under Review';
    case 'completed': return 'Completed';
    default: return status;
  }
}

function getWillTypeLabel(type: string): string {
  switch (type) {
    case 'video': return 'Video Will';
    case 'chat': return 'Chat Will';
    case 'audio': return 'Audio Will';
    case 'text': return 'Manual Will';
    default: return 'Will';
  }
}

function getTimeAgo(date: string): string {
  const now = Date.now();
  const updated = new Date(date).getTime();
  const diff = now - updated;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return days === 1 ? '1 day ago' : `${days} days ago`;
  if (hours > 0) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  return 'Just now';
}

function getWillPreview(will: Will): string {
  if (will.transcript && will.transcript.length > 0) {
    return will.transcript.length > 100 ? will.transcript.slice(0, 100) + '...' : will.transcript;
  }
  if (will.content && will.content.length > 0) {
    return will.content.length > 100 ? will.content.slice(0, 100) + '...' : will.content;
  }
  if (will.notes && will.notes.length > 0) return 'Notes added';
  return 'No content yet';
}

function hasWillContent(will: Will): boolean {
  return !!(will.content || will.transcript || will.notes);
}

export default function DashboardScreen() {
  const { colors, isDark, toggleLightDark } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 32 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    headerBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    themeToggle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBrandIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBrandTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.foreground,
      letterSpacing: 0.3,
    },
    welcome: { marginBottom: 20 },
    welcomeTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 6 },
    welcomeSubtitle: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
    legacyHealthCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 14,
      marginBottom: 16,
    },
    legacyHealthTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    legacyHealthTitle: { color: colors.foreground, fontSize: 15, fontWeight: '700' },
    legacyHealthScore: { color: colors.gold, fontSize: 18, fontWeight: '700' },
    legacyHealthBarTrack: { height: 8, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
    legacyHealthBarFill: { height: '100%', borderRadius: 999, backgroundColor: colors.gold },
    legacyHealthHint: { marginTop: 8, color: colors.mutedForeground, fontSize: 12, lineHeight: 17 },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    statIcon: { marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '600', color: colors.foreground },
    statLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    analyticsSection: { marginBottom: 24 },
    analyticsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    analyticsCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    analyticsCardHeader: { marginBottom: 12 },
    analyticsCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    analyticsCardTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, flex: 1 },
    analyticsCardDesc: { fontSize: 13, color: colors.mutedForeground, marginTop: 6 },
    completionPercentWrap: { alignItems: 'flex-end', marginTop: 8 },
    completionPercent: { fontSize: 28, fontWeight: '700', color: colors.foreground },
    completionRateLabel: { fontSize: 12, color: colors.mutedForeground },
    progressBarBg: {
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.gold,
      borderRadius: 6,
    },
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendLabel: { fontSize: 13, color: colors.mutedForeground },
    legendValue: { fontSize: 13, fontWeight: '600', color: colors.foreground },
    noDataText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', paddingVertical: 16 },
    categoryList: { gap: 10 },
    categoryRow: { paddingVertical: 8 },
    categoryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.foreground },
    categoryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    categoryCountPill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
    categoryCount: { fontSize: 12, fontWeight: '700', color: colors.foreground },
    categoryValue: { fontSize: 12, color: colors.mutedForeground, flexShrink: 1 },
    categoryPct: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground },
    recipientIconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipientBars: { gap: 12 },
    recipientBarRow: { marginBottom: 10 },
    recipientBarLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    recipientBarName: { fontSize: 14, fontWeight: '500', color: colors.foreground, flex: 1 },
    recipientBarTrack: {
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: 'hidden',
    },
    recipientBarFill: { height: '100%', borderRadius: 5 },
    recipientBarValue: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginTop: 4 },
    manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.button },
    manageBtnText: { fontSize: 14, fontWeight: '500', color: colors.foreground },
    recipientCardsWrap: { gap: 12, marginBottom: 24 },
    recipientCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    recipientCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    recipientAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.goldLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipientAvatarText: { fontSize: 16, fontWeight: '600', color: colors.goldForeground },
    recipientCardInfo: { flex: 1 },
    recipientCardName: { fontSize: 16, fontWeight: '600', color: colors.foreground },
    recipientCardRole: { fontSize: 13, color: colors.mutedForeground, marginTop: 2, textTransform: 'capitalize' },
    recipientCardContact: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 6 },
    recipientContactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recipientContactText: { fontSize: 13, color: colors.mutedForeground, flex: 1 },
    emptyRecipientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 24 },
    emptyRecipientText: { fontSize: 14, color: colors.mutedForeground },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    quickActionCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    quickActionIcon: {
      width: 56,
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    quickActionLabel: { fontSize: 14, fontWeight: '500', color: colors.foreground },
    myWillsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    myWillsHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    viewAllBtn: { paddingVertical: 6, paddingHorizontal: 8 },
    viewAllBtnText: { fontSize: 14, fontWeight: '500', color: colors.gold },
    newWillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.gold,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radius.button,
    },
    newWillBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 14 },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 32,
      alignItems: 'center',
    },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginTop: 12 },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' },
    btnGold: {
      backgroundColor: colors.gold,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: radius.button,
      marginTop: 16,
    },
    btnGoldText: { color: colors.goldForeground, fontWeight: '600', fontSize: 16 },
    willCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    willIconBox: {
      width: 52,
      height: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    willIconGold: { backgroundColor: colors.gold },
    willIconNavy: { backgroundColor: colors.primary },
    willIconSage: { backgroundColor: colors.sage },
    willBody: { flex: 1 },
    willTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
    willTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, flex: 1 },
    willStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    willStatusBadgeText: { fontSize: 11, fontWeight: '600' },
    willStatusDraft: { backgroundColor: colors.secondary },
    willStatusInProgress: { backgroundColor: colors.goldLight },
    willStatusReview: { backgroundColor: '#dbeafe' },
    willStatusCompleted: { backgroundColor: colors.sage + '40' },
    willMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    willPreview: { fontSize: 13, color: colors.mutedForeground, marginTop: 8, lineHeight: 18 },
    willIndicators: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    willIndicatorPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    willIndicatorText: { fontSize: 12, color: colors.mutedForeground },
    tutorialSection: { marginTop: 24, marginBottom: 24 },
    tutorialTitle: { fontSize: 22, fontWeight: '600', color: colors.foreground, marginBottom: 8, textAlign: 'center' },
    tutorialSubtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 20 },
    tutorialScrollContent: { paddingHorizontal: 16 },
    tutorialCardSlide: {
      marginRight: 16,
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    tutorialCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    tutorialCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    tutorialIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    step1Icon: { backgroundColor: colors.goldLight },
    step2Icon: { backgroundColor: colors.primary },
    step3Icon: { backgroundColor: colors.sage },
    step4Icon: { backgroundColor: colors.gold },
    step5Icon: { backgroundColor: colors.sage },
    tutorialCardTitleWrap: { flex: 1 },
    tutorialStepLabel: { fontSize: 12, fontWeight: '500', color: colors.gold, marginBottom: 2 },
    tutorialStepTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground },
    tutorialDesc: { fontSize: 14, color: colors.mutedForeground, marginBottom: 12 },
    tutorialList: { marginBottom: 14 },
    tutorialListItem: { fontSize: 13, color: colors.mutedForeground, marginBottom: 4 },
    tutorialBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tutorialBtnText: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  }));

  const quickActions = useMemo(
    () =>
      [
        { icon: 'mic' as const, label: 'Record Audio', href: '/create/audio', color: colors.gold },
        { icon: 'videocam' as const, label: 'Record Video', href: '/create/video', color: colors.primary },
        { icon: 'create' as const, label: 'Manual Form', href: '/create/manual', color: colors.primary },
        { icon: 'document-text' as const, label: 'Write a Note', href: '/create/note', color: colors.gold },
        { icon: 'folder-open' as const, label: 'Manage Assets', href: '/assets-manage', color: colors.gold },
        { icon: 'people' as const, label: 'Manage Recipients', href: '/recipients', color: colors.primary },
      ] as const,
    [colors.gold, colors.primary],
  );

  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wills, setWills] = useState<Will[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [assetAllocations, setAssetAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasRedirectedToOnboardingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (user.user_metadata?.onboarding_completed === false) {
      if (hasRedirectedToOnboardingRef.current) return;
      hasRedirectedToOnboardingRef.current = true;
      queueMicrotask(() => router.replace('/onboarding'));
      return;
    }
    hasRedirectedToOnboardingRef.current = false; // allow redirect again if they come back with incomplete onboarding
    fetchData();
  }, [user]);

  // Refetch when user returns to dashboard so analytics reflect latest (create/edit/delete)
  useFocusEffect(
    useCallback(() => {
      if (user && !loading) fetchData();
    }, [user])
  );

  const fetchData = async () => {
    if (!user) return;
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(userId) || !user.email) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [wRes, aRes, rRes] = await Promise.all([
        backendApi.listWills({ user_id: userId }),
        backendApi.getUserAssets(userId),
        backendApi.getRecipientsByEmail(user.email),
      ]);
      const wRows = wRes.data ?? [];
      setWills(
        wRows.map((w) => ({
          id: String(w.id),
          title: w.title || 'Untitled',
          status: w.status || 'draft',
          type: w.type || 'text',
          updated_at: w.updated_at || w.created_at,
          content: w.content,
          transcript: w.transcript,
          notes: w.notes,
        })),
      );
      const aRows = aRes.data ?? [];
      setAssets(
        aRows.map((a) => ({
          id: String(a.id),
          name: a.name,
          category: a.category || 'other',
          estimated_value: a.estimated_value,
        })),
      );
      const rRows = rRes.data ?? [];
      setRecipients(
        rRows.map((r) => ({
          id: String(r.id),
          full_name: r.full_name,
          email: r.email,
          phone: r.phone ?? null,
          relationship: r.relationship ?? null,
        })),
      );
      // Asset allocations are not exposed on the Express API yet; keep empty (analytics section adapts).
      setAssetAllocations([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  /** Chat-based wills are deprecated; hide from dashboard analytics and lists (match web). */
  const willsVisibleOnDashboard = useMemo(() => wills.filter((w) => w.type !== 'chat'), [wills]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // Analytics data – same logic as web Dashboard
  const willStatusStats = { draft: 0, in_progress: 0, review: 0, completed: 0 };
  willsVisibleOnDashboard.forEach((w) => {
    const s = w.status as keyof typeof willStatusStats;
    if (s in willStatusStats) willStatusStats[s]++;
  });
  const totalWills = willsVisibleOnDashboard.length;
  const completedWills = willStatusStats.completed;
  const completionPercentage = totalWills > 0 ? Math.round((completedWills / totalWills) * 100) : 0;
  const readinessScore = Math.min(
    100,
    Math.round(
      ((willsVisibleOnDashboard.length > 0 ? 35 : 0) +
        (assets.length > 0 ? 25 : 0) +
        (recipients.length > 0 ? 25 : 0) +
        (completedWills > 0 ? 15 : 0)),
    ),
  );
  const willStatusData = [
    { name: 'Draft', value: willStatusStats.draft, fill: '#94a3b8' },
    { name: 'In Progress', value: willStatusStats.in_progress, fill: '#fbbf24' },
    { name: 'Under Review', value: willStatusStats.review, fill: '#3b82f6' },
    { name: 'Completed', value: willStatusStats.completed, fill: '#10b981' },
  ].filter((item) => item.value > 0);

  const assetCategoryData = assets.reduce<Array<{ name: string; count: number; value: number; fill: string }>>((acc, asset) => {
    const category = asset.category || 'other';
    const label = category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const existing = acc.find((item) => item.name === label);
    if (existing) {
      existing.count++;
      existing.value += asset.estimated_value || 0;
    } else {
      acc.push({ name: label, count: 1, value: asset.estimated_value || 0, fill: getCategoryColor(category) });
    }
    return acc;
  }, []);

  const recipientValueData = recipients
    .map((r) => {
      const totalValue = assetAllocations
        .filter((a) => a.recipient_id === r.id)
        .reduce((sum, a) => {
          const asset = assets.find((x) => x.id === a.asset_id);
          if (asset?.estimated_value) return sum + (asset.estimated_value * a.allocation_percentage) / 100;
          return sum;
        }, 0);
      return { name: r.full_name, value: totalValue, fill: getRecipientColor(r.id) };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalAllocatedValue = recipientValueData.reduce((s, i) => s + i.value, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
    >
      {/* App name + theme toggle */}
      <View style={styles.headerTopRow}>
        <View style={styles.headerBrand}>
          <View style={styles.headerBrandIcon}>
            <Ionicons name="shield-checkmark" size={22} color={colors.goldForeground} />
          </View>
          <Text style={styles.headerBrandTitle}>Digital Will</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.themeToggle}
            onPress={toggleLightDark}
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.foreground} />
          </Pressable>
          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push('/account')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Ionicons name="person-circle-outline" size={26} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Welcome - spacing adjusted with text below */}
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Welcome, {userName}</Text>
        <Text style={styles.welcomeSubtitle}>Manage your digital legacy with confidence.</Text>
      </View>
      <View style={styles.legacyHealthCard}>
        <View style={styles.legacyHealthTop}>
          <Text style={styles.legacyHealthTitle}>Legacy Readiness</Text>
          <Text style={styles.legacyHealthScore}>{readinessScore}%</Text>
        </View>
        <View style={styles.legacyHealthBarTrack}>
          <View style={[styles.legacyHealthBarFill, { width: `${readinessScore}%` }]} />
        </View>
        <Text style={styles.legacyHealthHint}>
          Improve score by adding assets, recipients, and finalizing at least one will.
        </Text>
      </View>

      {/* Stats grid - same order and labels as web */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="folder-open-outline" size={24} color={colors.gold} style={styles.statIcon} />
          <Text style={styles.statValue}>{assets.length}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color={colors.gold} style={styles.statIcon} />
          <Text style={styles.statValue}>{recipients.length}</Text>
          <Text style={styles.statLabel}>Recipients</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color={colors.gold} style={styles.statIcon} />
          <Text style={styles.statValue}>{willsVisibleOnDashboard.length}</Text>
          <Text style={styles.statLabel}>Active Wills</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.gold} style={styles.statIcon} />
          <Text style={styles.statValue}>Yes</Text>
          <Text style={styles.statLabel}>Secure</Text>
        </View>
      </View>

      {/* Analytics – before Quick Actions, same as web */}
      <View style={styles.analyticsSection}>
        <View style={styles.analyticsHeader}>
          <Ionicons name="bar-chart-outline" size={20} color={colors.gold} />
          <Text style={styles.sectionTitle}>Analytics</Text>
        </View>

        {/* Will Completion Progress */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsCardHeader}>
            <View style={styles.analyticsCardTitleRow}>
              <Ionicons name="trending-up-outline" size={20} color={colors.gold} />
              <Text style={styles.analyticsCardTitle}>Will Completion Progress</Text>
            </View>
            <Text style={styles.analyticsCardDesc}>
              {completedWills} of {totalWills} wills completed
            </Text>
            <View style={styles.completionPercentWrap}>
              <Text style={styles.completionPercent}>{completionPercentage}%</Text>
              <Text style={styles.completionRateLabel}>Completion rate</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
          </View>
          {willStatusData.length > 0 ? (
            <View style={styles.legendGrid}>
              {willStatusData.map((item) => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                  <Text style={styles.legendLabel}>{item.name}:</Text>
                  <Text style={styles.legendValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No will data available</Text>
          )}
        </View>

        {/* Asset Distribution by Category */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsCardHeader}>
            <View style={styles.analyticsCardTitleRow}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.gold} />
              <Text style={styles.analyticsCardTitle}>Asset Distribution by Category</Text>
            </View>
            <Text style={styles.analyticsCardDesc}>
              {assets.length} total assets across {assetCategoryData.length} categories
            </Text>
          </View>
          {assetCategoryData.length > 0 ? (
            <View style={styles.categoryList}>
              {assetCategoryData.slice(0, 6).map((item) => (
                <View key={item.name} style={styles.categoryRow}>
                  <View style={styles.categoryTopRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                    <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.categoryCountPill}>
                      <Text style={styles.categoryCount}>{item.count}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryMetaRow}>
                    <Text style={styles.categoryValue} numberOfLines={1}>
                      Total value: {formatINR(item.value)}
                    </Text>
                    <Text style={styles.categoryPct}>
                      {assets.length > 0 ? `${Math.round((item.count / assets.length) * 100)}%` : '0%'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No assets available</Text>
          )}
        </View>

        {/* Asset Value by Recipients */}
        {recipientValueData.length > 0 && (
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsCardHeader}>
              <View style={styles.analyticsCardTitleRow}>
                <View style={styles.recipientIconBox}>
                  <Ionicons name="people" size={20} color={colors.goldForeground} />
                </View>
                <Text style={styles.analyticsCardTitle}>Asset Value by Recipients</Text>
              </View>
              <Text style={styles.analyticsCardDesc}>
                Total value allocated: {formatINR(totalAllocatedValue)}
              </Text>
            </View>
            <View style={styles.recipientBars}>
              {recipientValueData.map((item) => {
                const maxVal = Math.max(...recipientValueData.map((x) => x.value), 1);
                const pct = (item.value / maxVal) * 100;
                return (
                  <View key={item.name} style={styles.recipientBarRow}>
                    <View style={styles.recipientBarLabel}>
                      <View style={[styles.legendDot, { backgroundColor: item.fill }]} />
                      <Text style={styles.recipientBarName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <View style={styles.recipientBarTrack}>
                      <View style={[styles.recipientBarFill, { width: `${pct}%`, backgroundColor: item.fill }]} />
                    </View>
                    <Text style={styles.recipientBarValue}>{formatINR(item.value)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions – match web: audio, video, manual, note, assets, recipients */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href as any} asChild>
            <Pressable style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={28} color={colors.primaryForeground} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      {/* Recipients - full cards like web: avatar, name, relationship, email, phone */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recipients</Text>
        <Pressable
          style={({ pressed }) => [styles.manageBtn, pressed && { opacity: 0.82 }]}
          onPress={() => router.push('/recipients')}
        >
          <Ionicons name="people" size={16} color={colors.foreground} />
          <Text style={styles.manageBtnText}>Manage</Text>
        </Pressable>
      </View>
      {recipients.length > 0 ? (
        <View style={styles.recipientCardsWrap}>
          {recipients.map((r) => (
            <Pressable key={r.id} style={styles.recipientCard} onPress={() => router.push('/recipients')}>
              <View style={styles.recipientCardTop}>
                <View style={styles.recipientAvatar}>
                  <Text style={styles.recipientAvatarText}>
                    {(r.full_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recipientCardInfo}>
                  <Text style={styles.recipientCardName}>{r.full_name}</Text>
                  {r.relationship ? (
                    <Text style={styles.recipientCardRole}>{String(r.relationship)}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.recipientCardContact}>
                {r.email ? (
                  <View style={styles.recipientContactRow}>
                    <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} />
                    <Text style={styles.recipientContactText} numberOfLines={1}>{r.email}</Text>
                  </View>
                ) : null}
                {r.phone ? (
                  <View style={styles.recipientContactRow}>
                    <Ionicons name="call-outline" size={14} color={colors.mutedForeground} />
                    <Text style={styles.recipientContactText} numberOfLines={1}>{r.phone}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <Pressable style={styles.emptyRecipientCard} onPress={() => router.push('/recipients')}>
          <Ionicons name="people-outline" size={24} color={colors.mutedForeground} />
          <Text style={styles.emptyRecipientText}>No recipients yet. Tap to add.</Text>
        </Pressable>
      )}

      {/* My Wills - same as web: Manage, New Will; card shows status badge, type, time ago, preview, Content Added / More Notes */}
      <View style={styles.myWillsHeader}>
        <Text style={styles.sectionTitle}>My Wills</Text>
        <View style={styles.myWillsHeaderRight}>
          <Pressable style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/wills')}>
            <Text style={styles.viewAllBtnText}>Manage</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.newWillBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
            onPress={() => router.push('/create')}
          >
            <Ionicons name="add" size={18} color={colors.goldForeground} />
            <Text style={styles.newWillBtnText}>New Will</Text>
          </Pressable>
        </View>
      </View>

      {willsVisibleOnDashboard.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={40} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No wills yet</Text>
          <Text style={styles.emptySubtitle}>Create your first digital will to get started.</Text>
          <Pressable
            style={({ pressed }) => [styles.btnGold, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
            onPress={() => router.push('/create')}
          >
            <Text style={styles.btnGoldText}>Create Your First Will</Text>
          </Pressable>
        </View>
      ) : (
        willsVisibleOnDashboard.slice(0, 10).map((will) => {
          const hasContent = hasWillContent(will);
          const preview = getWillPreview(will);
          const statusBadgeStyle =
            will.status === 'completed' ? styles.willStatusCompleted :
            will.status === 'in_progress' ? styles.willStatusInProgress :
            will.status === 'review' ? styles.willStatusReview : styles.willStatusDraft;
          return (
            <Pressable
              key={will.id}
              style={styles.willCard}
              onPress={() => router.push(`/will/${will.id}`)}
            >
              <View style={[styles.willIconBox, will.type === 'video' ? styles.willIconNavy : will.type === 'chat' ? styles.willIconSage : styles.willIconGold]}>
                <Ionicons name={getWillIcon(will.type)} size={26} color={colors.primaryForeground} />
              </View>
              <View style={styles.willBody}>
                <View style={styles.willTitleRow}>
                  <Text style={styles.willTitle} numberOfLines={1}>{will.title || 'Untitled'}</Text>
                  <View style={[styles.willStatusBadge, statusBadgeStyle]}>
                    <Text style={styles.willStatusBadgeText}>{getStatusLabel(will.status)}</Text>
                  </View>
                </View>
                <Text style={styles.willMeta}>
                  {getWillTypeLabel(will.type)} · {getTimeAgo(will.updated_at)}
                </Text>
                <Text style={styles.willPreview} numberOfLines={2}>{preview}</Text>
                <View style={styles.willIndicators}>
                  {hasContent && (
                    <View style={styles.willIndicatorPill}>
                      <Ionicons name="checkmark-circle" size={12} color={colors.sage} />
                      <Text style={styles.willIndicatorText}>Content Added</Text>
                    </View>
                  )}
                  {will.notes && (
                    <View style={styles.willIndicatorPill}>
                      <Ionicons name="document-text-outline" size={12} color={colors.gold} />
                      <Text style={styles.willIndicatorText}>More Notes</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </Pressable>
          );
        })
      )}

      {/* How To Get Started - horizontal slide carousel: swipe to see steps */}
      <View style={styles.tutorialSection}>
        <Text style={styles.tutorialTitle}>How To Get Started</Text>
        <Text style={styles.tutorialSubtitle}>Swipe to see steps — create and manage your digital will</Text>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={Dimensions.get('window').width - 16}
          contentContainerStyle={styles.tutorialScrollContent}
        >
          <View style={[styles.tutorialCardSlide, { width: Dimensions.get('window').width - 32 }]}>
            <View style={styles.tutorialCardHeader}>
              <View style={[styles.tutorialIconBox, styles.step1Icon]}>
                <Ionicons name="document-text" size={24} color={colors.goldForeground} />
              </View>
              <View style={styles.tutorialCardTitleWrap}>
                <Text style={styles.tutorialStepLabel}>Step 1</Text>
                <Text style={styles.tutorialStepTitle}>Create Your Will</Text>
              </View>
            </View>
            <Text style={styles.tutorialDesc}>Choose audio, video, manual form, or write a note.</Text>
            <View style={styles.tutorialList}>
              <Text style={styles.tutorialListItem}>• Tap New Will or Create</Text>
              <Text style={styles.tutorialListItem}>• Select Audio, Video, Manual Form, or Write a Note</Text>
              <Text style={styles.tutorialListItem}>• Record, fill the form, or type your wishes</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.tutorialBtn, pressed && { opacity: 0.84 }]} onPress={() => router.push('/create')}>
              <Text style={styles.tutorialBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.tutorialCardSlide, { width: Dimensions.get('window').width - 32 }]}>
            <View style={styles.tutorialCardHeader}>
              <View style={[styles.tutorialIconBox, styles.step2Icon]}>
                <Ionicons name="folder-open" size={24} color={colors.primaryForeground} />
              </View>
              <View style={styles.tutorialCardTitleWrap}>
                <Text style={[styles.tutorialStepLabel, { color: colors.primary }]}>Step 2</Text>
                <Text style={styles.tutorialStepTitle}>Add Your Assets</Text>
              </View>
            </View>
            <Text style={styles.tutorialDesc}>List assets: property, investments, vehicles, and more.</Text>
            <View style={styles.tutorialList}>
              <Text style={styles.tutorialListItem}>• Go to Assets from Quick Actions</Text>
              <Text style={styles.tutorialListItem}>• Click Add Asset</Text>
              <Text style={styles.tutorialListItem}>• Fill details and save</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.tutorialBtn, pressed && { opacity: 0.84 }]} onPress={() => router.push('/assets-manage')}>
              <Text style={styles.tutorialBtnText}>Manage Assets</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.tutorialCardSlide, { width: Dimensions.get('window').width - 32 }]}>
            <View style={styles.tutorialCardHeader}>
              <View style={[styles.tutorialIconBox, styles.step3Icon]}>
                <Ionicons name="person-add" size={24} color={colors.primaryForeground} />
              </View>
              <View style={styles.tutorialCardTitleWrap}>
                <Text style={[styles.tutorialStepLabel, { color: colors.primary }]}>Step 3</Text>
                <Text style={styles.tutorialStepTitle}>Create Recipients</Text>
              </View>
            </View>
            <Text style={styles.tutorialDesc}>Add people who will receive your assets and messages.</Text>
            <View style={styles.tutorialList}>
              <Text style={styles.tutorialListItem}>• Click Manage in Recipients</Text>
              <Text style={styles.tutorialListItem}>• Click Add Recipient</Text>
              <Text style={styles.tutorialListItem}>• Enter name, email, phone, relationship</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.tutorialBtn, pressed && { opacity: 0.84 }]} onPress={() => router.push('/recipients')}>
              <Text style={styles.tutorialBtnText}>Manage Recipients</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          {/* Step 4: Assign Recipients - same as web */}
          <View style={[styles.tutorialCardSlide, { width: Dimensions.get('window').width - 32 }]}>
            <View style={styles.tutorialCardHeader}>
              <View style={[styles.tutorialIconBox, styles.step4Icon]}>
                <Ionicons name="link" size={24} color={colors.goldForeground} />
              </View>
              <View style={styles.tutorialCardTitleWrap}>
                <Text style={[styles.tutorialStepLabel, { color: colors.gold }]}>Step 4</Text>
                <Text style={styles.tutorialStepTitle}>Assign Recipients</Text>
              </View>
            </View>
            <Text style={styles.tutorialDesc}>Link your assets to the recipients who should receive them.</Text>
            <View style={styles.tutorialList}>
              <Text style={styles.tutorialListItem}>• Go to Assets section</Text>
              <Text style={styles.tutorialListItem}>• Click 'Assign Recipients' on any asset</Text>
              <Text style={styles.tutorialListItem}>• Select recipients and save</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.tutorialBtn, pressed && { opacity: 0.84 }]} onPress={() => router.push('/assets-manage')}>
              <Text style={styles.tutorialBtnText}>Assign Now</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          {/* Step 5: Review & Finalize - same as web */}
          <View style={[styles.tutorialCardSlide, { width: Dimensions.get('window').width - 32 }]}>
            <View style={styles.tutorialCardHeader}>
              <View style={[styles.tutorialIconBox, styles.step5Icon]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primaryForeground} />
              </View>
              <View style={styles.tutorialCardTitleWrap}>
                <Text style={[styles.tutorialStepLabel, { color: colors.sage }]}>Step 5</Text>
                <Text style={styles.tutorialStepTitle}>Review & Finalize</Text>
              </View>
            </View>
            <Text style={styles.tutorialDesc}>Review all sections of your will and finalize it.</Text>
            <View style={styles.tutorialList}>
              <Text style={styles.tutorialListItem}>• Go to Review Will section</Text>
              <Text style={styles.tutorialListItem}>• Check all sections are complete</Text>
              <Text style={styles.tutorialListItem}>• Click 'Finalize Will' to complete</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.tutorialBtn, pressed && { opacity: 0.84 }]} onPress={() => router.push('/review')}>
              <Text style={styles.tutorialBtnText}>Review Now</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.foreground} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}