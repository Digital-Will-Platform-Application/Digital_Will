import { isMobileLikeUserAgent } from '@/lib/deviceSession';

export type LoginActivityRow = {
  id: string;
  email: string | null;
  logged_at: string;
  device_id: string | null;
  device_label: string | null;
  user_agent: string | null;
};

export function groupSessionsByDevice(rows: LoginActivityRow[]): LoginActivityRow[] {
  const map = new Map<string, LoginActivityRow>();
  for (const row of rows) {
    const key = row.device_id?.trim() || row.id;
    const prev = map.get(key);
    if (!prev || new Date(row.logged_at) > new Date(prev.logged_at)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
  );
}

export function getSessionSubtitle(ua: string, deviceLabel: string | null): string {
  if (deviceLabel?.trim()) return deviceLabel.replace(/\s+on\s+/i, ' - ');
  if (!ua) return 'Unknown device';
  if (/DigitalWillApp/i.test(ua)) return ua.replace(/^DigitalWillApp\/[^ ]+\s*/, '').replace(/^\((.*)\)$/, '$1');
  return 'Web session';
}

export function getDeviceKindLabel(ua: string): 'Desktop' | 'Mobile' | 'Tablet' {
  if (/iPad/i.test(ua)) return 'Tablet';
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'Tablet';
  if (isMobileLikeUserAgent(ua)) return 'Mobile';
  return 'Desktop';
}

export function isSessionActiveNow(loggedAt: string, isThisDevice: boolean): boolean {
  const d = new Date(loggedAt).getTime();
  const diffMs = Date.now() - d;
  if (!Number.isFinite(diffMs) || diffMs < 0) return false;
  if (isThisDevice) return diffMs < 20 * 60 * 1000;
  return diffMs < 120_000;
}

export function formatSessionActiveLabel(loggedAt: string, isThisDevice: boolean): string {
  const d = new Date(loggedAt).getTime();
  const diffMs = Date.now() - d;
  if (isThisDevice && diffMs < 20 * 60 * 1000) return 'Active now';
  if (diffMs < 120_000) return 'Active now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
