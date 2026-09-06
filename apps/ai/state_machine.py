"""
State Machine & Fact Provenance Reconciliation Engine for CasePilot.
Enforces explicit case stages, non-destructive fact merging, conflict spawning,
and verified category transitions.
"""

import time
import uuid
from typing import Dict, Any, List, Optional, Tuple
from models import (
    CaseStage,
    FlowId,
    FactProvenance,
    ProposedFact,
    FieldConflict,
    ClassificationProposal,
    EvidenceItem
)
from flow_definitions import FLOW_DEFINITIONS

class CaseStateMachine:
    """
    Coordinates lifecycle transitions and state invariants:
    DISCOVERY -> CLASSIFIED -> INTAKE -> NEEDS_INFORMATION ->
    EVIDENCE_REVIEW -> CONFLICT_RESOLUTION -> READY_FOR_REVIEW -> SUBMITTED
    """

    @staticmethod
    def validate_flow_transition(
        current_flow: Optional[str],
        proposal: Optional[ClassificationProposal],
        confidence_threshold: float = 0.85
    ) -> Tuple[str, bool]:
        """
        Guards flow transitions. Only permits switching if:
        1. Current flow is None or 'DISCOVERY', OR
        2. Proposal confidence >= threshold (default 0.85)
        Returns (new_flow_id, did_transition)
        """
        if not proposal or not proposal.flow:
            return current_flow or 'DISCOVERY', False

        target = proposal.flow
        if target not in FLOW_DEFINITIONS and target != 'DISCOVERY':
            return current_flow or 'DISCOVERY', False

        # Transition allowed if initial discovery
        if not current_flow or current_flow == 'DISCOVERY':
            return target, True

        # Transition allowed if current flow unchanged
        if target == current_flow:
            return current_flow, False

        # Controlled transition: Require high confidence
        if proposal.confidence >= confidence_threshold:
            return target, True

        # Reject untrusted change
        return current_flow, False

    @staticmethod
    def normalize_value(val: Any) -> str:
        """Normalizes values for conflict comparison."""
        if val is None:
            return ""
        s = str(val).strip().replace(',', '').replace('₹', '').replace('rs.', '').replace('inr', '').strip()
        # Attempt float normalization
        try:
            f = float(s)
            if f.is_integer():
                return str(int(f))
            return str(f)
        except ValueError:
            return s.lower()

    @classmethod
    def reconcile_facts(
        cls,
        current_state: Dict[str, Any],
        provenance_records: Dict[str, FactProvenance],
        proposed_facts: List[ProposedFact],
        existing_conflicts: List[FieldConflict]
    ) -> Tuple[Dict[str, Any], Dict[str, FactProvenance], List[FieldConflict]]:
        """
        Non-destructive fact reconciliation:
        - If field is new: Accept and attach provenance.
        - If field is identical: Re-confirm & update confidence.
        - If field contradicts: DO NOT OVERWRITE. Generate FieldConflict.
        """
        updated_state = dict(current_state)
        updated_provenance = dict(provenance_records)
        active_conflicts = list(existing_conflicts)
        conflict_fields = {c.field for c in active_conflicts if not c.resolved}

        for prop in proposed_facts:
            field = prop.field
            new_val = prop.value
            if new_val in (None, '', [], {}):
                continue

            clean_new = cls.normalize_value(new_val)

            # Case A: Field does not exist in canonical state
            if field not in updated_state or updated_state[field] in (None, ''):
                updated_state[field] = new_val
                updated_provenance[field] = FactProvenance(
                    field=field,
                    value=new_val,
                    source='user_message',
                    confidence=prop.confidence,
                    confirmed=True,
                    timestamp=time.time(),
                    raw_quote=prop.raw_quote
                )
                continue

            # Case B: Field already exists
            existing_val = updated_state[field]
            clean_existing = cls.normalize_value(existing_val)

            if clean_new == clean_existing:
                # Values match: Increase confidence & update timestamp
                current_prov = updated_provenance.get(field)
                if current_prov:
                    current_prov.confidence = max(current_prov.confidence, prop.confidence)
                    current_prov.timestamp = time.time()
                continue

            # Case C: Discrepancy detected (Contradiction)
            # NEVER silently overwrite! Flag conflict.
            if field not in conflict_fields:
                conflict = FieldConflict(
                    id=f"cnf-{field}-{uuid.uuid4().hex[:6]}",
                    field=field,
                    reportedValue=str(existing_val),
                    evidenceValue=str(new_val),
                    resolved=False,
                    sourceFile="User Dialogue Amendment",
                    explanation=f"Citizen previously stated '{existing_val}', but later indicated '{new_val}'."
                )
                active_conflicts.append(conflict)
                conflict_fields.add(field)

        return updated_state, updated_provenance, active_conflicts

    @classmethod
    def reconcile_evidence(
        cls,
        current_state: Dict[str, Any],
        provenance_records: Dict[str, FactProvenance],
        evidence_items: List[EvidenceItem],
        existing_conflicts: List[FieldConflict]
    ) -> Tuple[Dict[str, FactProvenance], List[FieldConflict]]:
        """
        Reconciles document/OCR evidence against canonical user statements without destructive overwrite.
        """
        updated_provenance = dict(provenance_records)
        active_conflicts = list(existing_conflicts)
        conflict_fields = {c.field for c in active_conflicts if not c.resolved}

        for ev in evidence_items:
            meta = ev.extractedMetadata or {}
            for field, ev_val in meta.items():
                if field in current_state and current_state[field]:
                    norm_curr = cls.normalize_value(current_state[field])
                    norm_ev = cls.normalize_value(ev_val)

                    if norm_curr != norm_ev and field not in conflict_fields:
                        active_conflicts.append(FieldConflict(
                            id=f"cnf-{field}-{ev.id[:6]}",
                            field=field,
                            reportedValue=str(current_state[field]),
                            evidenceValue=str(ev_val),
                            resolved=False,
                            sourceFile=ev.name,
                            explanation=f"Attached {ev.name} records {ev_val}, whereas complaint draft states {current_state[field]}."
                        ))
                        conflict_fields.add(field)
                elif ev_val:
                    # Capture evidence provenance for fields not yet reported
                    updated_provenance[f"evidence_{field}"] = FactProvenance(
                        field=field,
                        value=ev_val,
                        source='evidence_ocr',
                        confidence=0.92,
                        confirmed=False,
                        evidence_id=ev.id,
                        timestamp=time.time()
                    )

        return updated_provenance, active_conflicts

    @classmethod
    def evaluate_stage(
        cls,
        flow_id: str,
        current_state: Dict[str, Any],
        conflicts: List[FieldConflict],
        evidence_list: List[EvidenceItem]
    ) -> Tuple[CaseStage, int, Dict[str, int], List[str]]:
        """
        Computes the current lifecycle stage, completion percentage, and missing statutory requirements.
        """
        if flow_id == 'DISCOVERY' or flow_id not in FLOW_DEFINITIONS:
            return 'DISCOVERY', 0, {}, []

        unresolved_conflicts = [c for c in conflicts if not c.resolved]
        if unresolved_conflicts:
            return 'CONFLICT_RESOLUTION', 0, {}, []

        flow_spec = FLOW_DEFINITIONS[flow_id]
        sections = flow_spec['sections']
        required_fields: List[str] = []
        filled_count = 0
        section_progress: Dict[str, int] = {}

        for sec_key, sec_data in sections.items():
            req_list = sec_data.get('required', [])
            required_fields.extend(req_list)
            
            sec_total = len(req_list)
            sec_filled = 0
            for f in req_list:
                val = current_state.get(f)
                if val is not None and str(val).strip() != '':
                    sec_filled += 1

            if sec_total > 0:
                section_progress[sec_key] = int((sec_filled / sec_total) * 100)
            else:
                section_progress[sec_key] = 100

        missing_required = [
            f for f in required_fields
            if current_state.get(f) is None or str(current_state.get(f)).strip() == ''
        ]

        total_req = len(required_fields)
        filled_count = total_req - len(missing_required)
        completion_pct = int((filled_count / total_req) * 100) if total_req > 0 else 100

        # Stage calculation
        if completion_pct == 0:
            stage: CaseStage = 'CLASSIFIED'
        elif len(missing_required) > 0:
            stage = 'NEEDS_INFORMATION'
        elif len(evidence_list) == 0 and flow_spec.get('evidence_rules', {}).get('recommended_types'):
            stage = 'EVIDENCE_REVIEW'
        else:
            stage = 'READY_FOR_REVIEW'

        return stage, completion_pct, section_progress, missing_required
