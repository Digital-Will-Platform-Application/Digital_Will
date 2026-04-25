import { useEffect, useMemo, useRef, useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { backendApi } from '@/lib/backendApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

const PROMPTS = [
  'Start by introducing yourself and stating your full name and date.',
  'Describe your wishes for your personal belongings.',
  'Specify any special instructions for your digital assets.',
  'Share any final messages for your loved ones.',
];

export default function CreateVideoWillNativeScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background },
      content: { padding: 20, paddingBottom: 40 },
      back: { color: colors.mutedForeground, marginBottom: 20 },
      progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
      progressStepWrap: { flexDirection: 'row', alignItems: 'center' },
      progressStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
      progressActive: { backgroundColor: colors.gold },
      progressDone: { backgroundColor: colors.gold },
      progressNum: { fontSize: 12, fontWeight: '600', color: colors.foreground },
      progressLine: { width: 24, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
      title: { ...typography.headingSection, color: colors.foreground, marginBottom: 8, textAlign: 'center' },
      subtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
      cameraBox: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary, marginBottom: 16 },
      controls: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
      primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gold, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.button },
      primaryBtnText: { color: colors.goldForeground, fontWeight: '600' },
      outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.button },
      outlineBtnText: { color: colors.foreground, fontWeight: '600' },
      errorText: { color: colors.destructive, textAlign: 'center', marginBottom: 12 },
      promptsCard: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 8 },
      promptsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
      promptsTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground },
      promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
      promptNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
      promptNumText: { fontSize: 12, fontWeight: '600', color: colors.foreground },
      promptText: { flex: 1, fontSize: 14, color: colors.mutedForeground },
      navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
      navBack: { color: colors.mutedForeground },
      navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
      encryptedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
      encrypted: { fontSize: 12, color: colors.mutedForeground },
      continueBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gold, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.button },
      continueBtnDisabled: { opacity: 0.6 },
      continueBtnText: { color: colors.goldForeground, fontWeight: '600' },
    }),
  );

  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const canContinue = useMemo(() => !!localUri && !isSaving, [localUri, isSaving]);

  useEffect(() => {
    (async () => {
      try {
        if (!permission) return;
        if (!permission.granted) {
          const req = await requestPermission();
          if (!req.granted) setPermError('Camera permission is required to record.');
        }
      } catch {
        setPermError('Could not request camera permission.');
      }
    })();
  }, [permission, requestPermission]);

  const ensurePermissions = async () => {
    if (!permission) return false;
    if (permission.granted) return true;
    const req = await requestPermission();
    if (req.granted) {
      setPermError(null);
      return true;
    }
    setPermError('Camera permission is required to record.');
    Alert.alert('Permission required', 'Please allow camera permission to record your video will.', [
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
      { text: 'OK' },
    ]);
    return false;
  };

  const startRecording = async () => {
    if (isSaving || isRecording) return;
    const ok = await ensurePermissions();
    if (!ok) return;
    try {
      setLocalUri(null);
      setIsRecording(true);
      const cam: any = cameraRef.current as any;
      if (!cam?.recordAsync) {
        throw new Error('Camera not ready');
      }
      const video = await cam.recordAsync({
        maxDuration: 180,
        quality: Platform.OS === 'ios' ? '720p' : undefined,
        mute: false,
      });
      setLocalUri(video?.uri ?? null);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not start video recording. Check camera permission.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const cam: any = cameraRef.current as any;
      if (cam?.stopRecording) cam.stopRecording();
    } catch {}
  };

  const saveAndContinue = async () => {
    if (!user?.email || !localUri) return;
    setIsSaving(true);
    try {
      // Upload video to backend (R2)
      const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
      const buf = Buffer.from(b64, 'base64');
      const videoFile = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const uploadRes = await backendApi.uploadVideo({ user_email: user.email, videoFile, staging: true });
      if (!uploadRes.success) throw new Error(uploadRes.message || 'Upload failed');

      // Save will draft row
      const userId = parseInt(user.id, 10);
      await backendApi.saveWill({
        user_id: Number.isFinite(userId) ? userId : undefined,
        user_email: user.email,
        transcript: 'Video will recorded on mobile.',
        content: 'Video will recorded on mobile.',
        title: 'My Video Will',
        type: 'video',
      });

      router.replace('/assets-manage?flow=true');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back to Method Selection</Text>
      </Pressable>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={styles.progressStepWrap}>
            <View style={[styles.progressStep, step === 1 ? styles.progressActive : step < 1 ? styles.progressDone : null]}>
              {step < 1 ? <Ionicons name="checkmark" size={16} color={colors.primaryForeground} /> : <Text style={styles.progressNum}>{step}</Text>}
            </View>
            {step < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <Text style={styles.title}>Record Your Video Will</Text>
      <Text style={styles.subtitle}>Look into the camera and share your wishes. Take your time and speak naturally.</Text>

      {permError ? <Text style={styles.errorText}>{permError}</Text> : null}

      <View style={styles.cameraBox}>
        <CameraView
          ref={(r) => (cameraRef.current = r)}
          style={{ width: '100%', height: '100%' }}
          facing="front"
          mode="video"
        />
      </View>

      <View style={styles.controls}>
        {!isRecording ? (
          <Pressable style={styles.primaryBtn} onPress={startRecording} disabled={isSaving}>
            <Ionicons name="videocam" size={20} color={colors.goldForeground} />
            <Text style={styles.primaryBtnText}>{localUri ? 'Record Again' : 'Start Recording'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.outlineBtn} onPress={stopRecording} disabled={isSaving}>
            <Ionicons name="stop" size={20} color={colors.foreground} />
            <Text style={styles.outlineBtnText}>Stop</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={saveAndContinue}
          disabled={!canContinue}
        >
          {isSaving ? <ActivityIndicator size="small" color={colors.goldForeground} /> : (
            <>
              <Text style={styles.continueBtnText}>Continue to Assets</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.goldForeground} />
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.promptsCard}>
        <View style={styles.promptsHeader}>
          <Ionicons name="document-text" size={20} color={colors.gold} />
          <Text style={styles.promptsTitle}>Suggested Topics</Text>
        </View>
        {PROMPTS.map((p, i) => (
          <View key={i} style={styles.promptRow}>
            <View style={styles.promptNum}>
              <Text style={styles.promptNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.promptText}>{p}</Text>
          </View>
        ))}
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.navBack}>← Back</Text>
        </Pressable>
        <View style={styles.navRight}>
          <View style={styles.encryptedRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.mutedForeground} />
            <Text style={styles.encrypted}>Encrypted</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

