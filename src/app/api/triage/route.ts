import { NextRequest, NextResponse } from "next/server";
import { classifyNarrative, TriageResult, CATEGORIES } from "@/lib/triage";

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
  const aiEngineUrl = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";
  if (narrative.trim().length > 5) {
    try {
      const aiRes = await fetch(`${aiEngineUrl}/api/ai/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
        signal: AbortSignal.timeout(4000),
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
  const apiKey = process.env.OPENAI_API_KEY;
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

  const systemPrompt = `You are a cybercrime classification assistant for India's NCRP (National Cyber Crime Reporting Portal).
Your job is to classify a victim's free-text narrative into one of the official categories below.

CATEGORIES:
${categoryList}

Rules:
1. Reply ONLY with valid JSON matching the schema. No prose, no markdown.
2. If the narrative matches "digital_arrest" signals (CBI, ED, police calling about arrest, digital arrest), always use that category.
3. Extract a loss amount in INR if mentioned; set to null if absent.
4. Write "reasoning" as one plain-English sentence a non-expert citizen can understand.
5. Set "moneyMoved" to true only if the victim explicitly says money was taken/sent/deducted.

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
  "isDigitalArrest": boolean
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 350,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Classify this narrative:\n\n${narrative}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw);

  // Validate that the returned categoryId is known
  const known = CATEGORIES.find((c) => c.id === parsed.categoryId);
  if (!known) return null;

  return {
    categoryId: parsed.categoryId,
    categoryLabel: parsed.categoryLabel ?? known.label,
    parentCategory: parsed.parentCategory ?? known.parent,
    isFinancialFraud: parsed.isFinancialFraud ?? known.isFinancial,
    urgency: parsed.urgency ?? known.defaultUrgency,
    detectedAmount: parsed.detectedAmount ?? undefined,
    moneyMoved: parsed.moneyMoved ?? false,
    reasoning: parsed.reasoning ?? "AI-classified.",
    isDigitalArrest: parsed.isDigitalArrest ?? parsed.categoryId === "digital_arrest",
    source: "ai",
  };
}
