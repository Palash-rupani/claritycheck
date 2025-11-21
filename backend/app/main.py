from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_products import router as products_router
from app.core.db import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClarityCheck Backend")

# -------------------------
# 🔥 FULL OPEN CORS (allow all)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow ALL origins
    allow_credentials=True,
    allow_methods=["*"],        # allow ALL methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],        # allow ALL headers
)

# -------------------------
# Routers
# -------------------------
app.include_router(products_router, prefix="/products", tags=["products"])

# -------------------------
# Health Check
# -------------------------
@app.get("/")
def health():
    return {"status": "ok"}
