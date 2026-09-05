import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, classifyNarrative } from "../src/lib/triage.ts";
import { formatEventGap, getSlaDetailLine } from "../src/lib/timeline.ts";

test("a gap between two events never reads as a point in time", () => {
  const d1 = new Date("2026-09-01T10:00:00Z");
  const d2 = new Date("2026-09-01T12:30:00Z");
  const d3 = new Date("2026-09-15T10:00:00Z");

  const gap1 = formatEventGap(d1, d2);
  const gap2 = formatEventGap(d1, d3);

  // Should never read like an absolute point in time (timestamp, clock time, or specific date)
  const pointInTimeRegex = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}|am|pm|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
  assert.strictEqual(pointInTimeRegex.test(gap1), false);
  assert.strictEqual(pointInTimeRegex.test(gap2), false);

  // Must contain duration units
  assert.match(gap1, /\b(hour|minute|day|second)s?\b/i);
  assert.match(gap2, /\b(hour|minute|day|second)s?\b/i);
});

test("the SLA detail line names the stage as a stage", () => {
  for (let stage = 1; stage <= 5; stage++) {
    const detailLine = getSlaDetailLine(stage);
    assert.match(detailLine, /\bStage\s+\d/i);
    assert.ok(detailLine.toLowerCase().includes("stage"));
  }
});

test("the taxonomy is internally consistent", () => {
  assert.ok(CATEGORIES.length > 0);
  const ids = new Set<string>();
  const validParents = new Set(["Financial Fraud", "Women/Children", "Other Cyber Crime"]);
  const validUrgencies = new Set(["standard", "urgent", "golden-hour"]);

  for (const cat of CATEGORIES) {
    assert.ok(cat.id && cat.id.trim().length > 0, "Category missing id");
    assert.ok(!ids.has(cat.id), `Duplicate category id: ${cat.id}`);
    ids.add(cat.id);

    assert.ok(cat.label && cat.label.trim().length > 0, `Category ${cat.id} missing label`);
    assert.ok(cat.description && cat.description.trim().length > 0, `Category ${cat.id} missing description`);
    assert.ok(validParents.has(cat.parent), `Invalid parent ${cat.parent} for category ${cat.id}`);
    assert.ok(validUrgencies.has(cat.defaultUrgency), `Invalid defaultUrgency ${cat.defaultUrgency} for category ${cat.id}`);

    if (cat.parent === "Financial Fraud") {
      assert.strictEqual(cat.isFinancial, true, `Financial Fraud category ${cat.id} must have isFinancial = true`);
    } else {
      assert.strictEqual(cat.isFinancial, false, `Category ${cat.id} under ${cat.parent} must have isFinancial = false`);
    }
  }
});

test("every category is reachable by its own most specific keyword", () => {
  const specificKeywords: Record<string, string> = {
    upi_fraud: "Someone sent a fake UPI collect request on PhonePe",
    net_banking: "Net banking phishing link compromised my credentials",
    card_fraud: "Unauthorized credit card ATM withdrawal and CVV skimmed",
    investment_scam: "Fake crypto trading app with high return promise",
    job_scam: "Part-time job YouTube like task scam on Telegram group",
    loan_app_scam: "Illegal loan app recovery agent extortion",
    sim_swap: "Fraudulent SIM swap and telecom fraud deactivated my SIM",
    child_safety: "Online child safety violation and CSAM abuse material",
    sextortion: "Video call blackmail sextortion demanding money for private photos",
    cyber_blackmail: "Cyber blackmailing and threatening harassment messages",
    cyber_stalking: "Persistent cyber stalking and online bullying",
    impersonation: "Impersonation using fake profile of a police officer",
    account_takeover: "Instagram account takeover and email hacked",
    malware_ransomware: "Device locked with malware ransomware attack and files encrypted",
    other_cybercrime: "Suspicious unauthorized activity not listed above",
  };

  for (const cat of CATEGORIES) {
    const input = specificKeywords[cat.id] || cat.label;
    const result = classifyNarrative(input);
    assert.strictEqual(result.categoryId, cat.id, `Expected category ${cat.id} for input: "${input}", but got ${result.categoryId}`);
  }
});

test("held-out phrasings reach the right category often enough", () => {
  const testPhrases = [
    { input: "Transferred 15000 to a scanner QR code for olx furniture and got blocked", expected: "upi_fraud" },
    { input: "Got a link via SMS saying electricity will be disconnected, clicked and account got debited", expected: "net_banking" },
    { input: "Joined a WhatsApp group promising 5000 daily for liking review tasks", expected: "job_scam" },
    { input: "Downloaded cash loan app, disbursed 3000 now abusing my mother and contacts", expected: "loan_app_scam" },
    { input: "Threatened to post morphed nude video call recording to my contacts unless I pay 20k", expected: "sextortion" },
    { input: "My card was with me in Delhi but transaction happened at ATM in London", expected: "card_fraud" },
    { input: "Someone created a counterfeit profile with my face on Facebook asking friends for money", expected: "impersonation" },
    { input: "Put 1 lakh into a Forex trading terminal recommended by Telegram mentor", expected: "investment_scam" },
    { input: "Computer showed red warning screen with phone number saying all hard disk data is encrypted", expected: "malware_ransomware" },
    { input: "Continuous threatening calls and abusive harassment on social media", expected: "cyber_blackmail" },
  ];

  let correct = 0;
  for (const item of testPhrases) {
    const res = classifyNarrative(item.input);
    if (res.categoryId === item.expected) {
      correct++;
    }
  }

  const accuracy = correct / testPhrases.length;
  assert.ok(accuracy >= 0.9, `Accuracy was ${accuracy * 100}%, expected >= 90%`);
});

test("a confident wrong answer never crosses into another parent", () => {
  const financialPhrases = [
    "Bank balance debited via UPI QR payment 5000",
    "Credit card CVV cloned at restaurant POS terminal",
    "Netbanking password entered on fake SBI phishing portal",
    "Stock market trading scheme lost 2 lakhs",
  ];

  for (const phrase of financialPhrases) {
    const res = classifyNarrative(phrase);
    assert.notStrictEqual(res.parentCategory, "Women/Children", `Financial phrase "${phrase}" crossed into Women/Children parent`);
    assert.strictEqual(res.parentCategory, "Financial Fraud");
  }

  const womenChildrenPhrases = [
    "Threatening to leak private photos and sextortion video",
    "Cyber stalking my location and sending abusive threats",
    "Online harassment and cyber blackmailing",
    "Child safety abuse and minor exploitation",
  ];

  for (const phrase of womenChildrenPhrases) {
    const res = classifyNarrative(phrase);
    assert.notStrictEqual(res.parentCategory, "Financial Fraud", `Women/Children phrase "${phrase}" crossed into Financial Fraud parent`);
    assert.strictEqual(res.parentCategory, "Women/Children");
  }
});

test("child-safety wording reaches the child-safety category", () => {
  const samples = [
    "Reporting online CSAM distribution group",
    "Online child abuse and exploitation of underage school minors",
    "Grooming and child safety concerns on social app",
  ];

  for (const sample of samples) {
    const res = classifyNarrative(sample);
    assert.strictEqual(res.categoryId, "child_safety");
    assert.strictEqual(res.parentCategory, "Women/Children");
  }
});

test("filler and greetings match nothing at all", () => {
  const fillers = [
    "Hello sir",
    "Good morning",
    "Hi",
    "Hey please help",
    "namaste",
    "test",
    "ok",
    "???",
    "   ",
  ];

  for (const filler of fillers) {
    const res = classifyNarrative(filler);
    assert.strictEqual(res.categoryId, "other_cybercrime");
    assert.strictEqual(res.isFinancialFraud, false);
    assert.strictEqual(res.moneyMoved, false);
    assert.strictEqual(res.urgency, "standard");
  }
});

test("classification is deterministic", () => {
  const text = "Received an unknown call, sent 12345 rupees via UPI within the last hour";
  const baseline = classifyNarrative(text);

  for (let i = 0; i < 50; i++) {
    const current = classifyNarrative(text);
    assert.strictEqual(current.categoryId, baseline.categoryId);
    assert.strictEqual(current.parentCategory, baseline.parentCategory);
    assert.strictEqual(current.urgency, baseline.urgency);
    assert.strictEqual(current.isFinancialFraud, baseline.isFinancialFraud);
    assert.strictEqual(current.detectedAmount, baseline.detectedAmount);
    assert.strictEqual(current.moneyMoved, baseline.moneyMoved);
  }
});

test("classifying does not choke on hostile input", () => {
  const hostileCases: any[] = [
    null,
    undefined,
    "",
    "   ",
    "<script>alert('xss')</script>",
    "'; DROP TABLE complaints; --",
    "A".repeat(100000),
    "\x00\x00\x01\x02",
    "🎉🔥💻🔒🛡️".repeat(200),
    12345,
    { foo: "bar" },
  ];

  for (const hostile of hostileCases) {
    assert.doesNotThrow(() => {
      const res = classifyNarrative(hostile);
      assert.ok(res && typeof res.categoryId === "string");
    });
  }
});
