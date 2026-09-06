import re
from typing import Dict, Any, List, Tuple

OFF_TOPIC_PATTERNS = [
    r'\bcapital of\b',
    r'\bwrite (?:a|me a)? (?:poem|essay|story|song|joke|code|script)\b',
    r'\btell me a joke\b',
    r'\bwho (?:is|was) (?:the president|einstein|newton|shakespeare)\b',
    r'\bwhat is the meaning of life\b',
    r'\bhow to make a cake\b',
    r'\bweather in\b',
    r'\btranslate this to\b',
    r'\bwho won the (?:world cup|ipl|match)\b',
    r'\bpython (?:code|program) to\b',
]

def is_off_topic_query(text: str) -> Tuple[bool, str]:
    """
    Evaluates locally whether the citizen is asking a non-cybercrime query.
    Saves 100% of OpenAI tokens by deflecting instantly.
    """
    lower = text.strip().lower()

    # If it has strong cybercrime signals, it is NOT off topic
    cyber_signals = [
        'fraud', 'scam', 'hacked', 'stolen', 'debited', 'upi', 'bank', 'sbi', 'hdfc',
        'otp', 'utr', 'lost', 'money', 'ransom', 'telegram', 'instagram', 'whatsapp',
        'police', 'fir', 'ncrp', 'complaint', 'evidence', 'blackmail', 'extort',
        'threat', 'fake profile', 'phishing', 'apk', 'kyc', 'link', 'call', 'caller'
    ]
    if any(sig in lower for sig in cyber_signals):
        return False, ""

    for pat in OFF_TOPIC_PATTERNS:
        if re.search(pat, lower):
            return True, (
                "CasePilot is dedicated exclusively to assisting citizens with cybercrime reporting, "
                "evidence verification, and statutory complaint filing under Indian cyber laws. "
                "Please describe what cyber incident occurred (e.g. monetary fraud, hacking, or online harassment) "
                "so I can assist in securing your accounts and drafting your complaint."
            )

    return False, ""

FLOW_CONFIGS: Dict[str, Dict[str, Any]] = {
    'FINANCIAL_FRAUD': {
        'title': 'Online Financial Fraud',
        'subtypes': [
            'UPI / QR Code Fraud',
            'Net Banking / Phishing Transfer',
            'Credit / Debit Card Fraud',
            'Electricity Bill / KYC APK Scam',
            'Work-From-Home / Task Scam',
            'Fake Investment / Trading Group'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Incident Date', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
            {'id': 'fraudAmount', 'label': 'Stolen Amount (INR)', 'stage': 'financial'},
            {'id': 'paymentMode', 'label': 'Payment Method', 'stage': 'financial'},
            {'id': 'bankName', 'label': 'Victim Bank Name', 'stage': 'financial'},
            {'id': 'utrNumber', 'label': '12-Digit UTR / Ref Number', 'stage': 'financial'},
        ],
        'optional_fields': [
            {'id': 'beneficiaryAccount', 'label': 'Suspect UPI / Account'},
            {'id': 'suspectName', 'label': 'Suspect Name / Alias'},
            {'id': 'suspectMobile', 'label': 'Suspect Phone Number'},
        ],
        'statutory': 'Section 66D IT Act (Cheating by personation) & BNS Section 318(4). Golden Hour 1930 inter-bank freeze protocol active.',
        'base_tabs': ['incident', 'financial', 'suspect', 'evidence', 'review'],
        'critical_missing_priority': ['fraudAmount', 'bankName', 'utrNumber', 'incidentDate', 'paymentMode', 'description']
    },
    'SOCIAL_MEDIA': {
        'title': 'Social Media & Impersonation',
        'subtypes': [
            'Fake Profile Impersonation',
            'Unauthorized Account Takeover',
            'Defamatory Content / Cyber Defamation',
            'Morphing & Identity Theft'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Date Observed', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
            {'id': 'socialPlatform', 'label': 'Platform (Instagram/FB/X)', 'stage': 'platform'},
            {'id': 'offenderHandle', 'label': 'Offender Handle / Profile URL', 'stage': 'platform'},
            {'id': 'accountStatus', 'label': 'Profile Online Status', 'stage': 'platform'},
        ],
        'optional_fields': [
            {'id': 'victimProfileUrl', 'label': 'Your Original Profile URL'},
            {'id': 'reportedToPlatform', 'label': 'Platform Report Reference'},
        ],
        'statutory': 'Section 66C/66D IT Act & Rule 3(1)(b) Information Technology (Intermediary Guidelines) Rules, 2021.',
        'base_tabs': ['incident', 'platform', 'evidence', 'review'],
        'critical_missing_priority': ['socialPlatform', 'offenderHandle', 'accountStatus', 'description', 'incidentDate']
    },
    'HACKING': {
        'title': 'Hacking & Account Compromise',
        'subtypes': [
            'Email Account Hijacking (Gmail/Outlook)',
            '2FA / OTP Interception',
            'Unauthorized Cloud Access',
            'Malicious Software / Spyware'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Compromise Date/Time', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
            {'id': 'affectedService', 'label': 'Affected Service/Email', 'stage': 'account'},
            {'id': 'unauthorizedAction', 'label': 'Changes Made by Attacker', 'stage': 'security'},
            {'id': 'recoveryChanged', 'label': 'Recovery Details Altered', 'stage': 'security'},
        ],
        'optional_fields': [
            {'id': 'suspectIp', 'label': 'Attacker IP / Location Alert'},
            {'id': 'lastLegitimateAccess', 'label': 'Last Known Legitimate Login'},
        ],
        'statutory': 'Section 43 & Section 66 IT Act (Computer-related offences).',
        'base_tabs': ['incident', 'account', 'security', 'evidence', 'review'],
        'critical_missing_priority': ['affectedService', 'recoveryChanged', 'unauthorizedAction', 'incidentDate', 'description']
    },
    'RANSOMWARE': {
        'title': 'Ransomware & System Extortion',
        'subtypes': [
            'Endpoint / Desktop File Encryption',
            'Server / NAS Database Lockdown',
            'Double Extortion (Exfiltration & Ransom)'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Infection Timestamp', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
            {'id': 'fileExtension', 'label': 'Encrypted Extension (e.g. .locked)', 'stage': 'malware'},
            {'id': 'ransomDemanded', 'label': 'Ransom Amount Demanded', 'stage': 'malware'},
            {'id': 'cryptoWallet', 'label': 'Attacker Wallet Address / Note', 'stage': 'malware'},
        ],
        'optional_fields': [
            {'id': 'backupStatus', 'label': 'Offline Backups Available'},
            {'id': 'isolatedNetwork', 'label': 'System Disconnected from LAN'},
        ],
        'statutory': 'Section 43/66 IT Act & Section 308(2) BNS (Extortion). CERT-In mandatory incident reporting window.',
        'base_tabs': ['incident', 'malware', 'evidence', 'review'],
        'critical_missing_priority': ['fileExtension', 'ransomDemanded', 'cryptoWallet', 'incidentDate', 'description']
    },
    'PHISHING': {
        'title': 'Phishing & Credential Theft',
        'subtypes': [
            'Fake Bank SMS / KYC Alert',
            'Malicious APK Download',
            'Fake Utility Bill Portal',
            'Spear Phishing Email'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Incident Date', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
            {'id': 'vectorChannel', 'label': 'Vector (SMS / WhatsApp / Email)', 'stage': 'phishing_details'},
            {'id': 'impersonatedEntity', 'label': 'Impersonated Organization', 'stage': 'phishing_details'},
        ],
        'optional_fields': [
            {'id': 'phishingUrl', 'label': 'Fraudulent URL / Link'},
            {'id': 'senderHeader', 'label': 'SMS Sender ID / Number'},
        ],
        'statutory': 'Section 66D IT Act & Section 318(4) BNS.',
        'base_tabs': ['incident', 'phishing_details', 'evidence', 'review'],
        'critical_missing_priority': ['vectorChannel', 'impersonatedEntity', 'phishingUrl', 'incidentDate', 'description']
    },
    'HARASSMENT': {
        'title': 'Cyber Harassment & Stalking',
        'subtypes': [
            'Persistent Abusive Messaging',
            'Online Threats & Stalking',
            'Doxxing / Personal Phone Number Leaks',
            'Unsolicited Calls / WhatsApp Intimidation'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'First / Latest Incident Date', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
            {'id': 'channel', 'label': 'Communication Channel', 'stage': 'details'},
            {'id': 'offenderContact', 'label': 'Offender Mobile / Handle', 'stage': 'details'},
        ],
        'optional_fields': [
            {'id': 'frequency', 'label': 'Frequency of Threats'},
        ],
        'statutory': 'Section 67/66E IT Act & BNS Section 78 (Stalking) / Section 351 (Criminal Intimidation).',
        'base_tabs': ['incident', 'details', 'evidence', 'review'],
        'critical_missing_priority': ['channel', 'offenderContact', 'incidentDate', 'description']
    },
    'WOMEN_CHILDREN': {
        'title': 'Crimes Against Women & Children',
        'subtypes': [
            'Sextortion / Video Call Blackmail',
            'Non-Consensual Image Sharing',
            'CSAM / Child Exploitation Content',
            'Cyber Stalking & Sexual Harassment'
        ],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Incident Date', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Details', 'stage': 'incident'},
            {'id': 'crimeType', 'label': 'Specific Crime Classification', 'stage': 'confidential'},
            {'id': 'isConfidential', 'label': 'Confidential Reporting Status', 'stage': 'confidential'},
        ],
        'optional_fields': [
            {'id': 'perpetratorContact', 'label': 'Perpetrator Contact / Profile'},
        ],
        'statutory': 'Section 67/67A/67B IT Act & POCSO Act / BNS Sections 74-79. Protected under Zero-Identity disclosure regulations.',
        'base_tabs': ['incident', 'confidential', 'evidence', 'review'],
        'critical_missing_priority': ['crimeType', 'isConfidential', 'incidentDate', 'description']
    },
    'OTHER_CYBERCRIME': {
        'title': 'General Cyber Crime',
        'subtypes': ['Other Cyber Incident'],
        'required_fields': [
            {'id': 'incidentDate', 'label': 'Incident Date', 'stage': 'incident'},
            {'id': 'description', 'label': 'Incident Description', 'stage': 'incident'},
        ],
        'optional_fields': [],
        'statutory': 'Information Technology Act, 2000 & Bharatiya Nyaya Sanhita, 2023.',
        'base_tabs': ['incident', 'evidence', 'review'],
        'critical_missing_priority': ['incidentDate', 'description']
    }
}
