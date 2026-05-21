import json
import logging
import os
import urllib.request
import urllib.error
from typing import Iterable, List

from fastapi.responses import JSONResponse

from services.ecobot_prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class LlmService:
    def __init__(self) -> None:
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.primary_model = os.getenv("OLLAMA_MODEL", "llama3:latest")
        self.fallback_model = os.getenv("OLLAMA_MODEL_FALLBACK", "qwen2.5:3b")
        self.max_tokens = int(os.getenv("ECOBOT_MAX_TOKENS", "256"))
        self.temperature = float(os.getenv("ECOBOT_TEMPERATURE", "0.2"))

        logger.info("[EcoBot] Inisialisasi LlmService (Ollama)")
        logger.info(f"  ollama_url     = {self.ollama_url}")
        logger.info(f"  primary_model  = {self.primary_model}")
        logger.info(f"  fallback_model = {self.fallback_model}")
        logger.info(f"  max_tokens     = {self.max_tokens}")
        logger.info(f"  temperature    = {self.temperature}")

    def _build_messages(self, messages: List[dict], system_prompt: str) -> List[dict]:
        return [{"role": "system", "content": system_prompt}, *[{"role": m.role, "content": m.content} for m in messages]]

    def _open(self, model: str, messages: List[dict], system_prompt: str, stream: bool):
        payload = {
            "model": model,
            "messages": self._build_messages(messages, system_prompt),
            "stream": stream,
            "options": {"temperature": self.temperature, "num_predict": self.max_tokens},
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.ollama_url}/api/chat",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        return urllib.request.urlopen(req, timeout=300)

    def generate(self, messages: List[dict], system_prompt: str = SYSTEM_PROMPT):
        for model in [self.primary_model, self.fallback_model]:
            logger.info(f"[EcoBot] Mencoba model (non-stream): {model}")
            try:
                with self._open(model, messages, system_prompt, stream=False) as resp:
                    result = json.loads(resp.read())
                    if "error" in result:
                        logger.warning(f"[EcoBot] Model {model} menolak: {result['error']}")
                        continue
                    reply = result["message"]["content"]
                    logger.info(f"[EcoBot] {model} OK ({len(reply)} karakter)")
                    return {"reply": reply, "mode": "llm", "model": model}
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                logger.warning(f"[EcoBot] Model {model} HTTP {e.code}: {body[:200]}")
            except urllib.error.URLError as e:
                logger.error(f"[EcoBot] Ollama tidak tersedia: {e}")
                return JSONResponse(
                    status_code=503,
                    content={"error": "Ollama tidak tersedia. Jalankan Ollama terlebih dahulu.", "mode": "error"},
                )
            except Exception as e:
                logger.warning(f"[EcoBot] Model {model} error: {e}")

        logger.error("[EcoBot] Semua model gagal")
        return JSONResponse(
            status_code=503,
            content={"error": "Tidak ada model AI yang tersedia saat ini.", "mode": "error"},
        )

    def generate_stream(self, messages: List[dict], system_prompt: str = SYSTEM_PROMPT) -> Iterable[str]:
        for model in [self.primary_model, self.fallback_model]:
            logger.info(f"[EcoBot] Mencoba model (stream): {model}")
            try:
                with self._open(model, messages, system_prompt, stream=True) as resp:
                    model_ok = True
                    first_chunk = True
                    for line in resp:
                        if not line.strip():
                            continue
                        chunk = json.loads(line)
                        # Check the first chunk for model-not-found errors
                        if first_chunk:
                            first_chunk = False
                            if "error" in chunk:
                                logger.warning(f"[EcoBot] Model {model} menolak: {chunk['error']}")
                                model_ok = False
                                break
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield self._sse(token)
                        if chunk.get("done"):
                            break

                    if model_ok:
                        yield self._sse_done()
                        return
                    # model_ok is False — try next model
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                logger.warning(f"[EcoBot] Model {model} HTTP {e.code}: {body[:200]}")
            except urllib.error.URLError as e:
                logger.error(f"[EcoBot] Ollama tidak tersedia: {e}")
                yield self._sse("Maaf, Ollama service tidak tersedia. Pastikan Ollama sudah berjalan.")
                yield self._sse_done()
                return
            except Exception as e:
                logger.warning(f"[EcoBot] Model {model} error: {e}")

        logger.error("[EcoBot] Semua model gagal (stream)")
        yield self._sse("Maaf, tidak ada model AI yang tersedia saat ini.")
        yield self._sse_done()

    def _sse(self, text: str) -> str:
        return f"data: {json.dumps({'token': text}, ensure_ascii=False)}\n\n"

    def _sse_done(self) -> str:
        return "event: done\ndata: {}\n\n"
