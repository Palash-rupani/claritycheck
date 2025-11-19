from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"

def create_token(user_id: str):
    exp = datetime.utcnow() + timedelta(hours=24)
    payload = {"sub": user_id, "exp": exp}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
