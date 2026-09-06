from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import json

from config import AI_PORT, AI_HOST, OPENAI_MODEL
from models import (
    IntakeRequest,
    IntakeResponse,
    TriageRequest,
    TriageResponse,
    ConflictResolutionRequest,
    ConflictResolutionResponse
)
from orchestrator import AIOrchestrator
from evidence_analyzer import analyze_evidence_file, scan_screenshot_with_vision
from scenarios import DEMO_SCENARIOS
from flow_definitions import CATEGORY_LOOKUP, CATEGORIES_METADATA
from extractors import FactExtractor

app = FastAPI(
    title="CasePilot AI Engine",
    description="Intelligent Cybercrime Intake, Triage & Forensics Engine powered by Python & OpenAI gpt-4o-mini",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CasePilot Python AI Engine",
        "model": OPENAI_MODEL,
        "categories_count": len(CATEGORIES_METADATA),
        "port": AI_PORT
    }

@app.post("/api/ai/triage", response_model=TriageResponse)
@app.post("/api/triage", response_model=TriageResponse)
async def triage_endpoint(req: TriageRequest):
    """
    Direct triage classification endpoint conforming to CasePilot frontend contract.
    Classifies free-text narratives into one of the 21 NCRP categories, detects
    urgency ('golden-hour' | 'urgent' | 'standard'), identifies 'isDigitalArrest'
    for emergency intercept, and extracts loss amount and moneyMoved flag.
    """
    narrative = req.narrative.strip()
    if not narrative:
        cat = CATEGORY_LOOKUP["other_cybercrime"]
        return TriageResponse(
            categoryId=cat["id"],
            categoryLabel=cat["label"],
            section=cat.get("section", "OTHER"),
            parentCategory=cat["parent"],
            subCategory=cat.get("subCategory", "General Cyber Offence"),
            isFinancialFraud=cat["isFinancial"],
            urgency=cat["defaultUrgency"],
            priorityDeskType=cat.get("priorityDeskType", "none"),
            statutoryCitations=cat.get("statutoryCitations", []),
            evidenceChecklist=cat.get("evidenceChecklist", []),
            detectedAmount=None,
            moneyMoved=False,
            reasoning="Empty input defaulted to general category.",
            isDigitalArrest=False,
            source="deterministic"
        )

    # Process via orchestrator to leverage 3-tier scope guard, OpenAI extraction, and local regex
    intake_resp = await AIOrchestrator.process_intake(IntakeRequest(message=narrative))

    cat_id = intake_resp.categoryId or intake_resp.flow_id or "other_cybercrime"
    known_cat = CATEGORY_LOOKUP.get(cat_id, CATEGORY_LOOKUP.get("other_cybercrime", {}))

    # Reconcile extracted fields dictionary
    extracted_fields = dict(intake_resp.case_updates or {})
    if intake_resp.detectedAmount is not None and "amount" not in extracted_fields:
        extracted_fields["amount"] = intake_resp.detectedAmount
    if "fraudAmount" in extracted_fields and "amount" not in extracted_fields:
        try:
            extracted_fields["amount"] = float(str(extracted_fields["fraudAmount"]).replace(",", ""))
        except Exception:
            pass
    if "beneficiaryAccount" in extracted_fields and "suspectAccount" not in extracted_fields:
        extracted_fields["suspectAccount"] = extracted_fields["beneficiaryAccount"]
    if "offenderHandle" in extracted_fields and "suspectHandle" not in extracted_fields:
        extracted_fields["suspectHandle"] = extracted_fields["offenderHandle"]

    return TriageResponse(
        categoryId=cat_id,
        categoryLabel=intake_resp.categoryLabel or known_cat.get("label", cat_id),
        section=known_cat.get("section", "OTHER"),
        parentCategory=intake_resp.parentCategory or known_cat.get("parent", "Other Cyber Crime"),
        subCategory=known_cat.get("subCategory", "General Cyber Offence"),
        isFinancialFraud=intake_resp.isFinancialFraud if intake_resp.isFinancialFraud is not None else known_cat.get("isFinancial", False),
        urgency=intake_resp.urgency or known_cat.get("defaultUrgency", "standard"),
        priorityDeskType=known_cat.get("priorityDeskType", "none"),
        statutoryCitations=known_cat.get("statutoryCitations", []),
        evidenceChecklist=known_cat.get("evidenceChecklist", []),
        detectedAmount=intake_resp.detectedAmount,
        moneyMoved=intake_resp.moneyMoved,
        reasoning=intake_resp.reasoning or "Classified by CasePilot AI engine.",
        isDigitalArrest=intake_resp.isDigitalArrest,
        source="ai" if intake_resp.tokens_used > 0 else "deterministic",
        extractedFields=extracted_fields,
        extractedPills=intake_resp.extracted_pills or []
    )

@app.post("/api/ai/intake", response_model=IntakeResponse)
async def intake_endpoint(req: IntakeRequest):
    """
    Main conversational intake endpoint.
    Processes user narrative, runs guardrails, extracts entities,
    merges state, determines dynamic tabs, calculates completeness,
    and returns single-turn next question.
    """
    return await AIOrchestrator.process_intake(req)

@app.post("/api/ai/check-image")
@app.post("/api/check-image")
async def check_image_endpoint(image: Optional[UploadFile] = File(None)):
    """
    Screenshot threat scanner endpoint using OpenAI gpt-4o vision.
    Extracts suspicious UPI VPAs, phone numbers, URLs, bank accounts, or remote access apps.
    """
    if not image:
        raise HTTPException(status_code=400, detail="No image provided")

    file_bytes = await image.read()
    mime_type = image.content_type or "image/jpeg"

    vision_data = await scan_screenshot_with_vision(file_bytes, mime_type)
    extracted_text = (vision_data.get("extracted") or "").strip()

    return {
        "extractedText": extracted_text,
        "type": vision_data.get("type", "other"),
        "amount": vision_data.get("amount"),
        "utr": vision_data.get("utr"),
        "bank": vision_data.get("bank"),
        "source": "gpt-4o-vision"
    }

@app.post("/api/ai/evidence/analyze")
async def analyze_evidence_endpoint(
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form(None),
    ocr_text: Optional[str] = Form(None),
    case_state_json: Optional[str] = Form(None)
):
    """
    Analyzes uploaded evidence document or OCR text.
    Computes SHA-256 hash and flags conflicts with reported caseState.
    """
    case_state = {}
    if case_state_json:
        try:
            case_state = json.loads(case_state_json)
        except Exception:
            pass

    resolved_filename = filename or (file.filename if file else "evidence_document.png")
    file_bytes = await file.read() if file else None
    file_type = file.content_type if file and file.content_type else "image/png"

    item, conflicts = await analyze_evidence_file(
        filename=resolved_filename,
        file_bytes=file_bytes,
        file_type=file_type,
        ocr_text=ocr_text,
        case_state=case_state
    )

    return {
        "evidenceItem": item.model_dump(),
        "conflicts": [c.model_dump() for c in conflicts]
    }

@app.post("/api/ai/conflict/resolve", response_model=ConflictResolutionResponse)
def resolve_conflict_endpoint(req: ConflictResolutionRequest):
    """
    Resolves an evidence discrepancy, updating the canonical caseState.
    """
    updated_state = dict(req.case_state)
    updated_state[req.field] = req.resolved_value

    return ConflictResolutionResponse(
        success=True,
        field=req.field,
        updated_value=req.resolved_value,
        case_updates={req.field: req.resolved_value}
    )

@app.get("/api/ai/scenarios")
def get_scenarios():
    """
    Lists pre-configured cybercrime scenario simulations.
    """
    return DEMO_SCENARIOS

@app.post("/api/ai/scenarios/run")
async def run_scenario_step(
    scenario_id: str = Form(...),
    turn_index: int = Form(0),
    case_state_json: Optional[str] = Form(None)
):
    """
    Executes a specific turn of a deterministic scenario simulation.
    """
    scen = next((s for s in DEMO_SCENARIOS if s["id"] == scenario_id), None)
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")

    turns = scen["turns"]
    if turn_index >= len(turns):
        raise HTTPException(status_code=400, detail="Turn index out of range")

    turn = turns[turn_index]
    existing_state = json.loads(case_state_json) if case_state_json else {}

    req = IntakeRequest(
        message=turn["user"],
        flow_id=scen.get("flowId", scen.get("categoryId")),
        case_state=existing_state
    )

    resp = await AIOrchestrator.process_intake(req)

    return {
        "scenarioId": scenario_id,
        "turnIndex": turn_index,
        "totalTurns": len(turns),
        "userMessage": turn["user"],
        "orchestratorResponse": resp.model_dump()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=AI_HOST, port=AI_PORT, reload=True)
