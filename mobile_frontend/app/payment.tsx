import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.body}>Complete your subscription or one-time payment here.</Text>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F7' },
  content: { padding: 24 },
  back: { color: '#5C6B7E', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E5C', marginBottom: 16 },
  body: { fontSize: 16, color: '#cbd5e1', marginBottom: 24 },
  link: { color: '#C9A227', marginTop: 24 },
});
