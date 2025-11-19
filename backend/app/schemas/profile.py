from pydantic import BaseModel
from typing import Any, Dict

class ProfileIn(BaseModel):
    profile: Dict[str, Any]
