import os
from pathlib import Path
from dotenv import load_dotenv

# Try loading from casepilot/.env or parent .env
base_dir = Path(__file__).resolve().parent
env_paths = [
    base_dir.parent.parent / ".env",
    base_dir.parent.parent / ".env.local",
    base_dir / ".env",
]

for p in env_paths:
    if p.exists():
        load_dotenv(p, override=True)
        break

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
AI_PORT = int(os.getenv("AI_PORT", "8000"))
AI_HOST = os.getenv("AI_HOST", "127.0.0.1")

# Max output tokens for gpt-4o-mini to strictly minimize cost
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "450"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.1"))
