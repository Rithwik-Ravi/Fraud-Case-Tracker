import json
import logging
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL, TEMPERATURE, MAX_OUTPUT_TOKENS

logger = logging.getLogger("casepilot.ai.llm")

client: Optional[AsyncOpenAI] = None
if OPENAI_API_KEY:
    try:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        logger.info(f"OpenAI client initialized with model: {OPENAI_MODEL}")
    except Exception as e:
        logger.warning(f"Could not initialize OpenAI client: {e}")

SYSTEM_PROMPT = """You are CasePilot, an expert Indian Cybercrime Intake Engine.
Your job is to assist the citizen by extracting facts from their message into the structured complaint, detecting category changes, and formulating the single next most important question.
Act like an empathetic, highly competent police intake officer taking notes in real time.

Return ONLY a JSON object with this exact structure:
{
  "detected_flow": "FINANCIAL_FRAUD | SOCIAL_MEDIA | HACKING | RANSOMWARE | PHISHING | HARASSMENT | WOMEN_CHILDREN",
  "extracted_fields": {
    "fraudAmount": "number as string or null",
    "paymentMode": "UPI | Net Banking | Credit Card | Debit Card | null",
    "bankName": "Bank Name or null",
    "utrNumber": "12-digit UTR or null",
    "beneficiaryAccount": "UPI ID or account or null",
    "socialPlatform": "Instagram | WhatsApp | Telegram | etc or null",
    "offenderHandle": "@handle or profile link or null",
    "affectedService": "Gmail | Outlook | etc or null",
    "recoveryChanged": "yes | no | null",
    "fileExtension": ".locked etc or null",
    "ransomDemanded": "amount or crypto or null",
    "channel": "WhatsApp | SMS | Call or null",
    "incidentDate": "YYYY-MM-DD or descriptive string or null",
    "description": "one sentence summary of incident or null"
  },
  "extracted_pills": ["Short pill summary 1", "Short pill summary 2"],
  "acknowledgement": "A 1-2 sentence acknowledgement of what you just recorded.",
  "next_question": "Exactly one focused question to ask for the most urgent missing requirement.",
  "navigation_action": {
    "primary_tab": "home | register | track | help | null",
    "sub_tab": "incident | financial | suspect | evidence | review | numbers | faq | immediate | null",
    "case_id": "case ID to select or null",
    "focus_field": "field ID to highlight or null"
  }
}

Rules:
1. Be concise. Never interrogate with multiple questions at once.
2. If the user reports financial loss in a non-financial flow (e.g. Phishing or Other), detect FINANCIAL_FRAUD.
3. If the user gave an amount, extract it cleanly without currency symbols.
4. Do NOT re-ask questions if the fact is already recorded in Known Facts.
5. If citizen asks to navigate, switch tabs, view cases, see helplines, or inspect evidence, set navigation_action appropriately.
"""

from prompts.prompt_manager import build_intake_prompt

async def run_llm_extraction(
    message: str,
    current_flow: str,
    current_state: Dict[str, Any],
    missing_fields: List[str],
    last_dialogue: List[Dict[str, str]]
) -> Optional[Dict[str, Any]]:
    """
    Executes a level-guided, category-targeted call to gpt-4o-mini.
    Returns parsed dictionary or None on failure/missing API key.
    """
    if not client or not OPENAI_API_KEY:
        return None

    # Filter current_state to non-empty fields to save input tokens
    compact_state = {k: v for k, v in current_state.items() if v not in (None, '', [], {})}

    system_prompt = build_intake_prompt(
        active_flow=current_flow,
        known_facts=compact_state,
        missing_priority_fields=missing_fields,
        citizen_message=message,
        recent_dialogue=last_dialogue
    )

    user_payload = {
        "citizen_message": message,
        "recent_dialogue": last_dialogue[-2:] if last_dialogue else []
    }

    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_payload, separators=(',', ':'))}
            ],
            response_format={"type": "json_object"},
            temperature=TEMPERATURE,
            max_tokens=MAX_OUTPUT_TOKENS
        )

        content = response.choices[0].message.content
        if not content:
            return None

        data = json.loads(content)
        usage_data = {}
        if response.usage:
            try:
                from llm_usage import UsageTracker
                usage_data = UsageTracker.record_usage(
                    model=OPENAI_MODEL,
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens
                )
            except Exception as ex:
                logger.warning(f"Could not record usage: {ex}")
        data["_usage"] = usage_data
        data["_tokens_used"] = usage_data.get("total_tokens", response.usage.total_tokens if response.usage else 0)
        return data

    except Exception as e:
        logger.error(f"OpenAI extraction failed: {e}. Falling back to deterministic engine.")
        return None
