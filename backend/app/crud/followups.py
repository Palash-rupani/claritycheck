# app/crud/followups.py
from sqlalchemy.orm import Session
from app.models.follow_up_log import FollowUpLog, AnswerRecord


def log_followup(db: Session, product_id: str, question: str, answer: str = None, asked_by: str = "ai"):
    """
    Log a followup question only if it doesn't already exist.
    Prevent duplicate followups.
    """
    # Check if question already exists
    existing = (
        db.query(FollowUpLog)
        .filter(FollowUpLog.product_id == product_id)
        .filter(FollowUpLog.question == question)
        .first()
    )

    if existing:
        return existing  # Do not insert duplicates

    # Insert new question
    record = FollowUpLog(
        product_id=product_id,
        question=question,
        answer=answer,
        asked_by=asked_by,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_followups_for_product(db: Session, product_id: str):
    return db.query(FollowUpLog).filter(FollowUpLog.product_id == product_id).all()


def save_answer_record(db: Session, product_id: str, answers: dict):
    """
    Upsert answers for this product
    """
    existing = db.query(AnswerRecord).filter_by(product_id=product_id).first()

    if existing:
        existing.answers = answers
        db.commit()
        db.refresh(existing)
        return existing

    new_record = AnswerRecord(product_id=product_id, answers=answers)
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


def get_answer_record(db: Session, product_id: str):
    record = db.query(AnswerRecord).filter_by(product_id=product_id).first()
    return record.answers if record else None
