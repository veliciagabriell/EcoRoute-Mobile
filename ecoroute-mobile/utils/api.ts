import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredUrl = (Constants.expoConfig as any)?.extra?.API_URL as string | undefined;
const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants as any)?.manifest?.hostUri;
const inferredHost = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;
export const API_URL = (
  configuredUrl?.trim() ||
  (Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : inferredHost
      ? `http://${inferredHost}:5000/api`
      : 'http://10.0.2.2:5000/api')
).replace(/\/$/, '');

console.log('[API] Using API_URL:', API_URL);

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function post(path: string, body: any) {
  const url = `${API_URL}${path}`;
  console.log('[API] POST', url, 'body:', body);
  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    console.log('[API] POST response status:', res.status);
    if (!res.ok) {
      const txt = await res.text();
      console.error('[API] POST error:', txt);
      throw new Error(txt || 'Request failed');
    }
    const data = await res.json();
    console.log('[API] POST success:', data);
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('[API] POST timeout, retrying once...');
      try {
        const retryRes = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!retryRes.ok) {
          const txt = await retryRes.text();
          throw new Error(txt || 'Request failed');
        }
        return await retryRes.json();
      } catch (retryErr: any) {
        throw new Error(retryErr?.message || 'Request timeout');
      }
    }
    console.error('[API] POST error:', err.message);
    throw err;
  }
}

export async function get(path: string) {
  const url = `${API_URL}${path}`;
  console.log('[API] GET', url);
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    console.log('[API] GET response status:', res.status);
    if (!res.ok) {
      const txt = await res.text();
      console.error('[API] GET error:', txt);
      throw new Error(txt || 'Request failed');
    }
    const data = await res.json();
    console.log('[API] GET success:', data);
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('[API] GET timeout, retrying once...');
      try {
        const retryRes = await fetchWithTimeout(url, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        if (!retryRes.ok) {
          const txt = await retryRes.text();
          throw new Error(txt || 'Request failed');
        }
        return await retryRes.json();
      } catch (retryErr: any) {
        throw new Error(retryErr?.message || 'Request timeout');
      }
    }
    console.error('[API] GET error:', err.message);
    throw err;
  }
}
