import Constants from 'expo-constants';

const API_URL = (Constants.expoConfig as any)?.extra?.API_URL || 'http://10.0.2.2:3000/api';

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export async function post(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Request failed');
  }
  return res.json();
}

export async function get(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Request failed');
  }
  return res.json();
}
