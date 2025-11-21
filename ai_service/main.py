# ai-service/main.py

import os
import difflib
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Any
from dotenv import load_dotenv
from transformers import pipeline

from utils import profile_to_prompt, clean_generated_text

# -----------------------------
# ENV + MODEL CONFIG
# -----------------------------
load_dotenv()

APP_MODEL = os.getenv("AI_MODEL", "google/flan-t5-large")   # CPU-friendly
NUM_QUESTIONS = int(os.getenv("NUM_QUESTIONS", "5"))
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "128"))
NUM_CANDIDATES = max(NUM_QUESTIONS * 3, 10)   # generate more → better dedupe

# -----------------------------
# START FASTAPI
# -----------------------------
app = FastAPI(title="ClarityCheck AI Service (No Torch Version)")


# -----------------------------
# LOAD MODEL — SAFE (NO TORCH)
# -----------------------------
print(f"🚀 Loading model: {APP_MODEL} (CPU-only, no torch)...")

qg_pipeline = pipeline(
    "text2text-generation",
    model=APP_MODEL,
    device=-1  # force CPU, no torch needed
)

print("✅ Model loaded successfully (pipeline only).")


# -----------------------------
# SCHEMAS
# -----------------------------
class FollowupRequest(BaseModel):
    product: Dict[str, Any] | None = None
    profile: Dict[str, Any] | None = None


class QuestionOut(BaseModel):
    id: str
    text: str
    type: str = "text"
    options: List[str] | None = None


class FollowupsResponse(BaseModel):
    questions: List[QuestionOut]


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "claritycheck-ai"}


# -----------------------------
# FILTERS + DEDUPE
# -----------------------------
FORBIDDEN = [
    "any other",
    "what else",
    "other questions",
    "anything else",
    "can i ask",
    "what can i ask",
    "manufacturer",
    "who made",
    "brand name",
    "batch number",
    "lot number",
    "product name",
]

MEANINGFUL_KEYWORDS = [
    "ingredient", "sourcing", "supplier", "origin", "trace", "lab", "test",
    "certificate", "coa", "allergen", "processing", "pesticide", "farming",
    "safety", "compliance", "rohs", "recycl", "purity", "stability",
]

def is_forbidden(q: str) -> bool:
    q = q.lower()
    return any(bad in q for bad in FORBIDDEN)

def is_meaningful(q: str) -> bool:
    q = q.lower()
    return any(kw in q for kw in MEANINGFUL_KEYWORDS)

def is_duplicate(q: str, seen: List[str], threshold: float = 0.78) -> bool:
    for s in seen:
        if difflib.SequenceMatcher(None, q.lower(), s.lower()).ratio() >= threshold:
            return True
    return False


# -----------------------------
# FALLBACK QUESTIONS
# -----------------------------
FALLBACK = {
    "electronics": [
        "Is the device compliant with RoHS material restrictions?",
        "Are safety tests available for batteries or heating components?",
        "Are repair manuals or spare parts available for servicing?",
        "Are key components recyclable or reusable?",
    ],
    "skincare": [
        "Are there irritation or sensitization test reports for the formula?",
        "Do suppliers provide provenance for botanical ingredients?",
        "Is a Certificate of Analysis available for active ingredients?",
        "Are allergens disclosed clearly for sensitive users?",
    ],
    "packaged": [
        "Are all ingredients traceable to verified suppliers?",
        "What quality control steps are followed during processing?",
        "Are preservatives or additives documented clearly?",
        "Are third-party lab tests available for contaminants?",
    ],
    "raw": [
        "What farming practices were used during cultivation?",
        "Were pesticides or fertilizers applied during growth?",
        "From which region were the raw ingredients sourced?",
        "How was the product stored and transported after harvest?",
    ],
    "supplement": [
        "Is a Certificate of Analysis available for each batch?",
        "Has the product undergone purity or potency testing?",
        "Are all active ingredients fully traceable to origin?",
        "Are stability and shelf-life studies documented?",
    ],
    "generic": [
        "Are third-party compliance certificates available?",
        "Can you share supplier traceability for main materials?",
        "Is there documentation validating major product claims?",
        "Are quality or safety test reports available?",
    ],
}


# -----------------------------
# MAIN ENDPOINT
# -----------------------------
@app.post("/followups", response_model=FollowupsResponse)
def generate_followups(req: FollowupRequest):

    product = req.product or {}
    profile = req.profile or {}

    name = (product.get("name") or "").strip()
    category_raw = (product.get("category") or "").lower().strip()
    description = (product.get("description") or "").strip()
    claim = (product.get("claim") or "").strip()

    # supabase nested structure fix
    if isinstance(profile, dict) and "profile" in profile:
        profile = profile["profile"]

    structured_profile = profile_to_prompt(profile)

    # category detection
    if any(x in category_raw for x in ["electronic", "device", "gadget"]):
        ptype = "electronics"
    elif any(x in category_raw for x in ["skincare", "cosmetic", "serum", "cream"]):
        ptype = "skincare"
    elif any(x in category_raw for x in ["snack", "food", "packaged", "beverage"]):
        ptype = "packaged"
    elif any(x in category_raw for x in ["fruit", "vegetable", "raw", "grain"]):
        ptype = "raw"
    elif any(x in category_raw for x in ["supplement", "tablet", "vitamin"]):
        ptype = "supplement"
    else:
        ptype = "generic"

    # ------------------------
    # MODEL PROMPT
    # ------------------------
    prompt = f"""
Generate ONE concise transparency follow-up question.
Focus ONLY on: sourcing, testing, compliance, traceability, certifications, quality checks, safety, or ingredient origin.
Avoid generic, meta, or repetitive questions.

Product: {name}
Category: {category_raw}
Claim: {claim}
Description: {description}

Profile:
{structured_profile}

Rules:
- MUST be under 20 words.
- MUST be meaningful.
- MUST be category-appropriate.
- NEVER ask “any other questions”.
- NEVER ask for product name or manufacturer.
Return ONLY the question text.
"""

    # ------------------------
    # GENERATE CANDIDATES
    # ------------------------
    raw_outputs = qg_pipeline(
        prompt,
        max_length=MAX_LENGTH,
        num_return_sequences=NUM_CANDIDATES,
    )

    candidates = [clean_generated_text(o.get("generated_text", "")) for o in raw_outputs]

    seen = []
    final = []

    # ------------------------
    # FILTER + DEDUPE
    # ------------------------
    for q in candidates:
        if not q:
            continue
        qlow = q.lower()

        if is_forbidden(qlow):
            continue
        if not is_meaningful(qlow):
            continue
        if ptype == "electronics" and "ingredient" in qlow:
            continue
        if is_duplicate(qlow, seen):
            continue

        seen.append(qlow)
        final.append(q)

        if len(final) >= NUM_QUESTIONS:
            break

    # ------------------------
    # FALLBACKS
    # ------------------------
    fb = FALLBACK.get(ptype, FALLBACK["generic"])
    i = 0
    while len(final) < NUM_QUESTIONS and i < len(fb):
        if not is_duplicate(fb[i].lower(), seen):
            final.append(fb[i])
            seen.append(fb[i].lower())
        i += 1

    # ------------------------
    # FORMAT OUTPUT
    # ------------------------
    output = [
        QuestionOut(id=f"q{i+1}", text=final[i])
        for i in range(min(len(final), NUM_QUESTIONS))
    ]

    return FollowupsResponse(questions=output)
