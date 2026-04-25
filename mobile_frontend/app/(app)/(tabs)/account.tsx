import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useThemedStyles } from '@/lib/useThemedStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, router as rootRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { backendApi, SessionApiError } from '@/lib/backendApi';
import { getOrCreateDeviceIdAsync, getNativeDeviceLabel, getNativeUserAgentSnapshot } from '@/lib/deviceSession';
import { recordLoginActivity } from '@/lib/loginActivity';
import {
  groupSessionsByDevice,
  getDeviceKindLabel,
  getSessionSubtitle,
  formatSessionActiveLabel,
  isSessionActiveNow,
  type LoginActivityRow,
} from '@/lib/activeSessionsHelpers';

function formatMemberSince(isoDate: string | undefined): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function AccountScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { color: colors.gold, fontWeight: '600', marginLeft: 8 },
    pageTitle: { ...typography.headingSection, color: colors.foreground, marginBottom: 24 },
    card: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16 },
    fieldLabel: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
    optional: { color: colors.mutedForeground, fontWeight: '600' },
    photoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 4 },
    photoLeft: { position: 'relative' },
    photoCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', backgroundColor: colors.goldLight },
    photoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary },
    noPhoto: { fontSize: 12, color: colors.mutedForeground, fontWeight: '500' },
    photoOverlay: { position: 'absolute', left: 0, top: 0, width: 72, height: 72, borderRadius: 36, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' },
    photoRight: { flex: 1, minWidth: 0 },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.button, alignSelf: 'flex-start' },
    outlineBtnDisabled: { opacity: 0.7 },
    outlineBtnText: { color: colors.foreground, fontWeight: '600' },
    helpText: { fontSize: 12, color: colors.mutedForeground, marginTop: 6, lineHeight: 16 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    nameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.input,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.background,
      marginBottom: 12,
    },
    saveBtn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.gold,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: radius.button,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    infoIcon: { marginRight: 12 },
    infoBlock: { flex: 1 },
    infoValue: { fontSize: 16, color: colors.foreground },
    manageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 0,
      marginBottom: 8,
    },
    manageBtnText: { fontSize: 16, color: colors.foreground, fontWeight: '500' },
    remindersBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    remindersBtnText: { fontSize: 16, color: colors.foreground, fontWeight: '500' },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.destructive,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.button,
      marginTop: 24,
    },
    logoutBtnDisabled: { opacity: 0.8 },
    logoutBtnText: { fontSize: 16, color: colors.destructiveForeground, fontWeight: '600' },
    deleteAccountCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.destructive + '66',
    },
    deleteAccountTitle: { fontSize: 18, fontWeight: '600', color: colors.destructive, marginBottom: 4 },
    deleteAccountDesc: { fontSize: 14, color: colors.mutedForeground, marginBottom: 14, lineHeight: 20 },
    deleteAccountBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.destructive,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: radius.button,
      alignSelf: 'stretch',
    },
    deleteAccountBtnText: { fontSize: 16, fontWeight: '600', color: colors.destructiveForeground },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalKeyboardWrap: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '90%',
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.foreground, marginBottom: 12 },
    modalBodyText: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20, marginBottom: 8 },
    modalChallengeBox: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondary,
      padding: 12,
      borderRadius: radius.input,
      marginVertical: 10,
    },
    modalChallengeText: { fontSize: 15, fontWeight: '600', color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    modalLabel: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8, marginTop: 4 },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.input,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' },
    modalBtnOutline: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    modalBtnOutlineText: { fontSize: 15, fontWeight: '600', color: colors.foreground },
    modalBtnDanger: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: radius.button,
      backgroundColor: colors.destructive,
    },
    modalBtnDangerDisabled: { opacity: 0.5 },
    modalBtnDangerText: { fontSize: 15, fontWeight: '600', color: colors.destructiveForeground },
    sessionCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: radius.card,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sessionRowLast: { borderBottomWidth: 0 },
    sessionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: colors.secondary,
    },
    sessionBody: { flex: 1, minWidth: 0 },
    sessionTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 },
    sessionKind: { fontSize: 16, fontWeight: '600', color: colors.foreground },
    thisDevicePill: {
      backgroundColor: colors.gold + '33',
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    thisDevicePillText: { fontSize: 11, fontWeight: '600', color: colors.primary },
    activeNowPill: {
      backgroundColor: colors.sage + '33',
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.sage,
    },
    activeNowPillText: { fontSize: 11, fontWeight: '700', color: colors.foreground },
    sessionMeta: { fontSize: 13, color: colors.mutedForeground, marginBottom: 2 },
    sessionRemoveBtn: { paddingVertical: 8, paddingHorizontal: 4, alignSelf: 'flex-start' },
    sessionRemoveText: { fontSize: 14, fontWeight: '600', color: colors.destructive },
    sessionActionsRow: { flexDirection: 'column', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    sessionOutlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    sessionDangerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: radius.button,
      backgroundColor: colors.destructive,
    },
    sessionOutlineBtnText: { fontSize: 15, fontWeight: '600', color: colors.foreground },
    sessionDangerBtnText: { fontSize: 15, fontWeight: '600', color: colors.destructiveForeground },
    sessionFootnote: { fontSize: 11, color: colors.mutedForeground, textAlign: 'center', marginTop: 12, lineHeight: 16 },
    emptySessions: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.mutedForeground,
      paddingVertical: 20,
      paddingHorizontal: 8,
    },
  }));

  const { user, session, signOut, updateUser, updateUserMetadata, isSuperAdmin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loginActivity, setLoginActivity] = useState<LoginActivityRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [logoutPrompt, setLogoutPrompt] = useState<{
    title: string;
    message: string;
    scope: 'local' | 'global';
  } | null>(null);
  const [logoutWorking, setLogoutWorking] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileFullName, setProfileFullName] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadLoginActivity = useCallback(async () => {
    if (!user?.id) return;
    if (!isSupabaseConfigured) {
      setLoginActivity([]);
      return;
    }
    try {
      const full = await supabase
        .from('login_activity')
        .select('id, email, logged_at, device_id, device_label, user_agent')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(200);
      if (full.error && full.error.message?.toLowerCase().includes('column')) {
        const basic = await supabase
          .from('login_activity')
          .select('id, email, logged_at')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(200);
        const rows = (basic.data ?? []).map((r) => ({
          ...r,
          device_id: null,
          device_label: null,
          user_agent: null,
        })) as LoginActivityRow[];
        setLoginActivity(rows);
        return;
      }
      if (full.error) {
        setLoginActivity([]);
        return;
      }
      setLoginActivity((full.data as LoginActivityRow[] | null) ?? []);
    } catch {
      setLoginActivity([]);
    }
  }, [user?.id]);

  useEffect(() => {
    void getOrCreateDeviceIdAsync().then(setCurrentDeviceId);
  }, []);

  const sortedSessionsByDevice = useMemo(() => {
    const list = groupSessionsByDevice(loginActivity);
    if (!currentDeviceId) return list;
    return [...list].sort((a, b) => {
      const aHere = Boolean(a.device_id) && a.device_id === currentDeviceId;
      const bHere = Boolean(b.device_id) && b.device_id === currentDeviceId;
      if (aHere && !bHere) return -1;
      if (!aHere && bHere) return 1;
      return new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime();
    });
  }, [loginActivity, currentDeviceId]);

  const sessionsForDisplay = useMemo(() => {
    const list = sortedSessionsByDevice;
    if (!currentDeviceId) return list;
    const hasCurrent = list.some((s) => s.device_id && s.device_id === currentDeviceId);
    if (hasCurrent) return list;
    const synthetic: LoginActivityRow = {
      id: `__local_current__${currentDeviceId}`,
      email: user?.email ?? null,
      logged_at: new Date().toISOString(),
      device_id: currentDeviceId,
      device_label: getNativeDeviceLabel(),
      user_agent: getNativeUserAgentSnapshot(),
    };
    return [synthetic, ...list];
  }, [sortedSessionsByDevice, currentDeviceId, user?.email]);

  const activeSessions = useMemo(() => {
    return sessionsForDisplay.filter((s) => {
      const isThisDevice = Boolean(s.device_id) && s.device_id === currentDeviceId;
      return isSessionActiveNow(s.logged_at, isThisDevice);
    });
  }, [sessionsForDisplay, currentDeviceId]);

  // If there are any active sessions, show only those (matches "show active sessions")
  const sessionsToShow = activeSessions.length > 0 ? activeSessions : sessionsForDisplay;

  const syncSessions = useCallback(async () => {
    if (!user?.id || !session) return;
    setSessionsLoading(true);
    try {
      await recordLoginActivity(user);
      await loadLoginActivity();
    } catch (e) {
      console.warn('Active session sync:', e);
    } finally {
      setSessionsLoading(false);
    }
  }, [user?.id, session, loadLoginActivity]);

  useFocusEffect(
    useCallback(() => {
      void syncSessions();
    }, [syncSessions]),
  );

  const removeSessionFromList = async (activity: LoginActivityRow) => {
    if (!user?.id) return;
    if (!isSupabaseConfigured) {
      Alert.alert('Unavailable', 'Active sessions are stored in Supabase. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for this feature.');
      return;
    }
    const key = activity.device_id || activity.id;
    setRemovingDeviceId(key);
    try {
      if (activity.device_id) {
        const { error } = await supabase.from('login_activity').delete().eq('user_id', user.id).eq('device_id', activity.device_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('login_activity').delete().eq('id', activity.id);
        if (error) throw error;
      }
      await loadLoginActivity();
      Alert.alert('Removed', 'Session removed from this list.');
    } catch {
      Alert.alert('Error', 'Could not remove this session (Supabase may be unset or ID format changed).');
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const deleteChallengeText = useMemo(() => {
    const fullName =
      profileFullName?.trim() ||
      (user?.user_metadata?.full_name as string | undefined)?.trim() ||
      '';
    if (fullName) return fullName;
    return (user?.email ?? '').trim();
  }, [profileFullName, user?.user_metadata?.full_name, user?.email]);

  const deleteChallengeIsName = useMemo(() => {
    const fullName =
      profileFullName?.trim() ||
      (user?.user_metadata?.full_name as string | undefined)?.trim() ||
      '';
    return Boolean(fullName);
  }, [profileFullName, user?.user_metadata?.full_name]);

  const isDeleteConfirmValid = useMemo(() => {
    const expected = deleteChallengeText;
    if (!expected || !deleteAccountPassword.trim()) return false;
    const typed = deleteConfirmInput.trim();
    if (deleteChallengeIsName) {
      return typed === expected;
    }
    return typed.toLowerCase() === expected.toLowerCase();
  }, [deleteConfirmInput, deleteChallengeText, deleteChallengeIsName, deleteAccountPassword]);

  /** Public marketing home (`/`). Use go-home first so the (app) stack is cleared reliably; it replaces with `/`. */
  const goToPublicHome = () => {
    try {
      rootRouter.dismissAll();
    } catch {
      /* not in a dismissible stack */
    }
    rootRouter.replace('/go-home');
  };

  const openLogoutThisDevice = () => {
    setLogoutPrompt({
      title: 'Log out on this device?',
      message:
        'You will be signed out on this device only. Other devices stay signed in until you log them out.',
      scope: 'local',
    });
  };

  const openLogoutAllDevices = () => {
    setLogoutPrompt({
      title: 'Log out everywhere?',
      message: 'You will be signed out on every device. You will need to sign in again to use your account.',
      scope: 'global',
    });
  };

  const openLogoutFooter = () => {
    setLogoutPrompt({
      title: 'Log out?',
      message: 'Are you sure you want to log out? You will need to sign in again to access your account.',
      scope: 'local',
    });
  };

  const confirmLogoutFromModal = () => {
    if (!logoutPrompt || logoutWorking) return;
    const { scope } = logoutPrompt;
    setLogoutPrompt(null);
    setLogoutWorking(true);
    void (async () => {
      try {
        await signOut({ scope });
        goToPublicHome();
      } finally {
        setLogoutWorking(false);
      }
    })();
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || !isDeleteConfirmValid) return;
    if (!deleteAccountPassword.trim()) {
      Alert.alert('Required', 'Enter your account password to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await backendApi.deleteMyAccount(deleteAccountPassword);
      setDeleteModalVisible(false);
      setDeleteConfirmInput('');
      setDeleteAccountPassword('');
      await signOut({ scope: 'local' });
      goToPublicHome();
    } catch (e: unknown) {
      const msg =
        e instanceof SessionApiError
          ? e.hint
            ? `${e.message}\n\n${e.hint}`
            : e.message
          : e instanceof Error
            ? e.message
            : 'Could not delete account.';
      Alert.alert('Could not delete account', msg);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const n = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';
    setName(n);
  }, [user?.user_metadata?.full_name, user?.email]);

  useEffect(() => {
    if (!user?.id) return;
    const metaName = user.user_metadata?.full_name as string | undefined;
    setProfileFullName(metaName ?? null);
    const raw = (user.user_metadata?.avatar_url as string | null) ?? null;
    if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      setAvatarUrl(raw);
    } else {
      setAvatarUrl(null);
    }
  }, [user?.id, user?.user_metadata?.avatar_url, user?.user_metadata?.full_name]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    setSaving(true);
    const { error } = await updateUser({ full_name: trimmed });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to update name');
      return;
    }
    setProfileFullName(trimmed);
    Alert.alert('Success', 'Profile updated.');
  };

  const initial = (displayName || 'U').charAt(0).toUpperCase();
  const email = user?.email ?? '—';
  const phone = (user as { phone?: string })?.phone ?? user?.user_metadata?.phone ?? '—';
  const memberSince = formatMemberSince(user?.user_metadata?.created_at as string | undefined);

  const handlePickPhoto = async () => {
    if (!user?.email) return;
    try {
      setUploadingPhoto(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const mime = asset.mimeType ?? 'image/jpeg';
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (mime && !allowed.includes(mime)) {
        Alert.alert('Invalid file', 'Use JPG, PNG, WebP, or GIF (max 5MB).');
        return;
      }
      if (typeof asset.size === 'number' && asset.size > 5 * 1024 * 1024) {
        Alert.alert('Too large', 'Image must be under 5MB.');
        return;
      }

      const extGuess =
        asset.name?.split('.').pop()?.toLowerCase() ||
        (mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : 'jpg');

      const res = await backendApi.uploadAvatar({
        user_email: user.email,
        avatarFile: {
          uri: asset.uri,
          name: asset.name || `avatar.${extGuess}`,
          type: mime || 'image/jpeg',
        },
      });
      const row = (res as { data?: { user?: { avatar_url?: string | null } } }).data?.user;
      const url = row?.avatar_url ?? null;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        setAvatarUrl(url);
        updateUserMetadata({ avatar_url: url });
      }
      Alert.alert('Success', 'Photo updated successfully.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.replace('/dashboard')} style={styles.backRow}>
        <Ionicons name="arrow-back" size={22} color={colors.gold} />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </Pressable>

      <Text style={styles.pageTitle}>User Profile</Text>

      {/* Card 1: Profile */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.cardSubtitle}>Photo and display name.</Text>
        <Text style={styles.fieldLabel}>
          Profile Photo <Text style={styles.optional}>(Optional)</Text>
        </Text>
        <View style={styles.photoRow}>
          <Pressable style={styles.photoLeft} onPress={handlePickPhoto} disabled={uploadingPhoto}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.photoCircle} />
            ) : (
              <View style={[styles.photoCircle, styles.photoEmpty]}>
                <Ionicons name="camera-outline" size={28} color={colors.mutedForeground} />
                <Text style={styles.noPhoto}>No photo</Text>
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              </View>
            )}
          </Pressable>
          <View style={styles.photoRight}>
            <Pressable style={[styles.outlineBtn, uploadingPhoto && styles.outlineBtnDisabled]} onPress={handlePickPhoto} disabled={uploadingPhoto}>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.foreground} />
              <Text style={styles.outlineBtnText}>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</Text>
            </Pressable>
            <Text style={styles.helpText}>Recommended: Square image, at least 200×200px</Text>
            <Text style={styles.helpText}>Max size: 5MB • Formats: JPG, PNG, WebP, GIF</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.mutedForeground}
          editable={!saving}
        />
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={colors.goldForeground} /> : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      {/* Card 2: Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardSubtitle}>Email and member info.</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} style={styles.infoIcon} />
          <View style={styles.infoBlock}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color={colors.mutedForeground} style={styles.infoIcon} />
          <View style={styles.infoBlock}>
            <Text style={styles.fieldLabel}>Mobile number</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} style={styles.infoIcon} />
          <View style={styles.infoBlock}>
            <Text style={styles.fieldLabel}>Member since</Text>
            <Text style={styles.infoValue}>{memberSince}</Text>
          </View>
        </View>
      </View>

      {/* Active sessions — same flows as web Account */}
      <View style={styles.sessionCard}>
        <Text style={styles.cardTitle}>Active Sessions</Text>
        <Text style={styles.cardSubtitle}>Devices where your account is signed in.</Text>
        {sessionsLoading && sessionsToShow.length === 0 ? (
          <ActivityIndicator style={{ marginVertical: 16 }} color={colors.gold} />
        ) : sessionsToShow.length === 0 ? (
          <Text style={styles.emptySessions}>
            No sessions recorded yet. After you sign in, this device will appear here.
          </Text>
        ) : (
          sessionsToShow.map((activity, idx) => {
            const isThisDevice = Boolean(activity.device_id) && activity.device_id === currentDeviceId;
            const ua = activity.user_agent || '';
            const kind = getDeviceKindLabel(ua);
            const iconName =
              kind === 'Mobile' ? 'phone-portrait-outline' : kind === 'Tablet' ? 'tablet-portrait-outline' : 'desktop-outline';
            const subtitle = getSessionSubtitle(ua, activity.device_label);
            const isActiveNow = isSessionActiveNow(activity.logged_at, isThisDevice);
            const activeLabel = formatSessionActiveLabel(activity.logged_at, isThisDevice);
            const rowKey = activity.device_id || activity.id;
            const isLast = idx === sessionsToShow.length - 1;
            return (
              <View key={rowKey} style={[styles.sessionRow, isLast && styles.sessionRowLast]}>
                <View style={styles.sessionIconBox}>
                  <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={22} color={colors.mutedForeground} />
                </View>
                <View style={styles.sessionBody}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionKind}>{kind}</Text>
                    {isActiveNow ? (
                      <View style={styles.activeNowPill}>
                        <Text style={styles.activeNowPillText}>Active</Text>
                      </View>
                    ) : null}
                    {isThisDevice ? (
                      <View style={styles.thisDevicePill}>
                        <Text style={styles.thisDevicePillText}>This device</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.sessionMeta}>{subtitle}</Text>
                  <Text style={styles.sessionMeta}>Location unavailable</Text>
                  <Text style={styles.sessionMeta}>{activeLabel}</Text>
                </View>
                {!isThisDevice ? (
                  <Pressable
                    style={styles.sessionRemoveBtn}
                    onPress={() => removeSessionFromList(activity)}
                    disabled={removingDeviceId === rowKey}
                  >
                    {removingDeviceId === rowKey ? (
                      <ActivityIndicator size="small" color={colors.destructive} />
                    ) : (
                      <Text style={styles.sessionRemoveText}>Log out</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}

        <View style={styles.sessionActionsRow}>
          <Pressable
            style={styles.sessionOutlineBtn}
            onPress={openLogoutThisDevice}
            disabled={logoutWorking}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.foreground} />
            <Text style={styles.sessionOutlineBtnText}>Log out from this device</Text>
          </Pressable>
          <Pressable
            style={styles.sessionDangerBtn}
            onPress={openLogoutAllDevices}
            disabled={logoutWorking}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.destructiveForeground} />
            <Text style={styles.sessionDangerBtnText}>Log out from all devices</Text>
          </Pressable>
        </View>
        <Text style={styles.sessionFootnote}>
          Log out on another device removes it from this list. To revoke access everywhere, use Log out from all devices.
        </Text>
      </View>

      {/* Card 3: Manage account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage account</Text>
        <Text style={styles.cardSubtitle}>Password.</Text>
        <Pressable style={styles.manageBtn} onPress={() => router.push('/reset-password')}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.foreground} />
          <Text style={styles.manageBtnText}>Change password</Text>
        </Pressable>
      </View>

      <View style={styles.deleteAccountCard}>
        <Text style={styles.deleteAccountTitle}>Delete account</Text>
        <Text style={styles.deleteAccountDesc}>
          {isSuperAdmin
            ? 'Primary administrator accounts cannot be deleted from the app.'
            : 'Permanently remove your data. You will confirm with your name or email and your password.'}
        </Text>
        <Pressable
          style={[styles.deleteAccountBtn, isSuperAdmin && { opacity: 0.5 }]}
          disabled={isSuperAdmin}
          onPress={() => {
            setDeleteConfirmInput('');
            setDeleteAccountPassword('');
            setDeleteModalVisible(true);
          }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.destructiveForeground} />
          <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
        </Pressable>
      </View>

      <Pressable style={styles.remindersBtn} onPress={() => router.push('/reminders')}>
        <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
        <Text style={styles.remindersBtnText}>Reminders</Text>
      </Pressable>

      <Pressable
        style={[styles.logoutBtn, logoutWorking && styles.logoutBtnDisabled]}
        onPress={openLogoutFooter}
        disabled={logoutWorking}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructiveForeground} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </Pressable>

      <Modal
        visible={logoutPrompt != null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!logoutWorking) setLogoutPrompt(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!logoutWorking) setLogoutPrompt(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Close log out dialog"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}
            pointerEvents="box-none"
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{logoutPrompt?.title ?? ''}</Text>
              <Text style={styles.modalBodyText}>{logoutPrompt?.message ?? ''}</Text>
              <View style={styles.modalFooter}>
                <Pressable
                  style={styles.modalBtnOutline}
                  onPress={() => {
                    if (!logoutWorking) setLogoutPrompt(null);
                  }}
                  disabled={logoutWorking}
                >
                  <Text style={styles.modalBtnOutlineText}>No</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtnDanger, logoutWorking && styles.modalBtnDangerDisabled]}
                  onPress={confirmLogoutFromModal}
                  disabled={logoutWorking}
                >
                  {logoutWorking ? (
                    <ActivityIndicator size="small" color={colors.destructiveForeground} />
                  ) : (
                    <Text style={styles.modalBtnDangerText}>Yes</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setDeleteConfirmInput('');
          setDeleteAccountPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setDeleteModalVisible(false);
              setDeleteConfirmInput('');
              setDeleteAccountPassword('');
            }}
            accessibilityRole="button"
            accessibilityLabel="Close delete account dialog"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}
            pointerEvents="box-none"
          >
            <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalBodyText}>
              This will remove your app data (wills, assets, recipients, reminders, and profile). This cannot be undone.
            </Text>
            <Text style={styles.modalBodyText}>
              To confirm, type your {deleteChallengeIsName ? 'full name' : 'email'} exactly as shown below, then enter your
              account password.
            </Text>
            <View style={styles.modalChallengeBox}>
              <Text style={styles.modalChallengeText}>{deleteChallengeText || '—'}</Text>
            </View>
            <Text style={styles.modalLabel}>Confirmation</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmInput}
              onChangeText={setDeleteConfirmInput}
              placeholder={deleteChallengeIsName ? 'Type your full name' : 'Type your email'}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize={deleteChallengeIsName ? 'words' : 'none'}
              autoCorrect={false}
              autoComplete="off"
              editable={Boolean(deleteChallengeText) && !deleting}
            />
            <Text style={styles.modalLabel}>Account password</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteAccountPassword}
              onChangeText={setDeleteAccountPassword}
              placeholder="Current password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              editable={!deleting}
            />
            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalBtnOutline}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteConfirmInput('');
                  setDeleteAccountPassword('');
                }}
                disabled={deleting}
              >
                <Text style={styles.modalBtnOutlineText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnDanger, (!isDeleteConfirmValid || deleting || !deleteChallengeText) && styles.modalBtnDangerDisabled]}
                onPress={() => void handleDeleteAccount()}
                disabled={!isDeleteConfirmValid || deleting || !deleteChallengeText}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.destructiveForeground} />
                ) : (
                  <Text style={styles.modalBtnDangerText}>Delete my account</Text>
                )}
              </Pressable>
            </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}