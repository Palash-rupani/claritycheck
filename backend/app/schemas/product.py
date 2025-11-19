from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    category: Optional[str]
    description: Optional[str]

class ProductOut(BaseModel):
    id: str
    name: str
    category: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True
