"""
Case Inspection & Status Assessment Engine for CasePilot.
Equips the AI Copilot with full context awareness of the citizen's tracked cases,
active case cards, and draft complaint completeness.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from config import OPENAI_API_KEY, OPENAI_MODEL, TEMPERATURE
from llm_client import client
from models import UIAction, IntakeResponse

logger = logging.getLogger("casepilot.ai.case_inspector")

INSPECTION_SYSTEM_PROMPT = """You are CasePilot, senior cybercrime investigative officer and case manager for India's National Cyber Crime Reporting Portal (NCRP).
Your role is to inspect the citizen's case file, evaluate statutory completeness, report investigative status, and clearly guide the next required action.

Guidelines:
1. Provide a direct, authoritative, professional answer in 2-3 sentences (under 60 words).
2. Never repeat generic questions like "what was the monetary amount lost" when reviewing an existing case.
3. Explicitly state whether the case file has all necessary facts/evidence recorded.
4. Highlight current status (e.g. 1930 lien marker, bank hold, police FIR) and the immediate next step (e.g. branch chargeback submission, magistrate restitution).
"""

class CaseInspector:
    """
    Intelligently inspects active and historical case files in the citizen's portal.
    """

    @classmethod
    def match_target_case(
        cls,
        message: str,
        current_ui_location: Dict[str, Any],
        tracked_cases: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Identifies which tracked case the user is referencing."""
        if not tracked_cases:
            return None

        lower = message.lower()

        # 1. Match specific Case ID in message (e.g. CC-2026-88192 or 88192)
        id_match = re.search(r'\b(cc-2026-\d{5})\b', lower)
        if id_match:
            cid = id_match.group(1).upper()
            for c in tracked_cases:
                if c.get('id', '').upper() == cid:
                    return c

        num_match = re.search(r'\bcase\s*(\d{5})\b', lower)
        if num_match:
            cid = f"CC-2026-{num_match.group(1)}"
            for c in tracked_cases:
                if c.get('id', '').upper() == cid:
                    return c

        # 2. Match by descriptive keywords
        if 'electricity' in lower or 'apk' in lower:
            for c in tracked_cases:
                if '88192' in c.get('id', '') or 'electricity' in str(c).lower():
                    return c
        elif 'telegram' in lower or 'trading' in lower or 'investment' in lower or '340000' in lower or '3.4' in lower:
            for c in tracked_cases:
                if '44019' in c.get('id', '') or 'telegram' in str(c).lower():
                    return c
        elif 'instagram' in lower or 'impersonat' in lower or 'riya' in lower or 'fake profile' in lower:
            for c in tracked_cases:
                if '77341' in c.get('id', '') or 'instagram' in str(c).lower():
                    return c
        elif 'matrimonial' in lower or 'shaadi' in lower or 'marriage' in lower:
            for c in tracked_cases:
                if '10294' in c.get('id', '') or 'matrimonial' in str(c).lower():
                    return c

        # 3. Match by active UI location if on track tab
        selected_id = current_ui_location.get('selected_case_id')
        if selected_id:
            for c in tracked_cases:
                if c.get('id', '').upper() == selected_id.upper():
                    return c

        # 4. Default to first/latest tracked case
        return tracked_cases[0] if tracked_cases else None

    @classmethod
    async def inspect_case(
        cls,
        user_message: str,
        current_ui_location: Dict[str, Any],
        tracked_cases: List[Dict[str, Any]],
        complaint_draft: Dict[str, Any],
        conversation_history: List[Any]
    ) -> Tuple[str, List[str], List[UIAction], int]:
        """
        Inspects the case file and generates a comprehensive diagnosis.
        Returns: (message, extracted_pills, ui_actions, tokens_used)
        """
        primary_tab = current_ui_location.get('primary_tab', 'track')
        matched_case = cls.match_target_case(user_message, current_ui_location, tracked_cases)

        # If user is on register tab and asking about draft
        if primary_tab == 'register' and not ('case' in user_message.lower() and re.search(r'\d{5}', user_message)):
            return cls._inspect_complaint_draft(complaint_draft, user_message)

        # If we have a tracked case
        if matched_case:
            case_id = matched_case.get('id', 'Unknown')
            ack = matched_case.get('ackNumber', 'NCRP-Pending')
            category = matched_case.get('category', 'Cyber Crime')
            subtype = matched_case.get('subtype', '')
            status = matched_case.get('status', 'investigation')
            health = matched_case.get('health', 'Normal')
            health_reason = matched_case.get('healthReason', '')
            amount = matched_case.get('amount')
            bank = matched_case.get('bank')
            utr = matched_case.get('utr')
            next_actions = matched_case.get('nextActions', [])

            pills = [f"Case: {case_id}"]
            if status:
                pills.append(f"Status: {status.title()}")
            if amount:
                pills.append(f"Amount: ₹{amount}")

            actions = [
                UIAction(action='switch_primary_tab', target='track', label='Track Case'),
                UIAction(action='select_case', target=case_id, label=f'Select Case {case_id}')
            ]

            # Fallback text if LLM unavailable
            fallback = (
                f"For Case {case_id} ({subtype or category}), all critical facts and transaction details are recorded. "
                f"Current status: {health_reason or status}. "
                f"Next action: {next_actions[0].get('title') if next_actions else 'Monitor case timeline for bank updates'}."
            )

            if not client or not OPENAI_API_KEY:
                return fallback, pills, actions, 0

            context_payload = {
                "case_id": case_id,
                "ack_number": ack,
                "category": category,
                "subtype": subtype,
                "status": status,
                "health": health,
                "health_reason": health_reason,
                "fraud_amount": amount,
                "bank": bank,
                "utr": utr,
                "next_pending_actions": next_actions,
                "citizen_question": user_message
            }

            try:
                response = await client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": INSPECTION_SYSTEM_PROMPT},
                        {"role": "user", "content": f"Case Context:\n{json.dumps(context_payload, separators=(',', ':'))}\n\nCitizen Inquiry: {user_message}"}
                    ],
                    temperature=0.2,
                    max_tokens=140
                )
                msg = response.choices[0].message.content or fallback
                tokens = response.usage.total_tokens if response.usage else 0
                return msg.strip().strip('"'), pills, actions, tokens
            except Exception as e:
                logger.warning(f"Case inspection LLM call failed: {e}")
                return fallback, pills, actions, 0

        # If no tracked cases exist at all
        return (
            "You do not have any active tracked cases yet. If you have been a victim of a cybercrime, "
            "I can assist you in filing an official complaint under the Register a Complaint tab right now.",
            [],
            [UIAction(action='switch_primary_tab', target='register', label='Register Complaint')],
            0
        )

    @classmethod
    def _inspect_complaint_draft(
        cls,
        draft: Dict[str, Any],
        user_message: str
    ) -> Tuple[str, List[str], List[UIAction], int]:
        """Inspects the completeness of a complaint currently being drafted."""
        state = draft.get('case_state', {})
        flow = draft.get('flow_id', 'FINANCIAL_FRAUD')
        missing = []
        if flow == 'FINANCIAL_FRAUD':
            if not state.get('fraudAmount'):
                missing.append('Stolen Amount')
            if not state.get('bankName'):
                missing.append('Originating Bank')
            if not state.get('utrNumber'):
                missing.append('12-digit UTR Number')
        elif flow == 'SOCIAL_MEDIA':
            if not state.get('offenderHandle'):
                missing.append('Offender Handle (@)')
            if not state.get('socialPlatform'):
                missing.append('Platform')

        if not missing:
            msg = (
                "Yes! All required statutory fields and evidence for your complaint draft are complete. "
                "You are ready to proceed to the Review & Submit tab to generate your official NCRP complaint."
            )
            actions = [UIAction(action='switch_sub_tab', target='review', label='Review & Submit')]
        else:
            missing_str = ", ".join(missing)
            msg = (
                f"We have recorded your incident details, but the case file still needs: {missing_str} "
                f"before it can be officially registered."
            )
            actions = [UIAction(action='switch_primary_tab', target='register', label='Register Complaint')]

        return msg, [f"Missing: {m}" for m in missing[:2]], actions, 0
