export interface Category {
  id: string;
  label: string;
  parent: "Financial Fraud" | "Women/Children" | "Other Cyber Crime";
  isFinancial: boolean;
  defaultUrgency: "standard" | "urgent" | "golden-hour";
  description: string;
}

/**
 * Subset of Category IDs that trigger special UX flows (e.g., interrupt screens).
 */
export const SPECIAL_ROUTE_CATEGORIES = ["digital_arrest"] as const;
export type SpecialRouteCategory = (typeof SPECIAL_ROUTE_CATEGORIES)[number];

export const CATEGORIES: Category[] = [
  {
    id: "upi_fraud",
    label: "UPI Related Fraud",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Fraudulent debit via UPI, fake collect request, QR code scam, or PhonePe/GPay impersonation.",
  },
  {
    id: "net_banking",
    label: "Internet Banking / Phishing Fraud",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Unauthorized net banking transfer, phishing login link, or remote access app (AnyDesk/TeamViewer).",
  },
  {
    id: "card_fraud",
    label: "Credit / Debit Card Fraud",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Unauthorized ATM withdrawal, POS swipe, card skimming, or online card transaction without consent.",
  },
  {
    id: "investment_scam",
    label: "Online Investment / Trading Scam",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "High return promise, fake crypto trading app, Telegram investment group, or stock market tip scam.",
  },
  {
    id: "job_scam",
    label: "Work from Home / Part-Time Job Scam",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Task scam, YouTube video like/subscribe fraud, daily payment promise requiring deposits.",
  },
  {
    id: "loan_app_scam",
    label: "Illegal Loan App / Extortion",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Instant loan disbursed without request, predatory interest, access to contacts and threatening calls.",
  },
  {
    id: "sim_swap",
    label: "SIM Swap / Telecom Fraud",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Fraudulent SIM card deactivation and duplication to intercept banking SMS and OTPs.",
  },
  {
    id: "child_safety",
    label: "Child Related Cyber Crime / CSAM",
    parent: "Women/Children",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Child sexual abuse material, grooming, online exploitation of minors, or child cyber harassment.",
  },
  {
    id: "sextortion",
    label: "Sextortion / Threatening with Private Photos",
    parent: "Women/Children",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Video call blackmail, morphing private pictures, demanding money under threat of leak.",
  },
  {
    id: "cyber_blackmail",
    label: "Cyber Blackmailing & Harassment",
    parent: "Women/Children",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Threatening messages, continuous harassment, blackmailing over chat or social media.",
  },
  {
    id: "cyber_stalking",
    label: "Cyber Stalking & Bullying",
    parent: "Women/Children",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Persistent unwanted contact, monitoring online activity, defamatory comments or harassment.",
  },
  {
    id: "impersonation",
    label: "Impersonation / Fake Profile",
    parent: "Other Cyber Crime",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Creating counterfeit profile of a person, government officer, or bank executive.",
  },
  {
    id: "account_takeover",
    label: "Social Media / Email Account Hacking",
    parent: "Other Cyber Crime",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Unauthorized access, password changed, credentials stolen via phishing or spyware.",
  },
  {
    id: "malware_ransomware",
    label: "Malware / Ransomware Attack",
    parent: "Other Cyber Crime",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Files encrypted, device locked, demanding ransom in cryptocurrency or digital payment.",
  },
  {
    id: "other_cybercrime",
    label: "Other Cyber Crime",
    parent: "Other Cyber Crime",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Any other digital offence not covered by specific categories above.",
  },
  // ── New NCRP-aligned categories (April 2026) ──────────────────────────────
  {
    id: "digital_arrest",
    label: "Digital Arrest Scam",
    parent: "Other Cyber Crime",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Impersonation of police, CBI, ED, customs, or income-tax officers over video/audio call, threatening illegal arrest unless a payment is made. No such legal procedure exists.",
  },
  {
    id: "romance_scam",
    label: "Romance / Matrimonial Fraud",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Fake relationships on dating, matrimonial, or social sites leading to money transfers, gift demands, or nude photo sharing.",
  },
  {
    id: "fake_customer_care",
    label: "Fake Helpline / Customer Care Fraud",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Fraudster poses as bank, telecom, or e-commerce customer care to extract OTPs, card details, or remote access.",
  },
  {
    id: "government_impersonation",
    label: "Government Official Impersonation",
    parent: "Other Cyber Crime",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Impersonation of a government officer, court official, or regulator (not in digital-arrest pattern) to extract money or personal data.",
  },
  {
    id: "courier_parcel_scam",
    label: "Courier / Parcel Scam",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Fake notification of seized parcel, drugs or contraband found in courier, demanding customs duty or clearance payment.",
  },
  {
    id: "task_scam",
    label: "Task / Like-Subscribe Scam",
    parent: "Financial Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Online task platform (YouTube like, Instagram follow, hotel reviews) requiring deposits to 'unlock' earnings; earnings are never paid out.",
  },
];

export interface TriageResult {
  categoryId: string;
  categoryLabel: string;
  parentCategory: string;
  isFinancialFraud: boolean;
  urgency: "standard" | "urgent" | "golden-hour";
  detectedAmount?: number;
  moneyMoved: boolean;
  reasoning: string;
  /** Set to true when categoryId is "digital_arrest" — triggers interrupt-screen redirect */
  isDigitalArrest?: boolean;
  /** Identifies whether the result came from AI or the deterministic rule engine */
  source?: "ai" | "deterministic";
}

export function parseFinancialAmount(text?: string | null): number | undefined {
  if (!text || typeof text !== "string") return undefined;
  // Guard against ReDoS on hostile inputs
  const lower = text.slice(0, 4000).toLowerCase();

  // Pattern for "X lakh"
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac)/);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  // Pattern for "X k"
  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k(?:\s|$|[^\w])/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  // Pattern for Rs / INR / ₹ / rupees / numbers
  const numMatch = lower.match(/(?:(?:rs\.?|inr|₹)\s*(\d[\d,]*)|(\d[\d,]*)\s*(?:rs|inr|₹|rupees|went out|lost|deducted))/);
  if (numMatch) {
    const raw = (numMatch[1] || numMatch[2]).replace(/,/g, "");
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) return val;
  }

  // Standalone large numbers (>= 500 and <= 10,000,000)
  const standaloneMatch = lower.match(/\b(\d{3,7})\b/);
  if (standaloneMatch) {
    const val = parseFloat(standaloneMatch[1]);
    if (val >= 500 && val <= 10000000) return val;
  }

  return undefined;
}

export function classifyNarrative(narrative?: string | null): TriageResult {
  // Safe input coercion
  if (!narrative || typeof narrative !== "string") {
    narrative = "";
  }

  // Bound length for hostile inputs
  const safeText = narrative.slice(0, 5000);
  const text = safeText.toLowerCase().trim();
  const detectedAmount = parseFinancialAmount(safeText);

  // ── PRIORITY 0: Digital Arrest Scam ────────────────────────────────────────
  // Must fire before every other branch — I4C advisory Jan 2024 / MHA Apr 2026.
  const hasDigitalArrestSignal =
    text.includes("digital arrest") ||
    text.includes("cbi officer") ||
    text.includes("enforcement directorate") ||
    text.includes("income tax officer") ||
    text.includes("income tax department") ||
    text.includes("narcotics control") ||
    text.includes("police custody") ||
    text.includes("fake arrest") ||
    text.includes("stay on the line") ||
    text.includes("do not disconnect") ||
    (text.includes("arrested") && (text.includes("parcel") || text.includes("courier") || text.includes("drugs"))) ||
    (text.includes("video call") && (text.includes("police") || text.includes("officer") || text.includes("fir")));

  if (hasDigitalArrestSignal) {
    return {
      categoryId: "digital_arrest",
      categoryLabel: "Digital Arrest Scam",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "urgent",
      detectedAmount,
      moneyMoved: false,
      reasoning:
        "Digital arrest pattern detected. This is a known scam — no law in India permits 'digital arrest'. Routing to emergency interrupt screen.",
      isDigitalArrest: true,
      source: "deterministic",
    };
  }

  // 1. Filler and greeting detection
  const stripped = text.replace(/[^a-z0-9]/g, " ").trim();
  const fillerList = [
    "",
    "hello",
    "hi",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
    "test",
    "testing",
    "please help",
    "help me",
    "hello sir",
    "hi sir",
    "hello madam",
    "hi madam",
    "ok",
    "okay",
  ];
  if (fillerList.includes(stripped)) {
    return {
      categoryId: "other_cybercrime",
      categoryLabel: "Other Cyber Crime",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "standard",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "No actionable cybercrime indicators detected in greeting or test input.",
      source: "deterministic",
    };
  }

  // Money movement indicators
  const moneyMovedIndicators = [
    "rupees went out",
    "money went out",
    "money left",
    "debited",
    "transferred money",
    "deducted",
    "lost money",
    "stolen money",
    "sent money",
    "went out of my account",
  ];
  const moneyMoved = moneyMovedIndicators.some((kw) => text.includes(kw)) || !!detectedAmount;

  // 2. Child Safety & Minor Protection (Priority 1 for citizen safety)
  if (
    text.includes("child") ||
    text.includes("minor") ||
    text.includes("csam") ||
    text.includes("underage") ||
    text.includes("child abuse") ||
    text.includes("grooming") ||
    text.includes("child safety")
  ) {
    return {
      categoryId: "child_safety",
      categoryLabel: "Child Related Cyber Crime / CSAM",
      parentCategory: "Women/Children",
      isFinancialFraud: false,
      urgency: "urgent",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Critical child protection indicators detected. Direct routing to Women and Child cyber cell.",
    };
  }

  // 3. Sextortion & Private Imagery Blackmail
  if (
    text.includes("sextortion") ||
    text.includes("private photo") ||
    text.includes("private picture") ||
    text.includes("video call blackmail") ||
    text.includes("nude") ||
    text.includes("morphed photo") ||
    text.includes("morphing")
  ) {
    return {
      categoryId: "sextortion",
      categoryLabel: "Sextortion / Threatening with Private Photos",
      parentCategory: "Women/Children",
      isFinancialFraud: false,
      urgency: "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Matched based on intimidation or extortion involving private imagery or sensitive video communication.",
    };
  }

  // 4. Cyber Blackmailing & Cyber Stalking
  if (text.includes("cyber stalking") || text.includes("stalking") || text.includes("bullying") || text.includes("unwanted messages")) {
    return {
      categoryId: "cyber_stalking",
      categoryLabel: "Cyber Stalking & Bullying",
      parentCategory: "Women/Children",
      isFinancialFraud: false,
      urgency: "standard",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Matched persistent unwanted monitoring or online bullying.",
    };
  }

  if (text.includes("cyber blackmail") || text.includes("blackmailing") || text.includes("harassment") || text.includes("threatening messages")) {
    return {
      categoryId: "cyber_blackmail",
      categoryLabel: "Cyber Blackmailing & Harassment",
      parentCategory: "Women/Children",
      isFinancialFraud: false,
      urgency: "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Matched abusive digital harassment or persistent blackmail patterns.",
    };
  }

  // 5. Financial Crimes
  if (
    text.includes("upi") ||
    text.includes("phonepe") ||
    text.includes("gpay") ||
    text.includes("paytm") ||
    text.includes("qr code") ||
    text.includes("collect request") ||
    text.includes("vpa")
  ) {
    return {
      categoryId: "upi_fraud",
      categoryLabel: "UPI Related Fraud",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Identified UPI payment mechanism / application scam. Emergency golden-hour intervention prioritized.",
    };
  }

  if (
    text.includes("task") ||
    text.includes("part time job") ||
    text.includes("part-time job") ||
    text.includes("youtube like") ||
    text.includes("instagram follow") ||
    text.includes("prepaid task") ||
    text.includes("task platform") ||
    text.includes("task app")
  ) {
    return {
      categoryId: "task_scam",
      categoryLabel: "Task / Like-Subscribe Scam",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Categorized as task/like-subscribe employment scam involving fraudulent deposit requests.",
      source: "deterministic",
    };
  }

  if (
    text.includes("work from home") ||
    text.includes("telegram group") ||
    (text.includes("daily") && text.includes("promising"))
  ) {
    return {
      categoryId: "job_scam",
      categoryLabel: "Work from Home / Part-Time Job Scam",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Categorized as work-from-home employment scam involving fraudulent deposit requests.",
      source: "deterministic",
    };
  }

  // Romance / matrimonial scam
  if (
    text.includes("dating") ||
    text.includes("matrimonial") ||
    text.includes("met online") ||
    text.includes("online friend") ||
    text.includes("chat app") ||
    text.includes("shaadi") ||
    text.includes("fell in love")
  ) {
    return {
      categoryId: "romance_scam",
      categoryLabel: "Romance / Matrimonial Fraud",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Romance or matrimonial fraud pattern detected — money transfer following online relationship.",
      source: "deterministic",
    };
  }

  // Fake customer care / helpline
  if (
    text.includes("customer care") ||
    text.includes("helpline") ||
    text.includes("support number") ||
    text.includes("toll free") ||
    text.includes("called bank")
  ) {
    return {
      categoryId: "fake_customer_care",
      categoryLabel: "Fake Helpline / Customer Care Fraud",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Fake customer care / helpline impersonation detected.",
      source: "deterministic",
    };
  }

  // Courier / parcel scam (without digital arrest angle)
  if (
    text.includes("parcel") ||
    text.includes("courier") ||
    text.includes("customs duty") ||
    text.includes("clearance fee") ||
    text.includes("package seized")
  ) {
    return {
      categoryId: "courier_parcel_scam",
      categoryLabel: "Courier / Parcel Scam",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Courier or parcel scam detected — fake customs duty or clearance payment demand.",
      source: "deterministic",
    };
  }

  // Government official impersonation (non-digital-arrest pattern)
  if (
    text.includes("government official") ||
    text.includes("officer impersonation") ||
    text.includes("court official") ||
    text.includes("magistrate calling") ||
    text.includes("impersonating a government") ||
    text.includes("fake government")
  ) {
    return {
      categoryId: "government_impersonation",
      categoryLabel: "Government Official Impersonation",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "urgent",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Government official impersonation detected outside digital-arrest pattern.",
      source: "deterministic",
    };
  }

  if (
    text.includes("loan app") ||
    text.includes("instant loan") ||
    text.includes("harassing my contacts") ||
    text.includes("recovery agent") ||
    text.includes("illegal loan")
  ) {
    return {
      categoryId: "loan_app_scam",
      categoryLabel: "Illegal Loan App / Extortion",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Identified illegal lending application harassment and extortion pattern.",
    };
  }

  if (
    text.includes("crypto") ||
    text.includes("trading") ||
    text.includes("investment") ||
    text.includes("stock market") ||
    text.includes("high return") ||
    text.includes("forex")
  ) {
    return {
      categoryId: "investment_scam",
      categoryLabel: "Online Investment / Trading Scam",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Detected fraudulent investment scheme promising unrealistic financial returns.",
    };
  }

  if (
    text.includes("credit card") ||
    text.includes("debit card") ||
    text.includes("atm") ||
    text.includes("cvv") ||
    text.includes("card skimming") ||
    text.includes("card blocked")
  ) {
    return {
      categoryId: "card_fraud",
      categoryLabel: "Credit / Debit Card Fraud",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Identified payment card unauthorized charge or credential compromise.",
    };
  }

  if (text.includes("sim swap") || text.includes("telecom fraud") || text.includes("esim") || text.includes("no network")) {
    return {
      categoryId: "sim_swap",
      categoryLabel: "SIM Swap / Telecom Fraud",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: "golden-hour",
      detectedAmount,
      moneyMoved,
      reasoning: "Critical telecom SIM swap vector detected. Phone number takeover threatens associated bank accounts.",
    };
  }

  if (
    text.includes("net banking") ||
    text.includes("phishing") ||
    text.includes("otp") ||
    text.includes("bank") ||
    text.includes("anydesk") ||
    text.includes("teamviewer") ||
    text.includes("rustdesk") ||
    moneyMoved
  ) {
    return {
      categoryId: "net_banking",
      categoryLabel: "Internet Banking / Phishing Fraud",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Detected unauthorized banking transaction or deceptive credential theft via phishing or remote access.",
    };
  }

  // 6. Other Cyber Crimes
  if (
    text.includes("impersonation") ||
    text.includes("fake profile") ||
    text.includes("counterfeit profile") ||
    text.includes("counterfeit account")
  ) {
    return {
      categoryId: "impersonation",
      categoryLabel: "Impersonation / Fake Profile",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "standard",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Matched counterfeit identity or impersonation of person or organization.",
    };
  }

  if (
    text.includes("ransomware") ||
    text.includes("malware") ||
    text.includes("files encrypted") ||
    text.includes("encrypted") ||
    text.includes("virus")
  ) {
    return {
      categoryId: "malware_ransomware",
      categoryLabel: "Malware / Ransomware Attack",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "urgent",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Detected device compromise, malicious software infection, or ransomware encryption.",
    };
  }

  if (text.includes("account takeover") || text.includes("instagram") || text.includes("facebook") || text.includes("whatsapp hacked") || text.includes("hacked")) {
    return {
      categoryId: "account_takeover",
      categoryLabel: "Social Media / Email Account Hacking",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "standard",
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Matched social media or email service unauthorized credential compromise.",
    };
  }

  // Fallback
  return {
    categoryId: "other_cybercrime",
    categoryLabel: "Other Cyber Crime",
    parentCategory: "Other Cyber Crime",
    isFinancialFraud: moneyMoved,
    urgency: moneyMoved ? "golden-hour" : "standard",
    detectedAmount,
    moneyMoved,
    reasoning: "General digital offence report. You may adjust the category during final review.",
    source: "deterministic",
  };
}
