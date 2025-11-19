from sqlalchemy import Column, String, DateTime, func
from app.core.db import Base
import uuid

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    category = Column(String)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
