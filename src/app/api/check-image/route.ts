import { NextRequest, NextResponse } from "next/server";
import { checkSuspectAction } from "@/actions/check";

export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * POST /api/check-image
 * Accepts multipart/form-data with an "image" field (File).
 *
 * When OPENAI_API_KEY is set, uses gpt-4o vision to extract the relevant
 * identifier (UPI ID, phone number, URL, bank account number, etc.) from the
 * screenshot, then runs checkSuspectAction() on the extracted text.
 *
 * Returns { extractedText, ...CheckVerdict } or { error: "vision_unavailable" }.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "vision_unavailable" }, { status: 200 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  // Enforce size limit: 4 MB
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large. Maximum 4 MB." }, { status: 413 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey, timeout: 12000 });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a cybercrime analyst. Examine this screenshot and extract the MOST suspicious identifier:
- UPI VPA (format: something@bank)
- Phone number (Indian or international)
- Website / URL
- Bank account number (numeric, 9-18 digits)
- Name of remote-access software (AnyDesk, TeamViewer, QuickSupport, etc.)

Reply ONLY with a JSON object: { "extracted": "<the identifier>", "type": "upi|phone|url|bank_account|remote_access_app|other" }
If nothing suspicious is visible, reply: { "extracted": "", "type": "other" }`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { extracted?: string; type?: string };
    const extractedText = (parsed.extracted ?? "").trim();

    if (!extractedText) {
      return NextResponse.json({
        extractedText: "",
        kind: "unclear",
        verdict: "unclear",
        title: "No suspicious identifier found in the screenshot.",
        reasons: ["The image did not contain a recognisable UPI ID, phone number, URL, or bank account number."],
      });
    }

    const verdict = await checkSuspectAction(extractedText);
    return NextResponse.json({ extractedText, ...verdict });
  } catch (err) {
    console.error("[/api/check-image] Error:", (err as Error).message);
    return NextResponse.json({ error: "vision_error", detail: (err as Error).message }, { status: 500 });
  }
}
