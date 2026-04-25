import { useState, useRef, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';

const PROMPTS = [
  'Start by introducing yourself and stating your full name and date.',
  'Describe your wishes for your personal belongings.',
  'Specify any special instructions for your digital assets.',
  'Share any final messages for your loved ones.',
];

export default function CreateAudioWillScreen() {
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
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
    },
    errorText: { color: colors.destructive, textAlign: 'center', marginVertical: 16 },
    micButton: {
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    timer: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 40, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
    statusText: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16, textAlign: 'center' },
    controlsRow: { flexDirection: 'row', gap: 16 },
    controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border },
    controlBtnText: { color: colors.foreground, fontWeight: '600' },
    stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: radius.button, backgroundColor: colors.destructive },
    stopBtnText: { color: '#fff', fontWeight: '600' },
    startOverBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
    startOverBtnText: { color: colors.mutedForeground },
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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') setPermError('Microphone permission is required to record.');
      } catch (e) {
        setPermError('Could not set up audio.');
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch {}
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    if (permError || isSaving) return;
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      await recording.startAsync();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setHasRecording(false);
      setIsSaved(false);
      startTimer();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not start recording. Check microphone permission.');
    }
  };

  const handlePauseResume = async () => {
    if (!recordingRef.current || !isRecording) return;
    try {
      if (isPaused) {
        await recordingRef.current.startAsync();
        startTimer();
      } else {
        await recordingRef.current.pauseAsync();
        stopTimer();
      }
      setIsPaused(!isPaused);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopAndSave = async () => {
    if (!recordingRef.current || !user || !isRecording) return;
    setIsSaving(true);
    setUploadError(null);
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
    try {
      const rec = recordingRef.current;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording URI');
      setHasRecording(true);
      // Recording is now stored locally (device file system), allow continuing even if upload fails.
      setIsSaved(true);

      // Read audio file and upload to Cloudflare R2 storage
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const buf = Buffer.from(b64, 'base64');
      const audioFile = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

      const { backendApi } = await import('@/lib/backendApi');
      
      const uploadResult = await backendApi.uploadAudio({
        user_email: user.email ?? '',
        audioFile,
        staging: true // Use staging bucket in development
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Failed to upload audio to R2');
      }

      console.log('Audio uploaded to R2:', uploadResult.data?.upload?.url);
    } catch (e) {
      console.error(e);
      setUploadError('Audio saved on device, but upload failed. You can still continue to Assets.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setHasRecording(false);
    setIsSaved(false);
  };

  const handleContinue = () => {
    router.replace('/assets-manage?flow=true');
  };

  const statusText = isSaving
    ? 'Saving recording...'
    : isRecording
    ? isPaused
      ? 'Recording paused'
      : 'Recording in progress...'
    : isSaved
    ? 'Recording saved successfully!'
    : hasRecording
    ? 'Recording complete'
    : 'Click the button above to start recording';

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
      <Text style={styles.title}>Record Your Audio Will</Text>
      <Text style={styles.subtitle}>Speak naturally and share your wishes. We'll transcribe everything for you.</Text>

      <View style={styles.card}>
        {permError ? (
          <Text style={styles.errorText}>{permError}</Text>
        ) : (
          <>
            {!isRecording && !isSaved && (
              <Pressable style={styles.micButton} onPress={handleStartRecording} disabled={isSaving}>
                <Ionicons name="mic" size={48} color={colors.goldForeground} />
              </Pressable>
            )}
            <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
            <Text style={styles.statusText}>{statusText}</Text>
            {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
            {isRecording && (
              <View style={styles.controlsRow}>
                <Pressable style={styles.controlBtn} onPress={handlePauseResume} disabled={isSaving}>
                  <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={colors.foreground} />
                  <Text style={styles.controlBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </Pressable>
                <Pressable style={styles.stopBtn} onPress={handleStopAndSave} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="stop" size={24} color="#fff" />
                      <Text style={styles.stopBtnText}>Stop and Save</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
            {!isSaved && !isRecording && hasRecording && (
              <Pressable style={styles.startOverBtn} onPress={handleReset} disabled={isSaving}>
                <Ionicons name="refresh" size={20} color={colors.foreground} />
                <Text style={styles.startOverBtnText}>Start Over</Text>
              </Pressable>
            )}
          </>
        )}
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
            style={[styles.continueBtn, (!isSaved || isSaving) && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isSaved || isSaving}
          >
            <Text style={styles.continueBtnText}>Continue to Assets</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.goldForeground} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}