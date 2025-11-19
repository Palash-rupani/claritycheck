# ai-service/utils.py
import re
from typing import Dict, List

def profile_to_prompt(profile: Dict) -> str:
    """
    Convert structured profile JSON into a compact plain-text prompt for QG.
    Keep it readable and highlight keys/values.
    """
    parts = []
    for key in sorted(profile.keys()):
        val = profile[key]

        if isinstance(val, dict):
            parts.append(f"{key}: " + ", ".join(f"{k}={v}" for k, v in val.items()))

        elif isinstance(val, list):
            parts.append(f"{key}: " + ", ".join(str(x) for x in val))

        else:
            parts.append(f"{key}: {val}")

    return "\n".join(parts)


def clean_generated_text(text: str) -> str:
    """
    Postprocess raw model output into a single question string.
    Remove trailing tokens, split into first sentence if necessary.
    """
    t = text.strip()
    t = re.sub(r"\s+", " ", t)

    # Add '?' if model forgot it but sentence looks like a question
    if not t.endswith("?"):
        if re.search(r'\b(is|does|do|are|what|how|where|when|which|why|who)\b', t, re.I):
            t += "?"

    return t
