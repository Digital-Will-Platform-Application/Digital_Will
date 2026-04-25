import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function VerifyRecipientScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Verify Recipient</Text>
      {token ? (
        <Text style={styles.body}>Verification token: {token}. Complete verification in the app or web.</Text>
      ) : (
        <Text style={styles.body}>Use the link from your email to verify your recipient status.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F7' },
  content: { padding: 24, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E5C', marginBottom: 16 },
  body: { fontSize: 16, color: '#cbd5e1' },
});
