"""
Central Stateful AI Orchestrator for CasePilot.
Coordinates:
1. 3-Tier Scope Guard & Fast Navigation (ScopeClassifier)
2. Decoupled Pure Fact Extraction (FactExtractor)
3. State Machine & Provenance Reconciliation (CaseStateMachine)
4. Hierarchical Question Planning (QuestionPlanner)
5. Contextual UI Dispatching & Telemetry Attribution
"""

import time
from typing import Dict, Any, List, Optional
from models import (
    FlowId,
    CaseStage,
    IntakeRequest,
    IntakeResponse,
    UIAction,
    FieldConflict,
    FactProvenance,
    ClassificationProposal,
    PlannedQuestion
)
from flow_definitions import FLOW_DEFINITIONS
from scope_classifier import ScopeClassifier
from extractors import FactExtractor
from state_machine import CaseStateMachine
from question_planner import QuestionPlanner
from response_generator import ResponseGenerator
from case_inspector import CaseInspector
from llm_usage import start_trace, get_correlation_id, get_elapsed_ms, UsageTracker

class AIOrchestrator:
    """
    State-machine cognitive orchestrator for cybercrime intake.
    Zero unconstrained LLM database mutations.
    """

    @classmethod
    async def process_intake(cls, req: IntakeRequest) -> IntakeResponse:
        t0 = time.time()
        cid = start_trace(req.correlation_id)
        message = req.message.strip()
        current_flow = req.flow_id
        current_state = dict(req.case_state or {})
        existing_conflicts = list(req.evidence_list and [] or []) # type: ignore
        provenance = dict(req.facts_provenance or {})

        # ── STAGE 1: 3-Tier Scope Guard & Fast Navigation (0 Tokens) ──
        scope_decision, deflection_msg, nav_actions = ScopeClassifier.evaluate_scope(message, req.current_ui_location)

        if scope_decision == 'DIGITAL_ARREST':
            return IntakeResponse(
                message=deflection_msg,
                flow_id="digital_arrest",
                stage='CLASSIFIED',
                categoryId="digital_arrest",
                categoryLabel="Digital Arrest Scam",
                parentCategory="Other Cyber Crime",
                isFinancialFraud=False,
                urgency="urgent",
                isDigitalArrest=True,
                moneyMoved=False,
                reasoning="Emergency circuit-breaker: detected high-threat digital arrest impersonation signals.",
                extracted_pills=["Category: Digital Arrest Scam", "Urgency: High Threat", "Action: Disconnect Immediately"],
                case_updates={},
                field_statuses={},
                facts_provenance=provenance,
                dynamic_tabs=['incident', 'suspect', 'evidence', 'review'],
                conflicts=[],
                completion_percentage=25,
                section_progress={},
                missing_required_fields=['suspectPhoneOrHandle'],
                next_question="EMERGENCY: Have you disconnected the video call? Please confirm that you have hung up and did not transfer any money to the caller.",
                planned_question=PlannedQuestion(
                    target_field='callDisconnected',
                    priority_tier='required',
                    question_text="EMERGENCY: Have you disconnected the video call? Please confirm that you have hung up and did not transfer any money to the caller.",
                    rationale="Circuit-breaker protocol to prevent immediate financial and emotional exploitation."
                ),
                is_review_ready=False,
                tokens_used=0,
                cost_usd=0.0,
                cost_inr=0.0,
                elapsed_ms=get_elapsed_ms(),
                correlation_id=cid,
                ui_actions=nav_actions,
                tool_used="Digital Arrest Circuit Breaker"
            )

        if scope_decision == 'CASE_QUERY':
            case_msg, pills, case_actions, q_tokens = await CaseInspector.inspect_case(
                user_message=req.message,
                current_ui_location=req.current_ui_location or {},
                tracked_cases=req.tracked_cases or [],
                complaint_draft={
                    'flow_id': current_flow,
                    'case_state': current_state,
                    'facts_provenance': provenance
                },
                conversation_history=req.conversation_history or []
            )
            base_tabs = FLOW_DEFINITIONS.get(current_flow, {}).get('base_tabs', ['incident', 'financial', 'suspect', 'evidence', 'review'])
            call_cost_usd = 0.0
            call_cost_inr = 0.0
            if q_tokens > 0:
                usage = UsageTracker.record_usage(
                    model="gpt-4o-mini",
                    prompt_tokens=int(q_tokens * 0.75),
                    completion_tokens=int(q_tokens * 0.25)
                )
                call_cost_usd = usage.get("cost_usd", 0.0)
                call_cost_inr = usage.get("cost_inr", 0.0)

            return IntakeResponse(
                message=case_msg,
                flow_id=current_flow or 'DISCOVERY',
                stage=req.case_stage or 'INTAKE',
                extracted_pills=pills,
                case_updates={},
                field_statuses={},
                facts_provenance=provenance,
                dynamic_tabs=base_tabs,
                conflicts=[],
                completion_percentage=100,
                section_progress={},
                missing_required_fields=[],
                next_question=None,
                is_review_ready=False,
                tokens_used=q_tokens,
                cost_usd=call_cost_usd,
                cost_inr=call_cost_inr,
                elapsed_ms=get_elapsed_ms(),
                correlation_id=cid,
                ui_actions=case_actions,
                tool_used="Case File Inspector"
            )

        if scope_decision == 'CASE_ACTION':
            matched_case = CaseInspector.match_target_case(req.message, req.current_ui_location or {}, req.tracked_cases or [])
            if matched_case:
                case_id = matched_case.get('id', 'Unknown')
                action_target = 'escalate' if 'escalate' in message.lower() else 'submit'
                return IntakeResponse(
                    message=f"I have selected case {case_id} for you. To proceed with the {action_target}, please use the action panel on the case card.",
                    flow_id=current_flow or 'DISCOVERY',
                    stage=req.case_stage or 'INTAKE',
                    extracted_pills=[],
                    case_updates={},
                    field_statuses={},
                    facts_provenance=provenance,
                    dynamic_tabs=['track'],
                    conflicts=[],
                    completion_percentage=100,
                    section_progress={},
                    missing_required_fields=[],
                    next_question=None,
                    is_review_ready=False,
                    tokens_used=0,
                    cost_usd=0.0,
                    cost_inr=0.0,
                    elapsed_ms=get_elapsed_ms(),
                    correlation_id=cid,
                    ui_actions=[
                        UIAction(action='switch_primary_tab', target='track', label='Track Case'),
                        UIAction(action='select_case', target=case_id, label=f'Select Case {case_id}'),
                        UIAction(action='trigger_case_action', target=action_target, label=f'{action_target.title()} Case')
                    ],
                    tool_used="Case Action Handler"
                )
            else:
                return IntakeResponse(
                    message="I couldn't identify which case you want to take action on. Please specify the case number or select it on the Track tab.",
                    flow_id=current_flow or 'DISCOVERY',
                    stage='DISCOVERY',
                    extracted_pills=[],
                    case_updates={},
                    field_statuses={},
                    facts_provenance=provenance,
                    dynamic_tabs=['track'],
                    conflicts=[],
                    completion_percentage=0,
                    section_progress={},
                    missing_required_fields=[],
                    next_question=None,
                    is_review_ready=False,
                    tokens_used=0,
                    cost_usd=0.0,
                    cost_inr=0.0,
                    elapsed_ms=get_elapsed_ms(),
                    correlation_id=cid,
                    ui_actions=[]
                )

        if scope_decision == 'NON_CYBERCRIME':
            return IntakeResponse(
                message=deflection_msg,
                flow_id=current_flow or 'DISCOVERY',
                stage='DISCOVERY',
                extracted_pills=[],
                case_updates={},
                field_statuses={},
                facts_provenance=provenance,
                dynamic_tabs=['incident', 'review'],
                conflicts=[],
                completion_percentage=0,
                section_progress={},
                missing_required_fields=[],
                next_question="Please describe what cyber incident occurred.",
                is_review_ready=False,
                tokens_used=0,
                cost_usd=0.0,
                cost_inr=0.0,
                elapsed_ms=get_elapsed_ms(),
                correlation_id=cid,
                ui_actions=[]
            )

        if scope_decision == 'NAVIGATION':
            target_desc = ", ".join([a.label or a.target or a.action for a in nav_actions if a.action.startswith('switch') or a.action == 'select_case'])
            nav_msg = f"Navigating to {target_desc}." if target_desc else "Navigating as requested."
            base_tabs = FLOW_DEFINITIONS.get(current_flow, {}).get('base_tabs', ['incident', 'financial', 'suspect', 'evidence', 'review'])
            return IntakeResponse(
                message=nav_msg,
                flow_id=current_flow or 'DISCOVERY',
                stage=req.case_stage or 'INTAKE',
                extracted_pills=[],
                case_updates={},
                field_statuses={},
                facts_provenance=provenance,
                dynamic_tabs=base_tabs,
                conflicts=[],
                completion_percentage=0,
                section_progress={},
                missing_required_fields=[],
                next_question=None,
                is_review_ready=False,
                tokens_used=0,
                cost_usd=0.0,
                cost_inr=0.0,
                elapsed_ms=get_elapsed_ms(),
                correlation_id=cid,
                ui_actions=nav_actions
            )

        if scope_decision == 'INQUIRY':
            inq_resp, inq_tokens = await ResponseGenerator.answer_general_inquiry(
                user_message=req.message,
                flow_title=FLOW_DEFINITIONS.get(current_flow, {}).get('title', 'Cyber Incident'),
                conversation_history=req.conversation_history or []
            )
            base_tabs = FLOW_DEFINITIONS.get(current_flow, {}).get('base_tabs', ['incident', 'financial', 'suspect', 'evidence', 'review'])
            call_cost_usd = 0.0
            call_cost_inr = 0.0
            if inq_tokens > 0:
                usage = UsageTracker.record_usage(
                    model="gpt-4o-mini",
                    prompt_tokens=int(inq_tokens * 0.75),
                    completion_tokens=int(inq_tokens * 0.25)
                )
                call_cost_usd = usage.get("cost_usd", 0.0)
                call_cost_inr = usage.get("cost_inr", 0.0)

            return IntakeResponse(
                message=inq_resp,
                flow_id=current_flow or 'DISCOVERY',
                stage=req.case_stage or 'DISCOVERY',
                extracted_pills=[],
                case_updates={},
                field_statuses={},
                facts_provenance=provenance,
                dynamic_tabs=base_tabs,
                conflicts=[],
                completion_percentage=0,
                section_progress={},
                missing_required_fields=[],
                next_question="Would you like to file a complaint now?",
                is_review_ready=False,
                tokens_used=inq_tokens,
                cost_usd=call_cost_usd,
                cost_inr=call_cost_inr,
                elapsed_ms=get_elapsed_ms(),
                correlation_id=cid,
                ui_actions=nav_actions
            )

        if scope_decision == 'AMBIGUOUS':
            return IntakeResponse(
                message=deflection_msg,
                flow_id=current_flow or 'DISCOVERY',
                stage='DISCOVERY',
                extracted_pills=[],
                case_updates={},
                field_statuses={},
                facts_provenance=provenance,
                dynamic_tabs=['incident', 'review'],
                conflicts=[],
                completion_percentage=0,
                section_progress={},
                missing_required_fields=[],
                next_question="What cyber incident would you like to report today?",
                is_review_ready=False,
                tokens_used=0,
                cost_usd=0.0,
                cost_inr=0.0,
                elapsed_ms=get_elapsed_ms(),
                correlation_id=cid,
                ui_actions=[]
            )

        # ── STAGE 2: Decoupled Pure Fact Extraction ───────────────────
        flow_spec = FLOW_DEFINITIONS.get(current_flow, {}) if current_flow else {}
        missing_preview = flow_spec.get('question_priority', [])[:4]

        proposal, proposed_facts, pills, ack, tokens_used = await FactExtractor.extract(
            message=message,
            active_flow=current_flow,
            known_facts=current_state,
            missing_fields=missing_preview
        )

        # If user provided a detailed narrative (>= 6 words) and no description was extracted, capture it
        if not any(f.field == 'description' for f in proposed_facts) and len(message.split()) >= 6:
            from models import ProposedFact
            proposed_facts.append(ProposedFact(
                field='description',
                value=message,
                confidence=0.90,
                source='user_message'
            ))

        # ── STAGE 3: Verified Flow Classification & Transition ────────
        final_flow, did_switch = CaseStateMachine.validate_flow_transition(
            current_flow=current_flow,
            proposal=proposal,
            confidence_threshold=0.85
        )

        # ── STAGE 4: Non-Destructive State Reconciliation & Conflicts ─
        updated_state, updated_provenance, active_conflicts = CaseStateMachine.reconcile_facts(
            current_state=current_state,
            provenance_records=provenance,
            proposed_facts=proposed_facts,
            existing_conflicts=[]
        )

        # Reconcile attached evidence items without silent overwrites
        updated_provenance, active_conflicts = CaseStateMachine.reconcile_evidence(
            current_state=updated_state,
            provenance_records=updated_provenance,
            evidence_items=req.evidence_list or [],
            existing_conflicts=active_conflicts
        )

        # ── STAGE 5: Lifecycle Stage & Dynamic Tabs Evaluation ────────
        stage, completion_pct, sec_progress, missing_req = CaseStateMachine.evaluate_stage(
            flow_id=final_flow,
            current_state=updated_state,
            conflicts=active_conflicts,
            evidence_list=req.evidence_list or []
        )

        final_spec = FLOW_DEFINITIONS.get(final_flow, FLOW_DEFINITIONS.get('FINANCIAL_FRAUD', {}))
        base_tabs = list(final_spec.get('base_tabs', ['incident', 'review']))

        # Dynamic tab injection: If monetary loss detected in non-financial flow, inject 'financial'
        has_monetary_loss = updated_state.get('fraudAmount') is not None or updated_state.get('lostMoney') in (True, 'yes', 'true')
        if final_flow in ['PHISHING', 'OTHER_CYBERCRIME'] and has_monetary_loss:
            if 'financial' not in base_tabs:
                insert_idx = base_tabs.index('evidence') if 'evidence' in base_tabs else len(base_tabs)
                base_tabs.insert(insert_idx, 'financial')

        # ── STAGE 6: Hierarchical Question Planning Decision Engine ───
        planned_q = QuestionPlanner.plan_next_question(
            flow_id=final_flow,
            current_state=updated_state,
            conflicts=active_conflicts,
            evidence_list=req.evidence_list or []
        )

        # ── STAGE 7: Response Assembly & Contextual UI Actions ─────────
        case_updates: Dict[str, Any] = {}
        field_statuses: Dict[str, str] = {}
        ui_actions: List[UIAction] = []

        # Flow switch action
        if did_switch:
            ui_actions.append(UIAction(
                action='switch_flow',
                field='flowId',
                value=final_flow,
                label=final_spec.get('title', final_flow)
            ))

        # Diff against old state to emit set_field UI actions
        for k, v in updated_state.items():
            if current_state.get(k) != v:
                case_updates[k] = v
                field_statuses[k] = 'ai-captured'
                ui_actions.append(UIAction(
                    action='set_field',
                    field=k,
                    value=v
                ))

        # Contextual auto-navigation to form sub-tabs (Always ensure register primary tab is active)
        if any(f in case_updates for f in ['fraudAmount', 'bankName', 'utrNumber', 'paymentMode']):
            ui_actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))
            ui_actions.append(UIAction(action='switch_sub_tab', target='financial', label='Financial Details'))
            focus_f = 'fraudAmount' if 'fraudAmount' in case_updates else 'bankName'
            ui_actions.append(UIAction(action='focus_field', target=focus_f))
        elif any(f in case_updates for f in ['offenderHandle', 'socialPlatform']):
            ui_actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))
            ui_actions.append(UIAction(action='switch_sub_tab', target='platform', label='Platform Details'))
            ui_actions.append(UIAction(action='focus_field', target='offenderHandle'))
        elif any(f in case_updates for f in ['affectedService', 'recoveryChanged']):
            ui_actions.append(UIAction(action='switch_primary_tab', target='register', label='Register Complaint'))
            ui_actions.append(UIAction(action='switch_sub_tab', target='account', label='Affected Account'))
            ui_actions.append(UIAction(action='focus_field', target='affectedService'))

        # Synthesize conversational officer response with gpt-4o-mini
        conv_message, gen_tokens = await ResponseGenerator.generate_response(
            user_message=req.message,
            flow_title=final_spec.get('title', final_flow),
            case_updates=case_updates,
            planned_question=planned_q,
            conversation_history=req.conversation_history or []
        )
        tokens_used += gen_tokens
        final_message = conv_message

        # Telemetry calculation
        call_cost_usd = 0.0
        call_cost_inr = 0.0
        if tokens_used > 0:
            usage = UsageTracker.record_usage(
                model="gpt-4o-mini",
                prompt_tokens=int(tokens_used * 0.75),
                completion_tokens=int(tokens_used * 0.25)
            )
            call_cost_usd = usage.get("cost_usd", 0.0)
            call_cost_inr = usage.get("cost_inr", 0.0)

        # Deduplicate UI actions
        deduped_actions: List[UIAction] = []
        seen = set()
        for act in ui_actions:
            key = (act.action, act.target, act.field, str(act.value))
            if key not in seen:
                seen.add(key)
                deduped_actions.append(act)

        # Resolve category metadata for top-level frontend contract
        from flow_definitions import CATEGORY_LOOKUP
        cat_meta = CATEGORY_LOOKUP.get(final_flow, {})
        cat_id = cat_meta.get("id", final_flow)
        cat_label = cat_meta.get("label", final_spec.get("title", final_flow))
        parent_cat = cat_meta.get("parent", "Other Cyber Crime")
        is_fin = proposal.isFinancialFraud if proposal and proposal.isFinancialFraud is not None else cat_meta.get("isFinancial", False)
        urgency_val = proposal.urgency if proposal and proposal.urgency else cat_meta.get("defaultUrgency", "standard")
        is_da = bool(final_flow == "digital_arrest" or (proposal and proposal.isDigitalArrest))
        money_mvd = bool(proposal and proposal.moneyMoved) if proposal else False
        det_amt = proposal.detectedAmount if proposal else None
        if det_amt is None and 'fraudAmount' in updated_state:
            try:
                det_amt = float(str(updated_state['fraudAmount']).replace(',', ''))
            except Exception:
                pass

        return IntakeResponse(
            message=final_message,
            flow_id=final_flow,
            stage=stage,
            classification=proposal,
            categoryId=cat_id,
            categoryLabel=cat_label,
            parentCategory=parent_cat,
            isFinancialFraud=is_fin,
            urgency=urgency_val,
            detectedAmount=det_amt,
            moneyMoved=money_mvd,
            isDigitalArrest=is_da,
            reasoning=proposal.reason if proposal else None,
            extracted_pills=pills,
            case_updates=case_updates,
            field_statuses=field_statuses,
            facts_provenance=updated_provenance,
            dynamic_tabs=base_tabs,
            conflicts=active_conflicts,
            completion_percentage=completion_pct,
            section_progress=sec_progress,
            missing_required_fields=missing_req,
            next_question=planned_q.question_text,
            planned_question=planned_q,
            is_review_ready=(stage == 'READY_FOR_REVIEW'),
            tokens_used=tokens_used,
            cost_usd=call_cost_usd,
            cost_inr=call_cost_inr,
            elapsed_ms=get_elapsed_ms(),
            correlation_id=cid,
            ui_actions=deduped_actions
        )

