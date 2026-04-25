import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

export default function AppIndex() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    queueMicrotask(() => router.replace('/dashboard'));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only; omit router to prevent loop
  }, []);

  return null;
}
