from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ActivityLogOut(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
