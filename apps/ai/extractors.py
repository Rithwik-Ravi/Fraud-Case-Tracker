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

CATEGORY_ENUM_LIST = " | ".join([c["id"] for c in CATEGORIES_METADATA])

EXTRACTION_SYSTEM_PROMPT = f"""You are CasePilot's Structured Cybercrime Extraction & Classification Engine for India's NCRP (National Cyber Crime Reporting Portal).
Your sole responsibility is:
1. Classify the citizen's message into EXACTLY ONE of the official categories below across the 3 Pillars:
   - Women/Children Related Crime
   - Financial Fraud
   - Other Cyber Crime
2. If the message mentions CBI, ED, police video call, courier contraband parcel, or digital arrest, ALWAYS classify as "digital_arrest" and set "isDigitalArrest" to true.
3. Extract concrete factual entities mentioned into proposed facts:
   - Financial: fraudAmount, bankName, utrNumber (12-digit), paymentMode, beneficiaryAccount, suspectAccount
   - Crypto: cryptoNetwork, victimWallet, suspectWallet, transactionHash, cryptoExchange
   - Ransomware / Technical: encryptedExtension, ransomNoteFile, ransomDemanded, ransomWalletAddress, targetDomain, serverIp, defacerHandle
   - Social Media / Impersonation: imposterUrl, genuineUrl, socialPlatform, offenderHandle, suspectHandle
   - Mobile: maliciousApkName (.apk), deviceType, telecomOperator
   - Common: suspectName, suspectPhone, suspectEmail, suspectWebsite, channel, incidentDate, delayReason, incidentDescription
4. Set "moneyMoved" to true only if the citizen explicitly states money was lost, transferred, debited, or deducted.
5. Provide a single empathetic factual acknowledgement sentence.

OFFICIAL NCRP CATEGORIES:
{CATEGORY_PROMPT_LIST}

JSON Schema:
{{
  "classification": {{
    "categoryId": "{CATEGORY_ENUM_LIST}",
    "categoryLabel": "Exact category label from list",
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
      "field": "fraudAmount | bankName | utrNumber | paymentMode | beneficiaryAccount | suspectAccount | suspectName | suspectPhone | suspectHandle | suspectWebsite | socialPlatform | offenderHandle | channel | incidentDate | delayReason | affectedService | remoteAccessApp | incidentDescription | cryptoNetwork | victimWallet | suspectWallet | transactionHash | cryptoExchange | encryptedExtension | ransomNoteFile | ransomDemanded | ransomWalletAddress | targetDomain | serverIp | defacerHandle | imposterUrl | genuineUrl | maliciousApkName",
      "value": "Clean extracted value",
      "confidence": 0.98,
      "raw_quote": "Exact substring from citizen message"
    }}
  ],
  "extracted_pills": [
    "Category: UPI Fraud",
    "Loss: ₹75,000",
    "Bank: SBI",
    "Suspect: @fraud_handle"
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

        # 7. Child Safety & CSAM
        if any(kw in lower for kw in ['child', 'minor', 'csam', 'underage', 'grooming', 'child abuse']):
            cat = CATEGORY_LOOKUP["child_safety"]
            return ClassificationProposal(
                flow="child_safety",
                subtype="CSAM_CHILD_PROTECTION",
                confidence=0.98,
                reason="Child sexual exploitation or cyber safety indicators detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

        # 8. Sextortion
        if any(kw in lower for kw in ['sextortion', 'video call nude', 'private picture leak', 'blackmailing with photo', 'morphing', 'morphed']):
            cat = CATEGORY_LOOKUP["sextortion"]
            return ClassificationProposal(
                flow="sextortion",
                subtype="NUDE_VIDEO_BLACKMAIL",
                confidence=0.95,
                reason="Intimate video call extortion or morphed media blackmail detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

        # 9. Cryptocurrency Theft
        if any(kw in lower for kw in ['crypto', 'bitcoin', 'ethereum', 'wallet drain', 'metamask', 'phantom', 'smart contract', 'seed phrase', 'usdt', 'txhash']):
            cat = CATEGORY_LOOKUP["crypto_wallet_drain"]
            return ClassificationProposal(
                flow="crypto_wallet_drain",
                subtype="WEB3_WALLET_DRAIN",
                confidence=0.95,
                reason="Cryptocurrency wallet drain or fraudulent smart contract transfer detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=True,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=True
            )

        # 10. Ransomware
        if any(kw in lower for kw in ['ransomware', '.locked', 'files encrypted', 'bitcoin ransom', 'ransom note']):
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

        # 11. Website Defacement & Server Breach
        if any(kw in lower for kw in ['defaced', 'website hacked', 'homepage changed', 'server breach', 'database breach']):
            cat = CATEGORY_LOOKUP.get("hack_defacement", CATEGORY_LOOKUP["other_cybercrime"])
            return ClassificationProposal(
                flow=cat["id"],
                subtype="WEBSITE_DEFACEMENT",
                confidence=0.95,
                reason="Website defacement or server intrusion detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

        # 12. Malicious Mobile APK
        if any(kw in lower for kw in ['.apk', 'malicious apk', 'installed app', 'electricity bill apk']):
            cat = CATEGORY_LOOKUP.get("mob_malicious_apk", CATEGORY_LOOKUP["other_cybercrime"])
            return ClassificationProposal(
                flow=cat["id"],
                subtype="MALICIOUS_APK_SPYWARE",
                confidence=0.92,
                reason="Malicious Android APK installation detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=any(k in lower for k in MONEY_MOVED_KEYWORDS)
            )

        # 13. Account Hacking & Impersonation
        if any(kw in lower for kw in ['impersonating', 'fake profile', 'counterfeit account', 'using my photos']):
            cat = CATEGORY_LOOKUP["impersonation"]
            return ClassificationProposal(
                flow="impersonation",
                subtype="IMPERSONATION_PROFILE",
                confidence=0.90,
                reason="Impersonation or fake profile creation detected.",
                categoryId=cat["id"],
                categoryLabel=cat["label"],
                parentCategory=cat["parent"],
                isFinancialFraud=False,
                urgency=cat["defaultUrgency"],
                isDigitalArrest=False,
                moneyMoved=False
            )

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

        # 7. Social Media Handles & Suspect Account
        handle_match = re.search(r'(?<!\w)@([a-zA-Z0-9_\.]{3,30})\b', text)
        if handle_match:
            h_val = f"@{handle_match.group(1)}"
            facts.append(ProposedFact(field='offenderHandle', value=h_val, confidence=0.98, source='local_regex', raw_quote=handle_match.group(0)))
            facts.append(ProposedFact(field='suspectHandle', value=h_val, confidence=0.98, source='local_regex'))

        # 8. Suspect Mobile Numbers (10 digits starting with 6-9 or +91)
        phone_match = re.search(r'(?:\+91[\s-]?)?([6-9]\d{9})\b', text)
        if phone_match:
            facts.append(ProposedFact(
                field='suspectPhone',
                value=phone_match.group(1),
                confidence=0.92,
                source='local_regex',
                raw_quote=phone_match.group(0)
            ))

        # 9. Channels & Platforms
        if 'whatsapp' in lower or 'wa' in lower:
            facts.append(ProposedFact(field='channel', value='WhatsApp', confidence=0.99))
            facts.append(ProposedFact(field='socialPlatform', value='WhatsApp', confidence=0.99))
        elif 'telegram' in lower or 'tg' in lower:
            facts.append(ProposedFact(field='channel', value='Telegram', confidence=0.99))
            facts.append(ProposedFact(field='socialPlatform', value='Telegram', confidence=0.99))
        elif 'instagram' in lower or 'insta' in lower:
            facts.append(ProposedFact(field='channel', value='Instagram', confidence=0.99))
            facts.append(ProposedFact(field='socialPlatform', value='Instagram', confidence=0.99))
        elif 'sms' in lower or 'text message' in lower:
            facts.append(ProposedFact(field='channel', value='SMS', confidence=0.95))
        elif 'call' in lower or 'phone' in lower:
            facts.append(ProposedFact(field='channel', value='Phone Call', confidence=0.92))
        elif 'apk' in lower:
            facts.append(ProposedFact(field='channel', value='Malicious APK', confidence=0.95))

        # 10. Suspect Website / Links
        url_match = re.search(r'https?://[^\s]+|\b[\w-]+\.(?:apk|xyz|top|site|club|online|ru)\b', text, re.IGNORECASE)
        if url_match:
            facts.append(ProposedFact(
                field='suspectWebsite',
                value=url_match.group(0),
                confidence=0.95,
                source='local_regex',
                raw_quote=url_match.group(0)
            ))

        # 11. Incident Time Indicators
        if 'today' in lower or 'aaj' in lower:
            facts.append(ProposedFact(field='incidentDate', value='Today', confidence=0.90, source='local_regex'))
        elif 'yesterday' in lower or 'kal' in lower:
            facts.append(ProposedFact(field='incidentDate', value='Yesterday', confidence=0.90, source='local_regex'))

        # 12. Cryptocurrency Entities
        if any(w in lower for w in ['tron', 'trc20']):
            facts.append(ProposedFact(field='cryptoNetwork', value='TRON', confidence=0.98, source='local_regex'))
        elif any(w in lower for w in ['bitcoin', 'btc']):
            facts.append(ProposedFact(field='cryptoNetwork', value='Bitcoin', confidence=0.98, source='local_regex'))
        elif any(w in lower for w in ['ethereum', 'eth', 'erc20']):
            facts.append(ProposedFact(field='cryptoNetwork', value='Ethereum', confidence=0.98, source='local_regex'))
        elif any(w in lower for w in ['solana', 'sol']):
            facts.append(ProposedFact(field='cryptoNetwork', value='Solana', confidence=0.98, source='local_regex'))

        if 'binance' in lower:
            facts.append(ProposedFact(field='cryptoExchange', value='Binance', confidence=0.98, source='local_regex'))
        elif 'wazirx' in lower:
            facts.append(ProposedFact(field='cryptoExchange', value='WazirX', confidence=0.98, source='local_regex'))
        elif 'coindcx' in lower:
            facts.append(ProposedFact(field='cryptoExchange', value='CoinDCX', confidence=0.98, source='local_regex'))

        crypto_wallet_match = re.search(r'\b(T[A-Za-z0-9]{33}|bc1[a-zA-HJ-NP-Z0-9]{39,59}|0x[a-fA-F0-9]{40})\b', text)
        if crypto_wallet_match:
            facts.append(ProposedFact(field='suspectWallet', value=crypto_wallet_match.group(1), confidence=0.98, source='local_regex'))

        tx_hash_match = re.search(r'\b(?:hash|txid|txhash)[\s:]*(0x[a-fA-F0-9]{16,64}|[a-fA-F0-9]{64})\b', text, re.IGNORECASE)
        if tx_hash_match:
            facts.append(ProposedFact(field='transactionHash', value=tx_hash_match.group(1), confidence=0.98, source='local_regex'))

        # 13. Ransomware Entities
        ext_match = re.search(r'\.([a-zA-Z0-9_-]{3,15})\b', text)
        if any(r_kw in lower for r_kw in ['encrypted with extension', 'extension .', 'files encrypted']):
            m = re.search(r'extension\s+\.([a-zA-Z0-9_-]+)', text, re.IGNORECASE)
            if m:
                facts.append(ProposedFact(field='encryptedExtension', value=f".{m.group(1)}", confidence=0.98, source='local_regex'))

        note_match = re.search(r'\b([A-Za-z0-9_.-]*(?:README|RESTORE|DECRYPT|HOW_TO)[\w_.-]*\.(?:txt|html))\b', text, re.IGNORECASE)
        if note_match:
            facts.append(ProposedFact(field='ransomNoteFile', value=note_match.group(1), confidence=0.98, source='local_regex'))

        ransom_dem_match = re.search(r'\b(\d+(?:\.\d+)?\s*(?:btc|eth|usdt|monero|xmr))\b', text, re.IGNORECASE)
        if ransom_dem_match:
            facts.append(ProposedFact(field='ransomDemanded', value=ransom_dem_match.group(1), confidence=0.98, source='local_regex'))

        # 14. Website Defacement & Server Breach
        domain_match = re.search(r'\b([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.(?:gov\.in|nic\.in|org\.in|edu\.in|com|org|in))\b', text, re.IGNORECASE)
        if domain_match:
            facts.append(ProposedFact(field='targetDomain', value=domain_match.group(1), confidence=0.98, source='local_regex'))

        ip_match = re.search(r'\b((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b', text)
        if ip_match:
            facts.append(ProposedFact(field='serverIp', value=ip_match.group(1), confidence=0.95, source='local_regex'))

        defacer_match = re.search(r'(?:defaced by|banner by|hacked by)\s+([A-Za-z0-9_.-]+)', text, re.IGNORECASE)
        if defacer_match:
            facts.append(ProposedFact(field='defacerHandle', value=defacer_match.group(1), confidence=0.98, source='local_regex'))

        # 15. Mobile Malicious APK
        apk_match = re.search(r'\b([a-zA-Z0-9_.-]+\.apk)\b', text, re.IGNORECASE)
        if apk_match:
            facts.append(ProposedFact(field='maliciousApkName', value=apk_match.group(1), confidence=0.99, source='local_regex'))

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
