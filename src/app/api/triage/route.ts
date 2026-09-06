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
        const matchedCat = CATEGORIES.find((c) => c.id === aiData.categoryId) || CATEGORIES[0];
        aiData.section = aiData.section || matchedCat.section;
        aiData.subCategory = aiData.subCategory || matchedCat.subCategory;
        aiData.priorityDeskType = aiData.priorityDeskType || matchedCat.priorityDeskType;
        aiData.statutoryCitations = aiData.statutoryCitations || matchedCat.statutoryCitations;
        aiData.evidenceChecklist = aiData.evidenceChecklist || matchedCat.evidenceChecklist;

        // Augment extractedFields with deterministic regex for aliases (Hindi/English), bank names, and dates
        const fallbackFields = classifyNarrative(narrative).extractedFields || {};
        aiData.extractedFields = {
          ...fallbackFields,
          ...(aiData.extractedFields || {}),
        };
        // Ensure suspectName is populated if missing from python response
        if (!aiData.extractedFields.suspectName && fallbackFields.suspectName) {
          aiData.extractedFields.suspectName = fallbackFields.suspectName;
        }
        if (!aiData.extractedFields.bankName && fallbackFields.bankName) {
          aiData.extractedFields.bankName = fallbackFields.bankName;
        }
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
    (c) => `  - id="${c.id}" | section="${c.section}" | parent="${c.parent}" | label="${c.label}" | subCategory="${c.subCategory}" | urgency="${c.defaultUrgency}"`
  ).join("\n");

  const systemPrompt = `You are a cybercrime classification and entity extraction assistant for India's NCRP (National Cyber Crime Reporting Portal).
Your job is to:
1. Classify a victim's narrative into EXACTLY ONE of the official NCRP categories across the 3 pillars:
   - Women/Children Related Crime (WOMEN_CHILDREN)
   - Financial Fraud (FINANCIAL)
   - Other Cyber Crime (OTHER)
2. Extract all concrete factual entities into structured fields to auto-fill the complaint report.
   - Common fields: suspectName, suspectPhone, suspectEmail, suspectHandle, suspectWebsite, channel, incidentDate, delayReason.
   - Financial fraud: bankName, bankAccount, suspectAccount (UPI/A/C), amount (INR), utrNumber (12-digit), paymentMode.
   - Cryptocurrency: cryptoNetwork (BTC, ETH, TRON, SOL), victimWallet, suspectWallet, transactionHash (0x...), cryptoExchange.
   - Ransomware / Hacking: encryptedExtension (e.g. .locked), ransomNoteFile, ransomDemanded, ransomWalletAddress, targetDomain, serverIp, defacerHandle.
   - Social media: imposterUrl, genuineUrl, socialPlatform, defamationType.
   - Mobile: maliciousApkName (.apk), deviceType, telecomOperator.
   - Women/Children: harassmentMedium (Video call, DM), threatenedContent, extortionDemand.

CATEGORIES:
${categoryList}

Rules:
1. Reply ONLY with valid JSON matching the schema. No prose, no markdown.
2. If narrative matches "digital_arrest" signals (CBI, ED, police calling about arrest, digital arrest, parcel contraband), always classify as "digital_arrest" and set "isDigitalArrest": true.
3. Extract loss amount in INR if mentioned; set to null if absent.
4. Set "moneyMoved": true only if victim explicitly confirms money was debited/sent/lost.
5. Write "reasoning" as one concise plain-English sentence.

Schema:
{
  "categoryId": string,
  "categoryLabel": string,
  "section": "WOMEN_CHILDREN" | "FINANCIAL" | "OTHER",
  "parentCategory": "Women/Children" | "Financial Fraud" | "Other Cyber Crime",
  "subCategory": string,
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
    "suspectEmail": string | null,
    "suspectHandle": string | null,
    "suspectWebsite": string | null,
    "amount": number | null,
    "utrNumber": string | null,
    "paymentMode": string | null,
    "channel": string | null,
    "incidentDate": string | null,
    "delayReason": string | null,
    "cryptoNetwork": string | null,
    "victimWallet": string | null,
    "suspectWallet": string | null,
    "transactionHash": string | null,
    "cryptoExchange": string | null,
    "encryptedExtension": string | null,
    "ransomNoteFile": string | null,
    "ransomDemanded": string | null,
    "ransomWalletAddress": string | null,
    "targetDomain": string | null,
    "serverIp": string | null,
    "defacerHandle": string | null,
    "imposterUrl": string | null,
    "genuineUrl": string | null,
    "socialPlatform": string | null,
    "maliciousApkName": string | null,
    "harassmentMedium": string | null,
    "threatenedContent": string | null,
    "extortionDemand": string | null
  },
  "extractedPills": string[]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Classify and extract fields from this narrative:\n\n${narrative}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw);

  // Validate that the returned categoryId is known
  const known = CATEGORIES.find((c) => c.id === parsed.categoryId) || CATEGORIES[0];

  const detAmount = parsed.detectedAmount ?? (parsed.extractedFields?.amount ? Number(parsed.extractedFields.amount) : undefined);

  // Clean and merge extracted fields
  const fields = { ...(parsed.extractedFields || {}) };
  if (detAmount && !fields.amount) fields.amount = detAmount;

  return {
    categoryId: known.id,
    categoryLabel: known.label,
    section: known.section,
    parentCategory: known.parent,
    subCategory: known.subCategory,
    isFinancialFraud: known.isFinancial,
    urgency: parsed.urgency ?? known.defaultUrgency,
    priorityDeskType: known.priorityDeskType,
    statutoryCitations: known.statutoryCitations,
    evidenceChecklist: known.evidenceChecklist,
    detectedAmount: detAmount,
    moneyMoved: parsed.moneyMoved ?? false,
    reasoning: parsed.reasoning ?? "AI-classified.",
    isDigitalArrest: parsed.isDigitalArrest ?? known.id === "digital_arrest",
    source: "ai",
    extractedFields: fields,
    extractedPills: parsed.extractedPills && parsed.extractedPills.length > 0 ? parsed.extractedPills : undefined,
  };
}
