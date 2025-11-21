# ai-service/main.py
# Uploaded file reference: /mnt/data/9c6bd615-6a6f-40af-b74a-81eeb385b1b9.png

import os
import difflib
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Any
from dotenv import load_dotenv
from transformers import pipeline

from utils import profile_to_prompt, clean_generated_text

# Load environment variables
load_dotenv()

# Model and generation config (set via env or defaults)
APP_MODEL = os.getenv("AI_MODEL", "google/flan-t5-large")  # change to your Flan model id if needed
NUM_QUESTIONS = int(os.getenv("NUM_QUESTIONS", "5"))
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "128"))
NUM_CANDIDATES = int(os.getenv("NUM_CANDIDATES", str(max(8, NUM_QUESTIONS * 2))))  # generate extra candidates

app = FastAPI(title="ClarityCheck AI Service (Improved)")

# Initialize pipeline (CPU by default; set CUDA_VISIBLE_DEVICES or device_map externally if needed)
print(f"Loading model: {APP_MODEL} ... (this may take some time)")
qg_pipeline = pipeline("text2text-generation", model=APP_MODEL, device=-1)
print("Model loaded successfully.")


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
# HELPERS: filtering, fuzzy dedupe, semantic checks
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
    "what else",
    "are there any other",
    "can i ask",
    "how to ask",
    "ask about",
    "what can i ask",
    "other questions",
    "who is the manufacturer",
]

MEANINGFUL_KEYWORDS = [
    "ingredient", "sourcing", "supplier", "origin", "trace", "traceability",
    "test", "lab", "coa", "certificate", "certification", "allergen",
    "preservative", "processing", "pesticide", "farming", "manufacturing",
    "compliance", "rohs", "ce", "safety", "stability", "contaminant", "purity",
    "packaging", "recycl", "waste", "ethic", "sustainab", "supply", "quality",
]

def is_meaningful(question: str) -> bool:
    q = question.lower()
    return any(kw in q for kw in MEANINGFUL_KEYWORDS)

def is_forbidden(question: str) -> bool:
    q = question.lower()
    return any(p in q for p in FORBIDDEN_PATTERNS)

def is_duplicate(question: str, seen: List[str], threshold: float = 0.75) -> bool:
    for s in seen:
        ratio = difflib.SequenceMatcher(None, question.lower(), s.lower()).ratio()
        if ratio >= threshold:
            return True
    return False


# -----------------------------
# FALLBACK POOLS (category-aware)
# -----------------------------
FALLBACK_POOLS = {
    "electronics": [
        "Is the device compliant with RoHS or equivalent material restrictions?",
        "Can you provide details on the recyclability of key components?",
        "Are repair manuals and spare parts available for maintenance?",
        "Are safety test reports available for batteries and chargers?"
    ],
    "skincare": [
        "Have ingredients undergone skin irritation or sensitivity testing?",
        "Are any known allergens present in the formulation?",
        "Is there a Certificate of Analysis (COA) for key actives?",
        "Do suppliers provide ingredient provenance for botanical extracts?"
    ],
    "raw": [
        "What farming practices were used during cultivation?",
        "Were pesticides or fertilizers applied during growth?",
        "From which region or farm were the raw ingredients sourced?",
        "How was the product stored and transported post-harvest?"
    ],
    "packaged": [
        "Are all ingredients fully traceable to verified suppliers?",
        "What processing steps are used and are they documented?",
        "Are any additives or preservatives used in the product?",
        "Are third-party quality checks performed during production?"
    ],
    "supplement": [
        "Is a Certificate of Analysis (COA) available for each batch?",
        "Has the product undergone third-party purity or potency testing?",
        "Can you verify the origin of each active ingredient?",
        "Are stability and shelf-life studies available?"
    ],
    "generic": [
        "Are third-party safety or compliance certificates available?",
        "Can you share supplier traceability for the main components?",
        "Is there documentation validating the product claims?"
    ],
}


# -----------------------------
# POST /followups (improved)
# -----------------------------
@app.post("/followups", response_model=FollowupsResponse)
def generate_followups(req: FollowupRequest):
    """
    Generate high-quality, category-aware follow-up questions with strong filtering.
    Designed to work well with Google Flan-family models by heavy post-filtering
    and fallback pools to guarantee good questions.
    """

    product = req.product or {}
    profile = req.profile or {}

    name = (product.get("name") or "").strip()
    category_raw = (product.get("category") or "").lower().strip()
    description = (product.get("description") or "").strip()
    claim = (product.get("claim") or "").strip()

    # If profile is nested like Supabase (profile.profile), normalize:
    if isinstance(profile, dict) and "profile" in profile and isinstance(profile["profile"], dict):
        profile_inner = profile["profile"]
    else:
        profile_inner = profile

    ingredients = (profile_inner.get("ingredients") or "").strip()
    sourcing = (profile_inner.get("sourcing") or "").strip()
    certifications = (profile_inner.get("certifications") or "").strip()
    additional = (profile_inner.get("additionalDetails") or profile_inner.get("additional_details") or "").strip()

    structured_profile = profile_to_prompt(profile_inner)

    # --- category classification (simple heuristics)
    product_type = "generic"
    if any(x in category_raw for x in ["electronic", "device", "gadget", "appliance", "battery"]):
        product_type = "electronics"
    elif any(x in category_raw for x in ["skincare", "cosmetic", "cream", "lotion", "serum", "makeup"]):
        product_type = "skincare"
    elif any(x in category_raw for x in ["vegetable", "fruit", "grain", "produce", "potato"]):
        product_type = "raw"
    elif any(x in category_raw for x in ["snack", "food", "beverage", "packaged", "processed"]):
        product_type = "packaged"
    elif any(x in category_raw for x in ["supplement", "vitamin", "capsule", "tablet"]):
        product_type = "supplement"
    else:
        product_type = "generic"

    # --- Build model prompt (concise, strict instructions)
    base_prompt = f"""
You are a specialist assistant that generates one concise, category-specific transparency follow-up question.
Focus only on transparency: sourcing, testing, traceability, compliance, certifications, or safety.
DO NOT ask for product name, manufacturer name, batch/lot numbers, or generic "what else" style questions.
Product: {name}
Category: {category_raw}
Claim: {claim}
Description: {description}

Profile:
{structured_profile}

Return ONLY the question text. Keep it under 20 words.
"""

    # Generate candidate outputs (more than needed to increase chance of quality)
    candidates = []
    try:
        model_out = qg_pipeline(
            base_prompt,
            max_length=MAX_LENGTH,
            num_return_sequences=NUM_CANDIDATES
        )
        # model_out is a list of dicts with 'generated_text'
        for o in model_out:
            txt = o.get("generated_text") or ""
            candidates.append(clean_generated_text(txt))
    except Exception as e:
        print("Model generation error:", e)
        candidates = []

    # Post-process: strict filtering, dedupe (fuzzy), enforce meaningfulness
    questions: List[Dict[str, Any]] = []
    seen_texts: List[str] = []

    # helper: pick appropriate fallback pool
    fallback_pool = FALLBACK_POOLS.get(product_type, FALLBACK_POOLS["generic"])

    for cand in candidates:
        if not cand:
            continue
        q = cand.strip()
        q_low = q.lower()

        # 1) forbid meta or banned patterns
        if is_forbidden(q):
            continue

        # 2) enforce meaningful-ness: question must contain a transparency keyword OR match category-specific allowed themes
        if not is_meaningful(q):
            # small exception: allow short targeted questions that include 'is'/'are' + category hints, but still check keywords
            continue

        # 3) category safety: prevent ingredient questions for electronics
        if product_type == "electronics":
            if any(kw in q_low for kw in ["ingredient", "ingredients", "formulation", "preservative", "allergen"]):
                continue

        # 4) supply-side: avoid asking about 'who made' etc (redundant but safe)
        if any(phr in q_low for phr in ["who made", "who is", "who sells", "what is the name"]):
            continue

        # 5) dedupe via fuzzy matching
        if is_duplicate(q, seen_texts, threshold=0.75):
            continue

        # Accept
        seen_texts.append(q)
        questions.append({
            "id": f"q{len(questions)+1}",
            "text": q,
            "type": "text",
            "options": None
        })

        if len(questions) >= NUM_QUESTIONS:
            break

    # If not enough high-quality generated questions, fill from fallback pool (unique only)
    i = 0
    while len(questions) < NUM_QUESTIONS and i < len(fallback_pool) * 2:
        fallback_q = fallback_pool[len(questions) % len(fallback_pool)]
        if not is_duplicate(fallback_q, seen_texts, threshold=0.75):
            seen_texts.append(fallback_q)
            questions.append({
                "id": f"q{len(questions)+1}",
                "text": fallback_q,
                "type": "text",
                "options": None
            })
        i += 1

    # Final safety: if still short (very unlikely), add generic items
    generic_pool = FALLBACK_POOLS["generic"]
    j = 0
    while len(questions) < NUM_QUESTIONS and j < len(generic_pool) * 2:
        fallback_q = generic_pool[len(questions) % len(generic_pool)]
        if not is_duplicate(fallback_q, seen_texts, threshold=0.75):
            seen_texts.append(fallback_q)
            questions.append({
                "id": f"q{len(questions)+1}",
                "text": fallback_q,
                "type": "text",
                "options": None
            })
        j += 1

    # Final trimming/normalization (ensure text is clean)
    final_questions = []
    for q in questions[:NUM_QUESTIONS]:
        txt = q["text"].strip()
        # remove trailing punctuation issues
        if txt.endswith("?"):
            txt = txt.rstrip()
        final_questions.append({
            "id": q["id"],
            "text": txt,
            "type": "text",
            "options": None
        })

    return {"questions": final_questions}
