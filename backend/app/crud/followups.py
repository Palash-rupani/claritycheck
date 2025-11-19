# app/crud/followups.py
from sqlalchemy.orm import Session
from app.models.follow_up_log import FollowUpLog

def log_followup(db: Session, product_id: str, question: str, answer: dict | None = None, asked_by: str = "ai"):
    rec = FollowUpLog(product_id=product_id, question=question, answer=answer, asked_by=asked_by)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec
