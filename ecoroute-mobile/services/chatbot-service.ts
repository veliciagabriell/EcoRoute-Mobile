import Constants from 'expo-constants';
import EventSource from 'react-native-sse';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type StreamCallbacks = {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

const getApiBaseUrl = (): string => {
  const extra = (Constants.expoConfig as { extra?: Record<string, unknown> })?.extra;
  const url = typeof extra?.API_URL === 'string' ? extra.API_URL : '';
  const trimmed = url?.trim().replace(/\/$/, '');

  if (!trimmed) {
    console.warn('[EcoBot] ⚠️ API_URL tidak ditemukan di Constants.expoConfig.extra');
    console.warn('[EcoBot] Pastikan ecoroute-mobile/.env berisi: EXPO_PUBLIC_API_URL=http://<IP_KAMU>:3000/api');
  } else {
    console.log('[EcoBot] ✅ Base URL:', trimmed);
  }

  return trimmed;
};

export function streamChat(messages: ChatMessage[], callbacks: StreamCallbacks): () => void {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    callbacks.onError(
      'EcoBot belum terkonfigurasi.\n\nCara memperbaiki:\n1. Buka file ecoroute-mobile/.env\n2. Isi EXPO_PUBLIC_API_URL=http://<IP_PC_KAMU>:3000/api\n3. Restart Expo: npx expo start --clear'
    );
    return () => {};
  }

  const url = `${baseUrl}/ecobot/chat/stream`;
  console.log('[EcoBot] 🔗 Menghubungi:', url);

  let source: EventSource | null = new EventSource(url, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ messages }),
  });

  const cleanup = () => {
    if (source) {
      source.close();
      source = null;
    }
  };

  source.addEventListener('open', () => {
    console.log('[EcoBot] ✅ SSE terhubung');
  });

  source.addEventListener('message', (event: any) => {
    try {
      const parsed = JSON.parse(event.data || '{}');
      if (parsed.token) {
        callbacks.onToken(parsed.token as string);
      }
    } catch {
      console.warn('[EcoBot] Chunk SSE tidak bisa di-parse:', event.data);
    }
  });

  source.addEventListener('done', () => {
    console.log('[EcoBot] ✅ SSE selesai');
    callbacks.onDone();
    cleanup();
  });

  source.addEventListener('error', (event: any) => {
    const statusCode = event?.status ?? 'unknown';
    console.error('[EcoBot] ❌ SSE error — status:', statusCode);
    if (statusCode === 404) {
      callbacks.onError('Endpoint EcoBot tidak ditemukan. Pastikan backend Node.js berjalan dengan benar.');
    } else if (statusCode === 503) {
      callbacks.onError('EcoBot AI belum aktif. Jalankan server Python:\n\ncd src && uvicorn ecobot_app:app --port 8001');
    } else if (statusCode === 0 || statusCode === undefined) {
      callbacks.onError('Tidak bisa terhubung ke backend. Pastikan Node.js server sudah dijalankan di port 3000.');
    } else {
      callbacks.onError(`Gagal terhubung ke EcoBot (status ${statusCode}).`);
    }
    cleanup();
  });

  return cleanup;
}

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'EcoBot belum terkonfigurasi. Isi EXPO_PUBLIC_API_URL di ecoroute-mobile/.env lalu restart Expo.'
    );
  }

  const url = `${baseUrl}/ecobot/chat`;
  console.log('[EcoBot] 📤 sendChat ke:', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    console.log('[EcoBot] 📥 sendChat response status:', res.status);

    if (res.status === 503) {
      throw new Error('EcoBot AI belum aktif. Jalankan server Python:\n\ncd src && uvicorn ecobot_app:app --port 8001');
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[EcoBot] ❌ sendChat HTTP error:', res.status, body);
      throw new Error(`EcoBot bermasalah (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as { reply?: string; error?: string };
    if (data.error) {
      console.error('[EcoBot] ❌ sendChat error dari server:', data.error);
      throw new Error(data.error);
    }

    console.log('[EcoBot] ✅ sendChat berhasil, reply:', data.reply?.slice(0, 60), '...');
    return data.reply || '';
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Network request failed')) {
      throw new Error(
        'Tidak bisa terhubung ke backend. Pastikan:\n1. Node.js server sudah dijalankan di port 3000\n2. IP di .env sudah benar\n3. HP/emulator & PC berada di jaringan Wi-Fi yang sama'
      );
    }
    throw err;
  }
}
