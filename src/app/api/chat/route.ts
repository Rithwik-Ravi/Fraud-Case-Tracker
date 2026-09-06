import { NextRequest, NextResponse } from "next/server";
import { getOpenAiApiKey } from "@/lib/ai-config";
import { parseFinancialAmount } from "@/lib/triage";

export const runtime = "nodejs";
export const maxDuration = 30;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatReportDraft {
  narrative?: string;
  categoryId?: string;
  categoryLabel?: string;
  amount?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  paymentMode?: string | null;
  utrNumber?: string | null;
  suspectAccount?: string | null;
  suspectName?: string | null;
  suspectPhone?: string | null;
  suspectHandle?: string | null;
  suspectWebsite?: string | null;
  channel?: string | null;
  incidentDate?: string | null;
  isReadyToReport?: boolean;
}

const ADVISORY_SYSTEM_PROMPT = `You are CasePilot AI, an expert, calm, citizen-first cyber incident and legal guidance assistant for India.
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
4. COMPLAINT FILING WORKFLOW:
   - When a citizen is ready to report, inform them that they can switch to 'Report Incident' mode in this chat or visit /report.
5. GOLDEN HOUR INTERVENTION: If money was transferred or debited within the last 1-2 hours:
   - Tell them the first 120 minutes are the critical "Golden Hour".
   - Advise them to immediately call 1930 and file a banking freeze request on CasePilot (/report?urgency=golden-hour).
6. STATUTORY RIGHTS & BNSS: Mention statutory case tracking under Bharatiya Nagarik Suraksha Sanhita (BNSS) Section 173(3) and Section 503 for fund lien restitution.
7. EVIDENCE INTEGRITY: Remind them to keep screenshots, chat logs, call records, and transaction receipts without altering them (BSA Section 63 compliant).
8. Keep responses concise, formatted with clear bullet points, and easy to read on mobile.`;

const REPORTING_SYSTEM_PROMPT = `You are CasePilot's Cyber Incident Intake Officer for Indian citizens.
Your objective is to conversationally interview the victim, gather their incident facts with empathy, and construct an official complaint draft so they don't have to fill complex forms alone.

Your Behavior:
1. Speak with calm empathy and reassuring clarity.
2. Structure your "reply" string in two clear parts:
   Part 1: Empathetic acknowledgement of what was shared.
   Part 2: If any critical statutory fields are still missing, explain to the victim IN PROPER PROCEDURAL AND LEGAL TERMS WHY EACH SPECIFIC DETAIL IS NEEDED by the police and banking nodal network:
   • 12-Digit Transaction UTR: Explain that this is the unique inter-bank identifier required by the 1930 / CFCFRMS nodal network to immediately freeze the recipient account before money is laundered across mule accounts.
   • Exact Financial Loss (₹): Explain that police FIRs and bank recovery mandates under BNSS Section 503 require an exact certified debit figure.
   • Complainant Bank & Debited Account: Explain that your home bank needs this to register an unauthorized debit dispute and authenticate your identity.
   • Suspect UPI / Account / Mobile: Explain that cyber investigators require the scammer's destination accounts and phone numbers to issue statutory Section 94 BNSS preservation notices to telecom operators and banks.
   • Platform / Channel: Explain that identifying whether contact was via WhatsApp, Telegram, or phone call enables cyber units to trace server logs and phishing origins.
   If all major details are already captured, reassure them that all necessary facts have been recorded and invite them to click 'Transfer to Form' to complete their official filing.
3. Field Extraction:
   • "suspectAccount": fraudster's UPI ID / VPA (e.g. handle@ybl, name@okaxis) or destination bank account number.
   • "suspectName": suspect impersonated identity or alias (e.g. "Airtel Executive", "Bank Manager Rajesh", "CBI Officer").
   • "bankName": complainant's bank or payment app (e.g. SBI, HDFC, PhonePe).
   • "bankAccount": complainant's debited account number, phone number, or UPI ID if mentioned.
   • "paymentMode": "UPI" | "Net Banking" | "Credit/Debit Card" | "AEPS" | "Wallet" | "Other".
   • "amount": numeric INR amount debited or lost.
   • "utrNumber": 12-digit transaction reference number.
   • "suspectPhone": suspect caller or WhatsApp mobile number.
   • "suspectHandle": suspect social handle (@...) or Telegram channel.
   • "suspectWebsite": phishing link, URL, or malicious APK website.
   • "channel": "WhatsApp" | "Telegram" | "Phone Call" | "SMS" | "Instagram" | "Fake Website" | "Malicious APK" | "Email" | "Other".
   • "incidentDate": date or approximate timing (e.g. "Today", "06/09/2026").
5. Output format: You MUST reply ONLY with a valid JSON object matching this schema:
{
  "reply": "Your message containing: (1) A warm, empathetic acknowledgement. (2) If fields are missing, a section titled 'Details needed for police investigation and bank freeze:' with bullet points for each missing detail explaining why it is required (e.g., UTR is needed for the 1930 CFCFRMS inter-bank lien hold, Loss Amount is required under BNSS 503, Suspect UPI/Phone is required for Section 94 BNSS preservation orders). If all fields are present, celebrate that the complaint draft is complete and ready to transfer.",
  "draft": {
    "narrative": "A cohesive 2-4 sentence summary of the incident based on everything the victim shared.",
    "categoryId": "upi_fraud" | "net_banking" | "card_fraud" | "investment_scam" | "job_scam" | "loan_app_scam" | "digital_arrest" | "sextortion" | "impersonation" | "other_cybercrime",
    "categoryLabel": "UPI Related Fraud" (or matching official label),
    "amount": number | null,
    "bankName": string | null,
    "bankAccount": string | null,
    "paymentMode": "UPI" | "Net Banking" | "Credit/Debit Card" | "AEPS" | "Wallet" | "Other" | null,
    "utrNumber": string | null,
    "suspectAccount": string | null,
    "suspectName": string | null,
    "suspectPhone": string | null,
    "suspectHandle": string | null,
    "suspectWebsite": string | null,
    "channel": "WhatsApp" | "Telegram" | "Phone Call" | "SMS" | "Instagram" | "Fake Website" | "Malicious APK" | "Email" | "Other" | null,
    "incidentDate": string | null,
    "isReadyToReport": boolean
  }
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const mode = (body.mode === "reporting" ? "reporting" : "advisory") as "advisory" | "reporting";

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content || typeof lastMessage.content !== "string") {
      return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
    }

    const apiKey = getOpenAiApiKey();

    // ── If OPENAI_API_KEY is configured, call gpt-4o-mini ────────────────────
    if (apiKey) {
      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: apiKey.trim(), timeout: 25000 });

        if (mode === "reporting") {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            max_tokens: 700,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: REPORTING_SYSTEM_PROMPT },
              ...messages.slice(-8).map((m) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: String(m.content).slice(0, 2000),
              })),
            ],
          });

          const raw = response.choices[0]?.message?.content?.trim() || "{}";
          try {
            const parsed = JSON.parse(raw);
            let replyText = parsed.reply || "I have recorded your details.";
            const draft = parsed.draft || null;

            if (draft) {
              const missingExplanations: string[] = [];
              if (!draft.amount) {
                missingExplanations.push(
                  "• **Reported Loss Amount (₹)**: Required by police cyber units and banking recovery mandates under BNSS Section 503 to register the certified quantified loss figure."
                );
              }
              if (!draft.utrNumber) {
                missingExplanations.push(
                  "• **12-Digit Transaction UTR**: The statutory inter-bank reference number needed by the 1930 / CFCFRMS nodal network to immediately place a lien freeze on the recipient account before money is laundered."
                );
              }
              if (!draft.bankName) {
                missingExplanations.push(
                  "• **Your Bank / Payment App**: Needed for your home bank to authenticate unauthorized debit instructions and initiate inter-bank restitution."
                );
              }
              if (!draft.suspectAccount && !draft.suspectPhone) {
                missingExplanations.push(
                  "• **Suspect Account / UPI ID or Mobile Number**: Cyber investigators require the scammer's beneficiary accounts and phone numbers to issue statutory Section 94 BNSS preservation notices to banks and telecom operators."
                );
              }

              if (missingExplanations.length > 0 && !replyText.includes("BNSS") && !replyText.includes("CFCFRMS")) {
                replyText +=
                  "\n\n**To ensure your complaint carries statutory legal weight and your bank can freeze the funds, please provide:**\n\n" +
                  missingExplanations.join("\n\n") +
                  "\n\n*You can reply directly here with any details you have, or click 'Transfer to Form' below.*";
              }
            }

            return NextResponse.json({
              reply: replyText,
              draft,
              source: "openai",
              model: "gpt-4o-mini",
              mode: "reporting",
            });
          } catch {
            // Fall through to deterministic if JSON parsing failed
          }
        } else {
          // Advisory mode
          const formattedMessages = [
            { role: "system" as const, content: ADVISORY_SYSTEM_PROMPT },
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
              mode: "advisory",
            });
          }
        }
      } catch (openAiError) {
        console.warn("[/api/chat] OpenAI call failed, falling back to deterministic:", (openAiError as Error).message);
      }
    }

    // ── Deterministic Rule-Based Fallback Engine ─────────────────────────────
    if (mode === "reporting") {
      const fallbackReporting = generateReportingFallback(messages);
      return NextResponse.json({
        ...fallbackReporting,
        source: "deterministic",
        model: "casepilot-offline-engine",
        mode: "reporting",
        hasApiKey: Boolean(apiKey && apiKey.trim().length > 0),
      });
    }

    const fallbackReply = generateAdvisoryFallback(lastMessage.content);
    return NextResponse.json({
      reply: fallbackReply,
      source: "deterministic",
      model: "casepilot-offline-engine",
      mode: "advisory",
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
 * Deterministic intake fallback for reporting mode.
 * Aggregates all user messages to extract financial and suspect entities.
 */
function generateReportingFallback(messages: ChatMessage[]): { reply: string; draft: ChatReportDraft } {
  const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const fullText = userTexts.toLowerCase();

  // Extract amount
  const amount = parseFinancialAmount(userTexts) ?? null;

  // Extract UTR (12 digits)
  const utrMatch = userTexts.match(/\b\d{12}\b/);
  const utrNumber = utrMatch ? utrMatch[0] : null;

  // Extract suspect UPI handle (e.g. fraud@ybl)
  const upiMatch = userTexts.match(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/);
  const suspectAccount = upiMatch ? upiMatch[1] : null;

  // Extract suspect phone (10 digits starting with 6-9)
  const phoneMatch = userTexts.match(/(?:\+91[\-\s]?)?([6-9]\d{9})\b/);
  const suspectPhone = phoneMatch ? phoneMatch[1] : null;

  // Extract suspect handle (e.g. @handle)
  const handleMatch = userTexts.match(/@([a-zA-Z0-9_\.]{3,30})/);
  const suspectHandle = handleMatch ? `@${handleMatch[1]}` : null;

  // Channel detection
  let channel: string | null = null;
  if (fullText.includes("whatsapp")) channel = "WhatsApp";
  else if (fullText.includes("telegram")) channel = "Telegram";
  else if (fullText.includes("instagram")) channel = "Instagram";
  else if (fullText.includes("call") || fullText.includes("phone")) channel = "Phone Call";
  else if (fullText.includes("sms")) channel = "SMS";

  // Category detection
  let categoryId = "other_cybercrime";
  let categoryLabel = "Other Cyber Crime";

  if (fullText.includes("cbi") || fullText.includes("digital arrest") || fullText.includes("police uniform")) {
    categoryId = "digital_arrest";
    categoryLabel = "Digital Arrest Scam";
  } else if (fullText.includes("upi") || fullText.includes("gpay") || fullText.includes("phonepe") || suspectAccount) {
    categoryId = "upi_fraud";
    categoryLabel = "UPI Related Fraud";
  } else if (fullText.includes("card") || fullText.includes("otp") || fullText.includes("cvv")) {
    categoryId = "card_fraud";
    categoryLabel = "Credit / Debit Card Fraud";
  } else if (fullText.includes("task") || fullText.includes("telegram group") || fullText.includes("part time")) {
    categoryId = "job_scam";
    categoryLabel = "Work from Home / Job Scam";
  }

  // Bank extraction
  let bankName: string | null = null;
  if (fullText.includes("sbi") || fullText.includes("state bank")) bankName = "State Bank of India";
  else if (fullText.includes("hdfc")) bankName = "HDFC Bank";
  else if (fullText.includes("icici")) bankName = "ICICI Bank";
  else if (fullText.includes("axis")) bankName = "Axis Bank";
  else if (fullText.includes("pnb") || fullText.includes("punjab national")) bankName = "Punjab National Bank";
  else if (fullText.includes("phonepe")) bankName = "PhonePe (UPI)";
  else if (fullText.includes("gpay") || fullText.includes("google pay")) bankName = "Google Pay (UPI)";
  else if (fullText.includes("paytm")) bankName = "Paytm Payments Bank";

  // Payment mode
  let paymentMode: string = "UPI";
  if (fullText.includes("card") || fullText.includes("cvv") || fullText.includes("atm")) paymentMode = "Credit/Debit Card";
  else if (fullText.includes("net banking") || fullText.includes("imps") || fullText.includes("neft")) paymentMode = "Net Banking";
  else if (fullText.includes("wallet")) paymentMode = "Wallet";

  // Suspect Name
  let suspectName: string | null = null;
  const aliasMatch = userTexts.match(/(?:pretending to be|claiming to be|named|alias)\s+([A-Za-z\s]{3,30})/i);
  if (aliasMatch) suspectName = aliasMatch[1].trim();

  // Incident Date
  let incidentDate: string = "Today";
  if (fullText.includes("yesterday")) incidentDate = "Yesterday";

  const isReadyToReport = Boolean(amount || utrNumber || suspectAccount || suspectPhone || userTexts.length > 50);

  // Generate guided assistant reply
  let reply = "Thank you for sharing this. I have recorded your incident facts in the checklist below.\n\n";

  const missingExplanations: { name: string; reason: string }[] = [];
  if (!amount) {
    missingExplanations.push({
      name: "Exact Financial Loss Amount (₹)",
      reason: "Required by police cyber units and banking recovery mandates under BNSS Section 503 to register the certified loss figure for fund recovery.",
    });
  }
  if (!utrNumber && amount) {
    missingExplanations.push({
      name: "12-Digit Transaction UTR",
      reason: "This is the statutory inter-bank reference number needed by the 1930 / CFCFRMS nodal network to immediately trace and freeze the fraudster's account before money is siphoned across mule networks.",
    });
  }
  if (!suspectAccount && !suspectPhone && !suspectHandle) {
    missingExplanations.push({
      name: "Suspect UPI ID, Phone Number, or Account",
      reason: "Investigating cyber cells require beneficiary account handles and phone numbers to issue statutory Section 94 BNSS preservation orders to telecom operators and banks.",
    });
  }

  if (missingExplanations.length > 0) {
    reply += "To ensure your complaint carries full statutory weight for police investigation and banking freeze, we need a few critical details:\n\n" +
      missingExplanations.map((m) => `• **${m.name}**: ${m.reason}`).join("\n\n") +
      "\n\nPlease reply with any of these details you have, or click 'Transfer to Form' below to continue.";
  } else {
    reply += "All critical statutory fields are captured in your checklist below! Your complaint has all the essential identifiers required for police inquiry and banking freeze. Click 'Transfer to Form' to review and submit.";
  }

  return {
    reply,
    draft: {
      narrative: userTexts.slice(0, 500),
      categoryId,
      categoryLabel,
      amount,
      bankName,
      bankAccount: null,
      paymentMode,
      utrNumber,
      suspectAccount,
      suspectName,
      suspectPhone,
      suspectHandle,
      suspectWebsite: null,
      channel,
      incidentDate,
      isReadyToReport,
    },
  };
}

/**
 * High-accuracy deterministic fallback engine for Advisory mode.
 */
function generateAdvisoryFallback(text: string): string {
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
      `3. Note: If the seller took money via an unauthorized phishing payment link or fake customer care number, switch to 'Report Incident' mode or visit /report.`;
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
      `1. Click the 'Report Incident' tab right here in this chat, or visit /report.\n` +
      `2. Chat with me or describe what happened in your own words (English, Hindi, or Hinglish).\n` +
      `3. Our AI Engine extracts the required entities:\n` +
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
      `3. Switch to 'Report Incident' mode here or use CasePilot's Rapid Bank Freeze (/report?urgency=golden-hour) to record transaction and nodal evidence.\n` +
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
      `5. Switch to 'Report Incident' mode here or file a formal complaint on CasePilot (/report).`;
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
    `I can assist you in two ways:\n` +
    `1. Ask & Guidance: Questions about scams, digital arrest, or emergency freezes\n` +
    `2. Report Incident: Guided step-by-step interview to build your official complaint\n\n` +
    `Switch tabs above, or describe your situation and I will guide you!`;
}
