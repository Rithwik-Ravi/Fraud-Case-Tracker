"""
Declarative Flow & Category Specifications for CasePilot.
Single source of truth for both AI Decision Engines and UI Configuration.
Defines classification criteria, section schemas, statutory question priorities,
conditional rules, evidence recommendations, and safety guidelines for all 21 NCRP categories.
"""

from typing import Dict, Any, List

CATEGORIES_METADATA: List[Dict[str, Any]] = [
    # ── Pillar 1: Women / Children Related Crime ──
    {
        "id": "child_safety",
        "label": "Child Related Cyber Crime / CSAM",
        "section": "WOMEN_CHILDREN",
        "parent": "Women/Children",
        "subCategory": "Child Pornography / CSAM (POCSO)",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Child sexual abuse material, grooming, online exploitation of minors, or child cyber harassment.",
        "priorityDeskType": "safety_desk",
        "statutoryCitations": ["Section 67B IT Act", "POCSO Act Sections 13, 14, 15", "BNS Section 95"],
        "evidenceChecklist": ["Screenshots of abusive messages / links", "Website / group URLs", "Suspect contact / handle"]
    },
    {
        "id": "sextortion",
        "label": "Sextortion / Video Call Extortion",
        "section": "WOMEN_CHILDREN",
        "parent": "Women/Children",
        "subCategory": "Sextortion & Private Imagery Blackmail",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Video call blackmail, morphing private pictures, demanding money under threat of leak.",
        "priorityDeskType": "safety_desk",
        "statutoryCitations": ["Section 66E IT Act", "Section 67/67A IT Act", "BNS Section 308 (Extortion)"],
        "evidenceChecklist": ["Chat logs & extortion demands", "Video call duration logs", "Account / UPI handles where money was demanded"]
    },
    {
        "id": "cyber_blackmail",
        "label": "Cyber Blackmailing & Threatening",
        "section": "WOMEN_CHILDREN",
        "parent": "Women/Children",
        "subCategory": "Blackmailing & Intimidation",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Threatening messages, continuous harassment, blackmailing over chat or social media.",
        "priorityDeskType": "safety_desk",
        "statutoryCitations": ["BNS Section 351", "Section 66D IT Act", "BNS Section 79"],
        "evidenceChecklist": ["Screenshots of threatening messages", "Caller ID records", "Social media profile links"]
    },
    {
        "id": "cyber_stalking",
        "label": "Cyber Stalking & Bullying",
        "section": "WOMEN_CHILDREN",
        "parent": "Women/Children",
        "subCategory": "Persistent Stalking & Harassment",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Persistent unwanted contact, monitoring online activity, defamatory comments or harassment.",
        "priorityDeskType": "safety_desk",
        "statutoryCitations": ["BNS Section 78 (Stalking)", "Section 66 IT Act", "BNS Section 79"],
        "evidenceChecklist": ["Chronological record of unwanted messages / calls", "Social profile URLs", "Call logs"]
    },
    {
        "id": "wc_defamation",
        "label": "Defamation / Morphed Pictures on Social Media",
        "section": "WOMEN_CHILDREN",
        "parent": "Women/Children",
        "subCategory": "Defamation & Deepfakes",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Publishing morphed, deepfake, or defamatory photographs/videos of women or children on public platforms.",
        "priorityDeskType": "safety_desk",
        "statutoryCitations": ["BNS Section 356", "Section 66E IT Act", "IT Rule 3(2)(b)"],
        "evidenceChecklist": ["Live URL of defamatory posts", "Original photo for comparison", "Screenshots with timestamp"]
    },

    # ── Pillar 2: Financial Fraud ──
    {
        "id": "upi_fraud",
        "label": "UPI Related Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "UPI Fraud / QR Code Scam",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Fraudulent debit via UPI, fake collect request, QR code scam, or PhonePe/GPay impersonation.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Section 66D IT Act", "BNS Section 318(4)", "1930 / CFCFRMS Inter-bank Lien Protocol"],
        "evidenceChecklist": ["12-Digit Transaction Reference (UTR)", "Bank statement showing debit", "Screenshot of UPI receipt"]
    },
    {
        "id": "net_banking",
        "label": "Internet Banking / Phishing Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Net Banking / Phishing Links",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Unauthorized net banking transfer, phishing login link, or remote access app (AnyDesk/TeamViewer).",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Section 66D IT Act", "BNS Section 318(4)", "RBI Customer Protection Directives"],
        "evidenceChecklist": ["Bank statement showing debit", "12-digit UTR", "Phishing URL / Remote access app name"]
    },
    {
        "id": "card_fraud",
        "label": "Credit / Debit Card Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Card Skimming / Unauthorized Swipe",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Unauthorized ATM withdrawal, POS swipe, card skimming, or online card transaction without consent.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Section 66C/D IT Act", "BNS Section 318(4)"],
        "evidenceChecklist": ["Copy of bank card statement", "SMS alert received from card issuer", "Merchant name in alert"]
    },
    {
        "id": "investment_scam",
        "label": "Online Investment / Trading Scam",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Fake Trading Apps & Stock Schemes",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "High return promise, fake crypto trading app, Telegram investment group, or stock market tip scam.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["BNS Section 318(4)", "Section 66D IT Act", "SEBI Act Section 12A"],
        "evidenceChecklist": ["Beneficiary bank account / UPI IDs where deposits were sent", "Bank transfer UTR receipts", "Telegram / WhatsApp chat history"]
    },
    {
        "id": "job_scam",
        "label": "Work from Home / Part-Time Job Scam",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Task & Like-Subscribe Employment Scam",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Task scam, YouTube video like/subscribe fraud, daily payment promise requiring deposits.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["BNS Section 318(4)", "Section 66D IT Act"],
        "evidenceChecklist": ["Deposit UTR numbers & recipient bank accounts", "Recruitment chat history", "Task platform screenshot"]
    },
    {
        "id": "task_scam",
        "label": "Task / Like-Subscribe Scam",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Prepaid Task Platform Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Online task platform requiring deposits to 'unlock' earnings; earnings are never paid out.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["BNS Section 318(4)", "Section 66D IT Act"],
        "evidenceChecklist": ["Deposit receipts / UTRs", "Task platform URL / APK", "Telegram admin handle"]
    },
    {
        "id": "loan_app_scam",
        "label": "Illegal Loan App / Extortion",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Predatory Instant Loan Apps",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Instant loan disbursed without request, predatory interest, access to contacts and threatening calls.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["BNS Section 308 (Extortion)", "BNS Section 351", "RBI Digital Lending Guidelines 2022"],
        "evidenceChecklist": ["Name of the loan app / APK file", "Bank statement showing disbursed amount", "Audio recordings of threats"]
    },
    {
        "id": "sim_swap",
        "label": "SIM Swap / Telecom Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "SIM Cloning & Telecom Takeover",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Fraudulent SIM card deactivation and duplication to intercept banking SMS and OTPs.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Section 66C/D IT Act", "Indian Telegraph Act Section 25"],
        "evidenceChecklist": ["Exact time network signal was lost", "Telecom service provider complaint reference", "Bank accounts linked"]
    },
    {
        "id": "fin_demat",
        "label": "Demat / Stock Trading Account Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Demat Compromise & Unauthorized Trade",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Unauthorized access to stock broking account, unauthorized sale of holdings, or fund diversion.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Section 66C/D IT Act", "BNS Section 318(4)", "SEBI Cyber Security Directives"],
        "evidenceChecklist": ["Broker name & Demat Client ID", "Contract note of unauthorized trades", "Bank statement"]
    },
    {
        "id": "fin_aeps",
        "label": "AEPS / Biometric / Aadhaar Banking Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Aadhaar Enabled Payment System Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Unauthorized cash withdrawal from bank account using cloned Aadhaar fingerprints via AEPS.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Aadhaar Act Section 42/43", "Section 66C/D IT Act", "BNS Section 318(4)"],
        "evidenceChecklist": ["Bank account statement showing AEPS withdrawal", "Bank branch complaint copy", "Business Correspondent location"]
    },
    {
        "id": "fake_customer_care",
        "label": "Fake Helpline / Customer Care Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Search Engine Fake Helpline Fraud",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Fraudster poses as bank, telecom, or e-commerce customer care to extract OTPs, card details, or remote access.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["Section 66D IT Act", "BNS Section 318(4)"],
        "evidenceChecklist": ["Phone number called from Google search", "12-digit UTR", "Bank statement"]
    },
    {
        "id": "courier_parcel_scam",
        "label": "Courier / Parcel Scam",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Fake Customs & Seized Parcel Fee",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Fake notification of seized parcel, drugs or contraband found in courier, demanding customs duty or clearance payment.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["BNS Section 308 (Extortion)", "BNS Section 318(4)", "Section 66D IT Act"],
        "evidenceChecklist": ["Fake courier tracking link / SMS", "Payment receipts / UTRs", "Caller contact numbers"]
    },
    {
        "id": "romance_scam",
        "label": "Romance / Matrimonial Fraud",
        "section": "FINANCIAL",
        "parent": "Financial Fraud",
        "subCategory": "Matrimonial & Dating App Fraud",
        "isFinancial": True,
        "defaultUrgency": "urgent",
        "description": "Fake relationships on dating, matrimonial, or social sites leading to money transfers, gift demands, or customs duty scams.",
        "priorityDeskType": "banking_freeze",
        "statutoryCitations": ["BNS Section 318(4)", "Section 66D IT Act"],
        "evidenceChecklist": ["Matrimonial / dating app profile link", "Complete chat history", "Bank accounts where money was sent"]
    },

    # ── Pillar 3: Other Cyber Crime ──
    {
        "id": "impersonation",
        "label": "Impersonation / Fake Profile",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Social Media Impersonation",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Creating counterfeit profile of a person, government officer, or bank executive.",
        "priorityDeskType": "none",
        "statutoryCitations": ["Section 66D IT Act", "BNS Section 319"],
        "evidenceChecklist": ["URL of fake / imposter profile", "URL of genuine profile", "Screenshots of imposter bio and posts"]
    },
    {
        "id": "account_takeover",
        "label": "Social Media / Email Account Hacking",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Account Hijack & Compromise",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Unauthorized access, password changed, credentials stolen via phishing or spyware.",
        "priorityDeskType": "none",
        "statutoryCitations": ["Section 43/66 IT Act", "Section 66C IT Act"],
        "evidenceChecklist": ["Compromised handle / email", "Security alert email from platform", "Approximate time of lockout"]
    },
    {
        "id": "hack_defacement",
        "label": "Website Defacement",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Website Defacement & Unauthorized Alteration",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Unauthorized alteration of website appearance, hacking into web server, inserting hacker splash pages.",
        "priorityDeskType": "system_containment",
        "statutoryCitations": ["Section 43/66 IT Act", "Section 66F IT Act"],
        "evidenceChecklist": ["Defaced webpage URL & archive/screenshot", "Server web access and error logs", "FTP / SSH login logs"]
    },
    {
        "id": "hack_server_breach",
        "label": "Unauthorized Server Access / Breach",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Server Intrusion & Database Breach",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Unauthorized intrusion into cloud infrastructure, internal databases, or enterprise computer systems.",
        "priorityDeskType": "system_containment",
        "statutoryCitations": ["Section 43/66 IT Act", "DPDP Act 2023 Sec 8(6)"],
        "evidenceChecklist": ["Firewall & authentication logs", "Target domain / IP", "Compromised accounts"]
    },
    {
        "id": "malware_ransomware",
        "label": "Malware / Ransomware Attack",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Ransomware & System Encryption",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Files encrypted, device locked, demanding ransom in cryptocurrency or digital payment.",
        "priorityDeskType": "system_containment",
        "statutoryCitations": ["Section 43/66 IT Act", "BNS Section 308 (Extortion)", "CERT-In Directions 2022"],
        "evidenceChecklist": ["Ransom Note text file (.txt / .html)", "File extension (e.g. .locked)", "Attacker crypto wallet / Tor link"]
    },
    {
        "id": "crypto_wallet_drain",
        "label": "Cryptocurrency Crime / Wallet Drain",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Crypto Wallet Drain & Smart Contract Phishing",
        "isFinancial": True,
        "defaultUrgency": "golden-hour",
        "description": "Drain of crypto assets from Web3 wallet (MetaMask/Phantom) via malicious smart contract permit signature or seed phrase theft.",
        "priorityDeskType": "system_containment",
        "statutoryCitations": ["Section 66D IT Act", "BNS Section 318(4)", "FIU-IND Anti-Money Laundering Framework"],
        "evidenceChecklist": ["Victim Web3 wallet address", "Suspect recipient wallet address", "Blockchain transaction hash (TxID)", "Blockchain network", "Centralized exchange name"]
    },
    {
        "id": "mob_malicious_apk",
        "label": "Malicious Mobile APK / Device Spyware",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Malicious Android APK & Spyware",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Deceptive APK installation (e.g. electricity bill update, e-challan, PM scheme) stealing OTPs and accessibility access.",
        "priorityDeskType": "system_containment",
        "statutoryCitations": ["Section 43/66 IT Act", "Section 66C/D IT Act"],
        "evidenceChecklist": ["Name of malicious APK or download URL", "Source phone number or WhatsApp chat", "Device model and Android version"]
    },
    {
        "id": "digital_arrest",
        "label": "Digital Arrest Scam",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Impersonation of Law Enforcement & Video Arrest",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Impersonation of police, CBI, ED, customs, or income-tax officers over video/audio call, threatening illegal arrest unless a payment is made. No such legal procedure exists.",
        "priorityDeskType": "safety_desk",
        "statutoryCitations": ["BNS Section 204", "BNS Section 308", "BNS Section 318(4)", "Section 66D IT Act"],
        "evidenceChecklist": ["Caller phone numbers & Skype/WhatsApp IDs", "Screenshots of fake arrest warrants", "Bank accounts provided for transfer"]
    },
    {
        "id": "government_impersonation",
        "label": "Government Official Impersonation",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "Counterfeit Government Authority",
        "isFinancial": False,
        "defaultUrgency": "urgent",
        "description": "Impersonation of a government officer, court official, or regulator (not in digital-arrest pattern) to extract money or personal data.",
        "priorityDeskType": "none",
        "statutoryCitations": ["BNS Section 204", "Section 66D IT Act"],
        "evidenceChecklist": ["Contact number or email used by imposter", "Fake badge or official letterhead shown", "Demands made"]
    },
    {
        "id": "other_cybercrime",
        "label": "Other Cyber Crime",
        "section": "OTHER",
        "parent": "Other Cyber Crime",
        "subCategory": "General Cyber Offence",
        "isFinancial": False,
        "defaultUrgency": "standard",
        "description": "Any other digital offence not covered by specific categories above.",
        "priorityDeskType": "none",
        "statutoryCitations": ["Information Technology Act 2000", "Bharatiya Nyaya Sanhita 2023"],
        "evidenceChecklist": ["Incident screenshots", "Suspect handles / numbers / URLs", "Sequence of events"]
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
    },

    # ── 22. Cryptocurrency Crime / Wallet Drain ──
    "crypto_wallet_drain": {
        "id": "crypto_wallet_drain",
        "title": "Cryptocurrency Crime / Wallet Drain",
        "parent": "Other Cyber Crime",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 66D IT Act & BNS Section 318(4). FIU-IND Anti-Money Laundering Framework.",
        "classification": {
            "keywords": ["crypto", "bitcoin", "ethereum", "wallet drain", "metamask", "phantom", "smart contract", "seed phrase", "usdt", "txhash", "tron", "binance", "txid"],
            "subtypes": ["WEB3_WALLET_DRAIN", "SMART_CONTRACT_PERMIT_SCAM", "FAKE_CRYPTO_EXCHANGE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": ["channel"]},
            "crypto": {"label": "Blockchain & Wallet Details", "required": ["suspectWallet", "transactionHash"], "optional": ["cryptoNetwork", "victimWallet", "cryptoExchange"]},
            "financial": {"label": "Crypto Loss Figure", "required": [], "optional": ["fraudAmount"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["blockchain_explorer_receipt", "exchange_statement", "chat_screenshot"], "required": []}
        },
        "question_priority": ["suspectWallet", "transactionHash", "cryptoNetwork", "cryptoExchange", "fraudAmount", "incidentDate", "description"],
        "base_tabs": ["incident", "crypto", "evidence", "review"],
        "safety_rules": [
            "Revoke token approvals immediately on Revoke.cash or blockchain explorer.",
            "Transfer remaining assets from compromised seed phrase wallet to fresh hardware wallet.",
            "Report suspect address immediately to FIU-IND and exchange compliance desks."
        ]
    },

    # ── 23. Website Defacement ──
    "hack_defacement": {
        "id": "hack_defacement",
        "title": "Website Defacement",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 43/66 IT Act & Section 66F IT Act (Cyber Terrorism).",
        "classification": {
            "keywords": ["defaced", "website hacked", "homepage changed", "defacer", "anonghost", "hacktivist", "splash page"],
            "subtypes": ["WEBSITE_DEFACEMENT", "INDEX_PAGE_ALTERATION", "DNS_HIJACK"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "technical": {"label": "Defacement & Server Scope", "required": ["targetDomain"], "optional": ["serverIp", "defacerHandle"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["defaced_screenshot", "server_access_logs", "ftp_ssh_logs"], "required": []}
        },
        "question_priority": ["targetDomain", "serverIp", "defacerHandle", "incidentDate", "description"],
        "base_tabs": ["incident", "technical", "evidence", "review"],
        "safety_rules": [
            "Isolate the web server immediately from public internet / DNS routing.",
            "Preserve access.log, error.log, and memory dumps before rebooting or rolling back.",
            "Mandatory 6-hour incident reporting window to CERT-In (incident@cert-in.org.in)."
        ]
    },

    # ── 24. Unauthorized Server Access / Breach ──
    "hack_server_breach": {
        "id": "hack_server_breach",
        "title": "Unauthorized Server Access / Breach",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 43/66 IT Act & DPDP Act 2023 Sec 8(6).",
        "classification": {
            "keywords": ["server breach", "database breach", "unauthorized ssh", "root access", "data exfiltration", "cloud breach"],
            "subtypes": ["DATABASE_EXFILTRATION", "UNAUTHORIZED_SSH_INTRUSION", "CLOUD_TENANT_BREACH"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "technical": {"label": "Server & Intrusion Scope", "required": ["serverIp"], "optional": ["targetDomain", "compromisedAccounts"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["firewall_logs", "auth_log", "pcap_traffic"], "required": []}
        },
        "question_priority": ["serverIp", "targetDomain", "incidentDate", "description"],
        "base_tabs": ["incident", "technical", "evidence", "review"],
        "safety_rules": [
            "Rotate all administrative keys, SSH certificates, and IAM credentials immediately.",
            "Preserve server logs for mandatory 180-day retention mandate under CERT-In directions."
        ]
    },

    # ── 25. Malicious Mobile APK / Device Spyware ──
    "mob_malicious_apk": {
        "id": "mob_malicious_apk",
        "title": "Malicious Mobile APK / Device Spyware",
        "parent": "Other Cyber Crime",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "Section 43/66 IT Act & Section 66C/D IT Act.",
        "classification": {
            "keywords": [".apk", "malicious apk", "installed app", "electricity bill apk", "sbi reward apk", "challan apk", "spyware app"],
            "subtypes": ["MALICIOUS_APK_SPYWARE", "SMS_FORWARDER_TROJAN", "ACCESSIBILITY_OVERLAY_MALWARE"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "mobile": {"label": "Malware Information", "required": ["maliciousApkName"], "optional": ["deviceType", "telecomOperator"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["apk_download_sms", "apk_file_hash", "device_screenshot"], "required": []}
        },
        "question_priority": ["maliciousApkName", "deviceType", "incidentDate", "description"],
        "base_tabs": ["incident", "mobile", "evidence", "review"],
        "safety_rules": [
            "Put phone on Airplane Mode immediately to stop SMS forwarding and unauthorized OTP relays.",
            "Boot into Safe Mode and uninstall the malicious APK, or perform a factory reset.",
            "Immediately log into your bank from a CLEAN device and change net banking credentials."
        ]
    },

    # ── 26. Defamation / Morphed Pictures on Social Media ──
    "wc_defamation": {
        "id": "wc_defamation",
        "title": "Defamation / Morphed Pictures on Social Media",
        "parent": "Women/Children",
        "is_financial": False,
        "urgency": "urgent",
        "statutory_reference": "BNS Section 356, Section 66E IT Act & Rule 3(2)(b) IT Intermediary Rules 2021.",
        "classification": {
            "keywords": ["morphed picture", "deepfake", "defamatory post", "defamation social media", "fake nudes uploaded", "reputation damage"],
            "subtypes": ["DEEPFAKE_DEFAMATION", "MORPHER_PUBLIC_POST", "UNAUTHORIZED_PHOTO_LEAK"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "social": {"label": "Offending Post / Profile", "required": ["imposterUrl"], "optional": ["socialPlatform", "genuineUrl"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["timestamped_url_screenshot", "original_photo_evidence"], "required": []}
        },
        "question_priority": ["imposterUrl", "socialPlatform", "incidentDate", "description"],
        "base_tabs": ["incident", "social", "evidence", "review"],
        "safety_rules": [
            "Capture live URL and screenshots with system timestamp before requesting takedown.",
            "Under Rule 3(2)(b) of IT Rules 2021, platforms are legally mandated to remove intimate/morphed imagery within 24 hours of grievance notification."
        ]
    },

    # ── 27. Demat / Stock Trading Account Fraud ──
    "fin_demat": {
        "id": "fin_demat",
        "title": "Demat / Stock Trading Account Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Section 66C/D IT Act, BNS Section 318(4), SEBI Cyber Security Directives.",
        "classification": {
            "keywords": ["demat", "stock trading account", "zerodha", "groww", "angelone", "unauthorized trade", "shares sold without permission"],
            "subtypes": ["UNAUTHORIZED_SHARE_LIQUIDATION", "BROKER_CREDENTIAL_TAKEOVER"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "Trading Loss & Demat Info", "required": ["fraudAmount", "bankName"], "optional": ["dematClientId"]},
            "evidence": {"label": "Evidence Vault", "recommended": ["broker_contract_note", "demat_holding_statement"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "evidence", "review"],
        "safety_rules": [
            "Contact your broker immediately to freeze trading permissions and revoke API keys.",
            "Inform CDSL / NSDL depository to lock Demat account operations."
        ]
    },

    # ── 28. AEPS / Biometric / Aadhaar Banking Fraud ──
    "fin_aeps": {
        "id": "fin_aeps",
        "title": "AEPS / Biometric / Aadhaar Banking Fraud",
        "parent": "Financial Fraud",
        "is_financial": True,
        "urgency": "golden-hour",
        "statutory_reference": "Aadhaar Act Section 42/43, Section 66C/D IT Act, BNS Section 318(4).",
        "classification": {
            "keywords": ["aeps", "biometric debit", "aadhaar fingerprint", "micro atm cash withdrawal", "fingerprint cloned", "aadhaar fraud"],
            "subtypes": ["CLONED_BIOMETRIC_AEPS", "BUSINESS_CORRESPONDENT_FRAUD"]
        },
        "sections": {
            "incident": {"label": "Incident Overview", "required": ["incidentDate", "description"], "optional": []},
            "financial": {"label": "AEPS Transaction Details", "required": ["fraudAmount", "bankName", "utrNumber"], "optional": []},
            "evidence": {"label": "Evidence Vault", "recommended": ["bank_passbook_copy", "aeps_transaction_sms"], "required": []}
        },
        "question_priority": ["fraudAmount", "bankName", "utrNumber", "incidentDate", "description"],
        "base_tabs": ["incident", "financial", "evidence", "review"],
        "safety_rules": [
            "Lock your Aadhaar biometrics IMMEDIATELY via the mAadhaar app or uidai.gov.in portal.",
            "File a formal dispute with your bank branch citing unauthorized AEPS debit under RBI zero-liability rules."
        ]
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
