/**
 * Backend API client — aligned with web `src/lib/backendApi.ts` (Neon + Express + JWT).
 */
import { getStoredAccessToken } from '@/lib/authStorage';
import Constants from 'expo-constants';

function getExpoDevHost(): string | null {
  const candidates: Array<unknown> = [
    // SDK 49+ (often set in Expo Go / dev builds)
    (Constants as any)?.expoConfig?.hostUri,
    // Older manifests / some environments
    (Constants as any)?.manifest?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string' || !c.trim()) continue;
    // hostUri/debuggerHost formats: "192.168.x.x:808x", "192.168.x.x:19000", etc.
    const host = c.split(':')[0]?.trim();
    if (host) return host;
  }
  return null;
}

function resolveApiBaseUrl(): string {
  const extra = (Constants as { expoConfig?: { extra?: { backendUrl?: string } } })?.expoConfig?.extra;
  const fromManifest = typeof extra?.backendUrl === 'string' ? extra.backendUrl.trim() : '';
  const fromEnv = typeof process.env.EXPO_PUBLIC_BACKEND_URL === 'string' ? process.env.EXPO_PUBLIC_BACKEND_URL.trim() : '';
  // Metro inlines EXPO_PUBLIC_*; manifest `extra.backendUrl` covers release APKs when env was set at build time.
  const raw = String(fromEnv || fromManifest || 'http://localhost:3001').replace(/\/+$/, '');

  // When running on a physical device, "localhost" points to the phone, not your PC.
  // If the developer forgot to set EXPO_PUBLIC_BACKEND_URL, auto-derive the PC IP from Expo hostUri.
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);
  if (isLocalhost) {
    const host = getExpoDevHost();
    if (host) return `http://${host}:3001`;
  }
  return raw;
}

const API_BASE_URL = resolveApiBaseUrl();

export class SessionApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly hint?: string;

  constructor(
    message: string,
    opts: { status: number; code?: string; hint?: string },
  ) {
    super(message);
    this.name = 'SessionApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.hint = opts.hint;
  }
}

function joinUrl(path: string): string {
  return `${API_BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1');
}

async function parseJsonSafe(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Read body once; parse JSON or keep a short text snippet (HTML/plain errors from proxies). */
async function readJsonResponse(response: Response): Promise<{
  json: Record<string, unknown>;
  rawSnippet?: string;
}> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return { json: {} };
  try {
    return { json: JSON.parse(trimmed) as Record<string, unknown> };
  } catch {
    return { json: {}, rawSnippet: trimmed.slice(0, 280) };
  }
}

function apiReachabilityHint(): string {
  return `API: ${API_BASE_URL} — set EXPO_PUBLIC_BACKEND_URL in mobile_frontend/.env (expo start) and the same in eas.json env for APK builds.`;
}

function assertOk(
  response: Response,
  result: Record<string, unknown>,
  fallbackMessage: string,
): void {
  if (response.ok && result.success === true) return;
  const msg = (typeof result.message === 'string' && result.message) || fallbackMessage;
  const code = typeof result.code === 'string' ? result.code : undefined;
  const hint = typeof result.hint === 'string' ? result.hint : undefined;
  if (response.status === 401) {
    throw new SessionApiError(msg, { status: 401, code, hint });
  }
  throw new Error(msg);
}

async function withAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getStoredAccessToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  mobile?: string;
  password: string;
  confirm_password: string;
  address1?: string;
  address2?: string;
  age?: number;
  gender?: string;
  state?: string;
  postal_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      username: string;
      email: string;
      mobile?: string;
      address1?: string;
      address2?: string;
      age?: number;
      gender?: string;
      state?: string;
      postal_code?: string;
      avatar_url?: string | null;
      is_admin?: boolean;
      is_super_admin?: boolean;
      created_at: string;
    };
    token: string;
  };
}

export interface WillRow {
  id: number;
  user_id: number;
  title: string | null;
  type: string | null;
  status: string | null;
  content: string | null;
  transcript: string | null;
  audio_url: string | null;
  video_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AssetRow {
  id: number;
  user_id: number;
  name: string;
  category: string | null;
  estimated_value: number | null;
  description?: string | null;
  currency?: string | null;
}

export interface RecipientRow {
  id: number;
  user_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  address?: string | null;
  image_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
}

export interface AdminStats {
  totalUsers: number;
  usersToday: number;
  totalAssets: number;
  assetsToday: number;
  totalRegisteredEmails?: number;
  usersThisWeek?: number;
  usersThisMonth?: number;
  usersThisYear?: number;
  usersLast7Days?: number;
  dailyRegistrations?: Array<{ date: string; count: number; shortLabel: string }>;
  monthlyRegistrationsThisYear?: Array<{ month: number; monthLabel: string; count: number }>;
  yearlyRegistrations?: Array<{ year: number; count: number }>;
}

export interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  mobile: string | null;
  created_at: string;
}

export interface AdminSubAdminRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export const backendApi = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    let response: Response;
    try {
      response = await fetch(joinUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      const base = e instanceof Error ? e.message : 'Network error';
      throw new Error(`${base}\n${apiReachabilityHint()}`);
    }
    const { json: result, rawSnippet } = await readJsonResponse(response);
    if (!response.ok) {
      const msg =
        (typeof result.message === 'string' && result.message) ||
        rawSnippet ||
        `Request failed (${response.status})`;
      throw new Error(msg);
    }
    return result as unknown as AuthResponse;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    let response: Response;
    try {
      response = await fetch(joinUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.trim().toLowerCase(), password: data.password }),
      });
    } catch (e) {
      const base = e instanceof Error ? e.message : 'Network error';
      throw new Error(`${base}\n${apiReachabilityHint()}`);
    }
    const { json: result, rawSnippet } = await readJsonResponse(response);
    if (!response.ok) {
      const msg =
        (typeof result.message === 'string' && result.message) ||
        rawSnippet ||
        `Request failed (${response.status})`;
      throw new Error(msg);
    }
    return result as unknown as AuthResponse;
  },

  async me(): Promise<AuthResponse> {
    const response = await fetch(joinUrl('/api/auth/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(await withAuthHeaders()),
      },
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      assertOk(response, result, 'Failed to load session');
    }
    return result as unknown as AuthResponse;
  },

  async changePassword(data: {
    user_email: string;
    current_password: string;
    new_password: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch(joinUrl('/api/auth/change-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to change password');
    }
    return result as unknown as { success: boolean; message: string };
  },

  async deleteMyAccount(password: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl('/api/auth/delete-account'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await withAuthHeaders()),
      },
      body: JSON.stringify({ password }),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok || result.success !== true) {
      assertOk(response, result, 'Could not delete account');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async listWills(params: { user_id?: number; user_email?: string }): Promise<{
    success: boolean;
    message?: string;
    data?: WillRow[];
  }> {
    const q = new URLSearchParams();
    if (params.user_id != null && Number.isFinite(params.user_id)) {
      q.set('user_id', String(params.user_id));
    } else if (params.user_email) {
      q.set('user_email', params.user_email.trim().toLowerCase());
    } else {
      throw new Error('user_id or user_email is required');
    }
    const response = await fetch(joinUrl(`/api/wills/list?${q}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to list wills');
    }
    return result as unknown as { success: boolean; message?: string; data?: WillRow[] };
  },

  async getWillById(
    willId: number,
    params: { user_id?: number; user_email?: string },
  ): Promise<{ success: boolean; message?: string; data?: WillRow }> {
    const q = new URLSearchParams();
    if (params.user_id != null && Number.isFinite(params.user_id)) {
      q.set('user_id', String(params.user_id));
    } else if (params.user_email) {
      q.set('user_email', params.user_email.trim().toLowerCase());
    }
    const response = await fetch(joinUrl(`/api/wills/${willId}?${q}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to fetch will');
    }
    return result as unknown as { success: boolean; message?: string; data?: WillRow };
  },

  async deleteWill(
    willId: number,
    params: { user_id?: number; user_email?: string },
  ): Promise<{ success: boolean; message?: string }> {
    const q = new URLSearchParams();
    if (params.user_id != null && Number.isFinite(params.user_id)) {
      q.set('user_id', String(params.user_id));
    } else if (params.user_email) {
      q.set('user_email', params.user_email.trim().toLowerCase());
    }
    const response = await fetch(joinUrl(`/api/wills/${willId}?${q}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to delete will');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async saveWill(data: {
    user_id?: number;
    user_email?: string;
    transcript: string;
    content?: string;
    title?: string;
    type?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string; data?: WillRow }> {
    const response = await fetch(joinUrl('/api/wills/save'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to save will');
    }
    return result as unknown as { success: boolean; message?: string; data?: WillRow };
  },

  async finalizeWill(data: {
    user_id?: number;
    user_email?: string;
    will_id?: number;
    recipients?: Array<{ email: string; name?: string; full_name?: string }>;
  }): Promise<Record<string, unknown>> {
    const response = await fetch(joinUrl('/api/wills/finalize'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to finalize will');
    }
    return result;
  },

  async getUserAssets(userId: number): Promise<{ success: boolean; data?: AssetRow[]; message?: string }> {
    const response = await fetch(joinUrl(`/api/assets/user/${userId}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to fetch assets');
    }
    return result as unknown as { success: boolean; data?: AssetRow[]; message?: string };
  },

  async addAsset(data: {
    user_id?: number;
    user_email?: string;
    name: string;
    category?: string;
    estimated_value?: string | number;
    description?: string;
    currency?: string;
  }): Promise<{ success: boolean; message?: string; data?: AssetRow }> {
    const response = await fetch(joinUrl('/api/assets/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to add asset');
    }
    return result as unknown as { success: boolean; message?: string; data?: AssetRow };
  },

  async getAssetById(assetId: number): Promise<{ success: boolean; data?: AssetRow; message?: string }> {
    const response = await fetch(joinUrl(`/api/assets/${assetId}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to fetch asset');
    }
    return result as unknown as { success: boolean; data?: AssetRow; message?: string };
  },

  async deleteAsset(assetId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl(`/api/assets/${assetId}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to delete asset');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async getRecipientsByEmail(userEmail: string): Promise<{
    success: boolean;
    data?: RecipientRow[];
    message?: string;
  }> {
    const response = await fetch(
      joinUrl(`/api/recipients/user-email/${encodeURIComponent(userEmail.trim().toLowerCase())}`),
      { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    );
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to load recipients');
    }
    return result as unknown as { success: boolean; data?: RecipientRow[]; message?: string };
  },

  async addRecipient(data: {
    user_email: string;
    full_name: string;
    email?: string;
    phone?: string;
    relationship?: string;
    address?: string;
  }): Promise<{ success: boolean; message?: string; data?: RecipientRow }> {
    const response = await fetch(joinUrl('/api/recipients/add'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to add recipient');
    }
    return result as unknown as { success: boolean; message?: string; data?: RecipientRow };
  },

  async updateRecipient(
    recipientId: number,
    data: {
      user_email: string;
      full_name?: string;
      email?: string;
      phone?: string;
      relationship?: string;
      address?: string;
    },
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl(`/api/recipients/${recipientId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to update recipient');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async deleteRecipient(
    recipientId: number,
    data: { user_email: string },
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl(`/api/recipients/${recipientId}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to remove recipient');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async uploadAudio(data: {
    user_email: string;
    audioFile: Blob | ArrayBuffer | Uint8Array;
    staging?: boolean;
  }): Promise<{ success: boolean; message?: string; data?: { url?: string; audio_url?: string } }> {
    const formData = new FormData();
    let blob: Blob;
    if (data.audioFile instanceof Blob) {
      blob = data.audioFile;
    } else if (data.audioFile instanceof ArrayBuffer) {
      blob = new Blob([data.audioFile], { type: 'audio/webm' });
    } else {
      blob = new Blob([Uint8Array.from(data.audioFile)], { type: 'audio/webm' });
    }
    formData.append('audio', blob as unknown as Blob, 'audio-will.webm');
    formData.append('user_email', data.user_email);
    if (data.staging) formData.append('staging', 'true');

    const response = await fetch(joinUrl('/api/upload/audio'), { method: 'POST', body: formData });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to upload audio');
    }
    return result as unknown as { success: boolean; message?: string; data?: { url?: string; audio_url?: string } };
  },

  async uploadVideo(data: {
    user_email: string;
    videoFile: Blob | ArrayBuffer | Uint8Array;
    staging?: boolean;
  }): Promise<{ success: boolean; message?: string; data?: { url?: string; video_url?: string } }> {
    const formData = new FormData();
    let blob: Blob;
    if (data.videoFile instanceof Blob) {
      blob = data.videoFile;
    } else if (data.videoFile instanceof ArrayBuffer) {
      blob = new Blob([data.videoFile], { type: 'video/webm' });
    } else {
      blob = new Blob([Uint8Array.from(data.videoFile)], { type: 'video/webm' });
    }
    formData.append('video', blob as unknown as Blob, 'video-will.webm');
    formData.append('user_email', data.user_email);
    if (data.staging) formData.append('staging', 'true');

    const response = await fetch(joinUrl('/api/upload/video'), { method: 'POST', body: formData });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to upload video');
    }
    return result as unknown as { success: boolean; message?: string; data?: { url?: string; video_url?: string } };
  },

  async uploadAvatar(data: {
    user_email: string;
    avatarFile: Blob | { uri: string; name?: string; type?: string };
    staging?: boolean;
  }): Promise<{ success: boolean; message?: string; data?: { avatar_url?: string } }> {
    const formData = new FormData();
    formData.append('user_email', data.user_email);
    if (data.staging) formData.append('staging', 'true');
    const f = data.avatarFile;
    if (typeof Blob !== 'undefined' && f instanceof Blob) {
      formData.append('avatar', f);
    } else if (f && typeof (f as { uri?: string }).uri === 'string') {
      const file = f as { uri: string; name?: string; type?: string };
      formData.append('avatar', {
        uri: file.uri,
        name: file.name || 'avatar.jpg',
        type: file.type || 'image/jpeg',
      } as unknown as Blob);
    }

    const response = await fetch(joinUrl('/api/profiles/upload-avatar'), { method: 'POST', body: formData });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to upload avatar');
    }
    return result as unknown as { success: boolean; message?: string; data?: { avatar_url?: string } };
  },

  async profileUpdate(body: {
    user_email: string;
    avatar_url?: string | null;
    full_name?: string | null;
    mobile?: string | null;
  }): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl('/api/profiles/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to update profile');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async translateNote(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    const response = await fetch(joinUrl('/api/translate/note'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await withAuthHeaders()),
      },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });
    const result = (await parseJsonSafe(response)) as {
      success?: boolean;
      message?: string;
      translatedText?: string;
    };
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Translation failed');
    }
    return String(result.translatedText ?? '');
  },

  async sendVerificationEmail(data: { user_email: string; user_id?: number }): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl('/api/email-verification/send-verification'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Failed to send verification email');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async verifyEmail(token: string): Promise<Record<string, unknown>> {
    const response = await fetch(
      joinUrl(`/api/email-verification/verify?token=${encodeURIComponent(token)}`),
      { method: 'GET' },
    );
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Email verification failed');
    }
    return result;
  },

  async checkVerificationStatus(userId: number): Promise<Record<string, unknown>> {
    const response = await fetch(joinUrl(`/api/email-verification/status/${userId}`), {
      method: 'GET',
    });
    return parseJsonSafe(response);
  },

  async saveChatMessage(data: {
    user_email?: string;
    user_id?: number;
    role: 'user' | 'assistant';
    content: string;
    will_id?: number;
    audio_url?: string;
    video_url?: string;
  }): Promise<Record<string, unknown>> {
    const response = await fetch(joinUrl('/api/chat/message'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error((result.message as string) || 'Chat save failed');
    }
    return result;
  },

  async checkUploadStatus(): Promise<Record<string, unknown>> {
    const response = await fetch(joinUrl('/api/upload/status'), { method: 'GET' });
    return parseJsonSafe(response);
  },

  async listSubAdmins(): Promise<{
    success: boolean;
    data?: { admins: AdminSubAdminRow[] };
  }> {
    const response = await fetch(joinUrl('/api/admin/sub-admins'), {
      method: 'GET',
      headers: await withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await parseJsonSafe(response);
    assertOk(response, result, 'Failed to list admins');
    return result as unknown as { success: boolean; data?: { admins: AdminSubAdminRow[] } };
  },

  async createSubAdmin(body: {
    full_name: string;
    email: string;
    password: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: { user: AdminSubAdminRow };
  }> {
    const response = await fetch(joinUrl('/api/admin/sub-admins'), {
      method: 'POST',
      headers: await withAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const result = await parseJsonSafe(response);
    assertOk(response, result, 'Failed to create admin');
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: { user: AdminSubAdminRow };
    };
  },

  async deleteSubAdmin(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(joinUrl(`/api/admin/sub-admins/${id}`), {
      method: 'DELETE',
      headers: await withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await parseJsonSafe(response);
    assertOk(response, result, 'Failed to remove admin');
    return result as unknown as { success: boolean; message?: string };
  },

  async getAdminStats(): Promise<{
    success: boolean;
    message?: string;
    data?: AdminStats;
  }> {
    const response = await fetch(joinUrl('/api/admin/stats'), {
      method: 'GET',
      headers: await withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await parseJsonSafe(response);
    assertOk(response, result, 'Failed to load admin stats');
    return result as unknown as { success: boolean; message?: string; data?: AdminStats };
  },

  async getAdminUsers(sort: 'newest' | 'name' | 'email' = 'name'): Promise<{
    success: boolean;
    message?: string;
    data?: { users: AdminUserRow[] };
  }> {
    const qs = new URLSearchParams({ sort });
    const response = await fetch(joinUrl(`/api/admin/users?${qs.toString()}`), {
      method: 'GET',
      headers: await withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await parseJsonSafe(response);
    assertOk(response, result, 'Failed to load users');
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: { users: AdminUserRow[] };
    };
  },

  async getAdminRegistrationsOnDate(dateYmd: string): Promise<{
    success: boolean;
    message?: string;
    data?: { date: string; count: number };
  }> {
    const response = await fetch(
      joinUrl(`/api/admin/registrations-on-date?date=${encodeURIComponent(dateYmd)}`),
      {
        method: 'GET',
        headers: await withAuthHeaders({ 'Content-Type': 'application/json' }),
      },
    );
    const result = await parseJsonSafe(response);
    assertOk(response, result, 'Failed to lookup registrations');
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: { date: string; count: number };
    };
  },
};
