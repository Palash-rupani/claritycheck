from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests

from app.schemas.product import ProductCreate, ProductOut
from app.schemas.profile import ProfileIn
from app.utils.deps import get_db
from app.crud.products import create_product, save_profile, get_latest_profile
from app.crud.followups import log_followup

router = APIRouter()

AI_SERVICE_URL = "http://localhost:8001/followups"
# Later replace with ENV var in production


# -------------------------
# 1) Create Product
# -------------------------
@router.post("/", response_model=ProductOut)
def create_new(payload: ProductCreate, db: Session = Depends(get_db)):
    return create_product(db, payload)


# -------------------------
# 2) Update Profile + Get followups from AI
# -------------------------
@router.put("/{product_id}/profile")
def update_profile(product_id: str, payload: ProfileIn, db: Session = Depends(get_db)):

    # Save the profile JSON in DB
    saved_profile = save_profile(db, product_id, payload.profile)

    # ---- Call the AI service ----
    followups = []
    try:
        response = requests.post(
            AI_SERVICE_URL,
            json={"profile": payload.profile},
            timeout=15
        )
        response.raise_for_status()

        followups = response.json().get("questions", [])

        # ---- Save each AI question into follow_up_logs ----
        for q in followups:
            log_followup(
                db,
                product_id=product_id,
                question=q.get("text"),
                answer=None,
                asked_by="ai"
            )

    except Exception as e:
        # You can log error if needed
        print(f"AI Service Error: {e}")
        followups = []

    return {
        "status": "ok",
        "profile_id": saved_profile.id,
        "followups": followups
    }
