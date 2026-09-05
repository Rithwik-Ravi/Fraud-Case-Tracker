export interface Category {
  id: string;
  label: string;
  parent: "Financial Fraud" | "Women/Children" | "Other Cyber Crime";
  isFinancial: boolean;
  defaultUrgency: "standard" | "urgent" | "golden-hour";
  description: string;
}

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
}

export function parseFinancialAmount(text: string): number | undefined {
  // Matches ₹ 50,000, Rs 50000, 50k, 1.5 lakh, 62000 rupees
  const lower = text.toLowerCase();

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

  // Standalone large numbers (>= 500)
  const standaloneMatch = lower.match(/\b(\d{3,7})\b/);
  if (standaloneMatch) {
    const val = parseFloat(standaloneMatch[1]);
    if (val >= 500 && val <= 10000000) return val;
  }

  return undefined;
}

export function classifyNarrative(narrative: string): TriageResult {
  const text = narrative.toLowerCase();
  const detectedAmount = parseFinancialAmount(narrative);

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

  // Rule matching in priority order
  if (text.includes("private photo") || text.includes("video call") || text.includes("sextortion") || text.includes("nude") || text.includes("blackmail")) {
    return {
      categoryId: "sextortion",
      categoryLabel: "Sextortion / Threatening with Private Photos",
      parentCategory: "Women/Children",
      isFinancialFraud: moneyMoved,
      urgency: "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Matched based on intimidation or extortion involving private imagery or sensitive video communication.",
    };
  }

  if (text.includes("upi") || text.includes("phonepe") || text.includes("gpay") || text.includes("paytm") || text.includes("qr code") || text.includes("collect request")) {
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

  if (text.includes("task") || text.includes("part time") || text.includes("telegram group") || text.includes("youtube like") || text.includes("prepaid task")) {
    return {
      categoryId: "job_scam",
      categoryLabel: "Work from Home / Part-Time Job Scam",
      parentCategory: "Financial Fraud",
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      detectedAmount,
      moneyMoved,
      reasoning: "Categorized as part-time task employment scam involving fraudulent deposit requests.",
    };
  }

  if (text.includes("loan app") || text.includes("instant loan") || text.includes("harassing my contacts") || text.includes("recovery agent")) {
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

  if (text.includes("crypto") || text.includes("trading") || text.includes("investment") || text.includes("stock market") || text.includes("high return")) {
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

  if (text.includes("credit card") || text.includes("debit card") || text.includes("atm") || text.includes("cvv") || text.includes("card blocked")) {
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

  if (text.includes("sim swap") || text.includes("no network") || text.includes("esim")) {
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

  if (text.includes("otp") || text.includes("bank") || text.includes("link") || text.includes("anrdesk") || text.includes("teamviewer") || text.includes("rustdesk") || moneyMoved) {
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

  if (text.includes("instagram") || text.includes("facebook") || text.includes("whatsapp") || text.includes("hacked") || text.includes("password")) {
    return {
      categoryId: "account_takeover",
      categoryLabel: "Social Media / Email Account Hacking",
      parentCategory: "Other Cyber Crime",
      isFinancialFraud: false,
      urgency: "standard",
      detectedAmount,
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
  };
}
