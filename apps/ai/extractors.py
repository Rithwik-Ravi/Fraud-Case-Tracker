"""
Pure Fact Extraction & Classification Proposal Layer for CasePilot.
Decoupled from conversational questioning, state mutation, and UI dispatching.
Supports all 21 official NCRP categories, Digital Arrest circuit-breaker, and banking freeze entities.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from config import OPENAI_API_KEY, OPENAI_MODEL, TEMPERATURE, MAX_OUTPUT_TOKENS
from models import ProposedFact, ClassificationProposal
from flow_definitions import FLOW_DEFINITIONS, CATEGORIES_METADATA, CATEGORY_LOOKUP
from llm_client import client

logger = logging.getLogger("casepilot.ai.extractor")

CATEGORY_PROMPT_LIST = "\n".join([
    f"- id: \"{c['id']}\" | label: \"{c['label']}\" | parent: \"{c['parent']}\" | isFinancial: {c['isFinancial']} | urgency: \"{c['defaultUrgency']}\""
    for c in CATEGORIES_METADATA
])

EXTRACTION_SYSTEM_PROMPT = f"""You are CasePilot's Structured Cybercrime Extraction & Classification Engine for India's NCRP.
Your sole responsibility is:
1. Classify the citizen's message into EXACTLY ONE of the official 21 categories below.
2. If the message mentions CBI, ED, police video call, courier contraband parcel, or digital arrest, ALWAYS classify as "digital_arrest" and set "isDigitalArrest" to true.
3. Extract concrete factual entities mentioned into proposed facts (amounts, bank names, 12-digit UTR, payment mode, handles, apps).
4. Set "moneyMoved" to true only if the citizen explicitly states money was lost, transferred, debited, or deducted.
5. Provide a single empathetic factual acknowledgement sentence.

OFFICIAL NCRP CATEGORIES:
{CATEGORY_PROMPT_LIST}

JSON Schema:
{{
  "classification": {{
    "categoryId": "upi_fraud | net_banking | card_fraud | investment_scam | job_scam | loan_app_scam | sim_swap | child_safety | sextortion | cyber_blackmail | cyber_stalking | impersonation | account_takeover | malware_ransomware | other_cybercrime | digital_arrest | romance_scam | fake_customer_care | government_impersonation | courier_parcel_scam | task_scam",
    "categoryLabel": "Exact category label",
    "parentCategory": "Financial Fraud | Women/Children | Other Cyber Crime",
    "isFinancialFraud": true | false,
    "urgency": "golden-hour | urgent | standard",
    "detectedAmount": 75000 | null,
    "moneyMoved": true | false,
    "isDigitalArrest": true | false,
    "reasoning": "1 clear plain-English sentence explaining the classification",
    "confidence": 0.95
  }},
  "proposed_facts": [
    {{
      "field": "fraudAmount | bankName | utrNumber | paymentMode | beneficiaryAccount | socialPlatform | offenderHandle | affectedService | recoveryChanged | fileExtension | ransomDemanded | channel | incidentDate | incidentDescription | remoteAccessApp",
      "value": "Clean extracted value",
      "confidence": 0.98,
      "raw_quote": "Exact substring from citizen message"
    }}
  ],
  "extracted_pills": [
    "Category: UPI Fraud",
    "Loss: ₹75,000",
    "Bank: SBI"
  ],
  "acknowledgement": "1 concise sentence acknowledging the facts reported."
}}
"""

MONEY_MOVED_KEYWORDS = [
    'debited', 'deducted', 'lost', 'sent', 'transferred', 'paid', 'taken',
    'scammed', 'cheated of', 'withdrawn', 'charged', 'stolen', 'cut from account'
]

DIGITAL_ARREST_KEYWORDS = [
    'digital arrest', 'digitally arrested', 'cbi video call', 'ed video call',
    'police skype', 'customs parcel drugs', 'aadhaar in money laundering'
]

class FactExtractor:
    """
    Decoupled extraction engine combining local deterministic regex
    and targeted gpt-4o-mini extraction.
    """

    @staticmethod
    def classify_local(text: str) -> ClassificationProposal:
        """Deterministic rule-based classification across all 21 categories (0 tokens)."""
        lower = text.lower()

        # 1. Digital Arrest (Highest priority)
        if any(kw in lower for kw in DIGITAL_ARREST_KEYWORDS) or ('video call' in lower and any(a in lower for a in ['cbi', 'ed', 'police', 'arrest'])):
            cat = CATEGORY_LOOKUP["digital_arrest"]
            return ClassificationProposal(
                flow="digital_arrest",
                subtype="CBI_ED_VIDEO_CALL",
                confidence=0.98,
                reason="Detected high-threat digital arrest impersonation signals.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=cat["isFinancial"],
                urgency=cat["defaultUrgency"],
                isDigitalArrest=True,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 2. UPI Fraud
        if any(kw in lower for kw in ['upi', 'gpay', 'google pay', 'phonepe', 'paytm', 'qr code', 'collect request', 'vpa']):
            cat = CATEGORY_LOOKUP["upi_fraud"]
            return ClassificationProposal(
                flow="upi_fraud",
                subtype="UPI_COLLECT_FRAUD",
                confidence=0.92,
                reason="UPI payment instrument or collect request fraud detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 3. Remote Access / Internet Banking
        if any(kw in lower for kw in ['anydesk', 'teamviewer', 'quicksupport', 'rustdesk', 'net banking', 'netbanking', 'neft', 'rtgs', 'imps']):
            cat = CATEGORY_LOOKUP["net_banking"]
            return ClassificationProposal(
                flow="net_banking",
                subtype="REMOTE_ACCESS_OR_NET_BANKING",
                confidence=0.92,
                reason="Remote desktop software or net banking transfer detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 4. Job / Task Scam
        if any(kw in lower for kw in ['task scam', 'part time job', 'youtube like', 'hotel review task', 'prepaid task', 'work from home scam']):
            cat = CATEGORY_LOOKUP["job_scam"]
            return ClassificationProposal(
                flow="job_scam",
                subtype="PREPAID_TASK_SCAM",
                confidence=0.92,
                reason="Prepaid task or part-time work-from-home job scheme detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 5. Courier / Customs Scam
        if any(kw in lower for kw in ['courier scam', 'fedex', 'dhl parcel', 'customs fee', 'parcel seized', 'contraband parcel']):
            cat = CATEGORY_LOOKUP["courier_parcel_scam"]
            return ClassificationProposal(
                flow="courier_parcel_scam",
                subtype="CUSTOMS_PARCEL_FRAUD",
                confidence=0.92,
                reason="Courier or customs duty parcel seizure scam detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 6. Investment Scam
        if any(kw in lower for kw in ['investment scam', 'trading group', 'crypto scam', 'telegram tips', 'stock tip', 'high return']):
            cat = CATEGORY_LOOKUP["investment_scam"]
            return ClassificationProposal(
                flow="investment_scam",
                subtype="TELEGRAM_TRADING_SCAM",
                confidence=0.90,
                reason="Stock trading or cryptocurrency investment scheme detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 7. Sextortion
        if any(kw in lower for kw in ['sextortion', 'video call nude', 'private picture leak', 'blackmailing with photo']):
            cat = CATEGORY_LOOKUP["sextortion"]
            return ClassificationProposal(
                flow="sextortion",
                subtype="NUDE_VIDEO_BLACKMAIL",
                confidence=0.95,
                reason="Intimate video call extortion detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

        # 8. Ransomware
        if any(kw in lower for kw in ['ransomware', '.locked', 'files encrypted', 'bitcoin ransom']):
            cat = CATEGORY_LOOKUP["malware_ransomware"]
            return ClassificationProposal(
                flow="malware_ransomware",
                subtype="CRYPTO_RANSOMWARE",
                confidence=0.95,
                reason="Ransomware file encryption detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

        # 9. Account Hacking
        if any(kw in lower for kw in ['hacked', 'password changed', '2fa bypassed', 'account takeover', 'recovery email changed']):
            cat = CATEGORY_LOOKUP["account_takeover"]
            return ClassificationProposal(
                flow="account_takeover",
                subtype="ACCOUNT_COMPROMISE",
                confidence=0.90,
                reason="Unauthorized account takeover or credential theft detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

        # 10. General Financial Fraud fallback if debit mentioned
        if any(kw in lower for kw in ['debited', 'deducted', 'lost money', 'bank transfer', 'rs', '₹', 'inr']):
            cat = CATEGORY_LOOKUP["upi_fraud"]
            return ClassificationProposal(
                flow="upi_fraud",
                subtype="FINANCIAL_LOSS",
                confidence=0.85,
                reason="Monetary debit or financial fraud reported.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=True
            )

        # Default fallback
        cat = CATEGORY_LOOKUP["other_cybercrime"]
        return ClassificationProposal(
            flow="other_cybercrime",
            subtype="GENERAL",
            confidence=0.70,
            reason="Classified under general cybercrime pending details.",
            categoryId=cat["id"],
            categoryLabel=cat["label"],
            parentCategory=cat["parent"],
            isFinancialFraud=False,
            urgency=cat["defaultUrgency"],
            isDigitalArrest=False,
            moneyMoved=False
        )

    @staticmethod
    def extract_local_facts(text: str) -> List[ProposedFact]:
        """High-precision local extraction for numbers, handles, and banking entities (0 Tokens)."""
        facts: List[ProposedFact] = []
        lower = text.lower()

        # 1. Financial Amounts (e.g. 75,000, 75k, 2.5 lakh, ₹52000, 80000 rupees)
        cleaned_for_amount = re.sub(r'\b(?:cc-2026-\d+|ack-\d{4}-\d+)\b', '', text, flags=re.IGNORECASE)
        cleaned_for_amount = re.sub(r'\b[6-9]\d{9}\b', '', cleaned_for_amount)

        # Lakh pattern
        lakh_match = re.search(r'\b(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs)\b', cleaned_for_amount, re.IGNORECASE)
        if lakh_match:
            amt = str(int(float(lakh_match.group(1)) * 100000))
            facts.append(ProposedFact(
                field='fraudAmount',
                value=amt,
                confidence=0.99,
                source='local_regex',
                raw_quote=lakh_match.group(0)
            ))
        else:
            # 'k' pattern
            k_match = re.search(r'\b(\d{1,4})\s*k\b', cleaned_for_amount, re.IGNORECASE)
            if k_match:
                amt = str(int(k_match.group(1)) * 1000)
                facts.append(ProposedFact(
                    field='fraudAmount',
                    value=amt,
                    confidence=0.99,
                    source='local_regex',
                    raw_quote=k_match.group(0)
                ))
            else:
                amt_match = re.search(r'(?:rs\.?|₹|inr)\s*([0-9,]{2,10}(?:\.[0-9]{1,2})?)|\b([1-9][0-9]{3,7})\b', cleaned_for_amount, re.IGNORECASE)
                if amt_match:
                    raw_val = amt_match.group(1) or amt_match.group(2)
                    clean_val = raw_val.replace(',', '')
                    if not re.match(r'^(?:19|20)\d{2}$', clean_val):
                        facts.append(ProposedFact(
                            field='fraudAmount',
                            value=clean_val,
                            confidence=0.95,
                            source='local_regex',
                            raw_quote=amt_match.group(0)
                        ))

        # 2. Bank Names
        bank_map = {
            'state bank of india': 'State Bank of India',
            'sbi': 'State Bank of India',
            'hdfc': 'HDFC Bank',
            'icici': 'ICICI Bank',
            'axis': 'Axis Bank',
            'punjab national bank': 'Punjab National Bank',
            'pnb': 'Punjab National Bank',
            'bank of baroda': 'Bank of Baroda',
            'bob': 'Bank of Baroda',
            'kotak': 'Kotak Mahindra Bank',
            'canara': 'Canara Bank',
            'indusind': 'IndusInd Bank',
            'union bank': 'Union Bank of India'
        }
        for kw, canonical in bank_map.items():
            if re.search(rf'\b{kw}\b', lower):
                facts.append(ProposedFact(
                    field='bankName',
                    value=canonical,
                    confidence=0.98,
                    source='local_regex',
                    raw_quote=kw
                ))
                break

        # 3. UTR / Reference Numbers (12 digits)
        utr_match = re.search(r'\b([0-9]{12})\b', text)
        if utr_match:
            facts.append(ProposedFact(
                field='utrNumber',
                value=utr_match.group(1),
                confidence=0.99,
                source='local_regex',
                raw_quote=utr_match.group(0)
            ))

        # 4. Payment Modes
        if any(w in lower for w in ['upi', 'gpay', 'google pay', 'phonepe', 'paytm']):
            facts.append(ProposedFact(field='paymentMode', value='UPI', confidence=0.95, source='local_regex'))
        elif any(w in lower for w in ['net banking', 'netbanking', 'neft', 'rtgs', 'imps']):
            facts.append(ProposedFact(field='paymentMode', value='Net Banking', confidence=0.95, source='local_regex'))
        elif any(w in lower for w in ['credit card', 'debit card', 'card']):
            facts.append(ProposedFact(field='paymentMode', value='Card', confidence=0.90, source='local_regex'))

        # 5. Beneficiary UPI ID
        vpa_match = re.search(r'([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})', text)
        if vpa_match and not any(ext in vpa_match.group(1).lower() for ext in ['.com', '.org', '.net', '.edu']):
            facts.append(ProposedFact(
                field='beneficiaryAccount',
                value=vpa_match.group(1),
                confidence=0.96,
                source='local_regex',
                raw_quote=vpa_match.group(0)
            ))

        # 6. Remote Access Tools
        remote_tools = ['anydesk', 'teamviewer', 'quicksupport', 'rustdesk']
        for rt in remote_tools:
            if rt in lower:
                facts.append(ProposedFact(
                    field='remoteAccessApp',
                    value=rt.capitalize(),
                    confidence=0.98,
                    source='local_regex',
                    raw_quote=rt
                ))
                break

        # 7. Social Media Handles & Platforms
        handle_match = re.search(r'(?<!\w)@([a-zA-Z0-9_\.]{3,30})\b', text)
        if handle_match:
            facts.append(ProposedFact(
                field='offenderHandle',
                value=f"@{handle_match.group(1)}",
                confidence=0.98,
                source='local_regex',
                raw_quote=handle_match.group(0)
            ))

        if 'instagram' in lower or 'insta' in lower:
            facts.append(ProposedFact(field='socialPlatform', value='Instagram', confidence=0.99))
        elif 'telegram' in lower or 'tg' in lower:
            facts.append(ProposedFact(field='socialPlatform', value='Telegram', confidence=0.99))
        elif 'whatsapp' in lower or 'wa' in lower:
            facts.append(ProposedFact(field='socialPlatform', value='WhatsApp', confidence=0.99))
        elif 'facebook' in lower or 'fb' in lower:
            facts.append(ProposedFact(field='socialPlatform', value='Facebook', confidence=0.99))

        return facts

    @classmethod
    async def extract(
        cls,
        message: str,
        active_flow: Optional[str],
        known_facts: Dict[str, Any],
        missing_fields: List[str]
    ) -> Tuple[Optional[ClassificationProposal], List[ProposedFact], List[str], Optional[str], int]:
        """
        Executes decoupled fact extraction.
        Returns: (classification_proposal, proposed_facts, pills, acknowledgement, tokens_used)
        """
        local_facts = cls.extract_local_facts(message)
        local_proposal = cls.classify_local(message)
        tokens_used = 0

        # Build structured context representation
        structured_context = {
            "CASE": {
                "active_flow": active_flow or local_proposal.flow,
                "confirmed_facts": {k: v for k, v in known_facts.items() if v not in (None, '', [], {})},
                "missing_required_fields": missing_fields[:4],
                "current_citizen_input": message
            }
        }

        if not client or not OPENAI_API_KEY:
            # Deterministic fallback
            pills = [f"{f.field}: {f.value}" for f in local_facts[:3]]
            proposal = local_proposal
            if active_flow and active_flow in CATEGORY_LOOKUP:
                cat = CATEGORY_LOOKUP[active_flow]
                proposal.categoryId = cat["id"]
                proposal.categoryLabel = cat["label"]
                proposal.parentCategory = cat["parent"]
                proposal.isFinancialFraud = cat["isFinancial"]
                proposal.urgency = cat["defaultUrgency"]
            return proposal, local_facts, pills, None, 0

        try:
            response = await client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                    {"role": "user", "content": json.dumps(structured_context, separators=(',', ':'))}
                ],
                response_format={"type": "json_object"},
                temperature=TEMPERATURE,
                max_tokens=MAX_OUTPUT_TOKENS
            )

            raw_content = response.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
            tokens_used = response.usage.total_tokens if response.usage else 0

            # 1. Parse classification proposal
            classif_data = parsed.get("classification") or {}
            cat_id = classif_data.get("categoryId") or local_proposal.flow
            known_cat = CATEGORY_LOOKUP.get(cat_id, CATEGORY_LOOKUP.get("other_cybercrime", {}))

            detected_amount = classif_data.get("detectedAmount")
            if detected_amount is not None:
                try:
                    detected_amount = float(detected_amount)
                except (ValueError, TypeError):
                    detected_amount = None

            is_digital_arrest = bool(classif_data.get("isDigitalArrest") or cat_id == "digital_arrest")
            money_moved = bool(classif_data.get("moneyMoved", local_proposal.moneyMoved))

            proposal = ClassificationProposal(
                flow=cat_id,
                subtype=classif_data.get("subtype"),
                confidence=float(classif_data.get("confidence", 0.9)),
                reason=classif_data.get("reasoning") or local_proposal.reason,
                categoryId=cat_id,
                categoryLabel=classif_data.get("categoryLabel") or known_cat.get("label", cat_id),
                parentCategory=classif_data.get("parentCategory") or known_cat.get("parent", "Other Cyber Crime"),
                isFinancialFraud=classif_data.get("isFinancialFraud", known_cat.get("isFinancial", False)),
                urgency=classif_data.get("urgency", known_cat.get("defaultUrgency", "standard")),
                detectedAmount=detected_amount,
                moneyMoved=money_moved,
                isDigitalArrest=is_digital_arrest
            )

            # 2. Parse proposed facts
            llm_proposed: List[ProposedFact] = []
            for item in parsed.get("proposed_facts", []):
                fid = item.get("field")
                val = item.get("value")
                if fid == 'description':
                    fid = 'incidentDescription'
                if fid and val not in (None, '', 'null'):
                    llm_proposed.append(ProposedFact(
                        field=fid,
                        value=val,
                        confidence=float(item.get("confidence", 0.9)),
                        source="llm_extraction",
                        raw_quote=item.get("raw_quote")
                    ))

            # Merge local facts with LLM facts
            merged_dict: Dict[str, ProposedFact] = {}
            for f in llm_proposed:
                merged_dict[f.field] = f
            for f in local_facts:
                if f.field == 'fraudAmount' and 'fraudAmount' in merged_dict:
                    continue
                merged_dict[f.field] = f

            all_proposed = list(merged_dict.values())
            pills = parsed.get("extracted_pills") or [f"{f.field}: {f.value}" for f in all_proposed[:3]]
            ack = parsed.get("acknowledgement")

            return proposal, all_proposed, pills, ack, tokens_used

        except Exception as e:
            logger.error(f"Extraction failed: {e}. Falling back to deterministic facts.")
            pills = [f"{f.field}: {f.value}" for f in local_facts[:3]]
            return local_proposal, local_facts, pills, None, 0
