from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str
    jwt_secret: str
    jwt_expire_hours: int = 24
    admin_username: str = "admin"
    admin_password: str = "admin123"
    admin_email: str = "admin@example.com"
    allowed_origins: str = "http://localhost:3000"
    app_env: str = "development"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
