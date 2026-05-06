from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), default="Nueva conversación")
    model = Column(String, default="claude-sonnet-4-20250514")
    system_prompt = Column(Text, default="Eres un asistente útil y amigable.")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    user = relationship("User", backref="conversations")
