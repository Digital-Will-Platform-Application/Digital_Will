import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="audio" />
      <Stack.Screen name="video" />
      <Stack.Screen name="manual" />
      <Stack.Screen name="note" />
    </Stack>
  );
}
