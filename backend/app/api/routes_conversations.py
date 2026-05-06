from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationOut,
    ConversationWithMessages,
    ConversationTitleUpdate,
)
from app.services.auth_service import get_current_user
from app.services import conversation_service as svc

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.get_user_conversations(db, current_user.id)


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
def create_conversation(
    body: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.create_conversation(db, current_user.id, body)


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.get_conversation(db, conversation_id, current_user.id)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc.delete_conversation(db, conversation_id, current_user.id)


@router.put("/{conversation_id}/title", response_model=ConversationOut)
def update_title(
    conversation_id: int,
    body: ConversationTitleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.schemas.conversation import ConversationUpdate
    return svc.update_conversation(db, conversation_id, current_user.id, ConversationUpdate(title=body.title))
