import { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import { backendApi } from '@/lib/backendApi';

function formatMemberSince(isoDate: string | undefined): string {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function AdminProfileScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 32 },
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
    profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    nameRow: { flex: 1, minWidth: 0 },
    label: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
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
    value: { fontSize: 16, color: colors.foreground, marginBottom: 12 },
    fieldRow: { marginBottom: 12 },
    saveBtn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.gold,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: radius.button,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: colors.goldForeground, fontWeight: '600', fontSize: 14 },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.destructive,
      paddingVertical: 16,
      borderRadius: radius.button,
      marginTop: 24,
    },
    logoutBtnDisabled: { opacity: 0.8 },
    logoutBtnText: { fontSize: 16, color: colors.primaryForeground, fontWeight: '600' },
  }));

  const { user, signOut, updateUser, updatePassword, updateUserMetadata } = useAuth();
  const router = useRouter();
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Admin';
  const [name, setName] = useState(displayName);
  const [mobile, setMobile] = useState((user?.user_metadata?.phone as string) ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const raw = (user.user_metadata?.avatar_url as string | null) ?? null;
    if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      setAvatarUrl(raw);
    } else {
      setAvatarUrl(null);
    }
  }, [user?.id, user?.user_metadata?.avatar_url]);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    signOut();
    router.replace('/go-home');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateUser({ full_name: name.trim(), mobile: mobile.trim() });
    setSaving(false);
    if (error) Alert.alert('Error', error.message || 'Failed to update.');
    else Alert.alert('Success', 'Profile updated.');
  };

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

  const handleUpdatePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(currentPassword, newPassword);
    setSaving(false);
    if (error) Alert.alert('Error', error.message || 'Failed to update password.');
    else {
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password updated.');
    }
  };

  const initial = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.replace('/admin/(tabs)/dashboard')} style={styles.backRow}>
        <Ionicons name="arrow-back" size={22} color={colors.gold} />
        <Text style={styles.backText}>Back to Dashboard</Text>
      </Pressable>

      <Text style={styles.pageTitle}>Admin Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.cardSubtitle}>Photo and display name.</Text>
        <Text style={styles.label}>
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

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="admin"
          placeholderTextColor={colors.mutedForeground}
          editable={!saving}
        />
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveProfile} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={colors.goldForeground} /> : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardSubtitle}>Email and mobile number.</Text>
        <View style={styles.fieldRow}>
          <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} />
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="call-outline" size={20} color={colors.mutedForeground} />
          <Text style={styles.label}>Add mobile number</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            placeholder="e.g. 9876543210 or +91 9876543210"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            editable={!saving}
          />
          <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveProfile} disabled={saving}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
        <View style={styles.fieldRow}>
          <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
          <Text style={styles.label}>Member since</Text>
          <Text style={styles.value}>{formatMemberSince(user?.user_metadata?.created_at as string | undefined)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change password</Text>
        <Text style={styles.cardSubtitle}>Set a new password for your admin account.</Text>
        <TextInput
          style={styles.input}
          placeholder="Current password"
          placeholderTextColor={colors.mutedForeground}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="New password (min 8 characters)"
          placeholderTextColor={colors.mutedForeground}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!saving}
        />
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleUpdatePassword} disabled={saving}>
          <Text style={styles.saveBtnText}>Update password</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Ionicons name="log-out-outline" size={20} color={colors.primaryForeground} />
        )}
        <Text style={styles.logoutBtnText}>{loggingOut ? 'Logging out…' : 'Logout'}</Text>
      </Pressable>
    </ScrollView>
  );
}