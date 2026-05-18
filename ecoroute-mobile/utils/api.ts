import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredUrl = (Constants.expoConfig as any)?.extra?.API_URL as string | undefined;
const API_URL =
  configuredUrl ||
  (Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://10.0.2.2:3000/api');

console.log('[API] Using API_URL:', API_URL);

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

const REQUEST_TIMEOUT_MS = 10000;

export async function post(path: string, body: any) {
  const url = `${API_URL}${path}`;
  console.log('[API] POST', url, 'body:', body);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
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
      console.error('[API] POST timeout');
      throw new Error('Request timeout');
    }
    console.error('[API] POST error:', err.message);
    throw err;
  }
}

export async function get(path: string) {
  const url = `${API_URL}${path}`;
  console.log('[API] GET', url);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
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
      console.error('[API] GET timeout');
      throw new Error('Request timeout');
    }
    console.error('[API] GET error:', err.message);
    throw err;
  }
}
