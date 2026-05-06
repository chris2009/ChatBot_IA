from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.message import MessageOut


class ConversationCreate(BaseModel):
    title: Optional[str] = "Nueva conversación"
    system_prompt: Optional[str] = "Eres un asistente útil y amigable."


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None


class ConversationTitleUpdate(BaseModel):
    title: str


class ConversationOut(BaseModel):
    id: int
    user_id: int
    title: str
    model: str
    system_prompt: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationWithMessages(ConversationOut):
    messages: List[MessageOut] = []
