import { Stack } from 'expo-router';

export default function RecipientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
    </Stack>
  );
}
