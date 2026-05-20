import json
import logging
import os
from typing import Iterable, List

from fastapi.responses import JSONResponse

from services.ecobot_prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

try:
    from llama_cpp import Llama
    logger.info("[EcoBot] llama-cpp-python berhasil diimport")
except Exception as e:
    Llama = None
    logger.warning(f"[EcoBot] llama-cpp-python tidak tersedia: {e}")


class LlmService:
    def __init__(self) -> None:
        self.model_path = os.getenv("ECOBOT_MODEL_PATH", "")
        self.use_mock = os.getenv("ECOBOT_USE_MOCK", "true").lower() == "true"
        self.max_tokens = int(os.getenv("ECOBOT_MAX_TOKENS", "512"))
        self.temperature = float(os.getenv("ECOBOT_TEMPERATURE", "0.2"))
        self._model = None

        logger.info(f"[EcoBot] Inisialisasi LlmService:")
        logger.info(f"  use_mock     = {self.use_mock}")
        logger.info(f"  model_path   = '{self.model_path}'")
        logger.info(f"  max_tokens   = {self.max_tokens}")
        logger.info(f"  temperature  = {self.temperature}")

        if not self.use_mock:
            if not self.model_path:
                logger.error("[EcoBot] ECOBOT_MODEL_PATH tidak di-set! Set ECOBOT_USE_MOCK=true untuk mode tanpa model.")
            elif not os.path.isfile(self.model_path):
                logger.error(f"[EcoBot] File model tidak ditemukan: {self.model_path}")
            else:
                logger.info(f"[EcoBot] File model ditemukan, akan di-load saat request pertama.")

    def _load_model(self) -> None:
        if self._model is not None:
            return
        if self.use_mock:
            return
        if not self.model_path:
            raise RuntimeError(
                "ECOBOT_MODEL_PATH tidak di-set. "
                "Set ECOBOT_USE_MOCK=true untuk mode tanpa model, "
                "atau isi ECOBOT_MODEL_PATH dengan path file .gguf yang benar."
            )
        if not os.path.isfile(self.model_path):
            raise RuntimeError(
                f"File model tidak ditemukan: {self.model_path}. "
                "Pastikan file .gguf sudah didownload dan path-nya benar."
            )
        if Llama is None:
            raise RuntimeError(
                "llama-cpp-python belum terinstall. "
                "Jalankan: pip install llama-cpp-python"
            )

        logger.info(f"[EcoBot] Memuat model dari: {self.model_path}")
        self._model = Llama(
            model_path=self.model_path,
            n_ctx=2048,
            n_threads=int(os.getenv("ECOBOT_THREADS", "4")),
            n_batch=int(os.getenv("ECOBOT_BATCH", "256")),
            verbose=False,
        )
        logger.info("[EcoBot] Model berhasil dimuat!")

    def generate(self, messages: List[dict], system_prompt: str = SYSTEM_PROMPT):
        if self.use_mock:
            logger.info("[EcoBot] generate() mode mock")
            return JSONResponse(
                {
                    "reply": (
                        "Halo! Aku EcoBot 🌿 Saat ini aku berjalan dalam mode ringan. "
                        "Untuk mengaktifkan AI penuh, hubungkan model LLM di backend."
                    ),
                    "mode": "mock",
                }
            )

        try:
            self._load_model()
            logger.info(f"[EcoBot] generate() dengan {len(messages)} pesan")
            output = self._model.create_chat_completion(
                messages=[{"role": "system", "content": system_prompt}, *messages],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
            reply = output["choices"][0]["message"]["content"]
            logger.info(f"[EcoBot] Respons dihasilkan ({len(reply)} karakter)")
            return {"reply": reply, "mode": "llm"}
        except Exception as e:
            logger.error(f"[EcoBot] Error saat generate: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": str(e), "mode": "error"},
            )

    def generate_stream(self, messages: List[dict], system_prompt: str = SYSTEM_PROMPT) -> Iterable[str]:
        if self.use_mock:
            logger.info("[EcoBot] generate_stream() mode mock")
            mock_reply = (
                "Halo! Aku EcoBot 🌿 Saat ini aku berjalan dalam mode ringan. "
                "Untuk mengaktifkan AI penuh, hubungkan model LLM di backend."
            )
            yield self._sse(mock_reply)
            yield self._sse_done()
            return

        try:
            self._load_model()
            logger.info(f"[EcoBot] generate_stream() dengan {len(messages)} pesan")
            stream = self._model.create_chat_completion(
                messages=[{"role": "system", "content": system_prompt}, *messages],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=True,
            )
            for chunk in stream:
                delta = chunk["choices"][0].get("delta", {})
                token = delta.get("content")
                if token:
                    yield self._sse(token)
            yield self._sse_done()
        except Exception as e:
            logger.error(f"[EcoBot] Error saat generate_stream: {e}")
            yield self._sse(f"Maaf, terjadi kesalahan: {str(e)}")
            yield self._sse_done()

    def _sse(self, text: str) -> str:
        payload = json.dumps({"token": text}, ensure_ascii=False)
        return f"data: {payload}\n\n"

    def _sse_done(self) -> str:
        return "event: done\ndata: {}\n\n"
