from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationCreate, ConversationUpdate


def get_user_conversations(db: Session, user_id: int) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


def get_conversation(db: Session, conversation_id: int, user_id: int) -> Conversation:
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id,
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
    return conv


def create_conversation(db: Session, user_id: int, data: ConversationCreate) -> Conversation:
    conv = Conversation(
        user_id=user_id,
        title=data.title or "Nueva conversación",
        system_prompt=data.system_prompt or "Eres un asistente útil y amigable.",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def create_conversation_from_message(db: Session, user_id: int, first_message: str) -> Conversation:
    words = first_message.strip().split()
    title = " ".join(words[:6]) + ("..." if len(words) > 6 else "")
    conv = Conversation(user_id=user_id, title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def update_conversation(db: Session, conversation_id: int, user_id: int, data: ConversationUpdate) -> Conversation:
    conv = get_conversation(db, conversation_id, user_id)
    if data.title is not None:
        conv.title = data.title
    if data.system_prompt is not None:
        conv.system_prompt = data.system_prompt
    db.commit()
    db.refresh(conv)
    return conv


def delete_conversation(db: Session, conversation_id: int, user_id: int) -> None:
    conv = get_conversation(db, conversation_id, user_id)
    db.delete(conv)
    db.commit()


def get_conversation_history(db: Session, conversation_id: int, limit: int = 20) -> list[dict]:
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    # Keep last 'limit' messages for context
    messages = messages[-limit:]
    return [{"role": m.role, "content": m.content} for m in messages]
