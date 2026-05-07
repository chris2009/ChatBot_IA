import base64
import json
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Cookie
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import LoginRequest, TokenResponse, UserOut
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
    log_activity,
    decode_token,
    SubscriptionExpiredError,
)
from app.models.user import User
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        user = authenticate_user(db, body.username, body.password)
    except SubscriptionExpiredError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SUBSCRIPTION_EXPIRED",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    user_agent = request.headers.get("user-agent", "")
    log_activity(db, user.id, "login", ip, user_agent)

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(hours=settings.jwt_expire_hours),
    )

    is_prod = settings.app_env == "production"

    response.set_cookie(
        key="auth-token",
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.jwt_expire_hours * 3600,
    )

    auth_info = base64.b64encode(
        json.dumps({"username": user.username, "role": user.role}).encode()
    ).decode()
    response.set_cookie(
        key="auth-info",
        value=auth_info,
        httponly=False,
        secure=is_prod,
        samesite="lax",
        max_age=settings.jwt_expire_hours * 3600,
    )

    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    auth_token: Optional[str] = Cookie(default=None, alias="auth-token"),
):
    if auth_token:
        try:
            payload = decode_token(auth_token)
            user_id = int(payload.get("sub", 0))
            if user_id:
                ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
                user_agent = request.headers.get("user-agent", "")
                log_activity(db, user_id, "logout", ip, user_agent)
        except Exception:
            pass

    is_prod = settings.app_env == "production"
    response.delete_cookie("auth-token", secure=is_prod, samesite="lax")
    response.delete_cookie("auth-info", secure=is_prod, samesite="lax")
    return {"message": "Sesión cerrada"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
