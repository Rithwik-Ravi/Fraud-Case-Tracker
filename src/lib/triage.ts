export type NcrpSection = "WOMEN_CHILDREN" | "FINANCIAL" | "OTHER";
export type PriorityDeskType = "banking_freeze" | "safety_desk" | "system_containment" | "none";

export interface Category {
  id: string;
  label: string;
  section: NcrpSection;
  parent: "Women/Children" | "Financial Fraud" | "Other Cyber Crime";
  subCategory: string;
  isFinancial: boolean;
  defaultUrgency: "standard" | "urgent" | "golden-hour";
  description: string;
  priorityDeskType: PriorityDeskType;
  statutoryCitations: string[];
  evidenceChecklist: string[];
}

/**
 * Subset of Category IDs that trigger special UX flows (e.g., interrupt screens).
 */
export const SPECIAL_ROUTE_CATEGORIES = ["digital_arrest"] as const;
export type SpecialRouteCategory = (typeof SPECIAL_ROUTE_CATEGORIES)[number];

export const CATEGORIES: Category[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // PILLAR 1: WOMEN & CHILDREN RELATED CRIME (Section: WOMEN_CHILDREN)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "child_safety",
    label: "Child Related Cyber Crime / CSAM",
    section: "WOMEN_CHILDREN",
    parent: "Women/Children",
    subCategory: "Child Pornography / CSAM (POCSO)",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Child sexual abuse material, grooming, online exploitation of minors, or child cyber harassment.",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["Section 67B IT Act", "POCSO Act Sections 13, 14, 15", "BNS Section 95"],
    evidenceChecklist: ["Screenshots of abusive messages / links", "Website / group URLs", "Suspect contact / handle", "Platform chat exports (unredacted)"],
  },
  {
    id: "sextortion",
    label: "Sextortion / Video Call Extortion",
    section: "WOMEN_CHILDREN",
    parent: "Women/Children",
    subCategory: "Sextortion & Private Imagery Blackmail",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Video call blackmail, morphing private pictures, demanding money under threat of leaking sensitive media.",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["Section 66E IT Act (Privacy violation)", "Section 67/67A IT Act", "BNS Section 308 (Extortion)", "BNS Section 351"],
    evidenceChecklist: ["Chat logs & extortion demands", "Video call duration logs & suspect number", "Account / UPI handles where money was demanded", "Do NOT pay ransom or delete chat records"],
  },
  {
    id: "cyber_blackmail",
    label: "Cyber Blackmailing & Threatening",
    section: "WOMEN_CHILDREN",
    parent: "Women/Children",
    subCategory: "Blackmailing & Intimidation",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Threatening messages, continuous intimidation, blackmailing over chat or social media.",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["BNS Section 351 (Criminal Intimidation)", "Section 66D IT Act", "BNS Section 79 (Outraging modesty of women)"],
    evidenceChecklist: ["Screenshots of threatening messages", "Caller ID / phone number records", "Social media profile links", "Date and time stamps of intimidation"],
  },
  {
    id: "cyber_stalking",
    label: "Cyber Stalking & Bullying",
    section: "WOMEN_CHILDREN",
    parent: "Women/Children",
    subCategory: "Persistent Stalking & Harassment",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Persistent unwanted contact, monitoring online activity, defamatory comments, or online harassment.",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["BNS Section 78 (Stalking)", "Section 66 IT Act", "BNS Section 79"],
    evidenceChecklist: ["Chronological record of unwanted messages / calls", "Social profile URLs of the stalker", "Screenshots showing persistent harassment", "Call logs showing repeated attempts"],
  },
  {
    id: "wc_defamation",
    label: "Defamation / Morphed Pictures on Social Media",
    section: "WOMEN_CHILDREN",
    parent: "Women/Children",
    subCategory: "Defamation & Deepfakes",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Publishing morphed, deepfake, or defamatory photographs/videos of women or children on public platforms.",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["BNS Section 356 (Defamation)", "Section 66E IT Act", "Section 67 IT Act", "IT Rule 3(2)(b) (24-hour non-consensual imagery takedown)"],
    evidenceChecklist: ["Live URL of defamatory posts / profiles", "Original photo for comparison", "Screenshots preserving timestamp and poster handle", "Comments / shares amplifying the post"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PILLAR 2: FINANCIAL FRAUD (Section: FINANCIAL)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "upi_fraud",
    label: "UPI Related Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "UPI Fraud / QR Code Scam",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Fraudulent debit via UPI, fake collect request, QR code scam, or PhonePe/GPay impersonation.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66D IT Act (Cheating by personation)", "BNS Section 318(4) (Cheating)", "1930 / CFCFRMS Inter-bank Lien Protocol"],
    evidenceChecklist: ["12-Digit Transaction Reference (UTR)", "Bank account statement showing debit", "Screenshot of UPI transaction receipt / VPA", "Suspect UPI ID / Mobile number"],
  },
  {
    id: "net_banking",
    label: "Internet Banking / Phishing Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Net Banking / Phishing Links",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Unauthorized net banking transfer, phishing login link, or remote access app (AnyDesk/TeamViewer).",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66D IT Act", "BNS Section 318(4)", "RBI Circular on Customer Liability (3-Day Zero Liability)"],
    evidenceChecklist: ["Bank statement showing debit", "12-digit UTR / IMPS / NEFT reference", "SMS notifications received from bank", "Phishing URL or name of remote access app installed"],
  },
  {
    id: "card_fraud",
    label: "Credit / Debit Card Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Card Skimming / Unauthorized Swipe",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Unauthorized ATM withdrawal, POS swipe, card skimming, or online card transaction without OTP.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66C IT Act (Identity theft)", "Section 66D IT Act", "BNS Section 318(4)"],
    evidenceChecklist: ["Copy of bank card statement highlighting debit", "SMS alert received from card issuer", "Confirmation whether card is physically in possession", "Merchant name mentioned in transaction alert"],
  },
  {
    id: "investment_scam",
    label: "Online Investment / Trading Scam",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Fake Trading Apps & Stock Schemes",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "High return promise, fake crypto trading app, Telegram investment group, or institutional stock tip scam.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 318(4)", "Section 66D IT Act", "SEBI Act Section 12A (Fraudulent trading practices)"],
    evidenceChecklist: ["Beneficiary bank account / UPI IDs where deposits were sent", "Bank transfer UTR receipts", "Chat history from Telegram / WhatsApp group", "Screenshots of fake portfolio / profit display app"],
  },
  {
    id: "job_scam",
    label: "Work from Home / Part-Time Job Scam",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Task & Like-Subscribe Employment Scam",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Task scam, YouTube video like/subscribe fraud, daily payment promise requiring deposits to unlock funds.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 318(4)", "Section 66D IT Act"],
    evidenceChecklist: ["Deposit UTR numbers & recipient bank accounts", "Telegram / WhatsApp recruitment chat history", "Screenshots of task platform dashboard", "Job offer message / SMS received"],
  },
  {
    id: "task_scam",
    label: "Task / Like-Subscribe Scam",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Prepaid Task Platform Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Online task platform (YouTube like, Instagram follow, hotel reviews) requiring deposits to 'unlock' earnings.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 318(4)", "Section 66D IT Act"],
    evidenceChecklist: ["Deposit receipts / UTRs", "Task platform URL / APK", "Telegram admin handle", "Chat screenshots"],
  },
  {
    id: "loan_app_scam",
    label: "Illegal Loan App / Extortion",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Predatory Instant Loan Apps",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Instant loan disbursed without request, predatory interest, unauthorized contact book access and threatening calls.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 308 (Extortion)", "BNS Section 351", "RBI Digital Lending Guidelines 2022", "Section 66E IT Act"],
    evidenceChecklist: ["Name of the loan app / APK file", "Bank statement showing disbursed amount & repayments", "Audio recordings of recovery agent threats", "Screenshots of defamatory messages sent to your contacts"],
  },
  {
    id: "sim_swap",
    label: "SIM Swap / Telecom Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "SIM Cloning & Telecom Takeover",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Fraudulent SIM card deactivation and duplication to intercept banking SMS, OTPs, and WhatsApp.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66C IT Act", "Section 66D IT Act", "Indian Telegraph Act Section 25"],
    evidenceChecklist: ["Exact time network signal was lost", "Telecom service provider complaint reference", "Bank accounts linked to the swapped mobile number", "Any unauthorized debits occurred during network outage"],
  },
  {
    id: "fin_demat",
    label: "Demat / Stock Trading Account Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Demat Compromise & Unauthorized Trade",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Unauthorized access to stock broking account, unauthorized sale of holdings, or fund diversion.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66C/D IT Act", "BNS Section 318(4)", "SEBI Circular on Cyber Security"],
    evidenceChecklist: ["Broker name & Demat Client ID", "Contract note of unauthorized trades", "Bank statement showing fund payout", "IP login alert email from broker"],
  },
  {
    id: "fin_aeps",
    label: "AEPS / Biometric / Aadhaar Banking Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Aadhaar Enabled Payment System Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Unauthorized cash withdrawal from bank account using cloned Aadhaar fingerprints via AEPS merchant points.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Aadhaar Act Section 42/43", "Section 66C/D IT Act", "BNS Section 318(4)"],
    evidenceChecklist: ["Bank account statement showing AEPS withdrawal", "Bank branch complaint copy", "Confirmation whether Aadhaar biometric was locked on UIDAI portal", "Transaction ID & location of Business Correspondent (BC)"],
  },
  {
    id: "fake_customer_care",
    label: "Fake Helpline / Customer Care Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Search Engine Fake Helpline Fraud",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Fraudster poses as bank, airline, courier, or telecom customer care via Google search numbers to extract money/OTPs.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66D IT Act", "BNS Section 318(4)"],
    evidenceChecklist: ["Phone number called from Google search", "12-digit UTR of debited amount", "Bank account statement", "Call duration logs"],
  },
  {
    id: "courier_parcel_scam",
    label: "Courier / Parcel Scam",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Fake Customs & Seized Parcel Fee",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Fake notification of seized parcel, drugs or contraband found in courier, demanding customs duty or clearance payment.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 308 (Extortion)", "BNS Section 318(4)", "Section 66D IT Act"],
    evidenceChecklist: ["Fake courier tracking link / SMS", "Payment receipts / UTRs transferred", "Caller contact numbers", "Bank account numbers given for deposit"],
  },
  {
    id: "romance_scam",
    label: "Romance / Matrimonial Fraud",
    section: "FINANCIAL",
    parent: "Financial Fraud",
    subCategory: "Matrimonial & Dating App Fraud",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Fake relationships on dating, matrimonial, or social sites leading to money transfers under pretexts of gifts or customs clearance.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 318(4) (Cheating)", "Section 66D IT Act"],
    evidenceChecklist: ["Matrimonial / dating app profile link", "Complete chat history", "Bank accounts where money was deposited", "Receipts of wire transfers / UTRs"],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PILLAR 3: OTHER CYBER CRIME (Section: OTHER)
  // ══════════════════════════════════════════════════════════════════════════
  // Subcategory: Online & Social Media Crimes
  {
    id: "impersonation",
    label: "Impersonation / Fake Profile",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Social Media Impersonation",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Creating counterfeit profile of a person, influencer, government official, or brand to deceive others.",
    priorityDeskType: "none",
    statutoryCitations: ["Section 66D IT Act (Cheating by personation)", "BNS Section 319 (Cheating by personation)"],
    evidenceChecklist: ["URL of the fake / imposter profile", "URL of genuine profile for verification", "Screenshots of imposter bio and posts", "Messages sent by fake profile to contacts"],
  },
  {
    id: "account_takeover",
    label: "Social Media / Email Account Hacking",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Account Hijack & Compromise",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Unauthorized access, password changed, recovery email altered via phishing or credential stuffing.",
    priorityDeskType: "none",
    statutoryCitations: ["Section 43/66 IT Act (Unauthorized computer access)", "Section 66C IT Act (Identity theft)"],
    evidenceChecklist: ["Compromised handle / email address", "Security alert email from platform notifying changes", "Approximate date and time of lockout", "Screenshots of any unauthorized posts or DMs sent"],
  },
  {
    id: "soc_cyberbullying",
    label: "Cyber Bullying & Online Trolling",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Online Harassment & Bullying",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Coordinated online trolling, abusive comment storms, or targeted harassment on social media.",
    priorityDeskType: "none",
    statutoryCitations: ["Section 66 IT Act", "BNS Section 352 (Intentional insult)"],
    evidenceChecklist: ["Post URLs containing abusive content", "Handles of offending accounts", "Screenshots with timestamps", "Platform report reference tickets"],
  },

  // Subcategory: Hacking / Defacement
  {
    id: "hack_defacement",
    label: "Website Defacement",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Website Defacement & Unauthorized Alteration",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Unauthorized alteration of website appearance, hacking into web server, inserting hacker splash pages.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43/66 IT Act (Data tampering and hacking)", "Section 66F IT Act (if critical information infrastructure)"],
    evidenceChecklist: ["Defaced webpage URL & archive/screenshot", "Server web access and error logs (last 48 hours)", "FTP / SSH login logs and source IP addresses", "Hosting provider ticket & timestamp of incident"],
  },
  {
    id: "hack_server_breach",
    label: "Unauthorized Server Access / Breach",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Server Intrusion & Database Breach",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Unauthorized intrusion into cloud infrastructure, internal databases, or enterprise computer systems.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43/66 IT Act", "Digital Personal Data Protection (DPDP) Act 2023 Sec 8(6)"],
    evidenceChecklist: ["Firewall & authentication logs showing unauthorized IP", "Target domain / IP / cloud instance ID", "Compromised user / admin accounts", "Indicators of Compromise (IOCs) and timestamp"],
  },
  {
    id: "hack_data_theft",
    label: "Data / Privacy Theft & Corporate Exfiltration",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Data Exfiltration & Privacy Leak",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Theft of confidential business data, employee records, customer personal data, or proprietary source code.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43(b)/66 IT Act", "DPDP Act 2023", "BNS Section 316 (Criminal breach of trust)"],
    evidenceChecklist: ["Description of exfiltrated data categories", "Data transfer logs / outbound traffic metrics", "Suspect employee or contractor credentials if insider threat", "Dark web leak forum links if publicly advertised"],
  },

  // Subcategory: Ransomware & Malware
  {
    id: "malware_ransomware",
    label: "Malware / Ransomware Attack",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Ransomware & System Encryption",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Files encrypted, enterprise systems locked, demanding ransom in cryptocurrency or digital payment.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43/66 IT Act", "BNS Section 308 (Extortion)", "CERT-In Cyber Security Directions 2022"],
    evidenceChecklist: ["Copy of the Ransom Note text file (.txt / .html)", "File extension appended to encrypted files (e.g., .locked, .phobos)", "Attacker email address / Tor portal link from ransom note", "Attacker Cryptocurrency wallet address (BTC/XMR) if specified"],
  },
  {
    id: "rans_cryptojacking",
    label: "Cryptojacking / Unauthorized Resource Mining",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Cryptojacking & CPU Theft",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Secret deployment of cryptocurrency mining malware on servers, devices, or cloud containers causing 100% CPU usage.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43/66 IT Act"],
    evidenceChecklist: ["Server process monitoring logs showing mining binary", "Outbound network mining pool connection IPs/ports", "Compromised service / entry vector", "Cloud billing spike evidence"],
  },

  // Subcategory: Cryptocurrency Crime
  {
    id: "crypto_wallet_drain",
    label: "Cryptocurrency Crime / Wallet Drain",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Crypto Wallet Drain & Smart Contract Phishing",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Drain of crypto assets from Web3 wallet (MetaMask/Phantom) via malicious smart contract permit signature or seed phrase theft.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 66D IT Act", "BNS Section 318(4)", "FIU-IND Anti-Money Laundering Framework"],
    evidenceChecklist: ["Victim Web3 wallet address (Public key)", "Suspect recipient wallet address", "Blockchain transaction hash (TxID / TxHash)", "Blockchain network (Ethereum, Bitcoin, TRON, BSC, Solana)", "Centralized exchange name if funds were deposited to Binance/CoinDCX/WazirX"],
  },
  {
    id: "crypto_token_scam",
    label: "Fraudulent Crypto Token / Fake Exchange",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Rugpull & Fake Crypto Exchange",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Fake cryptocurrency exchange platform that locks deposits or rugpull token with unwithdrawable liquidity.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["BNS Section 318(4)", "Section 66D IT Act"],
    evidenceChecklist: ["Fake exchange website URL", "Deposit TxIDs or bank transfer receipts", "Telegram / WhatsApp referral channel link", "Promoter handles & admin crypto addresses"],
  },

  // Subcategory: Mobile Crimes
  {
    id: "mob_malicious_apk",
    label: "Malicious Mobile APK / Device Spyware",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Malicious Android APK & Spyware",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Deceptive APK installation (e.g. electricity bill update, e-challan, PM scheme) stealing OTPs and accessibility access.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43/66 IT Act", "Section 66C/D IT Act"],
    evidenceChecklist: ["Name of the malicious APK or download URL", "Source phone number or WhatsApp chat where APK was received", "Device model and Android version", "List of bank or payment apps compromised on the device"],
  },
  {
    id: "mob_msg_hijack",
    label: "WhatsApp / Telegram Account Hijacking",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Messaging App Hijack",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Account hijacked via verification code sharing or QR code scanning, sending distress money requests to contacts.",
    priorityDeskType: "none",
    statutoryCitations: ["Section 66C IT Act", "Section 66D IT Act"],
    evidenceChecklist: ["Mobile number associated with the account", "Approximate time of account lockout", "Screenshots of emergency money requests sent to your friends/family", "Two-step verification status"],
  },

  // Subcategory: Online Trafficking
  {
    id: "traffick_human",
    label: "Online Trafficking / Cyber Recruitment Fraud",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Human Trafficking & Forced Cyber Slavery",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Deceptive overseas job offers leading to forced detention in cyber scam call centers (Southeast Asia / Cambodia / Myanmar).",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["BNS Section 143 (Trafficking of persons)", "Emigration Act 1983", "Section 66D IT Act"],
    evidenceChecklist: ["Recruitment agent name, phone number, and agency URL", "Flight ticket and tourist visa documentation provided", "Location / GPS pins shared by victim abroad", "Telegram / messaging coordinates of handlers"],
  },
  {
    id: "traffick_illegal_goods",
    label: "Illegal Goods / Darknet Marketplace",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Darknet Sales & Contraband",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Online sale or solicitation of banned narcotics, firearms, or illegal contraband over darknet or encrypted channels.",
    priorityDeskType: "none",
    statutoryCitations: ["Narcotic Drugs and Psychotropic Substances (NDPS) Act", "Arms Act", "Section 66 IT Act"],
    evidenceChecklist: ["Website / marketplace URL (.onion link or surface web)", "Telegram channel / seller handle", "Payment method requested (Crypto wallet or UPI)", "Chat transcript or advertisement copy"],
  },

  // Subcategory: Online Gambling
  {
    id: "gamble_betting",
    label: "Illegal Online Betting / Gambling Apps",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Illegal Betting Apps & Hawala Routing",
    isFinancial: true,
    defaultUrgency: "urgent",
    description: "Illegal offshore betting portals (IPL betting, color prediction, casino apps) laundering funds through mule bank accounts.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Public Gambling Act 1867", "Prevention of Money Laundering Act (PMLA)", "Section 66D IT Act"],
    evidenceChecklist: ["Betting app / website URL", "Mule bank accounts or UPI IDs where deposits were routed", "UTR transaction receipts", "Influencer / promoter handle who shared referral link"],
  },

  // Subcategory: Special & Any Other Cyber Crime
  {
    id: "digital_arrest",
    label: "Digital Arrest Scam",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Impersonation of Law Enforcement & Video Arrest",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Impersonation of police, CBI, ED, customs, or income-tax officers over video/audio call, threatening illegal arrest unless money is paid into 'verification accounts'. No such legal procedure exists in India.",
    priorityDeskType: "safety_desk",
    statutoryCitations: ["BNS Section 204 (Impersonating a public servant)", "BNS Section 308 (Extortion)", "BNS Section 318(4)", "Section 66D IT Act"],
    evidenceChecklist: ["Caller phone numbers & Skype/WhatsApp IDs", "Screenshots of fake arrest warrants / CBI letterheads", "Bank accounts provided for 'verification transfer'", "Video call screenshot showing fake police station backdrop"],
  },
  {
    id: "other_email_spoofing",
    label: "Email Spoofing / Business Email Compromise",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Email Spoofing & BEC",
    isFinancial: true,
    defaultUrgency: "golden-hour",
    description: "Spoofed vendor or executive email instructing finance department to alter supplier bank account details.",
    priorityDeskType: "banking_freeze",
    statutoryCitations: ["Section 66C/D IT Act", "BNS Section 318(4)"],
    evidenceChecklist: ["Original .EML email file with full unedited Internet Headers", "Spoofed sender address vs Return-Path header", "Fraudulent bank account details specified in email", "Wire transfer / RTGS UTR number if payment was executed"],
  },
  {
    id: "other_ddos",
    label: "Denial of Service (DoS / DDoS Attack)",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "DoS / Distributed Denial of Service",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Volumetric flood or application-layer attack causing downtime for commercial website or digital infrastructure.",
    priorityDeskType: "system_containment",
    statutoryCitations: ["Section 43(f)/66 IT Act (Denial of access to authorized computer)"],
    evidenceChecklist: ["Web server bandwidth / packet flood graph", "Source IP address access logs from Cloudflare/AWS/WAF", "Target domain and duration of service outage", "Extortion email / ransom demand if DDoS-for-ransom"],
  },
  {
    id: "government_impersonation",
    label: "Government Official Impersonation",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "Counterfeit Government Authority",
    isFinancial: false,
    defaultUrgency: "urgent",
    description: "Impersonation of a government officer, court official, or regulator outside the digital arrest pattern.",
    priorityDeskType: "none",
    statutoryCitations: ["BNS Section 204", "Section 66D IT Act"],
    evidenceChecklist: ["Contact number or email used by imposter", "Fake identity badge or official letterhead shown", "Demands made", "Date and time of contact"],
  },
  {
    id: "other_cybercrime",
    label: "Any Other Cyber Crime",
    section: "OTHER",
    parent: "Other Cyber Crime",
    subCategory: "General Cyber Offence",
    isFinancial: false,
    defaultUrgency: "standard",
    description: "Any other cyber offence or digital fraud not specifically covered by the above categories.",
    priorityDeskType: "none",
    statutoryCitations: ["Information Technology Act 2000", "Bharatiya Nyaya Sanhita 2023"],
    evidenceChecklist: ["Incident screenshots", "Suspect handles / numbers / URLs", "Date and time sequence of events"],
  },
];

export interface ExtractedFields {
  // ── Common fields across ALL complaints ─────────────────────────────────────
  incidentDate?: string;
  delayReason?: string;
  channel?: string;
  suspectName?: string;
  suspectPhone?: string;
  suspectEmail?: string;
  suspectHandle?: string;
  suspectWebsite?: string;
  suspectAddress?: string;

  // ── Financial Fraud fields (Part A & Part B reconciliation) ─────────────────
  bankName?: string;
  bankAccount?: string;
  suspectAccount?: string;
  amount?: number;
  utrNumber?: string;
  paymentMode?: string;
  merchantName?: string;

  // ── Cryptocurrency Crime fields ─────────────────────────────────────────────
  cryptoNetwork?: string; // BTC, ETH, TRON, BSC, SOL, etc.
  victimWallet?: string;
  suspectWallet?: string;
  transactionHash?: string; // TxID / TxHash
  cryptoExchange?: string;

  // ── Ransomware & Hacking fields ─────────────────────────────────────────────
  encryptedExtension?: string; // e.g. .locked, .phobos
  ransomNoteFile?: string;
  ransomDemanded?: string;
  ransomWalletAddress?: string;
  targetDomain?: string;
  serverIp?: string;
  defacerHandle?: string;
  affectedSystemCount?: number;

  // ── Social Media & Impersonation fields ──────────────────────────────────────
  imposterUrl?: string;
  genuineUrl?: string;
  socialPlatform?: string;
  defamationType?: string;

  // ── Mobile Crime fields ─────────────────────────────────────────────────────
  maliciousApkName?: string;
  deviceType?: string;
  telecomOperator?: string;

  // ── Women & Child Safety fields ─────────────────────────────────────────────
  harassmentMedium?: string;
  threatenedContent?: string;
  extortionDemand?: string;
  reportAnonymously?: boolean;

  // ── Nested Category Specific Fields Object (if provided by AI model) ─────────
  categorySpecificFields?: Record<string, any>;
}

export interface TriageResult {
  categoryId: string;
  categoryLabel: string;
  section: NcrpSection;
  parentCategory: "Women/Children" | "Financial Fraud" | "Other Cyber Crime";
  subCategory: string;
  isFinancialFraud: boolean;
  urgency: "standard" | "urgent" | "golden-hour";
  priorityDeskType: PriorityDeskType;
  statutoryCitations: string[];
  evidenceChecklist: string[];
  detectedAmount?: number;
  moneyMoved: boolean;
  reasoning: string;
  isDigitalArrest?: boolean;
  source?: "ai" | "deterministic";
  extractedFields?: ExtractedFields;
  extractedPills?: string[];
}

export function parseFinancialAmount(text?: string | null): number | undefined {
  if (!text || typeof text !== "string") return undefined;
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

  // Pattern for Rs / INR / ₹ / rupees
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

export function extractDeterministicFields(safeText: string, detectedAmount?: number): ExtractedFields {
  const fields: ExtractedFields = {};

  if (detectedAmount) {
    fields.amount = detectedAmount;
  }

  // 1. Bank Names
  const bankMap: Record<string, string> = {
    "state bank of india": "State Bank of India",
    sbi: "State Bank of India",
    hdfc: "HDFC Bank",
    icici: "ICICI Bank",
    axis: "Axis Bank",
    pnb: "Punjab National Bank",
    "punjab national bank": "Punjab National Bank",
    bob: "Bank of Baroda",
    "bank of baroda": "Bank of Baroda",
    kotak: "Kotak Mahindra Bank",
    canara: "Canara Bank",
    indusind: "IndusInd Bank",
    "union bank": "Union Bank of India",
    paytm: "Paytm Payments Bank",
  };
  for (const [kw, canonical] of Object.entries(bankMap)) {
    if (new RegExp(`\\b${kw}\\b`, "i").test(safeText)) {
      fields.bankName = canonical;
      break;
    }
  }

  // 2. 12-digit UTR
  const utrMatch = safeText.match(/\b([0-9]{12})\b/);
  if (utrMatch) {
    fields.utrNumber = utrMatch[1];
  }

  // 3. Suspect Account / UPI ID
  const vpaMatch = safeText.match(/([a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,64})/);
  if (vpaMatch && !vpaMatch[1].endsWith(".com") && !vpaMatch[1].endsWith(".org") && !vpaMatch[1].endsWith(".in")) {
    fields.suspectAccount = vpaMatch[1];
  }

  // 4. Suspect Mobile Phone
  const phoneMatch = safeText.match(/(?:\+91[\s-]?)?([6-9]\d{9})\b/);
  if (phoneMatch) {
    fields.suspectPhone = phoneMatch[1];
  }

  // 5. Suspect Social Handle
  const handleMatch = safeText.match(/(?<!\w)@([a-zA-Z0-9_\.]{3,30})\b/);
  if (handleMatch) {
    fields.suspectHandle = `@${handleMatch[1]}`;
  }

  // 6. Payment Mode
  if (/\b(?:upi|gpay|google pay|phonepe|paytm|vpa)\b/i.test(safeText)) {
    fields.paymentMode = "UPI";
  } else if (/\b(?:net banking|netbanking|neft|rtgs|imps)\b/i.test(safeText)) {
    fields.paymentMode = "Net Banking";
  } else if (/\b(?:credit card|debit card|atm|pos|card)\b/i.test(safeText)) {
    fields.paymentMode = "Credit/Debit Card";
  } else if (/\b(?:crypto|bitcoin|usdt|eth|ethereum|tron)\b/i.test(safeText)) {
    fields.paymentMode = "Cryptocurrency";
  }

  // 7. Channel
  if (/\b(?:whatsapp|wa)\b/i.test(safeText)) {
    fields.channel = "WhatsApp";
  } else if (/\b(?:telegram|tg)\b/i.test(safeText)) {
    fields.channel = "Telegram";
  } else if (/\b(?:instagram|insta)\b/i.test(safeText)) {
    fields.channel = "Instagram";
  } else if (/\b(?:sms|text message)\b/i.test(safeText)) {
    fields.channel = "SMS";
  } else if (/\b(?:call|phone call|called me|video call)\b/i.test(safeText)) {
    fields.channel = "Phone Call";
  } else if (/\b(?:apk|application|installed)\b/i.test(safeText)) {
    fields.channel = "Malicious APK";
  } else if (/\b(?:email|gmail|outlook)\b/i.test(safeText)) {
    fields.channel = "Email";
  }

  // 8. Incident Timing
  if (/\b(?:today|aaj)\b/i.test(safeText)) {
    fields.incidentDate = "Today";
  } else if (/\b(?:yesterday|kal)\b/i.test(safeText)) {
    fields.incidentDate = "Yesterday";
  }

  // 9. Suspect Alias / Impersonated Identity
  const hindiAlias = safeText.match(/([a-zA-Z\s]{3,30})\s+ban\s+kar/i);
  const engAlias = safeText.match(/(?:pretending to be|claiming to be|impersonating|officer|named|alias)\s+([a-zA-Z\s]{3,30})/i);
  if (hindiAlias) {
    const raw = hindiAlias[1]
      .replace(/^(?:ek\s+vyakti\s+ne|kisi\s+ne|caller|someone|fraudster|scammer|person)\s+/i, "")
      .trim();
    fields.suspectName = raw.charAt(0).toUpperCase() + raw.slice(1);
  } else if (engAlias) {
    const raw = engAlias[1]
      .replace(/^(?:a|an|the)\s+/i, "")
      .trim();
    fields.suspectName = raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  // 10. Web3 Crypto Wallet Address & TxID
  const ethMatch = safeText.match(/\b(0x[a-fA-F0-9]{40})\b/);
  if (ethMatch) {
    fields.suspectWallet = ethMatch[1];
    fields.cryptoNetwork = "Ethereum / EVM";
  }
  const btcMatch = safeText.match(/\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/);
  if (btcMatch) {
    fields.suspectWallet = btcMatch[1];
    fields.cryptoNetwork = "Bitcoin";
  }
  const tronMatch = safeText.match(/\b(T[A-Za-z1-9]{33})\b/);
  if (tronMatch) {
    fields.suspectWallet = tronMatch[1];
    fields.cryptoNetwork = "TRON";
  }
  const txHashMatch = safeText.match(/\b(0x[a-fA-F0-9]{64})\b/);
  if (txHashMatch) {
    fields.transactionHash = txHashMatch[1];
  }

  // 11. Ransomware & Hacking fields
  const extMatch = safeText.match(/\.([a-zA-Z0-9_\-]{4,15})\s+(?:extension|locked|encrypted)/i);
  if (extMatch) {
    fields.encryptedExtension = `.${extMatch[1]}`;
  }
  const domainMatch = safeText.match(/\b([a-zA-Z0-9-]+\.(?:com|org|in|gov\.in|net|io))\b/i);
  if (domainMatch && !domainMatch[1].includes("google") && !domainMatch[1].includes("gmail")) {
    fields.targetDomain = domainMatch[1];
  }
  const ipMatch = safeText.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  if (ipMatch) {
    fields.serverIp = ipMatch[1];
  }

  // 12. APK / Mobile
  const apkMatch = safeText.match(/\b([a-zA-Z0-9._-]+\.apk)\b/i);
  if (apkMatch) {
    fields.maliciousApkName = apkMatch[1];
    fields.channel = "Malicious APK";
  }

  return fields;
}

export function classifyNarrative(narrative?: string | null): TriageResult {
  const result = classifyNarrativeCore(narrative);
  const safeText = (narrative || "").slice(0, 5000);
  const detectedAmount = parseFinancialAmount(safeText);
  result.extractedFields = extractDeterministicFields(safeText, detectedAmount);

  // Build key fact pills for visual UI display
  const pills: string[] = [`Category: ${result.categoryLabel}`];
  if (result.detectedAmount) {
    pills.push(`Loss: ₹${result.detectedAmount.toLocaleString("en-IN")}`);
  }
  if (result.extractedFields?.bankName) {
    pills.push(`Bank: ${result.extractedFields.bankName}`);
  }
  if (result.extractedFields?.utrNumber) {
    pills.push(`UTR: ${result.extractedFields.utrNumber}`);
  }
  if (result.extractedFields?.suspectAccount) {
    pills.push(`Suspect: ${result.extractedFields.suspectAccount}`);
  }
  if (result.extractedFields?.suspectWallet) {
    pills.push(`Wallet: ${result.extractedFields.suspectWallet.slice(0, 10)}...`);
  }
  if (result.extractedFields?.transactionHash) {
    pills.push(`TxHash: ${result.extractedFields.transactionHash.slice(0, 10)}...`);
  }
  if (result.extractedFields?.targetDomain) {
    pills.push(`Domain: ${result.extractedFields.targetDomain}`);
  }
  if (result.extractedFields?.encryptedExtension) {
    pills.push(`Ext: ${result.extractedFields.encryptedExtension}`);
  }
  if (result.extractedFields?.maliciousApkName) {
    pills.push(`APK: ${result.extractedFields.maliciousApkName}`);
  }
  if (result.extractedFields?.channel) {
    pills.push(`Channel: ${result.extractedFields.channel}`);
  }
  result.extractedPills = pills;
  return result;
}

function getCategoryConfig(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

function classifyNarrativeCore(narrative?: string | null): TriageResult {
  if (!narrative || typeof narrative !== "string") {
    narrative = "";
  }

  const safeText = narrative.slice(0, 5000);
  const text = safeText.toLowerCase().trim();
  const detectedAmount = parseFinancialAmount(safeText);

  // ── PRIORITY 0: Digital Arrest Scam ────────────────────────────────────────
  // I4C Advisory / MHA: False claims of police/CBI video arrest.
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
    const config = getCategoryConfig("digital_arrest");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved: false,
      reasoning:
        "Digital arrest pattern detected. There is no procedure under Indian law for digital arrest over a phone or video call.",
      isDigitalArrest: true,
      source: "deterministic",
    };
  }

  // ── PRIORITY 1: Greetings & Filler ─────────────────────────────────────────
  const stripped = text.replace(/[^a-z0-9]/g, " ").trim();
  const fillerList = [
    "", "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
    "namaste", "test", "testing", "please help", "help me", "hello sir", "hi sir", "ok", "okay"
  ];
  if (fillerList.includes(stripped)) {
    const config = getCategoryConfig("other_cybercrime");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "standard",
      priorityDeskType: "none",
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "No actionable cybercrime indicators detected in greeting or test input.",
      source: "deterministic",
    };
  }

  // Money movement indicators
  const moneyMovedIndicators = [
    "rupees went out", "money went out", "money left", "debited", "transferred money",
    "deducted", "lost money", "stolen money", "sent money", "went out of my account",
    "lost ₹", "lost rs"
  ];
  const moneyMoved = moneyMovedIndicators.some((kw) => text.includes(kw)) || !!detectedAmount;

  // ── PRIORITY 2: Child Safety & POCSO (Section: WOMEN_CHILDREN) ─────────────
  if (
    text.includes("child") || text.includes("minor") || text.includes("csam") ||
    text.includes("underage") || text.includes("child abuse") || text.includes("grooming")
  ) {
    const config = getCategoryConfig("child_safety");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Critical child protection indicators detected. Direct routing to Women & Child Cyber Cell.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 3: Sextortion & Video Call Blackmail (Section: WOMEN_CHILDREN) ─
  if (
    text.includes("sextortion") || text.includes("private photo") || text.includes("private picture") ||
    text.includes("video call blackmail") || text.includes("nude") || text.includes("naked video") ||
    text.includes("morphed photo") || text.includes("morphing")
  ) {
    const config = getCategoryConfig("sextortion");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Matched intimidation or extortion involving private media or video call recording. Emergency Safety Desk activated.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 4: Cyber Stalking & Blackmail (Section: WOMEN_CHILDREN) ───────
  if (text.includes("cyber stalking") || text.includes("stalking") || text.includes("following my profile") || text.includes("monitoring my account")) {
    const config = getCategoryConfig("cyber_stalking");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "standard",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Persistent online surveillance or stalking pattern detected under BNS Section 78.",
      source: "deterministic",
    };
  }

  if (text.includes("blackmailing") || text.includes("blackmail") || text.includes("threatening to leak") || text.includes("ruin my reputation")) {
    const config = getCategoryConfig("cyber_blackmail");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Matched abusive digital intimidation and criminal blackmail pattern.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 5: Ransomware & Hacking / Defacement (Section: OTHER) ──────────
  if (
    text.includes("ransomware") || text.includes("files encrypted") || text.includes("locked all files") ||
    text.includes("ransom note") || text.includes(".locked") || text.includes("readme.txt") || text.includes("decrypt files")
  ) {
    const config = getCategoryConfig("malware_ransomware");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Ransomware encryption detected. System containment advisory initiated (disconnect network, isolate backups).",
      source: "deterministic",
    };
  }

  if (
    text.includes("defaced") || text.includes("website hacked") || text.includes("homepage changed") ||
    text.includes("hacker splash") || text.includes("hacked by")
  ) {
    const config = getCategoryConfig("hack_defacement");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Website defacement detected. Preserve web server access logs and capture web page archive.",
      source: "deterministic",
    };
  }

  if (
    text.includes("server breach") || text.includes("database breach") || text.includes("unauthorized server access") ||
    text.includes("root access") || text.includes("ssh hacked") || text.includes("data leak") || text.includes("data theft")
  ) {
    const config = getCategoryConfig("hack_server_breach");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Unauthorized infrastructure breach detected. Preserve firewall and authentication audit trails.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 6: Cryptocurrency Crime (Section: OTHER) ──────────────────────
  if (
    text.includes("crypto") || text.includes("bitcoin") || text.includes("ethereum") || text.includes("wallet drain") ||
    text.includes("metamask") || text.includes("phantom") || text.includes("seed phrase") || text.includes("usdt") ||
    text.includes("smart contract") || text.includes("txhash")
  ) {
    const config = getCategoryConfig("crypto_wallet_drain");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: "golden-hour",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved: true,
      reasoning: "Cryptocurrency theft / Web3 wallet drain detected. Blockchain transaction hash and wallet tracking activated.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 7: Mobile & APK Crimes (Section: OTHER) ───────────────────────
  if (text.includes(".apk") || text.includes("malicious apk") || text.includes("installed app") || text.includes("electricity bill apk") || text.includes("e-challan apk")) {
    const config = getCategoryConfig("mob_malicious_apk");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Malicious APK infection detected. Advise device flight mode / disconnect and isolate financial apps.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 8: Social Media Impersonation & Hijacking (Section: OTHER) ────
  if (
    text.includes("impersonating") || text.includes("fake profile") || text.includes("counterfeit account") ||
    text.includes("made a fake instagram") || text.includes("using my photos")
  ) {
    const config = getCategoryConfig("impersonation");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "standard",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Social media impersonation / fake profile detected. Direct URL and genuine profile reconciliation enabled.",
      source: "deterministic",
    };
  }

  if (text.includes("account takeover") || text.includes("hacked my instagram") || text.includes("hacked my facebook") || text.includes("whatsapp hacked")) {
    const config = getCategoryConfig("account_takeover");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: false,
      urgency: "standard",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount: undefined,
      moneyMoved: false,
      reasoning: "Social media / messaging credential compromise detected.",
      source: "deterministic",
    };
  }

  // ── PRIORITY 9: Financial Fraud Subcategories (Section: FINANCIAL) ──────────
  if (text.includes("upi") || text.includes("phonepe") || text.includes("gpay") || text.includes("paytm") || text.includes("qr code") || text.includes("collect request")) {
    const config = getCategoryConfig("upi_fraud");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "UPI fraudulent debit detected. Golden-hour 1930 / CFCFRMS banking freeze prioritized.",
      source: "deterministic",
    };
  }

  if (text.includes("task") || text.includes("like subscribe") || text.includes("youtube like") || text.includes("prepaid task") || text.includes("part time job") || text.includes("part-time job")) {
    const config = getCategoryConfig("task_scam");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Task / employment deposit scam detected. Beneficiary accounts flagged for Section 94 BNSS freeze.",
      source: "deterministic",
    };
  }

  if (text.includes("work from home") || text.includes("job offer") || text.includes("recruitment fee")) {
    const config = getCategoryConfig("job_scam");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Work from home employment scam involving fraudulent deposit requests.",
      source: "deterministic",
    };
  }

  if (text.includes("trading") || text.includes("stock tip") || text.includes("investment group") || text.includes("high return") || text.includes("forex")) {
    const config = getCategoryConfig("investment_scam");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Fraudulent online trading / investment scheme detected.",
      source: "deterministic",
    };
  }

  if (text.includes("credit card") || text.includes("debit card") || text.includes("atm") || text.includes("cvv") || text.includes("card skimming")) {
    const config = getCategoryConfig("card_fraud");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Payment card unauthorized debit or credential compromise detected.",
      source: "deterministic",
    };
  }

  if (text.includes("sim swap") || text.includes("esim") || text.includes("sim deactivated") || text.includes("no network signal")) {
    const config = getCategoryConfig("sim_swap");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: "golden-hour",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Critical SIM swap telecom takeover vector detected.",
      source: "deterministic",
    };
  }

  if (text.includes("aeps") || text.includes("biometric") || text.includes("aadhaar cash withdrawal") || text.includes("fingerprint cloned")) {
    const config = getCategoryConfig("fin_aeps");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: "golden-hour",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "AEPS unauthorized biometric withdrawal detected. Immediate biometric lock advised.",
      source: "deterministic",
    };
  }

  if (text.includes("loan app") || text.includes("instant loan") || text.includes("harassing my contacts") || text.includes("recovery agent")) {
    const config = getCategoryConfig("loan_app_scam");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Illegal lending application harassment and extortion pattern detected.",
      source: "deterministic",
    };
  }

  if (text.includes("customer care") || text.includes("helpline") || text.includes("toll free") || text.includes("google search number")) {
    const config = getCategoryConfig("fake_customer_care");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Fake customer care helpline impersonation detected.",
      source: "deterministic",
    };
  }

  if (text.includes("dating") || text.includes("matrimonial") || text.includes("met online") || text.includes("shaadi") || text.includes("fell in love")) {
    const config = getCategoryConfig("romance_scam");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Romance or matrimonial fraud pattern detected.",
      source: "deterministic",
    };
  }

  if (text.includes("parcel") || text.includes("courier") || text.includes("customs duty") || text.includes("clearance fee")) {
    const config = getCategoryConfig("courier_parcel_scam");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Courier or parcel scam detected — fake customs duty or clearance demand.",
      source: "deterministic",
    };
  }

  if (
    text.includes("net banking") || text.includes("phishing") || text.includes("otp") || text.includes("bank") ||
    text.includes("anydesk") || text.includes("teamviewer") || text.includes("rustdesk") || moneyMoved
  ) {
    const config = getCategoryConfig("net_banking");
    return {
      categoryId: config.id,
      categoryLabel: config.label,
      section: config.section,
      parentCategory: config.parent,
      subCategory: config.subCategory,
      isFinancialFraud: true,
      urgency: moneyMoved ? "golden-hour" : "urgent",
      priorityDeskType: config.priorityDeskType,
      statutoryCitations: config.statutoryCitations,
      evidenceChecklist: config.evidenceChecklist,
      detectedAmount,
      moneyMoved,
      reasoning: "Unauthorized banking transaction or credential theft via phishing or remote desktop.",
      source: "deterministic",
    };
  }

  // Fallback
  const config = getCategoryConfig("other_cybercrime");
  return {
    categoryId: config.id,
    categoryLabel: config.label,
    section: config.section,
    parentCategory: config.parent,
    subCategory: config.subCategory,
    isFinancialFraud: moneyMoved,
    urgency: moneyMoved ? "golden-hour" : "standard",
    priorityDeskType: moneyMoved ? "banking_freeze" : "none",
    statutoryCitations: config.statutoryCitations,
    evidenceChecklist: config.evidenceChecklist,
    detectedAmount,
    moneyMoved,
    reasoning: "General cyber offence report. Category may be refined during review.",
    source: "deterministic",
  };
}
