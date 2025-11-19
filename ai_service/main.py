# ai-service/main.py
import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any
from dotenv import load_dotenv
from transformers import pipeline
from utils import profile_to_prompt, clean_generated_text

# Load environment variables
load_dotenv()

APP_MODEL = os.getenv("AI_MODEL", "google/flan-t5-base")
NUM_QUESTIONS = int(os.getenv("NUM_QUESTIONS", "5"))
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "128"))

app = FastAPI(title="ClarityCheck AI Service")
 
# Load the HuggingFace pipeline
print(f"Loading model: {APP_MODEL} ... (this may take some time)")
qg_pipeline = pipeline("text2text-generation", model=APP_MODEL, device=-1)
print("Model loaded successfully.")

# Request/Response Schemas
class ProfileRequest(BaseModel):
    profile: Dict[str, Any]

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
# FOLLOW-UP QUESTION GENERATION
# -----------------------------
@app.post("/followups", response_model=FollowupsResponse)
def generate_followups(req: ProfileRequest):
    profile = req.profile or {}
    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="profile must be a JSON object")

    prompt = profile_to_prompt(profile)

    full_prompt = (
        "Generate a concise follow-up question about product transparency only.\n"
        "Focus areas: ingredient origin, processing steps, certifications, suppliers, environmental impact, "
        "safety testing, and claim validation.\n\n"
        "Rules:\n"
        "- ONE question per output.\n"
        "- Do NOT ask about product name, ingredients list, or manufacturer name.\n"
        "- No generic supplement questions.\n"
        "- No repeated or vague questions.\n\n"
        "Profile:\n" + prompt + "\n\n"
        "Return only one question."
    )

    generated = qg_pipeline(
        full_prompt,
        max_length=MAX_LENGTH,
        num_return_sequences=NUM_QUESTIONS
    )

    questions = []
    seen = set()

    FORBIDDEN = [
        "manufacturer",
        "name of the product",
        "what is the name",
        "what are the ingredients",
        "supplement",
        "product name"
    ]

    fallback_pool = [
        "Where are the raw ingredients sourced from?",
        "Has the product undergone any third-party safety testing?",
        "Do your suppliers hold verifiable certifications?",
        "What environmental practices are followed during production?",
        "Do you have documentation to validate your product claims?",
        "Is each ingredient traceable to its origin ?",
    ]

    for item in generated:
        raw = item.get("generated_text", "").strip()

        # clean formatting
        q = clean_generated_text(raw)

        # filter forbidden patterns
        if any(bad in q.lower() for bad in FORBIDDEN):
            continue

        # dedupe
        if q.lower() in seen:
            continue
        seen.add(q.lower())

        questions.append({
            "id": f"q{len(questions)+1}",
            "text": q,
            "type": "text",
            "options": None
        })

        if len(questions) >= NUM_QUESTIONS:
            break

    # fallback if needed
    while len(questions) < NUM_QUESTIONS:
        q = fallback_pool[len(questions) % len(fallback_pool)]
        questions.append({
            "id": f"q{len(questions)+1}",
            "text": q,
            "type": "text",
            "options": None
        })

    return {"questions": questions}
