import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env dari root project (satu level di atas src/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

from routes.chat import router as chat_router  # noqa: E402

app = FastAPI(title="EcoBot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")

logger.info("=" * 50)
logger.info("EcoBot FastAPI siap")
logger.info(f"  ECOBOT_USE_MOCK   = {os.getenv('ECOBOT_USE_MOCK', 'true')}")
logger.info(f"  ECOBOT_MODEL_PATH = {os.getenv('ECOBOT_MODEL_PATH', '(tidak di-set)')}")
logger.info("=" * 50)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "use_mock": os.getenv("ECOBOT_USE_MOCK", "true"),
        "model_path": os.getenv("ECOBOT_MODEL_PATH", ""),
    }
