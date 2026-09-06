"""
3-Tier Scope & Intent Classifier for CasePilot.
Ensures zero-token fast-path navigation and deflection for off-topic queries,
with intelligent fallback for ambiguous queries and high-priority Digital Arrest circuit-breaker intercept.
"""

import re
from typing import Tuple, Optional, List, Dict, Any
from models import UIAction

# Clear non-cybercrime patterns
NON_CYBER_PATTERNS = [
    r'\bcapital of\b',
    r'\bwrite (?:a|me a)? (?:poem|essay|story|song|joke|code|script|function)\b',
    r'\btell me a joke\b',
    r'\bwho (?:is|was) (?:the president|einstein|newton|shakespeare|modi|musk)\b',
    r'\bwhat is the meaning of life\b',
    r'\bhow to make (?:a cake|coffee|pizza|bread)\b',
    r'\bweather in\b',
    r'\btranslate this to\b',
    r'\bwho won the (?:world cup|ipl|match|election)\b',
    r'\bpython (?:code|program|script) to\b',
    r'\bsolve this math\b',
    r'\bhow to learn (?:python|coding|guitar)\b'
]

# High-confidence cybercrime keywords
STRONG_CYBER_SIGNALS = [
    'fraud', 'scam', 'hacked', 'hack', 'stolen', 'debited', 'deducted',
    'upi', 'gpay', 'phonepe', 'paytm', 'bank', 'sbi', 'hdfc', 'icici',
    'otp', 'utr', 'lost', 'money', 'ransom', 'ransomware', 'telegram',
    'instagram', 'whatsapp', 'facebook', 'police', 'fir', 'ncrp', 'complaint',
    'evidence', 'blackmail', 'extort', 'threat', 'fake profile', 'phishing',
    'apk', 'kyc', 'link', 'call', 'caller', 'impersonat', 'morphed', 'compromised',
    'unauthorized', 'bitcoin', 'crypto', 'wallet', 'cheated', 'task scam',
    'investment scam', 'electricity bill', 'sim card', 'blocked', 'digital arrest',
    'sextortion', 'loan app', 'courier scam', 'fedex scam', 'customs fee'
]

# High-priority digital arrest triggers
DIGITAL_ARREST_PATTERNS = [
    r'\bdigital(?:ly)?\s+arrest(?:ed)?\b',
    r'\bcbi\s+(?:video\s+call|interrogat|calling|arrest)\b',
    r'\bed\s+(?:video\s+call|interrogat|calling|officer)\b',
    r'\bpolice\s+(?:on\s+skype|video\s+call|whatsapp\s+video)\b',
    r'\bcustoms\s+(?:drugs|narcotics|contraband|parcel)\s+(?:found|seized|warning)\b',
    r'\baadhaar\s+(?:used\s+in|found\s+in)\s+(?:money\s+laundering|drugs|crime)\b',
    r'\bstay\s+on\s+(?:video\s+call|camera)\s+(?:or|under)\s+(?:arrest|custody)\b',
    r'\bfake\s+arrest\s+warrant\b',
    r'\brbi\s+(?:verification|safe)\s+account\b'
]

DIGITAL_ARREST_ADVISORY = (
    "EMERGENCY WARNING: There is NO legal provision for 'Digital Arrest' under Indian Law. "
    "No police officer, CBI agent, ED official, or court will EVER place you under arrest via video call (Skype/WhatsApp) "
    "or ask you to transfer funds to an 'RBI verification' account. "
    "Disconnect the call immediately. Do NOT transfer any money. "
    "Redirecting you to the CasePilot Digital Arrest Emergency Circuit Breaker."
)

DEFLECTION_MESSAGE = (
    "CasePilot is dedicated exclusively to assisting citizens with cybercrime reporting, "
    "evidence verification, and statutory complaint filing under Indian cyber laws. "
    "Please describe what cyber incident occurred (e.g. monetary fraud, unauthorized account access, "
    "or online harassment) so I can assist in securing your accounts and drafting your complaint."
)

class ScopeClassifier:
    """
    Tiered scope evaluation:
    1. Digital arrest circuit breaker check (Highest priority)
    2. Navigation check (0 tokens fast-path)
    3. General inquiry / FAQ check
    4. Strong cyber signal (0 tokens)
    5. Clear non-cyber deflection (0 tokens)
    6. Ambiguity handling
    """

    @classmethod
    def is_digital_arrest(cls, message: str) -> bool:
        lower = message.strip().lower()
        return any(re.search(pat, lower) for pat in DIGITAL_ARREST_PATTERNS)

    @staticmethod
    def detect_navigation(message: str) -> List[UIAction]:
        """Detects on-demand UI navigation intents locally (0 tokens)."""
        lower = message.strip().lower()
        actions: List[UIAction] = []

        # 1. Digital Arrest Circuit Breaker
        if any(p in lower for p in ['digital arrest', 'fake cbi call', 'fake police video call', 'circuit breaker']):
            actions.append(UIAction(action='navigate_url', target='/digital-arrest', label='Digital Arrest Circuit Breaker'))
            actions.append(UIAction(action='digital_arrest_alert', target='CIRCUIT_BREAKER'))
            return actions

        # 2. Suspect Threat Scanner / Check tool
        if re.search(r'\b(?:check|verify|scan|inspect)?\s*(?:suspect|threat scanner|screenshot scanner|check upi|check number|verify phone|is this fake|check link|check website)\b', lower):
            actions.append(UIAction(action='navigate_url', target='/check', label='Suspect Threat Scanner'))
            actions.append(UIAction(action='switch_primary_tab', target='check', label='Suspect Threat Scanner'))

        # 3. Assisted Mode / Guided Questionnaire
        elif re.search(r'\b(?:assisted mode|guided mode|guided report|questionnaire mode|voice mode|mcq mode)\b', lower):
            actions.append(UIAction(action='navigate_url', target='/assisted', label='Assisted Reporting Mode'))
            actions.append(UIAction(action='switch_primary_tab', target='assisted', label='Assisted Mode'))

        # 4. Tracking & Status Lookups
        elif re.search(r'\b(?:switch to|take me to|go to|open|show|view)?\s*(?:track|tracking|track case|track complaint|status|check status|my cases|my complaints|timeline)\b', lower):
            actions.append(UIAction(action='navigate_url', target='/track', label='Track Case'))
            actions.append(UIAction(action='switch_primary_tab', target='track', label='Track Case'))

        # 5. File / Report Complaint
        elif re.search(r'\b(?:switch to|take me to|go to|open|show|file|start)?\s*(?:report|register|complaint|file complaint|new complaint|report incident|incident form|the form|form)\b', lower):
            actions.append(UIAction(action='navigate_url', target='/report', label='Report Incident'))
            actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))

        # 6. Home / Dashboard
        elif re.search(r'\b(?:switch to|take me to|go to|open|show|back to)?\s*(?:home|dashboard|overview|main page|portal)\b', lower):
            actions.append(UIAction(action='navigate_url', target='/', label='Home Overview'))
            actions.append(UIAction(action='switch_primary_tab', target='home', label='Home Overview'))

        # Specific Case Selection in Track
        case_match = re.search(r'\b(ack-\d{4}-\d+|cc-2026-\d{5})\b', lower)
        if case_match:
            case_id = case_match.group(1).upper()
            actions.append(UIAction(action='navigate_url', target=f'/track?ack={case_id}', label=f'Track {case_id}'))
            actions.append(UIAction(action='switch_primary_tab', target='track', label='Track Case'))
            actions.append(UIAction(action='select_case', target=case_id, label=f'Select Case {case_id}'))

        # Sub-tab Navigation within Report
        if re.search(r'\b(?:switch to|go to|open|show)?\s*(?:financial|financial details|money details|bank details|payment details|freeze)\b', lower):
            actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))
            actions.append(UIAction(action='switch_sub_tab', target='financial', label='Financial Details'))
        elif re.search(r'\b(?:switch to|go to|open|show)?\s*(?:evidence|evidence vault|proof|upload proof|documents)\b', lower):
            actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))
            actions.append(UIAction(action='switch_sub_tab', target='evidence', label='Evidence Vault'))
        elif re.search(r'\b(?:switch to|go to|open|show)?\s*(?:review|review & submit|ready to submit|review tab)\b', lower):
            actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))
            actions.append(UIAction(action='switch_sub_tab', target='review', label='Review & Submit'))

        # Deduplicate while preserving order
        deduped = []
        seen = set()
        for a in actions:
            k = (a.action, a.target, a.field, str(a.value))
            if k not in seen:
                seen.add(k)
                deduped.append(a)
        return deduped

    @classmethod
    def is_case_query(cls, message: str) -> bool:
        lower = message.strip().lower()
        case_query_patterns = [
            r'\bdid you get (?:everything|all)\b',
            r'\b(?:everything|all) (?:you need|needed)\b',
            r'\blast case (?:file)?\b',
            r'\b(?:this|my|the) case (?:file)?\b',
            r'\bcase file\b',
            r'\b(?:status of|check status of|track status of|info on|details of) (?:my |the )?(?:case|complaint)\b',
            r'\bis (?:the|my|this) (?:case|complaint|file) (?:ready|complete|submitted|active|done)\b',
            r'\bwhat (?:is happening|happened) (?:to|with) (?:my|this|the) case\b',
            r'\bwhat cases (?:do i have|are there|exist)\b',
            r'\bshow (?:me )?(?:the )?(?:my )?cases?\b',
            r'\b(?:case|ack)\s+(?:ack-\d{4}-\d+|cc-2026-\d{5})\b',
            r'\bmy (?:previous|existing|filed|registered) (?:case|complaint)\b',
        ]
        return any(re.search(pat, lower) for pat in case_query_patterns)

    @classmethod
    def is_case_action(cls, message: str) -> bool:
        lower = message.strip().lower()
        action_patterns = [
            r'\bescalate (?:my|this|the) (?:case|complaint)\b',
            r'\btake action on\b',
            r'\bsubmit (?:my|this|the) (?:case|complaint|form)\b',
            r'\bwithdraw (?:my|this|the) (?:case|complaint)\b',
            r'\bfile escalation\b',
        ]
        return any(re.search(pat, lower) for pat in action_patterns)

    @classmethod
    def is_inquiry(cls, message: str) -> bool:
        lower = message.strip().lower()
        inquiry_patterns = [
            r'\bwhat is\b',
            r'\bhow to\b',
            r'\bcan you\b',
            r'\bcould you\b',
            r'\bshould i\b',
            r'\bwhy\b',
            r'\bmeaning of\b',
            r'\bprocedure\b',
            r'\bhelp me understand\b',
            r'\bexplain\b'
        ]
        return any(re.search(pat, lower) for pat in inquiry_patterns)

    @classmethod
    def evaluate_scope(cls, message: str, current_ui_location: Optional[Dict[str, Any]] = None) -> Tuple[str, str, List[UIAction]]:
        """
        Returns: (decision, deflection_message, navigation_actions)
        decision is one of:
        'DIGITAL_ARREST', 'NAVIGATION', 'CASE_QUERY', 'CASE_ACTION', 'INQUIRY',
        'CYBERCRIME', 'NON_CYBERCRIME', 'AMBIGUOUS'
        """
        clean_msg = message.strip()
        lower = clean_msg.lower()

        # 1. Critical Intercept: Digital Arrest
        if cls.is_digital_arrest(clean_msg):
            actions = [
                UIAction(action='navigate_url', target='/digital-arrest', label='Digital Arrest Circuit Breaker'),
                UIAction(action='digital_arrest_alert', target='CIRCUIT_BREAKER')
            ]
            return 'DIGITAL_ARREST', DIGITAL_ARREST_ADVISORY, actions

        # 2. Case action
        if cls.is_case_action(clean_msg):
            return 'CASE_ACTION', '', []

        # 3. Case query
        if cls.is_case_query(clean_msg):
            return 'CASE_QUERY', '', []

        # 4. Fast navigation
        nav_actions = cls.detect_navigation(clean_msg)
        if nav_actions and len(clean_msg.split()) <= 8:
            return 'NAVIGATION', "Navigating you as requested.", nav_actions

        # 5. Non-cyber deflection check (0 tokens)
        for pattern in NON_CYBER_PATTERNS:
            if re.search(pattern, lower):
                return 'NON_CYBERCRIME', DEFLECTION_MESSAGE, []

        # 6. Strong cyber signal fast-path (0 tokens)
        for signal in STRONG_CYBER_SIGNALS:
            if signal in lower:
                return 'CYBERCRIME', '', nav_actions

        # 7. Check general inquiry
        if cls.is_inquiry(clean_msg):
            return 'INQUIRY', '', nav_actions

        # 8. Ambiguous short query
        if len(clean_msg.split()) < 3:
            return 'AMBIGUOUS', "Could you describe what happened in a bit more detail?", nav_actions

        return 'CYBERCRIME', '', nav_actions
