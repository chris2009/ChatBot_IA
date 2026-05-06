import base64
import json
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import LoginRequest, TokenResponse, UserOut
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.models.user import User
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(hours=settings.jwt_expire_hours),
    )

    # Cookie httpOnly con el JWT completo
    response.set_cookie(
        key="auth-token",
        value=token,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
        max_age=settings.jwt_expire_hours * 3600,
    )

    # Cookie legible con info del usuario (base64 JSON)
    auth_info = base64.b64encode(
        json.dumps({"username": user.username, "role": user.role}).encode()
    ).decode()
    response.set_cookie(
        key="auth-info",
        value=auth_info,
        httponly=False,
        secure=settings.app_env == "production",
        samesite="lax",
        max_age=settings.jwt_expire_hours * 3600,
    )

    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("auth-token")
    response.delete_cookie("auth-info")
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
