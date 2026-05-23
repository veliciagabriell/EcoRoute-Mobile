import { API_URL } from '@/utils/api';

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
  if (!API_URL) {
    console.warn('[EcoBot] API_URL tidak ditemukan.');
    console.warn('[EcoBot] Isi ecoroute-mobile/.env: EXPO_PUBLIC_API_URL=http://<IP_PC_KAMU>:5000/api');
    return '';
  }

  console.log('[EcoBot] Base URL:', API_URL);
  return API_URL;
};

export function streamChat(messages: ChatMessage[], callbacks: StreamCallbacks): () => void {
  let cancelled = false;

  sendChat(messages)
    .then((reply) => {
      if (cancelled) return;
      callbacks.onToken(reply);
      callbacks.onDone();
    })
    .catch((err) => {
      if (cancelled) return;
      callbacks.onError(err instanceof Error ? err.message : 'EcoBot sedang bermasalah. Coba lagi nanti.');
    });

  return () => {
    cancelled = true;
  };
}

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'EcoBot belum terkonfigurasi. Isi EXPO_PUBLIC_API_URL di ecoroute-mobile/.env lalu restart Expo.'
    );
  }

  const url = `${baseUrl}/chatbot/chat`;
  console.log('[EcoBot] sendChat ke:', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    console.log('[EcoBot] sendChat response status:', res.status);

    if (res.status === 503) {
      throw new Error('EcoBot AI belum aktif. Pastikan Ollama dan backend web sedang berjalan.');
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[EcoBot] sendChat HTTP error:', res.status, body);
      throw new Error(`EcoBot bermasalah (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as {
      data?: { reply?: string };
      reply?: string;
      error?: string;
    };
    if (data.error) {
      console.error('[EcoBot] sendChat error dari server:', data.error);
      throw new Error(data.error);
    }

    const reply = data.data?.reply || data.reply || '';
    console.log('[EcoBot] sendChat berhasil, reply:', reply.slice(0, 60), '...');
    return reply;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Network request failed')) {
      throw new Error(
        'Tidak bisa terhubung ke backend web. Pastikan:\n1. Backend web berjalan di port 5000\n2. IP di .env sudah benar, bukan localhost\n3. HP/emulator dan PC berada di jaringan Wi-Fi yang sama'
      );
    }
    throw err;
  }
}
