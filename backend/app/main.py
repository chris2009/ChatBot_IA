from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, SessionLocal, Base
from app.models import User, Conversation, Message  # noqa: ensure models are loaded
from app.services.auth_service import create_admin_if_not_exists
from app.api.routes_health import router as health_router
from app.api.routes_auth import router as auth_router
from app.api.routes_users import router as users_router
from app.api.routes_conversations import router as conversations_router
from app.api.routes_chat import router as chat_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas si no existen (desarrollo)
    Base.metadata.create_all(bind=engine)
    # Crear admin inicial
    db = SessionLocal()
    try:
        create_admin_if_not_exists(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AI Chat App",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(conversations_router)
app.include_router(chat_router)
