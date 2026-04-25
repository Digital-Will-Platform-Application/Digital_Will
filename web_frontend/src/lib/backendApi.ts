const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/** Thrown when the API returns 401 — includes human-readable hint for Admin / Super Admin. */
export class SessionApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly hint?: string;

  constructor(
    message: string,
    opts: {
      status: number;
      code?: string;
      hint?: string;
    },
  ) {
    super(message);
    this.name = 'SessionApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.hint = opts.hint;
  }
}

function assertOkApiResponse(
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

function describeApiBaseUrl(): string {
  const raw = String(API_BASE_URL || '').trim();
  return raw || '(missing VITE_BACKEND_URL)';
}

function isFetchNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e ?? '');
  return /failed to fetch|networkerror|load failed|fetch/i.test(msg);
}

function networkErrorHint(): string {
  return `Network error: cannot reach API at ${describeApiBaseUrl()}. Set VITE_BACKEND_URL to your backend (Render web service URL), then redeploy the frontend.`;
}

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('legacywallet_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    return parsed?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function withAuthHeaders(extra?: Record<string, string>) {
  const token = getStoredToken();
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

export interface SaveWillRequest {
  user_id?: number;
  user_email?: string;
  transcript: string;
  content?: string;
  title?: string;
  type?: string;
  notes?: string;
}

export interface AddAssetRequest {
  user_id?: number;
  user_email?: string;
  name: string;
  category?: string;
  estimated_value?: string | number;
  description?: string;
  currency?: string;
}

export interface FinalizeWillRequest {
  user_id?: number;
  user_email?: string;
  will_id?: number;
  recipients?: Array<{ email: string; name?: string; full_name?: string }>;
}

export const backendApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (e: unknown) {
      if (isFetchNetworkError(e)) throw new Error(networkErrorHint());
      throw e;
    }

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    return result;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (e: unknown) {
      if (isFetchNetworkError(e)) throw new Error(networkErrorHint());
      throw e;
    }

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    return result;
  },

  async me(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    let result: Record<string, unknown> = {};
    try {
      result = (await response.json()) as Record<string, unknown>;
    } catch {
      /* non-JSON body */
    }
    if (!response.ok) {
      assertOkApiResponse(response, result, 'Failed to load session');
    }
    return result as unknown as AuthResponse;
  },

  async changePassword(data: {
    user_email?: string;
    current_password: string;
    new_password: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to change password');
    }
    return result;
  },

  /** Permanently delete the logged-in user (Neon/Postgres). Requires account password. */
  async deleteMyAccount(password: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ password }),
    });
    let result: Record<string, unknown> = {};
    try {
      result = (await response.json()) as Record<string, unknown>;
    } catch {
      /* non-JSON */
    }
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, 'Could not delete account');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async listRecipients(params: {
    user_id?: number;
    user_email?: string;
  }): Promise<{
    success: boolean;
    count?: number;
    data?: Array<{
      id: number;
      user_id: number;
      full_name: string;
      email: string | null;
      phone: string | null;
      relationship: string | null;
    }>;
  }> {
    let url: string;
    if (params.user_id != null && Number.isFinite(params.user_id)) {
      url = `${API_BASE_URL}/api/recipients/user/${params.user_id}`;
    } else if (params.user_email) {
      url = `${API_BASE_URL}/api/recipients/user-email/${encodeURIComponent(params.user_email.trim().toLowerCase())}`;
    } else {
      throw new Error('user_id or user_email is required');
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to load recipients');
    }
    return result;
  },

  async addRecipient(body: {
    user_email?: string;
    user_id?: number;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    relationship?: string | null;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: { id: number };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/recipients/add`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add recipient');
    }
    return result;
  },

  async listSubAdmins(): Promise<{
    success: boolean;
    data?: { admins: Array<{ id: number; username: string; email: string; created_at: string }> };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/sub-admins`, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, 'Failed to list admins');
    }
    return result as unknown as {
      success: boolean;
      data?: { admins: Array<{ id: number; username: string; email: string; created_at: string }> };
    };
  },

  async createSubAdmin(body: { full_name: string; email: string; password: string }): Promise<{
    success: boolean;
    message?: string;
    data?: { user: { id: number; username: string; email: string; created_at: string } };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/sub-admins`, {
      method: 'POST',
      headers: {
        ...withAuthHeaders({ 'Content-Type': 'application/json' }),
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, 'Failed to create admin');
    }
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: { user: { id: number; username: string; email: string; created_at: string } };
    };
  },

  async deleteSubAdmin(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/sub-admins/${id}`, {
      method: 'DELETE',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, 'Failed to remove admin');
    }
    return result as unknown as { success: boolean; message?: string };
  },

  async getAdminStats(): Promise<{
    success: boolean;
    message?: string;
    data?: {
      totalUsers: number;
      usersToday: number;
      totalAssets: number;
      assetsToday: number;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    let result: Record<string, unknown> = {};
    try {
      result = (await response.json()) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Dashboard stats: invalid response (${response.status}). Set VITE_BACKEND_URL to your API (e.g. http://localhost:3001).`,
      );
    }
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, `Dashboard stats failed (${response.status}).`);
    }
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: { totalUsers: number; usersToday: number; totalAssets: number; assetsToday: number };
    };
  },

  async getAdminUsers(sort: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
      users: Array<{ id: number; username: string; email: string; mobile: string | null; created_at: string }>;
    };
  }> {
    const qs = new URLSearchParams({ sort });
    const response = await fetch(`${API_BASE_URL}/api/admin/users?${qs}`, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, 'Failed to load users');
    }
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: {
        users: Array<{ id: number; username: string; email: string; mobile: string | null; created_at: string }>;
      };
    };
  },

  async getAdminRegistrationsOnDate(dateYmd: string): Promise<{
    success: boolean;
    message?: string;
    data?: { date: string; count: number };
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/registrations-on-date?date=${encodeURIComponent(dateYmd)}`,
      {
        method: 'GET',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
      },
    );
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok || result.success !== true) {
      assertOkApiResponse(response, result, 'Lookup failed');
    }
    return result as unknown as {
      success: boolean;
      message?: string;
      data?: { date: string; count: number };
    };
  },

  async translateNote(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/translate/note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...withAuthHeaders(),
      },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });
    const result = (await response.json()) as {
      success?: boolean;
      message?: string;
      translatedText?: string;
    };
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Translation failed');
    }
    return String(result.translatedText ?? '');
  },

  async saveWill(data: SaveWillRequest) {
    const response = await fetch(`${API_BASE_URL}/api/wills/save`, {
      method: 'POST',
      headers: withAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save will');
    }

    return result;
  },

  async getUserWill(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/wills/user/${userId}`, {
      method: 'GET',
      headers: withAuthHeaders({
        'Content-Type': 'application/json',
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch will');
    }

    return result;
  },

  /** All wills for the logged-in user (Neon), ordered by updated_at. */
  async listWills(params: {user_id?: number; user_email?: string}): Promise<{
    success: boolean;
    message?: string;
    data?: Array<{
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
    }>;
  }> {
    const q = new URLSearchParams();
    if (params.user_id != null && Number.isFinite(params.user_id)) {
      q.set('user_id', String(params.user_id));
    } else if (params.user_email) {
      q.set('user_email', params.user_email.trim().toLowerCase());
    }
    const response = await fetch(`${API_BASE_URL}/api/wills/list?${q}`, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to list wills');
    }
    return result;
  },

  async deleteWill(
    willId: number,
    params: { user_id?: number; user_email?: string }
  ): Promise<{ success: boolean; message?: string }> {
    const q = new URLSearchParams();
    if (params.user_id != null && Number.isFinite(params.user_id)) {
      q.set('user_id', String(params.user_id));
    } else if (params.user_email) {
      q.set('user_email', params.user_email.trim().toLowerCase());
    }
    const response = await fetch(`${API_BASE_URL}/api/wills/${willId}?${q}`, {
      method: 'DELETE',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete will');
    }
    return result;
  },

  async finalizeWill(data: FinalizeWillRequest) {
    try {
      console.log('Finalizing will with data:', { ...data, will_id: data.will_id });
      
      const response = await fetch(`${API_BASE_URL}/api/wills/finalize`, {
        method: 'POST',
        headers: withAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorText;
        } catch {
          // If not JSON, use the text as-is
        }
        throw new Error(errorMessage || `HTTP ${response.status}: Failed to finalize will`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Error in finalizeWill API call:', error);
      if (error.message?.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to backend server. Please check if the backend is running on ${API_BASE_URL}`);
      }
      throw error;
    }
  },

  async addAsset(data: AddAssetRequest) {
    const response = await fetch(`${API_BASE_URL}/api/assets/add`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add asset');
    }

    return result;
  },

  async getUserAssets(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/assets/user/${userId}`, {
      method: 'GET',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch assets');
    }

    return result;
  },

  async sendWillNotifications(data: FinalizeWillRequest) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/send-will-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send notifications');
    }

    return result;
  },

  async uploadAudio(data: { user_email: string; audioFile: File | Blob; staging?: boolean }) {
    const formData = new FormData();
    formData.append('audio', data.audioFile);
    formData.append('user_email', data.user_email);
    if (data.staging) {
      formData.append('staging', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/audio`, {
      method: 'POST',
      headers: withAuthHeaders(),
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload audio');
    }

    return result;
  },

  async uploadVideo(data: { user_email: string; videoFile: File | Blob; staging?: boolean }) {
    const formData = new FormData();
    formData.append('video', data.videoFile);
    formData.append('user_email', data.user_email);
    if (data.staging) {
      formData.append('staging', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/api/upload/video`, {
      method: 'POST',
      headers: withAuthHeaders(),
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload video');
    }

    return result;
  },

  async checkUploadStatus() {
    const response = await fetch(`${API_BASE_URL}/api/upload/status`, {
      method: 'GET',
    });

    const result = await response.json();
    return result;
  },

  async uploadAvatar(data: { user_email: string; avatarFile: File | Blob; staging?: boolean }) {
    const formData = new FormData();
    formData.append('avatar', data.avatarFile);
    formData.append('user_email', data.user_email);
    if (data.staging) {
      formData.append('staging', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/api/profiles/upload-avatar`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload avatar');
    }
    return result;
  },

  async uploadAssetDocument(data: { user_email: string; asset_id: number; file: File | Blob }) {
    const formData = new FormData();
    formData.append("document", data.file);
    formData.append("user_email", data.user_email);
    formData.append("asset_id", String(data.asset_id));

    const response = await fetch(`${API_BASE_URL}/api/assets/upload-document`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(result.message || "Failed to upload document");
    }
    return result as { success: boolean; message?: string; data?: { documents_url?: string } };
  },

  async sendVerificationEmail(data: { user_email: string; user_id?: number }) {
    try {
      console.log('📧 Frontend: Sending verification email to:', data.user_email);
      console.log('📧 Frontend: API URL:', `${API_BASE_URL}/api/email-verification/send-verification`);
      
      const response = await fetch(`${API_BASE_URL}/api/email-verification/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📧 Frontend: Response status:', response.status);
      
      const result = await response.json();
      console.log('📧 Frontend: Response data:', result);
      
      if (!response.ok) {
        const errorMsg = result.message || result.error || 'Failed to send verification email';
        console.error('❌ Frontend: Error response:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!result.success) {
        const errorMsg = result.message || result.error || 'Failed to send verification email';
        console.error('❌ Frontend: Success is false:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Frontend: Verification email sent successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Frontend: Exception in sendVerificationEmail:', error);
      if (error.message) {
        throw error;
      }
      throw new Error(error.message || 'Failed to send verification email. Please check your connection and try again.');
    }
  },

  async verifyEmail(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/email-verification/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Email verification failed');
    }

    return result;
  },

  async checkVerificationStatus(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/email-verification/status/${userId}`, {
      method: 'GET',
    });

    const result = await response.json();
    return result;
  },
};
