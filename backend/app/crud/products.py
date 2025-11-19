from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.product_profile import ProductProfile

def create_product(db: Session, payload):
    p = Product(
        name=payload.name,
        category=payload.category,
        description=payload.description
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def save_profile(db: Session, product_id: str, profile: dict):
    rec = ProductProfile(product_id=product_id, profile=profile)
    db.add(rec)
    db.commit()
    return rec
