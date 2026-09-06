"""
Declarative Flow & Category Specifications for CasePilot.
Single source of truth for both AI Decision Engines and UI Configuration.
Defines classification criteria, section schemas, statutory question priorities,
conditional rules, evidence recommendations, and safety guidelines for all 21 NCRP categories.
"""

from typing import Dict, Any, List

CATEGORIES_METADATA: List[Dict[str, Any]] = [
    {
        "id": "upi_fraud",
        "label": "UPI Related Fraud",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Fraudulent debit via UPI, fake collect request, QR code scam, or PhonePe/GPay impersonation."
    },
    {
        "id": "net_banking",
        "label": "Internet Banking / Phishing Fraud",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Unauthorized net banking transfer, phishing login link, or remote access app (AnyDesk/TeamViewer)."
    },
    {
        "id": "card_fraud",
        "label": "Credit / Debit Card Fraud",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Unauthorized ATM withdrawal, POS swipe, card skimming, or online card transaction without consent."
    },
    {
        "id": "investment_scam",
        "label": "Online Investment / Trading Scam",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "High return promise, fake crypto trading app, Telegram investment group, or stock market tip scam."
    },
    {
        "id": "job_scam",
        "label": "Work from Home / Part-Time Job Scam",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Task scam, YouTube video like/subscribe fraud, daily payment promise requiring deposits."
    },
    {
        "id": "loan_app_scam",
        "label": "Illegal Loan App / Extortion",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Instant loan disbursed without request, predatory interest, access to contacts and threatening calls."
    },
    {
        "id": "sim_swap",
        "label": "SIM Swap / Telecom Fraud",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Fraudulent SIM card deactivation and duplication to intercept banking SMS and OTPs."
    },
    {
        "id": "child_safety",
        "label": "Child Related Cyber Crime / CSAM",
        "parent": "Women/Children",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Child sexual abuse material, grooming, online exploitation of minors, or child cyber harassment."
    },
    {
        "id": "sextortion",
        "label": "Sextortion / Threatening with Private Photos",
        "parent": "Women/Children",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Video call blackmail, morphing private pictures, demanding money under threat of leak."
    },
    {
        "id": "cyber_blackmail",
        "label": "Cyber Blackmailing & Harassment",
        "parent": "Women/Children",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Threatening messages, continuous harassment, blackmailing over chat or social media."
    },
    {
        "id": "cyber_stalking",
        "label": "Cyber Stalking & Bullying",
        "parent": "Women/Children",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Persistent unwanted contact, monitoring online activity, defamatory comments or harassment."
    },
    {
        "id": "impersonation",
        "label": "Impersonation / Fake Profile",
        "parent": "Other Cyber Crime",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Creating counterfeit profile of a person, government officer, or bank executive."
    },
    {
        "id": "account_takeover",
        "label": "Social Media / Email Account Hacking",
        "parent": "Other Cyber Crime",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Unauthorized access, password changed, credentials stolen via phishing or spyware."
    },
    {
        "id": "malware_ransomware",
        "label": "Malware / Ransomware Attack",
        "parent": "Other Cyber Crime",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Files encrypted, device locked, demanding ransom in cryptocurrency or digital payment."
    },
    {
        "id": "other_cybercrime",
        "label": "Other Cyber Crime",
        "parent": "Other Cyber Crime",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Any other digital offence not covered by specific categories above."
    },
    {
        "id": "digital_arrest",
        "label": "Digital Arrest Scam",
        "parent": "Other Cyber Crime",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Impersonation of police, CBI, ED, customs, or income-tax officers over video/audio call, threatening illegal arrest unless a payment is made. No such legal procedure exists."
    },
    {
        "id": "romance_scam",
        "label": "Romance / Matrimonial Fraud",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Fake relationships on dating, matrimonial, or social sites leading to money transfers, gift demands, or nude photo sharing."
    },
    {
        "id": "fake_customer_care",
        "label": "Fake Helpline / Customer Care Fraud",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Fraudster poses as bank, telecom, or e-commerce customer care to extract OTPs, card details, or remote access."
    },
    {
        "id": "government_impersonation",
        "label": "Government Official Impersonation",
        "parent": "Other Cyber Crime",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Impersonation of a government officer, court official, or regulator (not in digital-arrest pattern) to extract money or personal data."
    },
    {
        "id": "courier_parcel_scam",
        "label": "Courier / Parcel Scam",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Fake notification of seized parcel, drugs or contraband found in courier, demanding customs duty or clearance payment."
    },
    {
        "id": "task_scam",
        "label": "Task / Like-Subscribe Scam",
        "parent": "Financial Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Online task platform (YouTube like, Instagram follow, hotel reviews) requiring deposits to 'unlock' earnings; earnings are never paid out."
    }
]

CATEGORY_LOOKUP: Dict[str, Dict[str, Any]] = {c["id"]: c for c in CATEGORIES_METADATA}

FLOW_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    # ── 1. UPI Related Fraud ──
    "upi_fraud": {
        "id": "upi_fraud",
        "title": "UPI Related Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 66D IT Act (Cheating by personation using computer resource) & BNS Section 318(4). Golden Hour 1930 inter-bank freeze protocol active.",
        "classification": {
            "keywords": ["upi", "gpay", "phonepe", "paytm", "qr code", "collect request", "vpa", "pin debited", "upi fraud", "money debited", "lost money"],
            "subtypes": ["UPI_COLLECT_SCAM", "QR_CODE_FRAUD", "VPA_SPOOFING", "WRONG_UPI_TRANSFER"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": ["channel"]},
            "financial": {"label": "Financial & Banking Details", "required": ["fraudAmount", "bankName", "utrNumber", "paymentMode"], "optional": ["beneficiaryAccount", "accountNumberLast4"]},
            "suspect": {"label": "Suspect Information", "required": [], "optional": ["beneficiaryAccount", "suspectMobile", "suspectName"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["bank_statement", "transaction_sms", "chat_screenshot"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "beneficiaryAccount", "incidentDate", "paymentMode", "description"],
        "conditional_rules": [
            {
                "rule_id": "upi_beneficiary",
                "condition_field": "paymentMode",
                "condition_value": "UPI",
                "require_fields": ["beneficiaryAccount"],
                "rationale": "Capturing the suspect VPA / UPI ID enables NPCI to place a lien on the recipient handle."
            }
        ],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": [
            "Dial 1930 immediately if the debit occurred within 24 hours (Golden Hour).",
            "Report immediately in your UPI app (GPay / PhonePe / Paytm / BHIM) under 'Raise Dispute'.",
            "Never approve a collect request or enter UPI PIN to receive money."
        ]
    },

    # ── 2. Internet Banking / Phishing ──
    "net_banking": {
        "id": "net_banking",
        "title": "Internet Banking / Phishing Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 43, 66 & 66D IT Act & BNS Section 318(4).",
        "classification": {
            "keywords": ["net banking", "internet banking", "neft", "rtgs", "imps", "anydesk", "teamviewer", "quicksupport", "rustdesk", "remote access", "login credentials stolen", "otp shared"],
            "subtypes": ["REMOTE_ACCESS_APP_SCAM", "CREDENTIAL_HARVESTING", "UNAUTHORIZED_IMPS_TRANSFER"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": ["channel"]},
            "financial": {"label": "Banking Details", "required": ["fraudAmount", "bankName", "utrNumber", "paymentMode"], "optional": ["beneficiaryAccount"]},
            "suspect": {"label": "Suspect Information", "required": [], "optional": ["suspectWebsite", "suspectMobile"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["bank_statement", "phishing_url", "sms_screenshot"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": [
            "Contact your home bank immediately to freeze internet banking and hotlist credentials.",
            "Uninstall remote access tools (AnyDesk, TeamViewer, QuickSupport) immediately.",
            "Dial 1930 to notify the state cyber cell CFCFRMS portal."
        ]
    },

    # ── 3. Credit / Debit Card Fraud ──
    "card_fraud": {
        "id": "card_fraud",
        "title": "Credit / Debit Card Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 66C & 66D IT Act, RBI Unauthorized Electronic Banking Transactions Circular.",
        "classification": {
            "keywords": ["credit card", "debit card", "atm withdrawal", "card skimming", "pos machine", "cvv", "otp stolen", "international transaction"],
            "subtypes": ["CARD_CLONING", "CVV_THEFT", "UNAUTHORIZED_POS_ATM"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Card & Transaction Details", "required": ["fraudAmount", "bankName", "cardLast4"], "optional": ["transactionId"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["card_statement", "sms_alert"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "cardLast4", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "evidence", "review"],
        "safety_rules": [
            "Block your card immediately via bank mobile app, SMS, or customer care helpline.",
            "Notify bank within 3 days for zero-liability protection under RBI guidelines."
        ]
    },

    # ── 4. Digital Arrest Scam (CRITICAL CIRCUIT BREAKER) ──
    "digital_arrest": {
        "id": "digital_arrest",
        "title": "Digital Arrest Scam",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "urgent",
        "is_circuit_breaker": True,
        "statutory_reference": "Section 319 BNS (Cheating by impersonation), Section 66D IT Act. MHA & CBI Official Advisory: 'No government agency issues arrest over video call'.",
        "classification": {
            "keywords": [
                "digital arrest", "digitally arrested", "cbi video call", "ed video call", "police skype",
                "customs drugs parcel", "fedex parcel illegal", "aadhaar card in money laundering",
                "stay on video call", "fake arrest warrant", "supreme court order video call",
                "rbi verification account", "secrecy agreement video call"
            ],
            "subtypes": ["CBI_ED_VIDEO_CALL", "POLICE_UNIFORM_IMPERSONATION", "CUSTOMS_NARCOTICS_SEIZURE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": ["channel"]},
            "suspect": {"label": "Impersonator Details", "required": ["suspectPhoneOrHandle"], "optional": ["badgeNumber", "agencyClaimed"]},
            "financial": {"label": "Extortion / Fund Transfer", "required": [], "optional": ["fraudAmount", "beneficiaryAccount", "bankName"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["call_logs", "fake_warrants", "video_screenshots"], "required": []}
        },
        "question_priority": ["suspectPhoneOrHandle", "fraudAmount", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "evidence", "review"],
        "safety_rules": [
            "DISCONNECT IMMEDIATELY: There is NO legal provision for 'digital arrest' in Indian Law.",
            "No police officer, CBI agent, ED officer, or judge will ever question you or demand money over Skype, WhatsApp, or video call.",
            "DO NOT transfer money to any 'safe account' or 'RBI verification' account.",
            "Call 1930 immediately to report the caller's phone number and WhatsApp handle."
        ]
    },

    # ── 5. Online Investment / Trading Scam ──
    "investment_scam": {
        "id": "investment_scam",
        "title": "Online Investment / Trading Scam",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "urgent",
        "statutory_reference": "Section 66D IT Act & BNS Section 318(4). SEBI Advisory on Unregistered Trading Platforms.",
        "classification": {
            "keywords": ["investment scam", "crypto scam", "trading group", "telegram stock tips", "forex scam", "fake trading app", "high returns", "ipo allotment scam"],
            "subtypes": ["TELEGRAM_VIP_TRADING", "FAKE_CRYPTO_PLATFORM", "PUMP_AND_DUMP"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": ["channel"]},
            "financial": {"label": "Investment Loss", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": ["beneficiaryAccount"]},
            "suspect": {"label": "Platform / Group Details", "required": [], "optional": ["platformUrl", "telegramGroup", "offenderHandle"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["chat_screenshots", "transfer_receipts", "app_link"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": [
            "Stop all further deposits immediately. Scammers will claim you must pay tax or unlock fees to withdraw.",
            "Preserve Telegram / WhatsApp chats and export full group member lists."
        ]
    },

    # ── 6. Work from Home / Part-Time Job Scam / Task Scam ──
    "job_scam": {
        "id": "job_scam",
        "title": "Work from Home / Part-Time Job Scam",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "urgent",
        "statutory_reference": "Section 66D IT Act & BNS Section 318(4).",
        "classification": {
            "keywords": ["part time job", "work from home", "youtube like", "hotel review task", "task scam", "prepaid task", "telegram job", "daily payment task"],
            "subtypes": ["LIKE_SUBSCRIBE_TASK", "MERCHANT_REBATE_SCAM", "HOTEL_REVIEW_FRAUD"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Task Deposits", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": ["beneficiaryAccount"]},
            "suspect": {"label": "Scammer Contact", "required": [], "optional": ["telegramUsername", "whatsappNumber"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["chat_history", "payment_receipts"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": [
            "No legitimate company pays money for liking YouTube videos or demands deposits to unlock salary.",
            "Report the recruiter's numbers on Chakshu (Sanchar Saathi portal)."
        ]
    },

    # ── 7. Courier / Parcel Scam ──
    "courier_parcel_scam": {
        "id": "courier_parcel_scam",
        "title": "Courier / Parcel Scam",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "urgent",
        "statutory_reference": "Section 66D IT Act & BNS Section 318.",
        "classification": {
            "keywords": ["courier scam", "fedex parcel", "customs clearance fee", "contraband parcel", "illegal parcel seized", "drugs in parcel", "dhl parcel scam"],
            "subtypes": ["CUSTOMS_EXTORTION", "CONTRABAND_PARCEL_FEAR"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Fees Paid", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": ["beneficiaryAccount"]},
            "suspect": {"label": "Caller Details", "required": [], "optional": ["suspectPhone"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["sms_screenshot", "call_log", "receipts"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": [
            "Customs departments never demand payments into personal UPI VPAs or personal bank accounts.",
            "Verify tracking numbers directly on official courier websites."
        ]
    },

    # ── 8. Illegal Loan App / Extortion ──
    "loan_app_scam": {
        "id": "loan_app_scam",
        "title": "Illegal Loan App / Extortion",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "urgent",
        "statutory_reference": "Section 66E IT Act, BNS Section 308 (Extortion), RBI Digital Lending Guidelines.",
        "classification": {
            "keywords": ["loan app", "instant loan", "contacts accessed", "morphed photo sent to contacts", "recovery agent harassment", "threatening calls for loan", "predatory interest"],
            "subtypes": ["CONTACT_ACCESS_EXTORTION", "PREDATORY_MICRO_LOAN", "UNAPPROVED_APK_LOAN"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "suspect": {"label": "Loan App & Agents", "required": ["loanAppName"], "optional": ["suspectNumbers"]},
            "financial": {"label": "Loan Figures", "required": [], "optional": ["amountDisbursed", "amountExtorted"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["whatsapp_threats", "app_screenshot"], "required": []}
        },
        "question_priority": ["loanAppName", "amountExtorted", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "financial", "evidence", "review"],
        "safety_rules": [
            "Revoke all contacts and media permissions for the app and uninstall it.",
            "Alert your family and contacts that your phone was compromised and to ignore extortion messages.",
            "Check if the lender is RBI registered at rbi.org.in."
        ]
    },

    # ── 9. Sextortion ──
    "sextortion": {
        "id": "sextortion",
        "title": "Sextortion / Video Call Blackmail",
        "parent": "Women/Children",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 66E, 67, 67A IT Act & BNS Section 308 (Extortion).",
        "classification": {
            "keywords": ["sextortion", "video call nude", "private pictures threat", "morphing private pictures", "whatsapp video call scam", "blackmailing with photos"],
            "subtypes": ["WHATSAPP_NUDE_CALL", "DATING_APP_HONEYTRAP", "MORPHED_MEDIA_EXTORTION"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "suspect": {"label": "Extortionist Contact", "required": ["suspectPhoneOrHandle"], "optional": ["platformUsed"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["chat_screenshots", "call_logs"], "required": []}
        },
        "question_priority": ["suspectPhoneOrHandle", "platformUsed", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "evidence", "review"],
        "safety_rules": [
            "DO NOT PAY ANY MONEY: Paying once only leads to escalating demands.",
            "Block the number after taking screenshots of threats with phone number visible.",
            "Report and take down intimate images via stopncii.org."
        ]
    },

    # ── 10. Social Media / Email Account Hacking ──
    "account_takeover": {
        "id": "account_takeover",
        "title": "Social Media / Email Account Hacking",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "standard",
        "statutory_reference": "Section 43 & 66 IT Act (Unauthorized access & computer related offences).",
        "classification": {
            "keywords": ["account hacked", "instagram hacked", "gmail hacked", "facebook hacked", "password changed", "2fa bypassed", "recovery email changed", "unauthorized login"],
            "subtypes": ["GMAIL_HIJACK", "INSTAGRAM_ACCOUNT_THEFT", "WHATSAPP_TAKEOVER"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "account": {"label": "Compromised Account", "required": ["affectedService", "recoveryChanged"], "optional": ["username"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["security_alert_emails"], "required": []}
        },
        "question_priority": ["affectedService", "recoveryChanged", "incidentDate", "description"],
        "base_tabs": ["incident", "account", "evidence", "review"],
        "safety_rules": [
            "Trigger official account recovery immediately on the platform's support page.",
            "Revoke all active sessions and change passwords on linked services."
        ]
    },

    # ── 11. Impersonation / Fake Profile ──
    "impersonation": {
        "id": "impersonation",
        "title": "Impersonation / Fake Profile",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "standard",
        "statutory_reference": "Section 66C IT Act (Identity theft) & Rule 3(2)(b) IT Intermediary Rules 2021.",
        "classification": {
            "keywords": ["fake profile", "fake account", "cloned profile", "using my photos", "impersonating me", "fake instagram"],
            "subtypes": ["PROFILE_CLONING", "VIP_IMPERSONATION"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "suspect": {"label": "Offending Account", "required": ["offenderHandle", "socialPlatform"], "optional": ["profileUrl"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["screenshots"], "required": []}
        },
        "question_priority": ["socialPlatform", "offenderHandle", "profileUrl", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "evidence", "review"],
        "safety_rules": [
            "Report the profile inside the app for impersonation.",
            "Under Indian IT Rules 2021, platforms must remove impersonation profiles within 24-72 hours of notice."
        ]
    },

    # ── 12. Malware / Ransomware ──
    "malware_ransomware": {
        "id": "malware_ransomware",
        "title": "Malware / Ransomware Attack",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 43, 66 & 66F IT Act (Cyber terrorism & damage). CERT-In guidelines.",
        "classification": {
            "keywords": ["ransomware", "files locked", "files encrypted", ".locked", "malware", "virus", "bitcoin ransom note", "screen locked"],
            "subtypes": ["CRYPTO_RANSOMWARE", "LOCKER_MALWARE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "malware": {"label": "Infection Details", "required": ["fileExtension"], "optional": ["ransomDemanded"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["ransom_note", "sample_encrypted_file"], "required": []}
        },
        "question_priority": ["fileExtension", "ransomDemanded", "incidentDate", "description"],
        "base_tabs": ["incident", "malware", "evidence", "review"],
        "safety_rules": [
            "Disconnect infected devices from local Wi-Fi / LAN immediately to prevent spread.",
            "Do NOT pay ransom. Check NoMoreRansom.org for existing decryption keys."
        ]
    },

    # ── 13. Child Related Cyber Crime / CSAM ──
    "child_safety": {
        "id": "child_safety",
        "title": "Child Related Cyber Crime / CSAM",
        "parent": "Women/Children",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 67B IT Act, POCSO Act 2012. Zero-tolerance statutory priority.",
        "classification": {
            "keywords": ["csam", "child abuse", "minor exploited", "pocso", "underage", "child pornography"],
            "subtypes": ["POCSO_OFFENSE", "ONLINE_GROOMING"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "offense": {"label": "Offense Details", "required": ["platformUsed"], "optional": ["offenderIdentifier"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["links", "screenshots"], "required": []}
        },
        "question_priority": ["platformUsed", "offenderIdentifier", "incidentDate", "description"],
        "base_tabs": ["incident", "offense", "evidence", "review"],
        "safety_rules": [
            "Do not forward or possess illegal materials. Report links to NCRP and Childline (1098)."
        ]
    },

    # ── 14. Cyber Blackmail & Harassment ──
    "cyber_blackmail": {
        "id": "cyber_blackmail",
        "title": "Cyber Blackmailing & Harassment",
        "parent": "Women/Children",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 66E IT Act & BNS Section 351 (Criminal Intimidation).",
        "classification": {
            "keywords": ["blackmail", "harassment", "abusive messages", "defamation", "online threats", "threatening messages"],
            "subtypes": ["ONLINE_HARASSMENT", "CYBER_INTIMIDATION"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "suspect": {"label": "Harasser Info", "required": ["suspectIdentifier"], "optional": ["channel"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["screenshots", "call_logs"], "required": []}
        },
        "question_priority": ["suspectIdentifier", "channel", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "evidence", "review"],
        "safety_rules": [
            "Preserve timestamped screenshots before blocking the harasser.",
            "If in immediate physical danger, dial 112."
        ]
    },

    # ── 15. Cyber Stalking ──
    "cyber_stalking": {
        "id": "cyber_stalking",
        "title": "Cyber Stalking & Bullying",
        "parent": "Women/Children",
        "is_financial": False,
        "urgency": "standard",
        "statutory_reference": "BNS Section 78 & Section 66E IT Act.",
        "classification": {
            "keywords": ["stalking", "cyber stalking", "monitoring activity", "persistent messages", "trolling"],
            "subtypes": ["PERSISTENT_TRACKING", "ONLINE_BULLYING"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "suspect": {"label": "Stalker Info", "required": ["suspectIdentifier"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["screenshots"], "required": []}
        },
        "question_priority": ["suspectIdentifier", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "evidence", "review"],
        "safety_rules": ["Review account privacy settings and restrict profile visibility."]
    },

    # ── 16. SIM Swap Fraud ──
    "sim_swap": {
        "id": "sim_swap",
        "title": "SIM Swap / Telecom Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 66C & 66D IT Act, Indian Telegraph Act.",
        "classification": {
            "keywords": ["sim swap", "network gone", "no service sim", "esim fraud", "duplicate sim"],
            "subtypes": ["UNAUTHORIZED_ESIM", "SIM_CLONE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Fraudulent Transfers", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["telecom_complaint", "bank_statement"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "evidence", "review"],
        "safety_rules": ["Contact mobile operator immediately to block the swapped SIM and notify bank."]
    },

    # ── 17. Romance / Matrimonial Fraud ──
    "romance_scam": {
        "id": "romance_scam",
        "title": "Romance / Matrimonial Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "urgent",
        "statutory_reference": "Section 66D IT Act & BNS Section 318(4).",
        "classification": {
            "keywords": ["matrimonial scam", "shaadi.com fraud", "tinder scam", "dating scam", "gift customs duty scam", "romance scam"],
            "subtypes": ["CUSTOMS_GIFT_TRICK", "EMERGENCY_MEDICAL_PRETENSE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Transfers Made", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": []},
            "suspect": {"label": "Profile Details", "required": ["suspectProfileOrPhone"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["chat_records", "transfer_receipts"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "suspectProfileOrPhone", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": ["Stop all communications and refuse any further payments for 'customs gifts'."]
    },

    # ── 18. Fake Helpline / Customer Care ──
    "fake_customer_care": {
        "id": "fake_customer_care",
        "title": "Fake Helpline / Customer Care Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 66D IT Act.",
        "classification": {
            "keywords": ["fake customer care", "google search helpline", "fake toll free number", "fake bank helpline", "swiggy customer care fraud"],
            "subtypes": ["SEARCH_ENGINE_AD_SPOOF", "REFUND_CALL_SCAM"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Loss Info", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": []},
            "suspect": {"label": "Helpline Dialled", "required": ["dialledNumber"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["call_logs", "sms_debited"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "dialledNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": ["Always find contact numbers inside the official mobile app, never from Google search results."]
    },

    # ── 19. Government Official Impersonation ──
    "government_impersonation": {
        "id": "government_impersonation",
        "title": "Government Official Impersonation",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 66D IT Act & Section 204 BNS (Impersonating a public servant).",
        "classification": {
            "keywords": ["fake judge", "court notice scam", "income tax notice fake", "trai disconnect warning", "rbi officer call"],
            "subtypes": ["FAKE_NOTICE_NOTICE", "PHONE_DISCONNECT_EXTORTION"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "suspect": {"label": "Impersonator Info", "required": ["agencyClaimed", "suspectIdentifier"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["notice_pdf", "call_recording"], "required": []}
        },
        "question_priority": ["agencyClaimed", "suspectIdentifier", "incidentDate", "description"],
        "base_tabs": ["incident", "suspect", "evidence", "review"],
        "safety_rules": ["Verify notices on official government portals (e.g. incometax.gov.in, e-Courts)."]
    },

    # ── 20. Task / Like-Subscribe Scam (Alias/Specialized) ──
    "task_scam": {
        "id": "task_scam",
        "title": "Task / Like-Subscribe Scam",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "urgent",
        "statutory_reference": "Section 66D IT Act & BNS Section 318(4).",
        "classification": {
            "keywords": ["task scam", "youtube like task", "telegram task", "merchant rating task", "daily commission task"],
            "subtypes": ["PREPAID_TASK_FRAUD", "TASK_BALANCE_LOCK"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Deposits", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": []},
            "suspect": {"label": "Scammer", "required": ["telegramGroupOrHandle"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["chat_screenshots"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "telegramGroupOrHandle", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "suspect", "evidence", "review"],
        "safety_rules": ["Cease all payments. Never pay advance money to unlock earnings."]
    },

    # ── 21. Other Cyber Crime ──
    "other_cybercrime": {
        "id": "other_cybercrime",
        "title": "Other Cyber Crime",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "standard",
        "statutory_reference": "Information Technology Act, 2000 & Bharatiya Nyaya Sanhita (BNS).",
        "classification": {
            "keywords": ["cyber crime", "online fraud", "internet scam", "digital offense"],
            "subtypes": ["GENERAL_DIGITAL_OFFENSE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["screenshots"], "required": []}
        },
        "question_priority": ["incidentDate", "description"],
        "base_tabs": ["incident", "evidence", "review"],
        "safety_rules": ["Preserve all relevant digital evidence, links, and messages."]
    }
}

# ── Macro-flow backwards-compatibility aliases ──
FLOW_DEFINITIONS["FINANCIAL_FRAUD"] = FLOW_DEFINITIONS["upi_fraud"]
FLOW_DEFINITIONS["SOCIAL_MEDIA"] = FLOW_DEFINITIONS["impersonation"]
FLOW_DEFINITIONS["HACKING"] = FLOW_DEFINITIONS["account_takeover"]
FLOW_DEFINITIONS["RANSOMWARE"] = FLOW_DEFINITIONS["malware_ransomware"]
FLOW_DEFINITIONS["PHISHING"] = FLOW_DEFINITIONS["net_banking"]
FLOW_DEFINITIONS["HARASSMENT"] = FLOW_DEFINITIONS["cyber_blackmail"]
FLOW_DEFINITIONS["WOMEN_CHILDREN"] = FLOW_DEFINITIONS["child_safety"]
FLOW_DEFINITIONS["OTHER_CYBERCRIME"] = FLOW_DEFINITIONS["other_cybercrime"]

def get_category_spec(category_id: str) -> Dict[str, Any]:
    """Retrieves flow definition by ID or mapped alias, defaulting to other_cybercrime."""
    return FLOW_DEFINITIONS.get(category_id, FLOW_DEFINITIONS.get("other_cybercrime", {}))
