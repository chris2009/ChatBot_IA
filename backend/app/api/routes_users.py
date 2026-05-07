from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.user import UserCreate, UserUpdate, UserOut, AvatarUpdate
from app.schemas.activity_log import ActivityLogOut
from app.services.auth_service import require_admin, get_current_user, hash_password

router = APIRouter(prefix="/users", tags=["users"])


# ── Perfil del usuario autenticado ──────────────────────────────────────────

@router.post("/me/avatar", response_model=UserOut)
def upload_avatar(
    body: AvatarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


# ── Administración (solo admin) ─────────────────────────────────────────────

@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username ya existe")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email ya existe")
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        is_active=body.is_active,
        subscription_expires_at=body.subscription_expires_at,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if body.username is not None:
        user.username = body.username
    if body.email is not None:
        user.email = body.email
    if body.password is not None:
        user.password_hash = hash_password(body.password)
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    if "subscription_expires_at" in body.model_fields_set:
        user.subscription_expires_at = body.subscription_expires_at
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()


@router.get("/{user_id}/activity", response_model=list[ActivityLogOut])
def get_user_activity(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    logs = (
        db.query(ActivityLog, User.username)
        .join(User, ActivityLog.user_id == User.id)
        .filter(ActivityLog.user_id == user_id)
        .order_by(desc(ActivityLog.created_at))
        .limit(limit)
        .all()
    )
    result = []
    for log, username in logs:
        out = ActivityLogOut.model_validate(log)
        out.username = username
        result.append(out)
    return result


# ── Log global de actividad (admin) ─────────────────────────────────────────

@router.get("/activity-logs/all", response_model=list[ActivityLogOut])
def get_all_activity(
    user_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(ActivityLog, User.username).join(User, ActivityLog.user_id == User.id)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    logs = query.order_by(desc(ActivityLog.created_at)).limit(limit).all()
    result = []
    for log, username in logs:
        out = ActivityLogOut.model_validate(log)
        out.username = username
        result.append(out)
    return result
