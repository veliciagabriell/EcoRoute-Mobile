import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post, setAccessToken } from '@/utils/api';

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'public' | 'officer' | 'admin';
  work_area?: string | null;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

type WebAuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
};

const STORAGE_KEY = 'ecoroute.session.v1';

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role: 'public' | 'officer' | 'admin';
}) {
  try {
    const data = normalizeAuthResponse(await post('/auth/register', payload));
    await saveSession(data);
    return data;
  } catch (err) {
    throw new Error(getAuthErrorMessage(err));
  }
}

export async function loginUser(payload: { email: string; password: string }) {
  try {
    const data = normalizeAuthResponse(await post('/auth/login', payload));
    await saveSession(data);
    return data;
  } catch (err) {
    throw new Error(getAuthErrorMessage(err));
  }
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    let response: ApiResponse<{ accessToken?: string; access_token?: string }> | { accessToken?: string; access_token?: string };
    try {
      response = (await post('/auth/refresh', { refreshToken })) as
        | ApiResponse<{ accessToken?: string; access_token?: string }>
        | { accessToken?: string; access_token?: string };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.toLowerCase().includes('refresh')) throw err;
      response = (await post('/auth/refresh', { refresh_token: refreshToken })) as
        | ApiResponse<{ accessToken?: string; access_token?: string }>
        | { accessToken?: string; access_token?: string };
    }
    const payload = (
      'data' in response && response.data ? response.data : response
    ) as { accessToken?: string; access_token?: string };
    const accessToken = payload.accessToken || payload.access_token;
    if (!accessToken) throw new Error('Response token tidak valid');
    return accessToken;
  } catch (err) {
    throw new Error(getAuthErrorMessage(err));
  }
}

export async function fetchMe() {
  try {
    let response: ApiResponse<{ user?: AuthUser }> | AuthUser;
    try {
      response = (await get('/users/me')) as ApiResponse<{ user?: AuthUser }> | AuthUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.includes('404') && !message.toLowerCase().includes('not found')) throw err;
      response = (await get('/auth/me')) as ApiResponse<{ user?: AuthUser }> | AuthUser;
    }
    const user = ('data' in response && response.data?.user) ? response.data.user : response as AuthUser;
    return normalizeUser(user);
  } catch (err) {
    throw new Error(getAuthErrorMessage(err));
  }
}

function normalizeUser(user: AuthUser): AuthUser {
  const legacyMap: Record<string, AuthUser['role']> = { umum: 'public', petugas: 'officer' };
  const lower = (user.role?.toLowerCase() ?? 'public') as string;
  return {
    ...user,
    role: legacyMap[lower] ?? (lower as AuthUser['role']),
  };
}

function normalizeAuthResponse(response: unknown): LoginResponse {
  const apiResponse = response as ApiResponse<WebAuthPayload> & Partial<LoginResponse> & Partial<WebAuthPayload>;
  const payload = apiResponse.data || apiResponse;
  const accessToken = payload.accessToken || apiResponse.access_token;
  const refreshToken = payload.refreshToken || apiResponse.refresh_token;
  const user = payload.user || apiResponse.user;

  if (!accessToken || !refreshToken || !user) {
    throw new Error('Response tidak valid');
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: normalizeUser(user),
  };
}

export async function saveSession(data: LoginResponse) {
  const session: StoredSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  setAccessToken(data.access_token);
  return session;
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  setAccessToken(null);
}

function getAuthErrorMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : '';
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return 'Terjadi kesalahan tidak diketahui. Cek log Metro untuk detail.';

  if (normalized.includes('email sudah terdaftar')) {
    return 'Email sudah terdaftar. Gunakan email lain atau login.';
  }
  if (normalized.includes('email') && normalized.includes('kata sandi')) {
    return 'Email atau kata sandi salah.';
  }
  if (normalized.includes('unauthorized')) {
    return 'Sesi berakhir. Silakan login kembali.';
  }
  if (normalized.includes('timeout') || normalized.includes('aborted')) {
    return 'Koneksi timeout - API EcoRoute tidak merespon. Cek EXPO_PUBLIC_API_URL dan koneksi internet.';
  }
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network request failed') ||
    normalized.includes('network error')
  ) {
    return 'Network error - tidak bisa konek ke API EcoRoute. Pastikan EXPO_PUBLIC_API_URL mengarah ke web Vercel dan koneksi internet aktif.';
  }

  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string };
    const msg = parsed.error || parsed.message;
    if (msg) return msg;
  } catch {
    // ignore parse errors
  }

  // Surface the raw error so problems aren't hidden behind a generic message.
  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
}
