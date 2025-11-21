import os
import difflib
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Any
from dotenv import load_dotenv

from utils import profile_to_prompt, clean_generated_text

# Load .env variables
load_dotenv()

HF_API_TOKEN = os.getenv("HF_API_KEY")
HF_MODEL = os.getenv("AI_MODEL", "google/flan-t5-large")
NUM_QUESTIONS = int(os.getenv("NUM_QUESTIONS", "5"))
NUM_CANDIDATES = int(os.getenv("NUM_CANDIDATES", "10"))
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "128"))

if not HF_API_TOKEN:
    raise ValueError("❌ Missing HF_API_KEY in environment variables.")

HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

HEADERS = {
    "Authorization": f"Bearer {HF_API_TOKEN}",
    "Content-Type": "application/json"
}

app = FastAPI(title="ClarityCheck AI Service (HuggingFace API)")


# ----------- SCHEMAS ------------
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
    return {"status": "ok", "service": "claritycheck-ai-hf"}


# ----------- FILTERS & HELPERS ------------

FORBIDDEN_PATTERNS = [
    "manufacturer",
    "who made",
    "brand name",
    "product name",
    "what is the name",
    "batch number",
    "lot number",
    "any other questions",
    "what else",
    "other questions",
    "can i ask",
    "how to ask",
]

MEANINGFUL_KEYWORDS = [
    "ingredient", "sourcing", "supplier", "origin", "trace", "traceability",
    "test", "lab", "coa", "certificate", "certifications", "allergen",
    "processing", "pesticide", "farming", "safety", "purity",
]

def is_forbidden(q: str):
    q = q.lower()
    return any(x in q for x in FORBIDDEN_PATTERNS)

def is_meaningful(q: str):
    q = q.lower()
    return any(x in q for x in MEANINGFUL_KEYWORDS)

def is_duplicate(q: str, seen: list, threshold=0.75):
    for s in seen:
        if difflib.SequenceMatcher(None, q.lower(), s.lower()).ratio() >= threshold:
            return True
    return False


# ----------- FALLBACK POOLS ------------
FALLBACK = {
    "skincare": [
        "Have the active ingredients been tested for purity?",
        "Do suppliers provide traceability for botanical ingredients?",
        "Is there a Certificate of Analysis for key actives?",
        "Are any allergens present in the formulation?",
    ],
    "packaged": [
        "Are additives or preservatives used?",
        "Are all ingredients traceable to verified suppliers?",
        "What quality checks occur during manufacturing?",
        "Are third-party lab tests available?",
    ],
    "raw": [
        "What farming practices were used?",
        "Were pesticides applied during growth?",
        "From which region was it sourced?",
        "How was it stored post-harvest?",
    ],
    "electronics": [
        "Is the device compliant with RoHS material safety standards?",
        "Are safety tests available for the battery?",
        "Are repairability or spare parts available?",
        "Is the device recyclable?",
    ],
    "generic": [
        "Are third-party safety certificates available?",
        "Is supplier traceability available for key components?",
        "Has the product undergone any lab testing?",
    ],
}


# ----------- POST: generate followups ------------
@app.post("/followups", response_model=FollowupsResponse)
def generate_followups(req: FollowupRequest):

    product = req.product or {}
    profile = req.profile or {}

    name = (product.get("name") or "").strip()
    category_raw = (product.get("category") or "").lower().strip()
    description = (product.get("description") or "").strip()
    claim = (product.get("claim") or "").strip()

    # Normalize nested profile shape
    profile_data = profile.get("profile", profile)
    structured_profile = profile_to_prompt(profile_data)

    # ---------- Detect Category ----------
    if any(x in category_raw for x in ["skincare", "cosmetic", "serum", "cream"]):
        product_type = "skincare"
    elif any(x in category_raw for x in ["food", "snack", "beverage", "packaged"]):
        product_type = "packaged"
    elif any(x in category_raw for x in ["vegetable", "fruit", "raw", "produce"]):
        product_type = "raw"
    elif any(x in category_raw for x in ["device", "electronic", "gadget"]):
        product_type = "electronics"
    else:
        product_type = "generic"

    # ---------- Build Prompt ----------
    prompt = f"""
Generate a concise, category-specific transparency follow-up question.
Rules:
- Focus ONLY on transparency, safety, sourcing, tests, traceability.
- DO NOT ask generic questions like "What else?".
- DO NOT ask about product name, manufacturer name, batch or lot numbers.
- Keep question under 20 words.

Product: {name}
Category: {category_raw}
Claim: {claim}
Description: {description}

Profile:
{structured_profile}

Return ONLY the question text.
"""

    # ---------- Request HuggingFace API ----------
    response = requests.post(
        HF_URL,
        headers=HEADERS,
        json={
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": MAX_LENGTH,
                "num_return_sequences": NUM_CANDIDATES,
                "return_full_text": False
            }
        }
    )

    raw_outputs = response.json()

    # HF might return a list or error message
    if isinstance(raw_outputs, dict) and "error" in raw_outputs:
        print("HF API Error:", raw_outputs)
        raw_outputs = []

    candidates = []
    for item in raw_outputs:
        text = item.get("generated_text", "").strip()
        candidates.append(clean_generated_text(text))

    # ---------- Filtering / Deduping ----------
    final = []
    seen = []

    for q in candidates:
        if not q:
            continue
        if is_forbidden(q):
            continue
        if not is_meaningful(q):
            continue
        if is_duplicate(q, seen):
            continue

        seen.append(q)
        final.append(q)

        if len(final) >= NUM_QUESTIONS:
            break

    # ---------- Add fallbacks if needed ----------
    fallback_pool = FALLBACK.get(product_type, FALLBACK["generic"])
    for fb in fallback_pool:
        if len(final) >= NUM_QUESTIONS:
            break
        if not is_duplicate(fb, seen):
            seen.append(fb)
            final.append(fb)

    # ---------- Build Response ----------
    return {
        "questions": [
            {"id": f"q{i+1}", "text": q, "type": "text", "options": None}
            for i, q in enumerate(final[:NUM_QUESTIONS])
        ]
    }
