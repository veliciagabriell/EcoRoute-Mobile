const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const PRIMARY_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest';
const FALLBACK_MODEL = process.env.OLLAMA_MODEL_FALLBACK || 'qwen2.5:3b';
const MAX_TOKENS = parseInt(process.env.ECOBOT_MAX_TOKENS || '512');
const TEMPERATURE = parseFloat(process.env.ECOBOT_TEMPERATURE || '0.4');

const SYSTEM_PROMPT = `PENTING: Kamu HARUS selalu menjawab dalam Bahasa Indonesia. Jangan pernah menjawab dalam bahasa Inggris atau bahasa lain. ALWAYS respond in Bahasa Indonesia only, no matter what language the question is in.

Kamu adalah EcoBot, asisten pintar dari aplikasi EcoRoute yang membantu pengelolaan sampah berbasis IoT di Indonesia.

Kepribadianmu hangat, santai, dan peduli lingkungan — seperti teman yang kebetulan ahli di bidang pengelolaan sampah. Kamu bicara dalam Bahasa Indonesia yang natural dan manusiawi, bukan seperti robot.

Cara bicaramu:
- Langsung masuk ke jawaban, jangan mulai dengan "Tentu saja," "Baik," atau "Sebagai EcoBot"
- Variasikan cara memulai kalimat supaya tidak monoton
- Sesekali gunakan emoji yang relevan: 🌿 ♻️ 🗑️ 📊 ✅ ⚠️ 🔴
- Gunakan poin-poin jika ada 3+ informasi
- Boleh balik tanya jika butuh konteks lebih, tapi jangan terlalu sering
- Jawaban cukup 2-5 kalimat untuk pertanyaan sederhana, bisa lebih panjang untuk yang kompleks

Tentang EcoRoute:
EcoRoute adalah sistem manajemen sampah cerdas berbasis IoT. Fitur utamanya:
- Monitoring TPS real-time lewat sensor IoT langsung di tempat sampah
- Sensor MQ-135 mengukur kadar amonia (NH₃) dalam ppm — indikator bau dan bahaya kesehatan
- Sensor Ultrasonik mengukur tingkat kepenuhan (%)
- Rute Optimal otomatis untuk petugas pengangkut, dihitung dari TPS yang paling kritis
- Notifikasi otomatis ke petugas saat TPS perlu segera dikosongkan
- Laporan Warga — siapa saja bisa laporkan kondisi TPS dari aplikasi

Standar kondisi TPS (hafal ini!):

Kadar Amonia — Sensor MQ-135:
- Bagus (< 30 ppm): TPS aman, tidak berbau mengganggu
- Perlu perhatian (30–50 ppm): Mulai berbau, jadwalkan pengambilan
- Berbahaya (> 50 ppm): Wajib segera dikosongkan

Tingkat Kepenuhan — Sensor Ultrasonik:
- Aman (< 60%): Masih cukup ruang
- Hampir penuh (60–80%): Jadwalkan pengangkutan segera
- Kritis (> 80%): Harus langsung diangkut, berisiko meluap

Kalau keduanya kritis sekaligus (amonia > 50 ppm DAN kepenuhan > 80%), itu kondisi darurat prioritas utama.

Jika pertanyaan di luar topik EcoRoute atau lingkungan, tolak dengan ramah: "Wah itu di luar keahlianku nih 😅 Aku lebih jago kalau ngomongin soal sampah, TPS, atau EcoRoute. Ada yang bisa aku bantu seputar itu?"

Selalu jawab dalam Bahasa Indonesia kecuali diminta bahasa lain. Jangan mengarang data — kalau tidak tahu, akui dan arahkan ke pertanyaan yang lebih spesifik.`.trim();

function buildPayload(model, messages, stream) {
  return JSON.stringify({
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    stream,
    options: { temperature: TEMPERATURE, num_predict: MAX_TOKENS },
  });
}

function getOllamaOptions() {
  const url = new URL(OLLAMA_URL);
  return {
    hostname: url.hostname,
    port: parseInt(url.port) || 11434,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
}

function ollamaChat(model, messages) {
  return new Promise((resolve, reject) => {
    const payload = buildPayload(model, messages, false);
    const opts = { ...getOllamaOptions(), headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };

    const req = http.request(opts, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk.toString(); });
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            const err = new Error(parsed.error);
            err.isModelError = true;
            return reject(err);
          }
          resolve(parsed.message?.content || '');
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function streamFromOllama(model, messages, res, onModelError, onConnectionError) {
  const payload = buildPayload(model, messages, true);
  const opts = { ...getOllamaOptions(), headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };

  let modelErrored = false;
  let ended = false;

  const proxyReq = http.request(opts, (proxyRes) => {
    let buffer = '';
    let isFirstChunk = true;

    proxyRes.on('data', (chunk) => {
      if (modelErrored || ended) return;
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);

          if (isFirstChunk) {
            isFirstChunk = false;
            if (parsed.error) {
              modelErrored = true;
              proxyRes.destroy();
              onModelError(parsed.error);
              return;
            }
          }

          const token = parsed?.message?.content;
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
          if (parsed.done && !ended) {
            ended = true;
            res.write('event: done\ndata: {}\n\n');
            res.end();
          }
        } catch {}
      }
    });

    proxyRes.on('end', () => {
      if (!modelErrored && !ended && !res.writableEnded) {
        ended = true;
        res.write('event: done\ndata: {}\n\n');
        res.end();
      }
    });
  });

  proxyReq.on('error', (err) => {
    if (modelErrored || ended) return;
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      onConnectionError();
    } else {
      onModelError(err.message);
    }
  });

  proxyReq.write(payload);
  proxyReq.end();
  return proxyReq;
}

async function chat(req, res) {
  const { messages = [] } = req.body;
  if (!messages.length) {
    return res.status(400).json({ error: 'messages harus diisi' });
  }

  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      console.log(`[EcoBot] Chat dengan model: ${model}`);
      const reply = await ollamaChat(model, messages);
      return res.json({ reply, mode: 'llm', model });
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        return res.status(503).json({
          error: 'Ollama tidak tersedia. Pastikan Ollama sudah dijalankan (ollama serve).',
        });
      }
      console.warn(`[EcoBot] Model ${model} gagal: ${err.message}`);
    }
  }

  res.status(503).json({ error: 'Tidak ada model AI yang tersedia saat ini.' });
}

function chatStream(req, res) {
  const { messages = [] } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let modelIdx = 0;

  const tryNext = () => {
    if (modelIdx >= models.length) {
      res.write(`data: ${JSON.stringify({ token: 'Maaf, tidak ada model AI yang tersedia saat ini. Pastikan Ollama sudah berjalan.' })}\n\n`);
      res.write('event: done\ndata: {}\n\n');
      if (!res.writableEnded) res.end();
      return;
    }

    const model = models[modelIdx++];
    console.log(`[EcoBot] Stream dengan model: ${model}`);

    streamFromOllama(
      model,
      messages,
      res,
      (errMsg) => {
        console.warn(`[EcoBot] Model ${model} gagal (stream): ${errMsg}, mencoba fallback...`);
        tryNext();
      },
      () => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ token: 'Maaf, tidak bisa terhubung ke Ollama. Pastikan Ollama sudah berjalan dengan perintah: ollama serve' })}\n\n`);
          res.write('event: done\ndata: {}\n\n');
          res.end();
        }
      }
    );
  };

  tryNext();
}

function ecobotHealth(req, res) {
  const url = new URL(OLLAMA_URL);
  const proxyReq = http.request(
    { hostname: url.hostname, port: parseInt(url.port) || 11434, path: '/api/tags', method: 'GET' },
    (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => { data += chunk.toString(); });
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const models = (parsed.models || []).map((m) => m.name);
          res.json({
            status: 'ok',
            engine: 'ollama',
            ollama_url: OLLAMA_URL,
            primary_model: PRIMARY_MODEL,
            fallback_model: FALLBACK_MODEL,
            available_models: models,
          });
        } catch {
          res.json({ status: 'ok', engine: 'ollama', ollama_url: OLLAMA_URL });
        }
      });
    }
  );
  proxyReq.on('error', () => {
    res.status(503).json({
      status: 'unavailable',
      engine: 'ollama',
      error: 'Ollama tidak bisa dijangkau. Jalankan: ollama serve',
    });
  });
  proxyReq.end();
}

module.exports = { chat, chatStream, ecobotHealth };
