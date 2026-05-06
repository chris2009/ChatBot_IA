from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.message import ChatRequest
from app.services.auth_service import get_current_user
from app.services.chat_service import stream_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message")
async def send_message(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return StreamingResponse(
        stream_chat_response(db, current_user.id, body.message, body.conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
