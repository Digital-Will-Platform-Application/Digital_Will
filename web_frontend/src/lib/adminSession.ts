import { toast } from 'sonner';
import { SessionApiError } from '@/lib/backendApi';

/**
 * When an admin API returns 401, show a clear message and return the user to Login.
 * Super Admin and secondary admin both use the same login page.
 */
export async function handleAdminApiSessionError(
  e: unknown,
  signOut: () => void | Promise<void>,
): Promise<boolean> {
  if (!(e instanceof SessionApiError) || e.status !== 401) return false;
  toast.error(e.message, {
    description: e.hint,
    duration: 14_000,
  });
  await Promise.resolve(signOut());
  window.location.replace('/login');
  return true;
}
