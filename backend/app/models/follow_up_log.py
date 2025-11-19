from sqlalchemy import Column, String, JSON, DateTime, func
from app.core.db import Base
import uuid

class FollowUpLog(Base):
    __tablename__ = "follow_up_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, nullable=False)
    question = Column(String, nullable=False)
    answer = Column(JSON, nullable=True)
    asked_by = Column(String, nullable=True)  # "ai" or "user"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
