from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_products import router as products_router
from app.core.db import Base, engine

# Create tables in Supabase
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClarityCheck Backend")

# --- CORS settings ---
origins = [
    "http://localhost:3000",  # your frontend URL
    "http://localhost:5173",  # Vite dev server (if used)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods
    allow_headers=["*"],  # allow all headers
)

# --- Routers ---
app.include_router(products_router, prefix="/products", tags=["products"])

# --- Health check ---
@app.get("/")
def health():
    return {"status": "ok"}
