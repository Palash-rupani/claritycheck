from sqlalchemy import Column, String, JSON, Integer, DateTime, func
from app.core.db import Base
import uuid

class ProductProfile(Base):
    __tablename__ = "product_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, nullable=False)
    profile = Column(JSON, nullable=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
