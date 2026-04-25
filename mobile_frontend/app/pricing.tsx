import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function PricingScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Pricing</Text>
      <Text style={styles.body}>View our plans and choose what fits you.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic</Text>
        <Text style={styles.cardPrice}>Free</Text>
        <Text style={styles.cardDesc}>Get started with core features.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Premium</Text>
        <Text style={styles.cardPrice}>Contact us</Text>
        <Text style={styles.cardDesc}>Full features and support.</Text>
      </View>
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
  body: { fontSize: 16, color: '#5C6B7E', marginBottom: 24 },
  card: { backgroundColor: '#F0EDE8', borderWidth: 1, borderColor: '#E5E0D8', padding: 20, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#2C3E5C' },
  cardPrice: { fontSize: 24, color: '#C9A227', marginTop: 8 },
  cardDesc: { color: '#5C6B7E', marginTop: 4 },
  link: { color: '#C9A227', marginTop: 24 },
});
