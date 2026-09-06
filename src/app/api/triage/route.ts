import { NextRequest, NextResponse } from "next/server";
import { classifyNarrative, TriageResult, CATEGORIES } from "@/lib/triage";
import { getOpenAiApiKey } from "@/lib/ai-config";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/triage
 * Accepts { narrative: string } and returns a TriageResult.
 *
 * When OPENAI_API_KEY is set, calls gpt-4o-mini for AI-assisted classification.
 * Falls back silently to the deterministic rule engine on error, timeout, or
 * when the key is not configured.
 */
export async function POST(req: NextRequest) {
  let narrative = "";
  try {
    const body = await req.json();
    narrative = (body.narrative ?? "").slice(0, 5000);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Try Python AI Engine path if running ──────────────────────────────────
  const aiEngineUrl = process.env.AI_ENGINE_URL || "http://127.0.0.1:8001";
  if (narrative.trim().length > 5) {
    try {
      const aiRes = await fetch(`${aiEngineUrl}/api/ai/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
        signal: AbortSignal.timeout(5000),
      });
      if (aiRes.ok) {
        const aiData: TriageResult = await aiRes.json();
        return NextResponse.json(aiData);
      }
    } catch {
      // AI Engine offline or timed out; continue to Next.js OpenAI path
    }
  }

  // ── Try OpenAI path ────────────────────────────────────────────────────────
  const apiKey = getOpenAiApiKey();
  if (apiKey && narrative.trim().length > 10) {
    try {
      const result = await classifyWithOpenAI(narrative, apiKey);
      if (result) return NextResponse.json(result);
    } catch (err) {
      console.warn("[/api/triage] OpenAI call failed, falling back to deterministic:", (err as Error).message);
    }
  }

  // ── Deterministic fallback ─────────────────────────────────────────────────
  const result: TriageResult = { ...classifyNarrative(narrative), source: "deterministic" };
  return NextResponse.json(result);
}

/**
 * Calls gpt-4o-mini to classify the narrative into one of the NCRP categories.
 * Returns null if classification is ambiguous or an error occurs.
 */
async function classifyWithOpenAI(narrative: string, apiKey: string): Promise<TriageResult | null> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey, timeout: 8000 });

  const categoryList = CATEGORIES.map(
    (c) => `  - id="${c.id}" | label="${c.label}" | parent="${c.parent}" | urgency="${c.defaultUrgency}"`
  ).join("\n");

  const systemPrompt = `You are a cybercrime classification and entity extraction assistant for India's NCRP (National Cyber Crime Reporting Portal).
Your job is to:
1. Classify a victim's narrative into one of the official 21 categories below.
2. Extract all concrete factual entities (bank name, amount, 12-digit UTR, suspect accounts, handles, contact numbers, channel, platform) into structured form boxes to auto-fill the complaint report for the victim.

CATEGORIES:
${categoryList}

Rules:
1. Reply ONLY with valid JSON matching the schema. No prose, no markdown.
2. If the narrative matches "digital_arrest" signals (CBI, ED, police calling about arrest, digital arrest, parcel contraband), always use "digital_arrest" and set "isDigitalArrest": true.
3. Extract loss amount in INR if mentioned; set to null if absent.
4. Extract 12-digit UTR, bank name (e.g. SBI, HDFC), suspect UPI/account (e.g. fraud@ybl), suspect mobile, suspect handle (@...), channel (WhatsApp, Telegram, Phone Call, SMS, APK, etc.).
5. Write "reasoning" as one plain-English sentence.
6. Set "moneyMoved" to true only if the victim explicitly says money was taken/sent/deducted/lost.

Schema:
{
  "categoryId": string,
  "categoryLabel": string,
  "parentCategory": string,
  "isFinancialFraud": boolean,
  "urgency": "standard" | "urgent" | "golden-hour",
  "detectedAmount": number | null,
  "moneyMoved": boolean,
  "reasoning": string,
  "isDigitalArrest": boolean,
  "extractedFields": {
    "bankName": string | null,
    "bankAccount": string | null,
    "suspectAccount": string | null,
    "suspectName": string | null,
    "suspectPhone": string | null,
    "suspectHandle": string | null,
    "suspectWebsite": string | null,
    "amount": number | null,
    "utrNumber": string | null,
    "paymentMode": "UPI" | "Net Banking" | "Credit/Debit Card" | "AEPS" | "Wallet" | "Other" | null,
    "channel": "WhatsApp" | "Telegram" | "Phone Call" | "SMS" | "Instagram" | "Fake Website" | "Malicious APK" | "Email" | "Other" | null,
    "incidentDate": string | null,
    "delayReason": string | null
  },
  "extractedPills": string[]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 450,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Classify and extract fields from this narrative:\n\n${narrative}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw);

  // Validate that the returned categoryId is known
  const known = CATEGORIES.find((c) => c.id === parsed.categoryId);
  if (!known) return null;

  const detAmount = parsed.detectedAmount ?? (parsed.extractedFields?.amount ? Number(parsed.extractedFields.amount) : undefined);

  // Clean and merge extracted fields
  const fields = { ...(parsed.extractedFields || {}) };
  if (detAmount && !fields.amount) fields.amount = detAmount;

  return {
    categoryId: parsed.categoryId,
    categoryLabel: parsed.categoryLabel ?? known.label,
    parentCategory: parsed.parentCategory ?? known.parent,
    isFinancialFraud: parsed.isFinancialFraud ?? known.isFinancial,
    urgency: parsed.urgency ?? known.defaultUrgency,
    detectedAmount: detAmount,
    moneyMoved: parsed.moneyMoved ?? false,
    reasoning: parsed.reasoning ?? "AI-classified.",
    isDigitalArrest: parsed.isDigitalArrest ?? parsed.categoryId === "digital_arrest",
    source: "ai",
    extractedFields: fields,
    extractedPills: parsed.extractedPills && parsed.extractedPills.length > 0 ? parsed.extractedPills : undefined,
  };
}
