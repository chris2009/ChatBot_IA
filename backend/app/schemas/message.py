from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    tokens_used: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
