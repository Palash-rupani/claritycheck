from fastapi import FastAPI
from app.api.routes_products import router as products_router
from app.core.db import Base, engine

# Create tables in Supabase
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClarityCheck Backend")

app.include_router(products_router, prefix="/products", tags=["products"])

@app.get("/")
def health():
    return {"status": "ok"}
