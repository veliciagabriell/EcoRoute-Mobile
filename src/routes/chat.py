from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from services.llm_service import LlmService
from services.ecobot_prompt import SYSTEM_PROMPT

router = APIRouter()
llm = LlmService()


class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
async def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages is required")
    return llm.generate(req.messages, system_prompt=SYSTEM_PROMPT)


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages is required")
    generator = llm.generate_stream(req.messages, system_prompt=SYSTEM_PROMPT)
    return StreamingResponse(generator, media_type="text/event-stream")
