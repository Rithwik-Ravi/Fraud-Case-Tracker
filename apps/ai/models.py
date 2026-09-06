import time
from typing import Dict, Any, List, Optional, Literal, Union
from pydantic import BaseModel, Field

# Flow ID supports the 21 NCRP categories, macro names, and DISCOVERY
FlowId = str

CaseStage = Literal[
    'DISCOVERY',
    'CLASSIFIED',
    'INTAKE',
    'NEEDS_INFORMATION',
    'EVIDENCE_REVIEW',
    'CONFLICT_RESOLUTION',
    'READY_FOR_REVIEW',
    'SUBMITTED'
]

class FactProvenance(BaseModel):
    """Tracks origin, confirmation status, and confidence of every extracted fact."""
    field: str
    value: Any
    source: Literal['user_message', 'evidence_ocr', 'api_lookup', 'user_edit'] = 'user_message'
    confidence: float = 1.0
    confirmed: bool = True
    evidence_id: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)
    raw_quote: Optional[str] = None

class ProposedFact(BaseModel):
    """Fact extracted by LLM or regex before state reconciliation."""
    field: str
    value: Any
    confidence: float = 0.9
    source: str = "user_message"
    raw_quote: Optional[str] = None

class ClassificationProposal(BaseModel):
    """Category classification proposed by LLM or local classifier with confidence."""
    flow: str
    subtype: Optional[str] = None
    confidence: float = 0.0
    reason: Optional[str] = None
    categoryId: Optional[str] = None
    categoryLabel: Optional[str] = None
    parentCategory: Optional[str] = None
    isFinancialFraud: Optional[bool] = None
    urgency: Optional[Literal['standard', 'urgent', 'golden-hour']] = None
    detectedAmount: Optional[float] = None
    moneyMoved: bool = False
    isDigitalArrest: bool = False

class PlannedQuestion(BaseModel):
    """Structured decision output from the Question Planning Engine."""
    target_field: Optional[str] = None
    priority_tier: Literal['conflict', 'required', 'conditional', 'evidence', 'optional', 'review_ready']
    question_text: str
    rationale: Optional[str] = None

class FieldConflict(BaseModel):
    id: str
    field: str
    reportedValue: str
    evidenceValue: str
    resolved: bool = False
    resolvedValue: Optional[str] = None
    sourceFile: Optional[str] = None
    explanation: Optional[str] = None

class EvidenceItem(BaseModel):
    id: str
    name: str
    size: int
    type: str
    category: str
    sha256: str
    uploadedAt: str
    extractedMetadata: Optional[Dict[str, Any]] = None

class ConversationTurn(BaseModel):
    role: Literal['user', 'assistant', 'system']
    text: str
    timestamp: Optional[str] = None

class UIAction(BaseModel):
    action: Literal[
        'set_field',
        'switch_flow',
        'flag_conflict',
        'request_evidence',
        'update_tab',
        'mark_complete',
        'switch_primary_tab',
        'switch_sub_tab',
        'select_case',
        'trigger_case_action',
        'navigate_url',
        'focus_field',
        'trigger_cta',
        'digital_arrest_alert'
    ]
    field: Optional[str] = None
    value: Optional[Any] = None
    label: Optional[str] = None
    target: Optional[str] = None

class IntakeRequest(BaseModel):
    message: str
    flow_id: Optional[str] = None  # None indicates initial DISCOVERY stage
    case_stage: Optional[CaseStage] = 'DISCOVERY'
    case_state: Dict[str, Any] = Field(default_factory=dict)
    conversation_history: List[ConversationTurn] = Field(default_factory=list)
    evidence_list: List[EvidenceItem] = Field(default_factory=list)
    active_tab: Optional[str] = None
    correlation_id: Optional[str] = None
    facts_provenance: Dict[str, FactProvenance] = Field(default_factory=dict)
    current_ui_location: Optional[Dict[str, Any]] = Field(default_factory=dict)
    tracked_cases: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    recent_actions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class IntakeResponse(BaseModel):
    message: str
    flow_id: str
    stage: CaseStage = 'INTAKE'
    classification: Optional[ClassificationProposal] = None
    # Harmonized frontend contract fields
    categoryId: Optional[str] = None
    categoryLabel: Optional[str] = None
    parentCategory: Optional[str] = None
    isFinancialFraud: Optional[bool] = None
    urgency: Optional[Literal['standard', 'urgent', 'golden-hour']] = None
    detectedAmount: Optional[float] = None
    moneyMoved: bool = False
    isDigitalArrest: bool = False
    reasoning: Optional[str] = None

    extracted_pills: List[str] = Field(default_factory=list)
    case_updates: Dict[str, Any] = Field(default_factory=dict)
    field_statuses: Dict[str, str] = Field(default_factory=dict)
    facts_provenance: Dict[str, FactProvenance] = Field(default_factory=dict)
    dynamic_tabs: List[str] = Field(default_factory=list)
    conflicts: List[FieldConflict] = Field(default_factory=list)
    completion_percentage: int = 0
    section_progress: Dict[str, int] = Field(default_factory=dict)
    missing_required_fields: List[str] = Field(default_factory=list)
    next_question: Optional[str] = None
    planned_question: Optional[PlannedQuestion] = None
    is_review_ready: bool = False
    tokens_used: int = 0
    cost_usd: Optional[float] = 0.0
    cost_inr: Optional[float] = 0.0
    elapsed_ms: Optional[float] = 0.0
    correlation_id: Optional[str] = None
    ui_actions: List[UIAction] = Field(default_factory=list)
    tool_used: Optional[str] = None

class TriageRequest(BaseModel):
    narrative: str

class TriageResponse(BaseModel):
    categoryId: str
    categoryLabel: str
    parentCategory: str
    isFinancialFraud: bool
    urgency: Literal['standard', 'urgent', 'golden-hour']
    detectedAmount: Optional[float] = None
    moneyMoved: bool = False
    reasoning: str
    isDigitalArrest: bool = False
    source: Literal['ai', 'deterministic'] = 'ai'
    extractedFields: Dict[str, Any] = Field(default_factory=dict)
    extractedPills: List[str] = Field(default_factory=list)

class ConflictResolutionRequest(BaseModel):
    conflict_id: str
    field: str
    resolved_value: str
    case_state: Dict[str, Any] = Field(default_factory=dict)

class ConflictResolutionResponse(BaseModel):
    success: bool
    field: str
    updated_value: str
    case_updates: Dict[str, Any]
