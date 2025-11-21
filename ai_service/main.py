# ai-service/main.py

import os
import difflib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

from utils import profile_to_prompt, clean_generated_text

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()

MODEL_NAME = os.getenv("AI_MODEL", "google/flan-t5-large")
NUM_QUESTIONS = int(os.getenv("NUM_QUESTIONS", "6"))
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "150"))
NUM_CANDIDATES = int(os.getenv("NUM_CANDIDATES", str(NUM_QUESTIONS * 3)))

app = FastAPI(title="ClarityCheck AI Service - Smart QG")

print(f"\n🚀 Loading model: {MODEL_NAME} (CPU-only)\n")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    device_map="cpu"
)

qg_pipeline = pipeline(
    "text2text-generation",
    model=model,
    tokenizer=tokenizer,
    device=-1
)

print("✅ Model loaded successfully.\n")


# -----------------------------
# SCHEMAS
# -----------------------------
class FollowupRequest(BaseModel):
    product: Dict[str, Any] | None = None
    profile: Dict[str, Any] | None = None


class QuestionOut(BaseModel):
    id: str
    text: str
    type: str
    options: List[str] | None = None


class FollowupsResponse(BaseModel):
    questions: List[QuestionOut]


@app.get("/")
def root():
    return {"status": "ok", "service": "claritycheck-ai"}


# -----------------------------
# FILTERING RULES
# -----------------------------
FORBIDDEN_PATTERNS = [
    "manufacturer",
    "who made",
    "brand name",
    "product name",
    "what is the name",
    "batch number",
    "lot number",
    "where is it sold",
    "any other questions",
    "are there any other",
    "what else",
    "other questions",
    "can i ask",
    "how to ask",
]

MEANINGFUL_KEYWORDS = [
    "ingredient", "sourcing", "supplier", "origin", "trace", "traceability",
    "test", "lab", "coa", "certificate", "certification", "allergen",
    "preservative", "processing", "pesticide", "farming", "manufacturing",
    "compliance", "rohs", "ce", "safety", "stability", "contaminant", "purity",
    "packaging", "recycl", "waste", "ethic", "sustainab", "supply", "quality",
]


def is_forbidden(q: str) -> bool:
    q = q.lower()
    return any(f in q for f in FORBIDDEN_PATTERNS)


def is_meaningful(q: str) -> bool:
    q = q.lower()
    return any(k in q for k in MEANINGFUL_KEYWORDS)


def is_duplicate(q: str, seen: List[str], threshold=0.75) -> bool:
    for s in seen:
        if difflib.SequenceMatcher(None, q.lower(), s.lower()).ratio() >= threshold:
            return True
    return False


# -----------------------------
# CATEGORY FALLBACK POOLS
# -----------------------------
FALLBACK = {
    "electronics": [
        "Is the product compliant with RoHS or similar safety standards?",
        "Are battery or electrical safety test reports available?",
        "Are key components recyclable or sustainably sourced?",
        "Are repair manuals or spare parts available?"
    ],
    "skincare": [
        "Are any ingredients subject to allergen warnings?",
        "Is there third-party testing for safety or irritation?",
        "Is a Certificate of Analysis available for key actives?",
        "Do suppliers provide verified sourcing details?"
    ],
    "raw": [
        "What farming practices were used during cultivation?",
        "Were any pesticides applied during growth?",
        "From which region were the raw ingredients sourced?",
        "How was freshness maintained during transport?"
    ],
    "packaged": [
        "Are all ingredients fully traceable to their suppliers?",
        "What processing or quality-control steps are documented?",
        "Are any additives or preservatives used?",
        "Are third-party quality checks performed?"
    ],
    "supplement": [
        "Is a Certificate of Analysis (COA) available for each batch?",
        "Has the product undergone purity or potency testing?",
        "Can you trace the source of each active ingredient?",
        "Are stability studies available for shelf life?"
    ],
    "generic": [
        "Are third-party safety or compliance reports available?",
        "Can you verify supplier traceability for key materials?",
        "Is documentation available to support marketing claims?"
    ]
}


# -----------------------------
# POST /followups
# -----------------------------
@app.post("/followups", response_model=FollowupsResponse)
def generate_followups(req: FollowupRequest):

    product = req.product or {}
    profile = req.profile or {}

    # Handle Supabase structure
    profile_data = profile.get("profile", profile)

    name = (product.get("name") or "").strip()
    description = (product.get("description") or "").strip()
    claim = (product.get("claim") or "").strip()
    category_raw = (product.get("category") or "").lower().strip()

    ingredients = profile_data.get("ingredients", "")
    sourcing = profile_data.get("sourcing", "")
    certifications = profile_data.get("certifications", "")

    structured_profile = profile_to_prompt(profile_data)

    # Category detection
    if any(x in category_raw for x in ["electronic", "device", "gadget"]):
        category = "electronics"
    elif any(x in category_raw for x in ["skincare", "cosmetic", "serum"]):
        category = "skincare"
    elif any(x in category_raw for x in ["vegetable", "fruit", "grain", "produce"]):
        category = "raw"
    elif any(x in category_raw for x in ["snack", "food", "packaged", "processed"]):
        category = "packaged"
    elif any(x in category_raw for x in ["supplement", "vitamin"]):
        category = "supplement"
    else:
        category = "generic"

    # -----------------------------
    # Build model prompt
    # -----------------------------
    base_prompt = f"""
Generate ONE short (max 20 words), category-focused transparency question.

Product Name: {name}
Category: {category_raw}
Claim: {claim}
Description: {description}

Profile:
{structured_profile}

Rules:
- MUST focus on transparency: testing, sourcing, traceability, certification, compliance, or safety.
- NEVER ask about product name, manufacturer name, “other questions”, or meta questions.
- MUST match the category.
- Question must be unique and meaningful.
Return only the question.
"""

    # -----------------------------
    # Generate raw outputs
    # -----------------------------
    raw_candidates = qg_pipeline(
        base_prompt,
        max_length=MAX_LENGTH,
        num_return_sequences=NUM_CANDIDATES
    )

    candidates = [clean_generated_text(c.get("generated_text", "")) for c in raw_candidates]

    # -----------------------------
    # Filter, dedupe, validate
    # -----------------------------
    final = []
    seen = []

    for q in candidates:
        q = q.strip()
        if not q:
            continue
        if is_forbidden(q):
            continue
        if not is_meaningful(q):
            continue
        if is_duplicate(q, seen):
            continue

        # electronics: never ask ingredient questions
        if category == "electronics" and any(x in q.lower() for x in ["ingredient", "formulation"]):
            continue

        seen.append(q)
        final.append(q)
        if len(final) >= NUM_QUESTIONS:
            break

    # -----------------------------
    # If not enough → use fallbacks
    # -----------------------------
    pool = FALLBACK.get(category, FALLBACK["generic"])

    for fb in pool:
        if len(final) >= NUM_QUESTIONS:
            break
        if not is_duplicate(fb, seen):
            seen.append(fb)
            final.append(fb)

    # -----------------------------
    # Convert to output format
    # -----------------------------
    output = []
    for i, q in enumerate(final[:NUM_QUESTIONS]):
        output.append({
            "id": f"q{i+1}",
            "text": q,
            "type": "text",
            "options": None
        })

    return {"questions": output}
