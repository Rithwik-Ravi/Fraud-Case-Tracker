import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are CasePilot AI, an expert, calm, citizen-first cyber incident and legal guidance assistant for India.
You provide immediate, actionable emergency assistance to citizens facing cyber crimes under Indian laws.

Key Rules & Guidelines:
1. CALM & DIRECT: Speak with calm authority. Citizens talking to you may be terrified, under active extortion, or suffering financial loss.
2. DIGITAL ARREST DEBUNKING: If a user mentions a call from CBI, Police, ED, Customs, or Narcotics threatening arrest on video or phone:
   - State immediately and clearly: "There is no Digital Arrest in Indian law. No government officer can arrest you over a phone or video call. Hang up immediately."
   - Direct them to disconnect immediately and view our Emergency Intercept at /digital-arrest.
3. CIVIL DISPUTES & NON-CYBER DEFLECTION:
   - Consumer / E-commerce disputes (defective items, refund delays, seller disputes): Direct to National Consumer Helpline (Call 1915 or visit consumerhelpline.gov.in) instead of cyber police.
   - Physically lost or stolen mobile phones: Direct to CEIR (Sanchar Saathi at ceir.gov.in) to block the device IMEI and trace it.
   - Unauthorized SIM cards in their name: Direct to DoT TAFCOP (tafcop.sancharsaathi.gov.in).
4. COMPLAINT FILING WORKFLOW (AI AUTO-FILL):
   - When a citizen is ready to report a cybercrime, guide them to /report.
   - Explain that they do NOT need to fill a tedious 40-box form: they simply describe what happened in their own words or voice in Step 1, and our AI engine automatically fills in all the statutory boxes (bank, amount, UTR, suspect handles, police jurisdiction).
5. GOLDEN HOUR INTERVENTION: If money was transferred or debited within the last 1-2 hours:
   - Tell them the first 120 minutes are the critical "Golden Hour".
   - Advise them to immediately call 1930 and file a banking freeze request on CasePilot (/report?urgency=golden-hour).
6. STATUTORY RIGHTS & BNSS: Mention statutory case tracking under Bharatiya Nagarik Suraksha Sanhita (BNSS) Section 173(3) and Section 503 for fund lien restitution.
7. EVIDENCE INTEGRITY: Remind them to keep screenshots, chat logs, call records, and transaction receipts without altering them (BSA Section 63 compliant).
8. Keep responses concise, formatted with clear bullet points, and easy to read on mobile.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content || typeof lastMessage.content !== "string") {
      return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // If OPENAI_API_KEY is configured, use OpenAI gpt-4o-mini
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes("sk-proj-...")) {
      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: apiKey.trim(), timeout: 25000 });

        const formattedMessages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          ...messages.slice(-10).map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: String(m.content).slice(0, 2000),
          })),
        ];

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: formattedMessages,
          temperature: 0.3,
          max_tokens: 800,
        });

        const reply = response.choices[0]?.message?.content?.trim();
        if (reply) {
          return NextResponse.json({
            reply,
            source: "openai",
            model: "gpt-4o-mini",
          });
        }
      } catch (openAiError) {
        console.warn("[/api/chat] OpenAI call failed, falling back to deterministic:", (openAiError as Error).message);
      }
    }

    // Deterministic Rule-Based Fallback Engine
    const fallbackReply = generateFallbackResponse(lastMessage.content);
    return NextResponse.json({
      reply: fallbackReply,
      source: "deterministic",
      model: "casepilot-offline-engine",
      hasApiKey: Boolean(apiKey && apiKey.trim().length > 0),
    });
  } catch (err) {
    console.error("[/api/chat] Error handling chat request:", err);
    return NextResponse.json(
      { error: "Internal chat service error. Please try again or call 1930." },
      { status: 500 }
    );
  }
}

/**
 * High-accuracy deterministic fallback engine for when OPENAI_API_KEY is not set or network fails.
 */
function generateFallbackResponse(text: string): string {
  const lower = text.toLowerCase();

  // 1. Digital arrest signals
  if (
    lower.includes("digital arrest") ||
    lower.includes("cbi") ||
    lower.includes("police officer") ||
    lower.includes("video call") ||
    lower.includes("customs") ||
    lower.includes("narcotics") ||
    lower.includes("parcel seized") ||
    lower.includes("ed officer") ||
    lower.includes("fedex") ||
    lower.includes("stay on the line")
  ) {
    return `EMERGENCY WARNING: There is no such thing as "Digital Arrest" in Indian law.\n\n` +
      `No law enforcement agency (Police, CBI, ED, Narcotics, Customs) is legally permitted to arrest citizens or demand interrogations over Skype, WhatsApp, or video calls.\n\n` +
      `Immediate Actions:\n` +
      `1. Disconnect the call immediately. Block the caller.\n` +
      `2. Do not transfer any money to "safe" or "verification" bank accounts.\n` +
      `3. Do not install screen-sharing software (AnyDesk, TeamViewer, RustDesk).\n` +
      `4. Dial 1930 or file a report on our portal to alert authorities.`;
  }

  // 2. Civil / Consumer Dispute Deflection (Not cybercrime)
  if (
    lower.includes("consumer") ||
    lower.includes("ecommerce") ||
    lower.includes("e-commerce") ||
    lower.includes("flipkart refund") ||
    lower.includes("amazon refund") ||
    lower.includes("defective product") ||
    lower.includes("order delay") ||
    lower.includes("seller dispute")
  ) {
    return `CIVIL CONSUMER GRIEVANCE ADVISORY:\n\n` +
      `This appears to be a civil commercial dispute rather than a criminal cyber offence.\n\n` +
      `How to resolve:\n` +
      `1. National Consumer Helpline (NCH): Dial toll-free 1915 or register online at consumerhelpline.gov.in.\n` +
      `2. E-Daakhil Portal: If unaddressed by the seller, file a consumer case at edaakhil.nic.in.\n` +
      `3. Note: If the seller took money via an unauthorized phishing payment link or fake customer care number, file a formal cyber report on CasePilot (/report).`;
  }

  // 3. Lost / Stolen Handset Deflection
  if (
    lower.includes("lost phone") ||
    lower.includes("stolen phone") ||
    lower.includes("lost mobile") ||
    lower.includes("imei block") ||
    lower.includes("lost device")
  ) {
    return `LOST / STOLEN MOBILE DEVICE PROTOCOL:\n\n` +
      `For physically lost or stolen smartphones, Indian law provides the Central Equipment Identity Register (CEIR):\n\n` +
      `1. Visit the Official Sanchar Saathi portal: ceir.sancharsaathi.gov.in\n` +
      `2. Submit a "Block Stolen/Lost Mobile" request with your 15-digit IMEI number.\n` +
      `3. The device will be blacklisted across all Indian telecom networks (Airtel, Jio, Vi, BSNL) preventing misuse.\n` +
      `4. File a Lost Property Notification at your local police station online portal.`;
  }

  // 4. Filing Flow & AI Auto-Fill guidance
  if (
    lower.includes("file complaint") ||
    lower.includes("how to report") ||
    lower.includes("register case") ||
    lower.includes("how to file")
  ) {
    return `HOW TO FILE A COMPLAINT ON CASEPILOT:\n\n` +
      `You do NOT need to fill out a confusing 40-question government form. Our system is built with AI-assisted intake:\n\n` +
      `1. Visit the Report Incident page (/report).\n` +
      `2. Speak or type your story in Step 1 in your own words (English, Hindi, or Hinglish).\n` +
      `3. Our AI Engine analyzes your statement and automatically populates all required boxes:\n` +
      `   • Official NCRP Category & Urgency\n` +
      `   • Bank name, amount, and 12-digit UTR\n` +
      `   • Suspect phone, handles, and URLs\n` +
      `   • Incident channel and local Cyber Police Station\n` +
      `4. Review the pre-filled details, attach screenshots, and instantly receive your official tracking ACK-YYYY-XXXXXX and stamped confirmation PDF.`;
  }

  // 5. Financial loss / Golden hour signals
  if (
    lower.includes("money") ||
    lower.includes("debited") ||
    lower.includes("upi") ||
    lower.includes("fraud") ||
    lower.includes("transferred") ||
    lower.includes("bank") ||
    lower.includes("atm") ||
    lower.includes("phishing") ||
    lower.includes("account empty") ||
    lower.includes("lost") ||
    lower.includes("refund")
  ) {
    return `CRITICAL: If money was debited within the last 2 hours, you are in the "Golden Hour".\n\n` +
      `During this window, banks can place a lien hold on the recipient account before money is laundered across mule networks.\n\n` +
      `Immediate Steps:\n` +
      `1. Note your 12-digit UTR/Transaction Reference number from the SMS.\n` +
      `2. Call 1930 (National Cybercrime Reporting Helpline) immediately to initiate a CFCFRMS payment switch freeze.\n` +
      `3. Use CasePilot's Rapid Bank Freeze (/report?urgency=golden-hour) to record transaction and nodal evidence.\n` +
      `4. Call your bank's emergency debit-card / UPI hotlisting helpline to prevent further debits.`;
  }

  // 6. Blackmail, sextortion, impersonation
  if (
    lower.includes("blackmail") ||
    lower.includes("photos") ||
    lower.includes("sextortion") ||
    lower.includes("threaten") ||
    lower.includes("morphed") ||
    lower.includes("leak") ||
    lower.includes("video")
  ) {
    return `CRITICAL ADVICE FOR SEXTORTION & HARASSMENT:\n\n` +
      `1. Do NOT pay any money. Paying does not stop extortion; it only invites higher demands.\n` +
      `2. Preserve all evidence: Take screenshots of chats, profile links, phone numbers, and payment handles. Do not delete the conversation.\n` +
      `3. Block the extortionist on all communication channels.\n` +
      `4. Under Section 67/67A of the IT Act, publishing or blackmailing with private media is a cognizable criminal offense.\n` +
      `5. File a formal complaint immediately on CasePilot (/report) or call 1930.`;
  }

  // 7. Case tracking / SLA
  if (
    lower.includes("track") ||
    lower.includes("status") ||
    lower.includes("ack") ||
    lower.includes("sla") ||
    lower.includes("bnss") ||
    lower.includes("fir")
  ) {
    return `TRACKING YOUR COMPLAINT:\n\n` +
      `Under Section 173(3) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), police stations must complete preliminary inquiry or convert cyber complaints to formal FIRs within statutory timelines (14 to 15 days).\n\n` +
      `How to track:\n` +
      `1. Visit the Track Complaint page (/track).\n` +
      `2. Enter your Acknowledgement Number (e.g. ACK-2026-XXXXXX) or sign in with your verified mobile number.\n` +
      `3. You will see the live 7-stage restitution timeline, police unit assignment, and bank nodal status.`;
  }

  // Default response
  return `Welcome to CasePilot Citizen Cyber Support.\n\n` +
    `I can assist you with:\n` +
    `- What to do if you suspect a scam or "Digital Arrest" call\n` +
    `- Emergency Golden-Hour banking freeze procedures (1930 / CFCFRMS)\n` +
    `- Verifying suspicious UPI IDs, bank accounts, or APK links\n` +
    `- Tracking case milestones under Indian cyber law and BNSS\n\n` +
    `Please describe what happened, or call 1930 directly for immediate emergency assistance.`;
}
