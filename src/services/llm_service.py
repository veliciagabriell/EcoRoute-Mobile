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
        self.model = os.getenv("OLLAMA_MODEL", "tinyllama")
        self.max_tokens = int(os.getenv("ECOBOT_MAX_TOKENS", "256"))
        self.temperature = float(os.getenv("ECOBOT_TEMPERATURE", "0.2"))

        logger.info("[EcoBot] Inisialisasi LlmService (Ollama)")
        logger.info(f"  ollama_url  = {self.ollama_url}")
        logger.info(f"  model       = {self.model}")
        logger.info(f"  max_tokens  = {self.max_tokens}")
        logger.info(f"  temperature = {self.temperature}")

    def _build_messages(self, messages: List[dict], system_prompt: str) -> List[dict]:
        return [{"role": "system", "content": system_prompt}, *[{"role": m.role, "content": m.content} for m in messages]]

    def _post(self, payload: dict, stream: bool):
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.ollama_url}/api/chat",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        return urllib.request.urlopen(req, timeout=300)

    def generate(self, messages: List[dict], system_prompt: str = SYSTEM_PROMPT):
        try:
            payload = {
                "model": self.model,
                "messages": self._build_messages(messages, system_prompt),
                "stream": False,
                "options": {"temperature": self.temperature, "num_predict": self.max_tokens},
            }
            with self._post(payload, stream=False) as resp:
                result = json.loads(resp.read())
                reply = result["message"]["content"]
                logger.info(f"[EcoBot] Respons dihasilkan ({len(reply)} karakter)")
                return {"reply": reply, "mode": "llm"}
        except urllib.error.URLError as e:
            logger.error(f"[EcoBot] Ollama tidak tersedia: {e}")
            return JSONResponse(status_code=503, content={"error": "Ollama tidak tersedia. Jalankan Ollama terlebih dahulu.", "mode": "error"})
        except Exception as e:
            logger.error(f"[EcoBot] Error saat generate: {e}")
            return JSONResponse(status_code=500, content={"error": str(e), "mode": "error"})

    def generate_stream(self, messages: List[dict], system_prompt: str = SYSTEM_PROMPT) -> Iterable[str]:
        try:
            payload = {
                "model": self.model,
                "messages": self._build_messages(messages, system_prompt),
                "stream": True,
                "options": {"temperature": self.temperature, "num_predict": self.max_tokens},
            }
            with self._post(payload, stream=True) as resp:
                for line in resp:
                    if not line.strip():
                        continue
                    chunk = json.loads(line)
                    token = chunk.get("message", {}).get("content", "")
                    if token:
                        yield self._sse(token)
                    if chunk.get("done"):
                        break
            yield self._sse_done()
        except urllib.error.URLError as e:
            logger.error(f"[EcoBot] Ollama tidak tersedia: {e}")
            yield self._sse("Maaf, Ollama service tidak tersedia. Pastikan Ollama sudah berjalan.")
            yield self._sse_done()
        except Exception as e:
            logger.error(f"[EcoBot] Error saat generate_stream: {e}")
            yield self._sse(f"Maaf, terjadi kesalahan: {str(e)}")
            yield self._sse_done()

    def _sse(self, text: str) -> str:
        return f"data: {json.dumps({'token': text}, ensure_ascii=False)}\n\n"

    def _sse_done(self) -> str:
        return "event: done\ndata: {}\n\n"
