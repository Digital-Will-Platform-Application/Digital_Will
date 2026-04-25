import { useState, useRef, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

const PROMPTS = [
  'Start by introducing yourself and stating your full name and date.',
  'Describe your wishes for your personal belongings.',
  'Specify any special instructions for your digital assets.',
  'Share any final messages for your loved ones.',
];

export default function CreateVideoWillScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
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
    subtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24 },
    card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 24 },
    videoPlaceholder: { aspectRatio: 16/9, backgroundColor: colors.secondary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    placeholderText: { fontSize: 16, color: colors.mutedForeground, marginTop: 8 },
    placeholderHint: { fontSize: 12, color: colors.mutedForeground, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
    controls: { alignItems: 'center' },
    startRecordBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: radius.button },
    startRecordBtnText: { color: colors.primaryForeground, fontWeight: '600', fontSize: 16 },
    controlsRow: { flexDirection: 'row', gap: 12 },
    controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border },
    controlBtnText: { color: colors.foreground, fontWeight: '600' },
    cameraErrorText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 12, paddingHorizontal: 16 },
    promptsCard: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 24 },
    promptsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    promptsTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground },
    promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    promptNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
    promptNumText: { fontSize: 12, fontWeight: '600', color: colors.foreground },
    promptText: { flex: 1, fontSize: 14, color: colors.mutedForeground },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    navBack: { color: colors.mutedForeground },
    navRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    encryptedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    encrypted: { fontSize: 12, color: colors.mutedForeground },
    continueBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gold, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.button },
    continueBtnDisabled: { opacity: 0.6 },
    continueBtnText: { color: colors.goldForeground, fontWeight: '600' },
  }));

  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isRecordingSim, setIsRecordingSim] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setCameraError('Video recording is best experienced on the web app. Create a draft here and add your video later, or use Record Audio, Manual Form, or Write a Note on this device.');
    setHasRecording(false);
    setIsRecordingSim(true);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRecordingSim(false);
      setHasRecording(true);
    }, 3000);
  };

  const handleSaveAndContinue = async () => {
    if (!user?.email) return;
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(userId)) {
      Alert.alert('Error', 'Invalid session.');
      return;
    }
    setIsSaving(true);
    try {
      await backendApi.saveWill({
        user_id: userId,
        user_email: user.email,
        transcript: 'Video will draft — add recording on web or continue your plan on mobile.',
        content: 'Video will draft.',
        title: 'My Video Will',
        type: 'video',
      });
      router.replace('/assets-manage?flow=true');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCameraError(null);
    setHasRecording(false);
    setIsRecordingSim(false);
    setRecordingTime(0);
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

      <View style={styles.card}>
        <View style={styles.videoPlaceholder}>
          <Ionicons name="videocam" size={48} color={colors.mutedForeground} />
          <Text style={styles.placeholderText}>Camera view</Text>
          <Text style={styles.placeholderHint}>Use the web app for full video recording. Here you can continue to save a draft.</Text>
        </View>
        <View style={styles.controls}>
          {!hasRecording && (
            <Pressable style={styles.startRecordBtn} onPress={handleStartRecording}>
              <Ionicons name="videocam" size={24} color={colors.primaryForeground} />
              <Text style={styles.startRecordBtnText}>{isRecordingSim ? 'Recording…' : 'Start Recording'}</Text>
            </Pressable>
          )}
          {hasRecording && (
            <View style={styles.controlsRow}>
              <Pressable style={styles.controlBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={20} color={colors.foreground} />
                <Text style={styles.controlBtnText}>Record Again</Text>
              </Pressable>
            </View>
          )}
          {cameraError && <Text style={styles.cameraErrorText}>{cameraError}</Text>}
        </View>
      </View>

      <View style={styles.promptsCard}>
        <View style={styles.promptsHeader}>
          <Ionicons name="document-text" size={20} color={colors.gold} />
          <Text style={styles.promptsTitle}>Suggested Topics</Text>
        </View>
        {PROMPTS.map((p, i) => (
          <View key={i} style={styles.promptRow}>
            <View style={styles.promptNum}><Text style={styles.promptNumText}>{i + 1}</Text></View>
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
          <Pressable
            style={[styles.continueBtn, (!hasRecording || isSaving) && styles.continueBtnDisabled]}
            onPress={handleSaveAndContinue}
            disabled={!hasRecording || isSaving}
          >
            {isSaving ? <ActivityIndicator size="small" color={colors.goldForeground} /> : (
              <>
                <Text style={styles.continueBtnText}>Continue to Assets</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.goldForeground} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}