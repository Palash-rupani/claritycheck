from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change_this_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    AI_SERVICE_URL: str = "http://localhost:8001/followups"  # <-- ADD THIS

    class Config:
        env_file = ".env"


settings = Settings()
