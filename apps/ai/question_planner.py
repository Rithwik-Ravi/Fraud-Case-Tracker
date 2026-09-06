"""
Hierarchical Question Planning Decision Engine for CasePilot.
Implements the statutory decision tree:
Conflict Resolution -> Required Missing -> Conditional Required -> Evidence Recommended -> Optional -> Review Ready
"""

from typing import Dict, Any, List, Optional
from models import PlannedQuestion, FieldConflict, EvidenceItem
from flow_definitions import FLOW_DEFINITIONS

FIELD_QUESTION_TEMPLATES = {
    'fraudAmount': {
        'question': "What was the total monetary amount lost or debited from your account?",
        'rationale': "Monetary loss threshold dictates investigation jurisdiction and 1930 priority."
    },
    'bankName': {
        'question': "Which bank, credit card, or payment wallet was the money debited from?",
        'rationale': "Source bank is necessary to dispatch the inter-bank freeze lien request."
    },
    'utrNumber': {
        'question': "Do you have the 12-digit UTR (Unique Transaction Reference) number or reference ID from your bank SMS?",
        'rationale': "12-digit UTR is the statutory tracking key used by 1930 to trace inter-bank hops."
    },
    'paymentMode': {
        'question': "What payment method was used (e.g. UPI, Net Banking, Credit Card, or Debit Card)?",
        'rationale': "Determines the clearing protocol and dispute form required."
    },
    'beneficiaryAccount': {
        'question': "What was the suspect's UPI ID (VPA, e.g. user@bank) or beneficiary bank account number?",
        'rationale': "Beneficiary account allows NPCI / clearing house to freeze recipient funds."
    },
    'suspectPhoneOrHandle': {
        'question': "What is the phone number, WhatsApp handle, or username used by the suspect or caller?",
        'rationale': "Suspect contact identifier is required for telecommunications tracing and preservation orders."
    },
    'remoteAccessApp': {
        'question': "Which remote access application did the caller ask you to install (e.g. AnyDesk, TeamViewer, QuickSupport)?",
        'rationale': "Identifies software vector used to take over device session."
    },
    'loanAppName': {
        'question': "What is the exact name of the loan application downloaded on your device?",
        'rationale': "Identifies predatory APK for takedown via Google Play Store and CERT-In."
    },
    'dialledNumber': {
        'question': "What helpline phone number did you find online and call?",
        'rationale': "Fake customer care number is needed for telecom blocking under Section 79 IT Act."
    },
    'telegramGroupOrHandle': {
        'question': "What is the name or web link of the Telegram trading or task group?",
        'rationale': "Group link is submitted to Telegram legal compliance for channel takedown."
    },
    'cardLast4': {
        'question': "What are the last 4 digits of the debit or credit card that was charged?",
        'rationale': "Identifies card bin and account for bank chargeback."
    },
    'incidentDate': {
        'question': "On what date and approximate time did this incident take place?",
        'rationale': "Transaction timestamp determines whether Golden Hour (<24h) protocol applies."
    },
    'description': {
        'question': "Could you briefly describe how the scam occurred or what the caller instructed you to do?",
        'rationale': "Modus operandi summary is required for statutory FIR drafting."
    },
    'socialPlatform': {
        'question': "Which social media platform was used (e.g. Instagram, Facebook, Telegram, WhatsApp, or X)?",
        'rationale': "Platform identification determines which intermediary legal notice is dispatched."
    },
    'offenderHandle': {
        'question': "What is the exact username, handle (@), or URL of the offending profile or group?",
        'rationale': "Offender identifier is required for Rule 3(2)(b) preservation and takedown orders."
    },
    'accountStatus': {
        'question': "Is the offending profile still actively online, or has it been deleted / blocked?",
        'rationale': "Active profiles require urgent emergency preservation requests before deletion."
    },
    'affectedService': {
        'question': "Which email or online account was compromised (e.g. Gmail, Outlook, WhatsApp)?",
        'rationale': "Determines whether account takeover falls under Sec 43/66 IT Act."
    },
    'recoveryChanged': {
        'question': "Did the unauthorized user change your recovery email address or phone number?",
        'rationale': "Altered recovery credentials indicate complete hijacking and prevent automated self-recovery."
    },
    'fileExtension': {
        'question': "What file extension was appended to your encrypted files (e.g. .locked, .phobos)?",
        'rationale': "File extension identifies the ransomware strain for key matching on NoMoreRansom."
    },
    'ransomDemanded': {
        'question': "What ransom amount or cryptocurrency was demanded in the ransom note?",
        'rationale': "Ransom demand establishes cyber extortion under Section 66F IT Act."
    },
    'phishingUrl': {
        'question': "What was the suspicious website link or URL you were sent (e.g. from SMS or email)?",
        'rationale': "Domain URL enables law enforcement takedown via NCIIPC / CERT-In."
    },
    'channel': {
        'question': "Through which channel did the contact occur (e.g. Phone Call, WhatsApp, SMS, or Email)?",
        'rationale': "Communication vector is required for telecom CDR subpoenas."
    },
    'suspectIdentifier': {
        'question': "What phone number, email, or online identity was used by the person harassing you?",
        'rationale': "Suspect contact identifier is required for police tracing under Section 66E IT Act."
    },
    'platformUsed': {
        'question': "On which app or website did this offense occur?",
        'rationale': "Service provider coordinates with specialized women safety / POCSO units."
    }
}

class QuestionPlanner:
    """
    Evaluates the current case state against declarative statutory priorities
    to select the single next question.
    """

    @classmethod
    def plan_next_question(
        cls,
        flow_id: str,
        current_state: Dict[str, Any],
        conflicts: List[FieldConflict],
        evidence_list: List[EvidenceItem]
    ) -> PlannedQuestion:
        # ── Special Circuit Breaker: Digital Arrest Emergency ────────
        if flow_id == "digital_arrest":
            if not current_state.get('callDisconnected'):
                return PlannedQuestion(
                    target_field='callDisconnected',
                    priority_tier='required',
                    question_text=(
                        "EMERGENCY SAFETY CHECK: Have you disconnected the video call? "
                        "Please confirm that you have hung up and did not transfer funds to any alleged 'RBI verification' account."
                    ),
                    rationale="Immediate physical and financial protection against ongoing psychological coercion."
                )

        # ── Tier 1: Conflict Resolution ──────────────────────────────
        unresolved = [c for c in conflicts if not c.resolved]
        if unresolved:
            c = unresolved[0]
            field_name = c.field
            return PlannedQuestion(
                target_field=field_name,
                priority_tier='conflict',
                question_text=(
                    f"We noticed a discrepancy regarding {field_name}: "
                    f"your complaint notes state '{c.reportedValue}', but document evidence indicates '{c.evidenceValue}'. "
                    f"Which value should be officially recorded on your police complaint?"
                ),
                rationale="Unresolved discrepancies must be arbitrated before formal submission to prevent rejection."
            )

        flow_spec = FLOW_DEFINITIONS.get(flow_id, FLOW_DEFINITIONS.get('upi_fraud', {}))
        if not flow_spec:
            return PlannedQuestion(
                target_field='description',
                priority_tier='required',
                question_text="Could you describe what cyber incident occurred so I can guide your complaint?",
                rationale="Initial incident identification."
            )

        # ── Tier 2: Required Missing Statutory Fields ────────────────
        question_priority = flow_spec.get('question_priority', [])
        for field in question_priority:
            val = current_state.get(field)
            if val is None or str(val).strip() == '':
                tmpl = FIELD_QUESTION_TEMPLATES.get(field, {
                    'question': f"Could you provide your {field} for the complaint record?",
                    'rationale': "Statutory requirement."
                })
                return PlannedQuestion(
                    target_field=field,
                    priority_tier='required',
                    question_text=tmpl['question'],
                    rationale=tmpl['rationale']
                )

        # ── Tier 3: Conditional Required Rules ───────────────────────
        conditional_rules = flow_spec.get('conditional_rules', [])
        for rule in conditional_rules:
            cond_field = rule.get('condition_field')
            cond_val = rule.get('condition_value')
            actual_val = current_state.get(cond_field)

            condition_met = False
            if isinstance(cond_val, bool):
                condition_met = bool(actual_val) is cond_val
            elif str(actual_val).lower() == str(cond_val).lower():
                condition_met = True

            if condition_met:
                for req_f in rule.get('require_fields', []):
                    if current_state.get(req_f) is None or str(current_state.get(req_f)).strip() == '':
                        tmpl = FIELD_QUESTION_TEMPLATES.get(req_f, {
                            'question': f"Could you please provide {req_f}?",
                            'rationale': rule.get('rationale', 'Conditional requirement.')
                        })
                        return PlannedQuestion(
                            target_field=req_f,
                            priority_tier='conditional',
                            question_text=tmpl['question'],
                            rationale=rule.get('rationale')
                        )

        # ── Tier 4: Evidence Recommendations ─────────────────────────
        evidence_rules = flow_spec.get('evidence_rules', {})
        recommended = evidence_rules.get('recommended_types', [])
        if recommended and len(evidence_list) == 0:
            rec_str = ", ".join(r.replace('_', ' ') for r in recommended[:2])
            return PlannedQuestion(
                target_field='evidence',
                priority_tier='evidence',
                question_text=(
                    f"All key incident details are recorded. Do you have any supporting documents "
                    f"(such as {rec_str}) to attach to your evidence vault?"
                ),
                rationale="Attaching digital evidence significantly accelerates police investigation."
            )

        # ── Tier 5: Useful Optional Information ──────────────────────
        optional_candidates = ['suspectMobile', 'suspectName', 'beneficiaryAccount', 'profileUrl']
        for opt in optional_candidates:
            if opt in flow_spec.get('sections', {}).get('suspect', {}).get('optional', []):
                if current_state.get(opt) is None or str(current_state.get(opt)).strip() == '':
                    tmpl = FIELD_QUESTION_TEMPLATES.get(opt)
                    if tmpl:
                        return PlannedQuestion(
                            target_field=opt,
                            priority_tier='optional',
                            question_text=f"Do you happen to know the suspect's {opt.replace('suspect', '').lower()}, or any additional contact info?",
                            rationale="Optional suspect identification."
                        )

        # ── Tier 6: Ready for Review ─────────────────────────────────
        return PlannedQuestion(
            target_field=None,
            priority_tier='review_ready',
            question_text=(
                "All essential statutory complaint requirements have been captured and verified. "
                "You can now review the draft details and proceed to official submission."
            ),
            rationale="Statutory requirements satisfied."
        )
