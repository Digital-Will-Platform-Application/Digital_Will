import { useState, useEffect } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Audio, Video, ResizeMode } from 'expo-av';

type Will = {
  id: string;
  title: string;
  status: string;
  type: string;
  content: string | null;
  transcript: string | null;
  notes: string | null;
  audio_url?: string | null;
  video_url?: string | null;
};

export default function WillDetailScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9F7' },
    content: { padding: 24 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F7' },
    error: { color: '#ef4444', marginBottom: 12 },
    back: { color: '#5C6B7E', marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E5C', marginBottom: 4 },
    meta: { color: '#5C6B7E', marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
    body: { color: colors.mutedForeground, lineHeight: 22 },
    button: { backgroundColor: colors.gold, paddingVertical: 14, borderRadius: radius.button, alignItems: 'center' },
    buttonText: { color: colors.goldForeground, fontWeight: '600' },
    link: { color: colors.gold, marginTop: 12, fontWeight: '600' },
  }));

  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [will, setWill] = useState<Will | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const willId = parseInt(String(id), 10);
    const userId = parseInt(user.id, 10);
    if (Number.isNaN(willId) || Number.isNaN(userId)) {
      setWill(null);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await backendApi.getWillById(willId, { user_id: userId });
        const w = res.data;
        if (!w) {
          setWill(null);
        } else {
          setWill({
            id: String(w.id),
            title: w.title || 'Untitled',
            status: w.status || 'draft',
            type: w.type || 'text',
            content: w.content,
            transcript: w.transcript,
            notes: w.notes,
            audio_url: w.audio_url,
            video_url: w.video_url,
          });
        }
      } catch {
        setWill(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, [sound]);

  const playAudio = async () => {
    if (!will?.audio_url) return;
    try {
      setIsPlayingAudio(true);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      const res = await Audio.Sound.createAsync({ uri: will.audio_url }, { shouldPlay: true });
      setSound(res.sound);
      res.sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) setIsPlayingAudio(false);
      });
    } catch (e) {
      console.error(e);
      setIsPlayingAudio(false);
      Alert.alert('Error', 'Could not play audio.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!will) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Will not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>{will.title || 'Untitled'}</Text>
      <Text style={styles.meta}>{will.status} · {will.type}</Text>
      {will.audio_url ? (
        <Pressable style={styles.button} onPress={playAudio} disabled={isPlayingAudio}>
          <Text style={styles.buttonText}>{isPlayingAudio ? 'Playing…' : 'Play Audio'}</Text>
        </Pressable>
      ) : null}
      {will.video_url ? (
        <View style={{ width: '100%', aspectRatio: 16 / 9, marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
          <Video
            source={{ uri: will.video_url }}
            style={{ width: '100%', height: '100%' }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      ) : null}
      {(will.content || will.transcript) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <Text style={styles.body}>{will.content || will.transcript || ''}</Text>
        </View>
      )}
      {will.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.body}>{will.notes}</Text>
        </View>
      )}
      <Pressable style={styles.button} onPress={() => router.push('/review')}>
        <Text style={styles.buttonText}>Review & submit</Text>
      </Pressable>
    </ScrollView>
  );
}