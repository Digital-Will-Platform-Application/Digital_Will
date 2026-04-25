import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/(tabs)/dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
  return null;
}
