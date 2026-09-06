"""
Conversational Response Generator for CasePilot.
Synthesizes empathetic, authoritative, and concise 1-2 sentence officer responses
using OpenAI gpt-4o-mini with strict token-budget discipline (< 120 output tokens).
"""

import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from config import OPENAI_API_KEY, OPENAI_MODEL, TEMPERATURE
from llm_client import client
from models import PlannedQuestion

logger = logging.getLogger("casepilot.ai.response_generator")

OFFICER_PERSONA_PROMPT = """You are CasePilot, a senior AI Cybercrime Intake Officer for India's National Cyber Crime Reporting Portal (NCRP / 1930).
Your tone is calm, empathetic, authoritative, and reassuring.

Guidelines:
1. Keep your response strictly to 1-2 sentences (under 45 words).
2. If the citizen asked a question (e.g. "what is UTR", "can you fill the form", "will police visit"), answer it directly and accurately first.
3. If new facts were recorded (e.g. fraud amount, suspect UPI, handle), briefly acknowledge them with empathy without repeating raw field names.
4. Seamlessly transition to asking the Planned Next Question provided.
5. NEVER ask more than ONE question.
6. Never sound robotic, bureaucratic, or accusatory.
"""

class ResponseGenerator:
    """
    Generates intelligent conversational responses powered by gpt-4o-mini,
    bridging deterministic fact extraction and question planning.
    """

    @classmethod
    async def generate_response(
        cls,
        user_message: str,
        flow_title: str,
        case_updates: Dict[str, Any],
        planned_question: Optional[PlannedQuestion],
        conversation_history: List[Dict[str, str]],
        is_inquiry: bool = False
    ) -> Tuple[str, int]:
        """
        Synthesizes an empathetic conversational response.
        Returns: (response_text, tokens_used)
        """
        # Fallback text if LLM call cannot proceed
        default_ack = ""
        if 'fraudAmount' in case_updates:
            clean_amt = str(case_updates['fraudAmount']).replace(',', '')
            try:
                default_ack = f"I’ve recorded the monetary loss of ₹{int(float(clean_amt)):,}."
            except ValueError:
                default_ack = f"I’ve recorded the monetary loss of ₹{clean_amt}."
        elif 'offenderHandle' in case_updates:
            default_ack = f"I’ve noted the offending profile {case_updates['offenderHandle']}."
        elif len(case_updates) > 0:
            default_ack = "I’ve recorded those incident details."

        q_text = planned_question.question_text if planned_question else ""
        fallback_msg = f"{default_ack} {q_text}".strip() if (default_ack or q_text) else (
            "I am ready to assist you. Please tell me what occurred or how much money was involved."
        )

        if not client or not OPENAI_API_KEY:
            return fallback_msg, 0

        # Build compact context for gpt-4o-mini
        context_payload = {
            "citizen_message": user_message,
            "category": flow_title,
            "newly_recorded_facts": case_updates,
            "planned_next_question": q_text,
            "question_rationale": planned_question.rationale if planned_question else "",
            "is_general_inquiry": is_inquiry
        }

        # Last 2 conversation turns for conversational continuity
        recent_history = conversation_history[-2:] if conversation_history else []
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": OFFICER_PERSONA_PROMPT}
        ]
        for h in recent_history:
            if isinstance(h, dict):
                r = h.get("role", "user")
                t = h.get("text", "")
            else:
                r = getattr(h, "role", "user")
                t = getattr(h, "text", "")
            messages.append({"role": "user" if r == "user" else "assistant", "content": str(t)})
        
        user_prompt = f"Context:\n{json.dumps(context_payload, separators=(',', ':'))}\n\nRespond as CasePilot:"
        messages.append({"role": "user", "content": user_prompt})

        try:
            response = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=120
            )
            reply = response.choices[0].message.content or fallback_msg
            tokens_used = response.usage.total_tokens if response.usage else 0
            return reply.strip().strip('"'), tokens_used
        except Exception as e:
            logger.warning(f"Conversational generation failed: {e}. Using deterministic fallback.")
            return fallback_msg, 0

    @classmethod
    async def answer_general_inquiry(
        cls,
        user_message: str,
        flow_title: str,
        conversation_history: List[Dict[str, str]]
    ) -> Tuple[str, int]:
        """
        Specialized handler for general advisory and FAQ questions.
        """
        lower = user_message.lower()
        if "fill" in lower and "form" in lower:
            return (
                "Yes, I can file and fill out your entire cybercrime complaint form right here! "
                "Just tell me what happened in your own words—such as what incident occurred, any money lost, or platform involved—and I will automatically populate every statutory field.",
                0
            )

        if not client or not OPENAI_API_KEY:
            return (
                "I can help you file an official cyber complaint and guide you through 1930 Golden Hour freeze procedures. "
                "Please describe what incident occurred so we can take immediate action.",
                0
            )

        inquiry_prompt = (
            "You are CasePilot, senior cybercrime intake officer in India. "
            "The citizen is asking an advisory question regarding cybercrime procedures, 1930 helpline, or police reporting. "
            "Answer clearly, accurately, and reassuringly in 1-2 sentences (under 45 words), then offer to help them file their complaint."
        )

        try:
            response = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": inquiry_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=120
            )
            reply = response.choices[0].message.content or "I am here to guide you through reporting this cyber incident."
            tokens_used = response.usage.total_tokens if response.usage else 0
            return reply.strip().strip('"'), tokens_used
        except Exception as e:
            logger.warning(f"Inquiry answer failed: {e}")
            return (
                "I am here to guide you through reporting this cyber incident. "
                "Please share the details of what happened so we can secure your accounts.",
                0
            )
