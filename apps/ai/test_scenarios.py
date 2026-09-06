import asyncio
import sys

# Configure UTF-8 for console output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from orchestrator import AIOrchestrator
from models import IntakeRequest, TriageRequest
from evidence_analyzer import analyze_evidence_file
from question_planner import QuestionPlanner
from scope_classifier import ScopeClassifier

async def run_tests():
    print("==================================================")
    print("RUNNING CASEPILOT AI ENGINE TEST SUITE (21 CATEGORIES)")
    print("==================================================")

    passed = 0
    failed = 0

    # ── TEST 1: 3-Tier Scope Guardrails ───────────────────────────
    print("\n[TEST 1] Scope Guardrails (Off-topic query deflection with 0 tokens)...")
    req1 = IntakeRequest(message="What is the capital of France?")
    res1 = await AIOrchestrator.process_intake(req1)
    if "cybercrime" in res1.message.lower() and res1.tokens_used == 0:
        print("  [PASS] Tier 1 Guardrail caught off-topic query without LLM token cost.")
        passed += 1
    else:
        print(f"  [FAIL] Guardrail failed. Response: {res1.message}")
        failed += 1

    # ── TEST 2: Digital Arrest Emergency Circuit Breaker ────────────
    print("\n[TEST 2] Digital Arrest Circuit Breaker Intercept...")
    req2 = IntakeRequest(message="CBI officer Sharma is on video call telling me my Aadhaar is in money laundering and I am under digital arrest.")
    res2 = await AIOrchestrator.process_intake(req2)
    has_circuit_breaker_action = any(a.target == '/digital-arrest' for a in res2.ui_actions)
    if res2.isDigitalArrest and res2.categoryId == "digital_arrest" and has_circuit_breaker_action:
        print(f"  [PASS] Digital arrest detected: categoryId={res2.categoryId}, isDigitalArrest={res2.isDigitalArrest}")
        print(f"  [PASS] Circuit breaker UI action generated: target=/digital-arrest")
        passed += 1
    else:
        print(f"  [FAIL] Digital arrest intercept failed: cat={res2.categoryId}, da={res2.isDigitalArrest}, actions={res2.ui_actions}")
        failed += 1

    # ── TEST 3: Fact Extraction with Provenance (UPI Fraud) ────────
    print("\n[TEST 3] Fact Extraction & Provenance Tracking (UPI Fraud)...")
    req3 = IntakeRequest(
        message="I got a call from someone pretending to be from SBI. They sent me a KYC link and I entered my details. Later ₹75,000 was debited.",
        flow_id="upi_fraud"
    )
    res3 = await AIOrchestrator.process_intake(req3)
    updates = res3.case_updates
    prov = res3.facts_provenance
    has_amount_prov = 'fraudAmount' in prov and prov['fraudAmount'].confirmed and prov['fraudAmount'].source == 'user_message'
    has_bank_prov = 'bankName' in prov and prov['bankName'].value == 'State Bank of India'

    if str(updates.get('fraudAmount')) == '75000' and updates.get('bankName') == 'State Bank of India' and has_amount_prov and has_bank_prov:
        print(f"  [PASS] Extracted Amount: Rs {updates.get('fraudAmount')} (Conf: {prov['fraudAmount'].confidence}), Bank: {updates.get('bankName')}")
        print(f"  [PASS] Fact Provenance verified: source={prov['fraudAmount'].source}, confirmed={prov['fraudAmount'].confirmed}")
        print(f"  [PASS] Frontend Contract: categoryId={res3.categoryId}, urgency={res3.urgency}, moneyMoved={res3.moneyMoved}")
        passed += 1
    else:
        print(f"  [FAIL] Extraction or provenance failed: {updates}, prov: {prov}")
        failed += 1

    # ── TEST 4: Job Scam / Task Scam Classification ─────────────────
    print("\n[TEST 4] Task / Part-Time Job Scam Classification...")
    req4 = IntakeRequest(
        message="I paid ₹40,000 in a Telegram task group for liking YouTube videos and now they locked my account."
    )
    res4 = await AIOrchestrator.process_intake(req4)
    if res4.categoryId in ["job_scam", "task_scam"] and res4.isFinancialFraud:
        print(f"  [PASS] Correctly classified as {res4.categoryId}, isFinancial={res4.isFinancialFraud}, loss={res4.case_updates.get('fraudAmount')}")
        passed += 1
    else:
        print(f"  [FAIL] Job scam classification failed: category={res4.categoryId}")
        failed += 1

    # ── TEST 5: Courier / Parcel Scam Classification ────────────────
    print("\n[TEST 5] Courier / Customs Parcel Scam Classification...")
    req5 = IntakeRequest(
        message="I received a call from FedEx saying an illegal parcel seized at customs has drugs in my name and demanded ₹50,000 penalty."
    )
    res5 = await AIOrchestrator.process_intake(req5)
    if res5.categoryId in ["courier_parcel_scam", "digital_arrest"] and res5.urgency in ["urgent", "golden-hour"]:
        print(f"  [PASS] Correctly identified parcel threat: category={res5.categoryId}, urgency={res5.urgency}")
        passed += 1
    else:
        print(f"  [FAIL] Courier scam failed: {res5.categoryId}")
        failed += 1

    # ── TEST 6: Fast Navigation Actions (Frontend Routes) ─────────
    print("\n[TEST 6] Fast Route Navigation (0 tokens)...")
    nav_actions = ScopeClassifier.detect_navigation("check suspect upi id")
    has_check_route = any(a.target == '/check' for a in nav_actions)
    nav_track = ScopeClassifier.detect_navigation("track case ACK-2026-10294")
    has_track_route = any('ACK-2026-10294' in (a.target or '') for a in nav_track)

    if has_check_route and has_track_route:
        print("  [PASS] Successfully mapped natural query to /check and /track?ack=ACK-2026-10294")
        passed += 1
    else:
        print(f"  [FAIL] Route navigation failed: check={has_check_route}, track={has_track_route}")
        failed += 1

    # ── TEST 7: Evidence Forensics (SHA-256 & Conflict Detection) ──
    print("\n[TEST 7] Evidence Forensics & Conflict Detection...")
    item, conflicts = await analyze_evidence_file(
        filename="bank_statement_sbi.png",
        file_bytes=b"Sample simulated bank transaction receipt bytes for SHA-256 integrity",
        ocr_text="State Bank of India. Transaction Successful. Amount: Rs 52,000. UTR: 418293847291.",
        case_state={"fraudAmount": "75000", "bankName": "State Bank of India"}
    )
    has_sha256 = len(item.sha256) == 64
    has_amt_conflict = len(conflicts) > 0 and conflicts[0].field == 'fraudAmount'

    if has_sha256 and has_amt_conflict:
        print(f"  [PASS] Cryptographic SHA-256 generated: {item.sha256[:16]}...")
        print(f"  [PASS] Conflict caught: reported ₹75,000 vs evidence ₹52,000")
        passed += 1
    else:
        print(f"  [FAIL] Forensic analysis failed: sha256={has_sha256}, conflicts={conflicts}")
        failed += 1

    # ── TEST 8: Question Planning for Banking Freeze ───────────────
    print("\n[TEST 8] Statutory Question Planning for Banking Freeze...")
    pq = QuestionPlanner.plan_next_question(
        flow_id="upi_fraud",
        current_state={"fraudAmount": "75000", "bankName": "HDFC Bank"},
        conflicts=[],
        evidence_list=[]
    )
    # Next missing required field in question_priority after amount & bank is utrNumber
    if pq.target_field == "utrNumber":
        print(f"  [PASS] Question planner correctly prioritized statutory UTR: '{pq.question_text}'")
        passed += 1
    else:
        print(f"  [FAIL] Question planner prioritized wrong field: {pq.target_field}")
        failed += 1

    print("\n==================================================")
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("==================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_tests())
