from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.product import ProductCreate, ProductOut
from app.schemas.profile import ProfileIn
from app.utils.deps import get_db
from app.crud.products import create_product, save_profile

router = APIRouter()

@router.post("/", response_model=ProductOut)
def create_new(payload: ProductCreate, db: Session = Depends(get_db)):
    return create_product(db, payload)

@router.put("/{product_id}/profile")
def update_profile(product_id: str, payload: ProfileIn, db: Session = Depends(get_db)):
    rec = save_profile(db, product_id, payload.profile)
    return {"status": "ok", "profile_id": rec.id}
