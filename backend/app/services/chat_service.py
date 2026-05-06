from datetime import datetime, timezone
from typing import AsyncGenerator
from sqlalchemy.orm import Session
from anthropic import Anthropic
from app.config import get_settings
from app.models.message import Message
from app.models.conversation import Conversation
from app.services.conversation_service import (
    get_conversation_history,
    create_conversation_from_message,
    get_conversation,
)

settings = get_settings()
anthropic_client = Anthropic(api_key=settings.anthropic_api_key)


async def stream_chat_response(
    db: Session,
    user_id: int,
    user_message: str,
    conversation_id: int | None,
) -> AsyncGenerator[str, None]:
    # Crear conversación si no existe
    if conversation_id is None:
        conv = create_conversation_from_message(db, user_id, user_message)
        conversation_id = conv.id
        # Informar al frontend el nuevo conversation_id
        yield f"data: [CONV_ID:{conversation_id}]\n\n"
    else:
        conv = get_conversation(db, conversation_id, user_id)

    # Guardar mensaje del usuario
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    db.commit()

    # Cargar historial (sin el mensaje que acabamos de guardar para no duplicar)
    history = get_conversation_history(db, conversation_id, limit=20)

    full_response = ""
    tokens_used = 0

    try:
        with anthropic_client.messages.stream(
            model=conv.model,
            max_tokens=1024,
            system=conv.system_prompt,
            messages=history,
        ) as stream:
            for text in stream.text_stream:
                full_response += text
                # Escapar saltos de línea para SSE
                escaped = text.replace("\n", "\\n")
                yield f"data: {escaped}\n\n"

            # Obtener tokens usados
            final_message = stream.get_final_message()
            tokens_used = final_message.usage.output_tokens

    except Exception as e:
        yield f"data: [ERROR:{str(e)}]\n\n"
        return

    # Guardar respuesta del asistente
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=full_response,
        tokens_used=tokens_used,
    )
    db.add(assistant_msg)

    # Actualizar updated_at de la conversación
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    yield "data: [DONE]\n\n"
