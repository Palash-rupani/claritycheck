from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from app.schemas.product import ProductCreate, ProductOut
from app.schemas.profile import ProfileIn
from app.utils.deps import get_db
from app.crud.products import (
    create_product,
    save_profile,
    get_latest_profile,
    get_all_products,
    get_product_by_id
)
from app.crud.followups import log_followup

router = APIRouter()

AI_SERVICE_URL = "https://claritycheck-production.up.railway.app/followups"




# ---------------------------------------------------------
# 0) List all products
# ---------------------------------------------------------
@router.get("/", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return get_all_products(db)


# ---------------------------------------------------------
# 1) Create a product  (FIX: accepts /products AND /products/)
# ---------------------------------------------------------
@router.post("", response_model=ProductOut)
@router.post("/", response_model=ProductOut)
def create_new(payload: ProductCreate, db: Session = Depends(get_db)):
    return create_product(db, payload)


# ---------------------------------------------------------
# 1.5) Get product + latest profile
# ---------------------------------------------------------
@router.get("/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    profile = get_latest_profile(db, product_id)

    return {
        **product.__dict__,
        "profile": profile.__dict__ if profile else {}
    }


# ---------------------------------------------------------
# 2) Update profile and request followups from AI service
# ---------------------------------------------------------
@router.post("/{product_id}/profile")
def update_profile(product_id: str, payload: ProfileIn, db: Session = Depends(get_db)):

    saved_profile = save_profile(db, product_id, payload.profile)

    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    followups = []
    try:
        payload_for_ai = {
            "product": {
                "name": product.name,
                "category": product.category,
                "description": product.description
            },
            "profile": payload.profile
        }

        response = requests.post(
            AI_SERVICE_URL,
            json=payload_for_ai,
            timeout=15
        )
        response.raise_for_status()

        followups = response.json().get("questions", [])

        for q in followups:
            log_followup(
                db,
                product_id=product_id,
                question=q.get("text"),
                answer=None,
                asked_by="ai"
            )

    except Exception as e:
        print(f"❌ AI Service Error: {e}")

    return {
        "status": "ok",
        "profile_id": saved_profile.id,
        "followups": followups
    }


# ---------------------------------------------------------
# 3) Get follow-up questions
# ---------------------------------------------------------
@router.get("/{product_id}/followups")
def get_followups(product_id: str, db: Session = Depends(get_db)):
    from app.crud.followups import get_followups_for_product

    followups = get_followups_for_product(db, product_id)

    result = [
        {
            "id": f"q{i+1}",
            "text": f.question,
            "type": "text",
            "options": None
        }
        for i, f in enumerate(followups)
    ]

    return {"followups": result}


# ---------------------------------------------------------
# 4) Save answers
# ---------------------------------------------------------
from pydantic import BaseModel
from app.crud.followups import save_answer_record, get_answer_record


class AnswersIn(BaseModel):
    answers: dict


@router.post("/{product_id}/answers")
def save_answers(product_id: str, payload: AnswersIn, db: Session = Depends(get_db)):
    save_answer_record(db, product_id, payload.answers)

    return {
        "status": "ok",
        "product_id": product_id,
        "saved_answers": payload.answers
    }


# ---------------------------------------------------------
# 5) Get saved answers
# ---------------------------------------------------------
@router.get("/{product_id}/answers")
def get_answers(product_id: str, db: Session = Depends(get_db)):
    record = get_answer_record(db, product_id)
    return {"answers": record or {}}
