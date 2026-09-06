import { NextRequest, NextResponse } from "next/server";
import { getOpenAiApiKey } from "@/lib/ai-config";
import { parseFinancialAmount, classifyNarrative } from "@/lib/triage";

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
  section?: "WOMEN_CHILDREN" | "FINANCIAL" | "OTHER";
  subCategory?: string;
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
  // Cryptocurrency
  cryptoNetwork?: string | null;
  victimWallet?: string | null;
  suspectWallet?: string | null;
  transactionHash?: string | null;
  cryptoExchange?: string | null;
  // Ransomware & Hacking
  encryptedExtension?: string | null;
  ransomNoteFile?: string | null;
  ransomDemanded?: string | null;
  ransomWalletAddress?: string | null;
  targetDomain?: string | null;
  serverIp?: string | null;
  defacerHandle?: string | null;
  // Social Media & Impersonation
  imposterUrl?: string | null;
  genuineUrl?: string | null;
  socialPlatform?: string | null;
  // Mobile
  maliciousApkName?: string | null;
  // Women & Children
  harassmentMedium?: string | null;
  threatenedContent?: string | null;
  extortionDemand?: string | null;
  reportAnonymously?: boolean;
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

const REPORTING_SYSTEM_PROMPT = `You are CasePilot's Cyber Incident Intake Officer for Indian citizens reporting to NCRP (cybercrime.gov.in).
Your objective is to conversationally interview the victim, gather their incident facts with empathy, and construct an official complaint draft adapting to the 3 NCRP pillars:
1. Women/Children Related Crime (WOMEN_CHILDREN) - with Option to Report Anonymously (Track 1A) vs Identified (Track 1B).
2. Financial Fraud (FINANCIAL) - Part A (victim bank, 12-digit UTR, loss) & Part B (suspect account/UPI).
3. Other Cyber Crime (OTHER) - Social Media, Hacking, Ransomware, Cryptocurrency, Mobile Crime, etc.

Behavior Guidelines:
1. Speak with calm empathy and reassuring clarity.
2. Structure your "reply" into two parts:
   Part 1: A warm, empathetic acknowledgement of what the citizen shared, confirming details captured so far.
   Part 2: Following up with their Case Intake Checklist, explain in proper procedural and statutory terms why pending details are needed for their SPECIFIC crime type:
   - For Financial Fraud: explain that 12-digit UTR and suspect UPI/account are needed for 1930 / CFCFRMS automated lien freezes and BNSS Sec 94 debit-freeze notices before cash is withdrawn.
   - For Cryptocurrency: explain that the blockchain Transaction Hash (TxID) and suspect wallet address are needed to trace coin flow across ledgers and request exchange blacklists.
   - For Ransomware / Hacking: explain that the ransom note, encrypted file extension, or target server IP are required by CERT-In and state cyber cells to analyze the malware strain and contain network intrusion.
   - For Social Media Impersonation / Fake Profiles: explain that the imposter URL and genuine profile URL are needed to serve mandatory 24-hour takedown notices under IT Rule 3(2)(b).
   - For Women & Children / Sextortion: explain that preserving unedited chat logs and suspect numbers establishes criminal intimidation under BNS Sec 351/308, and assure the victim that they have the statutory right under NCRP to report anonymously without disclosing their identity.
3. Field Extraction: Extract all relevant fields into the draft according to the category.
4. Output format: You MUST reply ONLY with a valid JSON object matching this schema:
{
  "reply": "Your empathetic response and explanation of remaining checklist requirements...",
  "draft": {
    "narrative": "A cohesive 2-4 sentence summary of the incident based on what the victim shared.",
    "categoryId": "upi_fraud | net_banking | card_fraud | investment_scam | job_scam | loan_app_scam | sim_swap | child_safety | sextortion | cyber_blackmail | cyber_stalking | wc_defamation | impersonation | account_takeover | hack_defacement | hack_server_breach | malware_ransomware | crypto_wallet_drain | mob_malicious_apk | digital_arrest | other_cybercrime",
    "categoryLabel": "Exact category label",
    "section": "WOMEN_CHILDREN | FINANCIAL | OTHER",
    "subCategory": "Subcategory name",
    "amount": number | null,
    "bankName": string | null,
    "bankAccount": string | null,
    "paymentMode": string | null,
    "utrNumber": string | null,
    "suspectAccount": string | null,
    "suspectName": string | null,
    "suspectPhone": string | null,
    "suspectHandle": string | null,
    "suspectWebsite": string | null,
    "channel": string | null,
    "incidentDate": string | null,
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
    "extortionDemand": string | null,
    "reportAnonymously": boolean,
    "isReadyToReport": boolean
  }
}`;

export interface StatutoryFieldExplanation {
  fieldKey: string;
  name: string;
  reason: string;
}

/**
 * Returns procedural and statutory justifications under Indian law (BNSS, 1930 / CFCFRMS, RBI, BSA, IT Act)
 * explaining why each remaining detail is needed by police cyber cells and banks.
 * DYNAMICALLY adapts to Financial Fraud, Cryptocurrency, Ransomware, Social Media, and Women/Children crimes.
 */
export function getStatutoryFieldExplanations(
  draft: ChatReportDraft | null | undefined
): StatutoryFieldExplanation[] {
  if (!draft) return [];
  const list: StatutoryFieldExplanation[] = [];
  const catId = draft.categoryId || "";
  const isCrypto = catId.includes("crypto");
  const isRansomwareOrHacking = catId.includes("ransomware") || catId.includes("hack") || catId.includes("defacement");
  const isSocialMedia = catId.includes("impersonation") || catId.includes("account_takeover") || catId.includes("stalking") || catId.includes("wc_defamation");
  const isWomenChildren = draft.section === "WOMEN_CHILDREN" || catId.includes("child") || catId.includes("sextortion") || catId.includes("blackmail");
  const isFinancial = draft.section === "FINANCIAL" || (!isCrypto && !isRansomwareOrHacking && !isSocialMedia && !isWomenChildren && Boolean(draft.amount && draft.amount > 0));

  // ── CATEGORY SPECIFIC FIELDS ───────────────────────────────────────────────
  if (isCrypto) {
    if (!draft.transactionHash) {
      list.push({
        fieldKey: "transactionHash",
        name: "Blockchain Transaction Hash (TxID / TxHash)",
        reason:
          "Cryptographic hash proving the debit on the public ledger. Under Bharatiya Sakshya Adhiniyam (BSA) Section 63, this immutable ledger proof is required to initiate on-chain tracking.",
      });
    }
    if (!draft.suspectWallet) {
      list.push({
        fieldKey: "suspectWallet",
        name: "Suspect Recipient Wallet Address",
        reason:
          "Target wallet address required by cyber units to trace destination clusters and serve AML alerts to Indian and global crypto exchanges (FIU-IND compliance).",
      });
    }
    if (!draft.cryptoNetwork) {
      list.push({
        fieldKey: "cryptoNetwork",
        name: "Blockchain Network (Ethereum, Bitcoin, TRON, Solana, etc.)",
        reason:
          "Identifies the ledger architecture and token contract standard for forensic cluster analysis.",
      });
    }
  } else if (isRansomwareOrHacking) {
    if (!draft.targetDomain && !draft.serverIp) {
      list.push({
        fieldKey: "targetDomain",
        name: "Target Domain or Server IP Address",
        reason:
          "Identifies the compromised digital infrastructure for containment and firewall log preservation under Section 43/66 IT Act.",
      });
    }
    if (catId.includes("ransomware") && !draft.encryptedExtension) {
      list.push({
        fieldKey: "encryptedExtension",
        name: "Encrypted File Extension (e.g. .locked, .phobos)",
        reason:
          "Enables CERT-In and forensic teams to identify the specific ransomware family and check for available decryptor keys.",
      });
    }
    if (catId.includes("ransomware") && !draft.ransomWalletAddress && !draft.suspectWebsite) {
      list.push({
        fieldKey: "ransomContact",
        name: "Attacker Email / Tor Link / Crypto Wallet from Ransom Note",
        reason:
          "Preserves the attacker's extortion coordinates for blacklisting and forensic threat intelligence.",
      });
    }
  } else if (isSocialMedia) {
    if (!draft.imposterUrl && !draft.suspectHandle) {
      list.push({
        fieldKey: "imposterUrl",
        name: "Imposter / Fake Profile URL or Handle",
        reason:
          "Required to issue statutory takedown notices to the social media intermediary under Rule 3(2)(b) of the IT Rules and Section 66D IT Act.",
      });
    }
    if (!draft.genuineUrl) {
      list.push({
        fieldKey: "genuineUrl",
        name: "Your Genuine Profile Link",
        reason:
          "Enables cyber investigators and platform grievance officers to verify genuine identity and expedite imposter account removal.",
      });
    }
  } else if (isWomenChildren) {
    if (!draft.threatenedContent && !draft.narrative) {
      list.push({
        fieldKey: "threatenedContent",
        name: "Nature of Threatened Content or Demands",
        reason:
          "Documents criminal intimidation under BNS Section 351/308 and triggers priority emergency protection by the Women & Child Cyber Cell.",
      });
    }
  } else if (isFinancial) {
    // 1. Transaction UTR
    if (!draft.utrNumber) {
      list.push({
        fieldKey: "utrNumber",
        name: "12-Digit Transaction UTR (or UPI Ref No.)",
        reason:
          "Statutory inter-bank tracking number required by 1930 / CFCFRMS to immediately trace the payment hop across beneficiary accounts and place an emergency lien freeze before money is siphoned into mule networks.",
      });
    }
    // 2. Suspect Account / UPI ID
    if (!draft.suspectAccount) {
      list.push({
        fieldKey: "suspectAccount",
        name: "Suspect's UPI ID or Destination Account Number",
        reason:
          "Cyber investigators require the scammer's destination account to issue statutory debit-freeze notices under Section 94 BNSS and stop ATM cash withdrawals.",
      });
    }
    // 3. Loss Amount
    if (!draft.amount) {
      list.push({
        fieldKey: "amount",
        name: "Reported Financial Loss Amount (₹)",
        reason:
          "Mandatory under BNSS Section 173(3) and Section 503 to establish certified pecuniary loss for police FIR registration and fund restitution.",
      });
    }
    // 4. Complainant Bank Name
    if (!draft.bankName) {
      list.push({
        fieldKey: "bankName",
        name: "Your Bank or Payment App Name",
        reason:
          "Needed to identify your home bank's nodal fraud desk to register an unauthorized debit dispute and protect your rights under RBI's 3-day zero-liability policy.",
      });
    }
  }

  // ── COMMON FIELDS ACROSS ALL CRIMES ────────────────────────────────────────
  if (!draft.incidentDate) {
    list.push({
      fieldKey: "incidentDate",
      name: "Incident Date & Approximate Timing",
      reason:
        "Establishes statutory chronology for law enforcement inquiry under BNSS Section 173(3) and determines 120-minute Golden Hour priority.",
    });
  }

  if (!draft.channel) {
    list.push({
      fieldKey: "channel",
      name: "Platform or Attack Channel (WhatsApp, Telegram, Phone, Website, etc.)",
      reason:
        "Identifies the digital attack vector to preserve electronic evidence and server logs under Bharatiya Sakshya Adhiniyam (BSA) Section 63.",
    });
  }

  if (!draft.suspectPhone && !draft.suspectHandle && !draft.suspectWebsite && !draft.suspectAccount && !draft.suspectWallet) {
    list.push({
      fieldKey: "suspectContact",
      name: "Suspect Contact (Phone Number, Social Handle, or Website)",
      reason:
        "Required by police cyber units to serve preservation notices on telecom operators or internet platforms under Section 91/94 BNSS.",
    });
  }

  return list;
}

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
            max_tokens: 850,
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
            const draft: ChatReportDraft | null = parsed.draft || null;

            if (draft) {
              const explanations = getStatutoryFieldExplanations(draft);

              if (explanations.length > 0) {
                // Check if reply already explicitly articulates the explanations in proper terms
                const hasDetailedBreakdown =
                  explanations.length <= 2 &&
                  explanations.every((exp) =>
                    replyText.toLowerCase().includes(exp.fieldKey.toLowerCase().slice(0, 4)) ||
                    replyText.toLowerCase().includes(exp.name.toLowerCase().slice(0, 6))
                  ) &&
                  (replyText.includes("1930") || replyText.includes("BNSS") || replyText.includes("CFCFRMS") || replyText.includes("freeze"));

                if (!hasDetailedBreakdown) {
                  // Clean off any redundant trailing call-to-action before appending structured breakdown
                  replyText = replyText
                    .replace(/\n\n\*You can reply directly[\s\S]*$/i, "")
                    .replace(/\n\n\*\*To ensure your complaint carries statutory[\s\S]*$/i, "")
                    .replace(/\n\n\*\*Following up with your Case Intake Checklist[\s\S]*$/i, "")
                    .trim();

                  const missingSection =
                    "\n\n**Following up with your Case Intake Checklist, here is why law enforcement and your bank specifically need you to fill in the remaining details:**\n\n" +
                    explanations
                      .map((exp, idx) => `${idx + 1}. **${exp.name}**:\n   ${exp.reason}`)
                      .join("\n\n") +
                    "\n\n*You can reply directly here with any details you have, or click 'Transfer to Form' below to fill them into the official report.*";

                  replyText = replyText + missingSection;
                }
              } else {
                if (!replyText.toLowerCase().includes("transfer to form") && !replyText.toLowerCase().includes("ready")) {
                  replyText =
                    replyText.trim() +
                    "\n\n**All critical statutory details have been captured!** Your complaint now contains the certified identifiers needed for police FIR registration under BNSS and an emergency bank lien freeze under 1930 / CFCFRMS. Please click **Transfer to Form** below to review and submit your official filing.";
                }
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

  // Leverage classifyNarrative from @/lib/triage for full 3-pillar NCRP coverage and entity extraction
  const triage = classifyNarrative(userTexts);
  const ef = triage.extractedFields || {};

  const isReadyToReport = Boolean(
    triage.detectedAmount ||
    ef.utrNumber ||
    ef.suspectAccount ||
    ef.suspectPhone ||
    ef.transactionHash ||
    ef.suspectWallet ||
    ef.targetDomain ||
    ef.imposterUrl ||
    userTexts.length > 50
  );

  const draft: ChatReportDraft = {
    narrative: userTexts.slice(0, 500),
    categoryId: triage.categoryId,
    categoryLabel: triage.categoryLabel,
    section: triage.section,
    subCategory: triage.subCategory,
    amount: triage.detectedAmount ?? null,
    bankName: ef.bankName ?? null,
    bankAccount: ef.bankAccount ?? null,
    paymentMode: ef.paymentMode ?? (triage.isFinancialFraud ? "UPI" : null),
    utrNumber: ef.utrNumber ?? null,
    suspectAccount: ef.suspectAccount ?? null,
    suspectName: ef.suspectName ?? null,
    suspectPhone: ef.suspectPhone ?? null,
    suspectHandle: ef.suspectHandle ?? null,
    suspectWebsite: ef.suspectWebsite ?? null,
    channel: ef.channel ?? null,
    incidentDate: ef.incidentDate ?? "Today",
    cryptoNetwork: ef.cryptoNetwork ?? null,
    victimWallet: ef.victimWallet ?? null,
    suspectWallet: ef.suspectWallet ?? null,
    transactionHash: ef.transactionHash ?? null,
    cryptoExchange: ef.cryptoExchange ?? null,
    encryptedExtension: ef.encryptedExtension ?? null,
    ransomNoteFile: ef.ransomNoteFile ?? null,
    ransomDemanded: ef.ransomDemanded ?? null,
    ransomWalletAddress: ef.ransomWalletAddress ?? null,
    targetDomain: ef.targetDomain ?? null,
    serverIp: ef.serverIp ?? null,
    defacerHandle: ef.defacerHandle ?? null,
    imposterUrl: ef.imposterUrl ?? null,
    genuineUrl: ef.genuineUrl ?? null,
    socialPlatform: ef.socialPlatform ?? null,
    maliciousApkName: ef.maliciousApkName ?? null,
    harassmentMedium: ef.harassmentMedium ?? null,
    threatenedContent: ef.threatenedContent ?? null,
    extortionDemand: ef.extortionDemand ?? null,
    isReadyToReport,
  };

  const explanations = getStatutoryFieldExplanations(draft);
  let reply = "Thank you for sharing this. I have recorded your incident facts in the checklist below.\n\n";

  if (explanations.length > 0) {
    reply +=
      "**Following up with your Case Intake Checklist, here is why law enforcement and your bank specifically need you to fill in the remaining details:**\n\n" +
      explanations
        .map((exp, idx) => `${idx + 1}. **${exp.name}**:\n   ${exp.reason}`)
        .join("\n\n") +
      "\n\n*You can reply directly here with any details you have, or click 'Transfer to Form' below to fill them into the official report.*";
  } else {
    reply +=
      "**All critical statutory details have been captured!** Your complaint now contains the certified identifiers needed for police FIR registration under BNSS and an emergency bank lien freeze under 1930 / CFCFRMS. Please click **Transfer to Form** below to review and submit your official filing.";
  }

  return { reply, draft };
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
