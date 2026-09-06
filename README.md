# CasePilot — Cyber Crime Reporting Portal

> **Tell us what happened. We will handle the paperwork.**  
> Next-Generation Citizen-Centric Cyber Crime Reporting & Rapid Triage Portal.

![CasePilot Portal Preview](./public/images/surakhsa_preview.png)

---

## 1. Project Title
**CasePilot** — An accessible, rapid-action citizen portal redesign for reporting cyber crimes in India.

---

## 2. Tagline
*Empowering citizens during the critical "Golden Hour" of financial fraud with instant triage, guided reporting, and transparent SLA tracking.*

---

## 3. Short Project Overview
**CasePilot** is a modern reimagining of India's National Cyber Crime Reporting Portal (NCRP / 1930), designed using the **UX4G Design System** and built on **Next.js App Router** with a **MongoDB** persistence layer. It eliminates bureaucratic intimidation by translating plain citizen narratives into official NCRP categories, instantly prioritizing banking freeze interventions, and providing accessible step-by-step reporting for all citizens regardless of language, literacy, or digital experience.

---

## 4. Problem Statement
1. **The "Golden Hour" Dilemma**: In digital financial fraud (UPI scams, phishing, unauthorized debits), the first 60–120 minutes determine whether stolen funds can be frozen before leaving the banking switch. Complex legacy complaint forms cause critical delays.
2. **Cognitive Burden on Victims**: Victims are stressed and unfamiliar with Indian Penal Code sections or technical cybercrime categories (e.g., distinguishing "VPA Spoofing" from "Card Skimming").
3. **Accessibility & Regional Exclusion**: Non-English speakers, senior citizens, and first-time smartphone users face steep barriers filing text-heavy online complaints.
4. **Lack of Transparent Case Tracking**: Citizens receive complaint numbers but lack clear visibility into statutory Right to Service timelines and investigation milestones.

---

## 5. What the Product Does
- **Speeds Up Emergency Interventions**: Prioritizes urgent banking freeze requests directly through an expedited intake flow with automated Golden-Hour warnings.
- **Translates Plain Language to Legal Categories**: Converts natural-language descriptions (in English, Hindi, and regional phrases) into 30+ official NCRP classifications.
- **Assisted 5-Step Guided Reporting**: Provides an alternative multiple-choice question (MCQ) questionnaire with built-in voice read-aloud (`SpeechSynthesis`).
- **Verifies Evidence Integrity**: Generates cryptographic SHA-256 hashes client-side for all attached evidence files.
- **Tracks Complaints Transparently**: Looks up case status by Acknowledgement Number (`ACK-YYYY-XXXXXX`) with statutory SLA calculations.
- **Proactive Suspect Screening**: Allows citizens to check suspicious UPI IDs, URLs, and phone numbers before sending money.

---

## 6. User Workflow / Journey

```text
[ Citizen Landing ]
        │
        ├── Standard Mode (Free text / Voice speech input)
        └── Assisted Mode (5-step guided questionnaire + Read Aloud)
        │
        ▼
[ Intelligent Triage & NCRP Categorization ]
        │
        ▼
[ Golden-Hour Emergency Action ] ─── (If Financial Loss: Captures Bank/UPI & UTR)
        │
        ▼
[ Cryptographic Evidence Hashing (SHA-256) ]
        │
        ▼
[ Official NCRP Acknowledgement Generated: ACK-YYYY-XXXXXX ]
        │
        ▼
[ Stored in MongoDB Repository ] ─── (Resilient Fallback Cache)
        │
        ▼
[ Real-Time Tracking & SLA Monitoring (/track) ]
```

---

## 7. Core Features

| Feature | Description | Citizen / Administrative Benefit |
| :--- | :--- | :--- |
| **Digital Arrest Circuit-Breaker** | Immediate high-priority intercept (`/digital-arrest`) for citizens facing fake CBI/ED/police video calls. | Stops immediate fund transfer coerced by scammers; provides instant emergency steps and legal truth. |
| **Hybrid AI & Heuristic Triage** | OpenAI `gpt-4o-mini` semantic classification with seamless deterministic fallback. | Accurately understands complex multi-lingual colloquial narratives while guaranteeing zero downtime. |
| **Screenshot Threat Scanner** | Vision-based scam analyzer (`gpt-4o`) extracting UPIs, URLs, phone numbers, and bank accounts from screenshots. | Allows non-technical citizens to simply upload a scam chat or payment receipt for instant analysis. |
| **Golden-Hour Freeze Capture** | Dedicated capture for citizen bank, debit account/UPI, suspect handle, UTR, and loss amount. | Transmits essential payment switch data required by 1930 / CFCFRMS nodal officers. |
| **Expanded Suspect Screening** | Checks UPI IDs, URLs, phones, bank accounts (IFSC/Mule), and remote access apps (AnyDesk/TeamViewer). | Protects against remote control trojans and mule banking rings before money leaves the account. |
| **7-Stage Restitution Timeline** | Full case tracking from FIR registration through Section 457 CrPC / 503 BNSS court order to account credit. | Eliminates opaque delays by guiding citizens through the statutory judicial refund process. |
| **Downloadable PDF Acknowledgement** | One-click official PDF receipt (`jsPDF`) with SHA-256 evidence digests and banking freeze records. | Provides citizens with an archival physical document for their bank branch and local police station. |
| **Assisted Mode (Guided MCQ)** | 5-step intuitive multiple-choice flow with dynamic sentence synthesis and voice narration. | Zero typing required; tailored for non-tech-savvy users and elderly citizens. |
| **Top Bar Accessibility Controls** | Instant language switching (6 languages), text scaling (`A-`, `A`, `A+`), and high-contrast assistance toggle. | Compliant with Government of India UX4G accessibility standards. |

---

## 8. Screenshots / UI Images

### Homepage & Hero Showcase
![Homepage Preview](./public/images/surakhsa_preview.png)

### Report Flow
<!-- TODO: Add screenshot of Report Flow & Golden-Hour Form here -->
> *Placeholder: Screenshots of the multi-step report flow, narrative input, and Golden-Hour bank freeze alert form.*

### Case Tracking Flow (`/track`)
<!-- TODO: Add screenshot of Case Tracking & SLA Timeline here -->
> *Placeholder: Screenshots of Acknowledgement Number search, case stage progression, and SLA timeline display.*

### Assisted Mode & Mobile Sign-In
<!-- TODO: Add screenshot of Assisted Mode MCQ and Sign-in here -->
> *Placeholder: Screenshots of the 5-step MCQ questionnaire, voice read-aloud buttons, and OTP verification.*

---

## 9. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  Next.js 16 (Turbopack) | React 19 | TailwindCSS v4 | UX4G  │
│  Context Providers (AssistMode, Language, TextSize, Auth)   │
│  Web Crypto API (SHA-256) | Web Speech API (TTS & Voice)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Server Actions & API Routes
┌──────────────────────────────▼──────────────────────────────┐
│                      Application Server                     │
│  - Triage & Classification Engine (src/lib/triage.ts)       │
│  - SLA & Timeline Engine (src/lib/timeline.ts)              │
│  - Resilient Multi-tier Store with 4s Connection Timeout    │
└──────────────────────────────┬──────────────────────────────┘
                               │ MongoDB Driver v7.6
┌──────────────────────────────▼──────────────────────────────┐
│                      Database Layer                         │
│  MongoDB Atlas (Cloud) / Local MongoDB                      │
│  Collections: complaints, users, sessions, suspect_reports   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.3.4` | SSR, Server Actions, Client Components, Turbopack |
| **Library** | React | `19.2.8` | Component architecture and state hydration |
| **AI / Vision** | OpenAI SDK | `^4.86.0` | `gpt-4o-mini` semantic triage & `gpt-4o` screenshot scam extraction |
| **PDF Generation** | jsPDF | `^2.5.2` | Client-side official NCRP complaint confirmation PDF generation |
| **Language** | TypeScript | `^5.0` | End-to-end static typing and schema verification |
| **Styling** | Vanilla CSS + TailwindCSS | `^4.0` | UX4G government design tokens and responsive layouts |
| **Database** | MongoDB Native Driver | `^7.6.0` | Document persistence and query execution |
| **Icons** | Lucide React | `^1.40.0` | Accessible vector iconography |
| **Security** | Jose & Web Crypto | `^6.2.10` | JWT verification and SHA-256 evidence hashing |
| **Test Runner** | Node.js Native Runner | `node:test` | Automated regression and classification testing |

---

## 11. Project Structure

```text
├── public/                     # Static assets and preview images
│   └── images/
│       └── surakhsa_preview.png # Real portal screenshot
├── src/
│   ├── actions/                # Next.js Server Actions
│   │   ├── auth.ts             # Sign-in & OTP verification
│   │   ├── check.ts            # Suspect check & reporting (Bank, App, Phone, UPI, URL)
│   │   ├── report.ts           # Complaint filing & banking freeze
│   │   └── track.ts            # ACK tracking & user complaints
│   ├── app/                    # App Router pages and layouts
│   │   ├── api/                # API Endpoints
│   │   │   ├── check-image/    # GPT-4o screenshot threat extractor
│   │   │   └── triage/         # GPT-4o-mini hybrid AI triage with rule-based fallback
│   │   ├── check/              # Suspect lookup & threat upload portal
│   │   ├── digital-arrest/     # Digital Arrest emergency circuit-breaker interrupt
│   │   ├── report/             # Multi-step complaint journey with jsPDF download
│   │   ├── signin/             # Phone OTP sign-in & citizen registration
│   │   ├── track/              # 7-stage case tracking & BNSS restitution guide
│   │   ├── layout.tsx          # Root layout with top bar, Google Fonts & footer
│   │   └── page.tsx            # Portal landing page with Digital Arrest alerts
│   ├── components/             # Reusable UI & Layout components
│   │   ├── layout/             # Header, Top Bar, Footer
│   │   ├── report/             # GuidedReport (5-step MCQ flow)
│   │   └── ui/                 # Button, Card, Badge, ReadAloud
│   ├── context/                # Accessibility & Session Contexts
│   │   ├── AccountContext.tsx  # User auth state
│   │   ├── AssistContext.tsx   # Assisted Mode toggle
│   │   ├── LanguageContext.tsx # 6-language switcher
│   │   └── TextSizeContext.tsx # Text scaling (A-, A, A+)
│   └── lib/                    # Core business logic & database
│       ├── i18n.ts             # Multilingual translations dictionary
│       ├── mongodb.ts          # MongoDB client & resilient fallback
│       ├── timeline.ts         # 7-stage SLA & event gap duration formatters
│       └── triage.ts           # Hybrid NCRP categorization engine (30+ categories)
├── tests/
│   └── suite.test.ts           # 10 automated end-to-end unit tests
├── scripts/
│   └── check_mongo.js          # Direct MongoDB Atlas verification tool
├── .env.example                # Sanitized environment template
├── .gitignore                  # Production exclusion rules
├── package.json                # Dependencies and npm scripts
├── README.md                   # Project documentation
└── tsconfig.json               # TypeScript configuration
```

---

## 12. Setup Instructions

### Prerequisites
- **Node.js**: v20.x or v22.x installed.
- **Package Manager**: `npm` (v10+).
- **MongoDB** (Optional for local): Either local MongoDB (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.
- **OpenAI API Key** (Optional): Enables GPT-4o-mini semantic triage and GPT-4o screenshot analysis. If omitted, the system seamlessly falls back to the deterministic classifier.

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Rithwik-Ravi/Fraud-Case-Tracker.git
cd Fraud-Case-Tracker

# 2. Install dependencies
npm install
```

---

## 13. Environment Variables

Create a `.env.local` file in the root directory (based on `.env.example`):

```env
# MongoDB Atlas or local MongoDB URI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/casepilot?retryWrites=true&w=majority"

# Database Name (Preserved for MongoDB Atlas cluster compatibility, or 'casepilot')
MONGODB_DB="Saarthi"

# Secret Key for secure session cookies
JWT_SECRET="casepilot_super_secret_jwt_key_hackathon_2026"

# Canonical App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: OpenAI API Key for AI triage and screenshot threat scanning
OPENAI_API_KEY="sk-proj-..."
```

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `MONGODB_DB` | Optional | Database name (defaults to `casepilot` or legacy cluster `Saarthi`) | `Saarthi` |
| `JWT_SECRET` | Yes | Secret used for cookie signing | `your_random_secret_string` |
| `NEXT_PUBLIC_APP_URL`| Optional | Deployment host URL | `https://casepath-two.vercel.app` |
| `OPENAI_API_KEY` | Optional | OpenAI Key for GPT-4o-mini & GPT-4o screenshot triage | `sk-proj-...` |

---

## 14. How to Run Locally

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Test Suite
```bash
npm test
```
Executes all 10 unit and regression tests (classification, SLA duration formatting, taxonomy consistency, and hostile input resistance).

### Check MongoDB Connection & Saved Records
```bash
npm run db:check
```
Connects to your active MongoDB Atlas cluster and prints stored complaint records and collection statistics.

---

## 15. How to Deploy (Vercel)

1. Import the repository into your [Vercel Dashboard](https://vercel.com).
2. Under **Project Settings** > **Environment Variables**, add:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
3. Click **Deploy**. Vercel will run `next build` and deploy the serverless application.

---

## 16. Backend & Database Notes

- **Native Driver with Singleton Pooling**: Uses `mongodb` v7.6 with cached client promises to avoid socket leaks across serverless function invocations.
- **Zero-Failure Resiliency**: When running in preview environments or during database cold starts, the server actions catch connection timeouts (4-second ceiling) and seamlessly fall back to an active memory cache, guaranteeing the citizen always receives their ACK confirmation.
- **Collections**:
  - `complaints`: Contains incident narrative, categorized IDs, loss amounts, banking freeze routing data, and evidence metadata.
  - `users` & `sessions`: Manages citizen sign-in and session tokens.
  - `suspect_reports` & `suspect_checks`: Stores suspect domains, UPI handles, and citizen community reports.

---

## 17. What is Mocked vs. Real

| Component / Functionality | Status | Details |
| :--- | :---: | :--- |
| **MongoDB Atlas Persistence** | **REAL** | Real database queries, insertions, and document lookups. |
| **Hybrid AI & Heuristic Triage** | **REAL** | Semantic classification via OpenAI `gpt-4o-mini` with instant deterministic fallback. |
| **Screenshot Threat Vision** | **REAL** | Multimodal scam extraction from uploaded images via OpenAI `gpt-4o`. |
| **Digital Arrest Circuit Breaker** | **REAL** | Real-time pattern interception and emergency redirection (`/digital-arrest`). |
| **PDF Acknowledgement Generation**| **REAL** | Client-side official NCRP receipt generation via `jsPDF`. |
| **Client Evidence Hashing** | **REAL** | Cryptographic SHA-256 calculation in the browser via `window.crypto.subtle`. |
| **Voice Narration (Read Aloud)** | **REAL** | Browser Web Speech API (`SpeechSynthesis`) with sentence chunking. |
| **Accessibility & Localization** | **REAL** | Live switching across 6 Indian languages and dynamic text scaling (`A-`, `A`, `A+`). |
| **Automated Test Suite** | **REAL** | 10 passing tests running natively via `node:test`. |
| **SMS OTP Transmission** | *MOCKED* | OTP is generated deterministically and displayed on-screen for test convenience. No telecom gateway attached. |
| **1930 / CFCFRMS Banking Switch** | *MOCKED* | Simulates network acknowledgment latency; does not contact live RBI/NPCI core banking servers. |
| **Evidence Binary Cloud Storage** | *MOCKED* | Files are hashed client-side for audit trail, but raw multi-megabyte binaries are not uploaded to an S3 bucket. |

---

## 18. Limitations
- Evidence files are verified via cryptographic SHA-256 hash client-side, but raw multi-megabyte binary files are not persisted to cloud object storage.
- Regional language translations in the current build focus on core portal navigation, emergency alerts, assisted MCQ reporting, and citizen action guides.
- Direct banking switch intervention simulates official 1930 nodal officer dispatch protocols without calling live production core-banking switches.

---

## 19. Future Improvements / Next Steps
- [ ] **Conversational Regional AI Voice Bot**: Integrate a multilingual speech-to-speech agent for voice-only reporting in rural dialects.
- [ ] **DigiLocker / Aadhaar e-KYC**: One-click verified identity prefill for citizen complaints.
- [ ] **NPCI / RBI CMS Webhook Integration**: Real-time webhook dispatch directly to bank fraud nodal desks.
- [ ] **WhatsApp / Telegram Incident Intake**: Filing incident reports via an authenticated official chatbot.

---

## 20. Team & Acknowledgements
- **Team**: <!-- TODO: Add team member names, roles, and GitHub profiles -->
- **Design Reference**: Inspired by the **UX4G (User Experience for Government)** Design System, India.
- **Guidelines**: Modeled after National Cyber Crime Reporting Portal (NCRP) and Indian Cyber Crime Coordination Centre (I4C / MHA) public documentation.

---

## 21. License & Disclaimer

> [!WARNING]
> **Independent Hackathon Prototype.**  
> This project is a proof-of-concept prototype built for competition and educational purposes. It is **not** affiliated with, endorsed by, or connected to the Government of India, the Ministry of Home Affairs (MHA), or the Indian Cyber Crime Coordination Centre (I4C).
>
> In an actual emergency or if you are a victim of cybercrime, immediately dial **1930** or register your complaint on the official portal at [cybercrime.gov.in](https://cybercrime.gov.in/).

Licensed under the [MIT License](LICENSE) <!-- TODO: Verify license preference -->.
