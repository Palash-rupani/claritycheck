from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)
