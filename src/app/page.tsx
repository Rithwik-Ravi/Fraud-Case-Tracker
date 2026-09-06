"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { useAssist } from "@/context/AssistContext";
import { PhoneCall, AlertTriangle, FileText, Search, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const { t } = useLang();
  const { assist, setAssist } = useAssist();
  const router = useRouter();
  const [quickText, setQuickText] = useState("");

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickText.trim()) {
      router.push(`/report?narrative=${encodeURIComponent(quickText.trim())}`);
    } else {
      router.push("/report");
    }
  };

  return (
    <div className="bg-white">
      {/* =========================================================================
          1. EMERGENCY TRIAGE STRIP (HOSPITAL / DISPATCH TRIAGE BOARD)
          Sorts incoming citizen immediately by actual situational urgency
          ========================================================================= */}
      <section className="border-b-2 border-ink-900 bg-ink-50 py-6 sm:py-8" aria-label="Emergency Situation Triage">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-ink-200 pb-3 mb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-danger-600 block">
                Immediate Incident Triage
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900">
                What is happening right now?
              </h1>
            </div>
            <p className="text-xs text-ink-500 font-medium">
              Select your current emergency state to receive immediate procedural routing
            </p>
          </div>

          <div className="grid gap-3.5">
            {/* PRIORITY 0: ACTIVE CALL / DIGITAL ARREST INTERRUPT */}
            <div className="border-l-8 border-danger-500 bg-danger-50/90 border-y border-r border-danger-200 p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ux bg-danger-600 text-white font-black text-sm">
                    P0
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-ux-sm bg-danger-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                        Active Threat
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-ink-900">
                        Someone is on a call with me right now claiming to be police, CBI, ED, or customs
                      </h2>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-ink-700">
                      This is an extortion scam called "Digital Arrest". No agency arrests citizens via Skype or WhatsApp video call. You can safely disconnect.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/digital-arrest"
                    className="ux-target inline-flex items-center justify-center gap-2 rounded-ux bg-danger-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-danger-700 transition w-full md:w-auto"
                  >
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                    <span>Open Emergency Interrupt Guidance</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* PRIORITY 1: TIME CRITICAL FINANCIAL LOSS (GOLDEN HOUR) */}
            <div className="border-l-8 border-warning-500 bg-warning-50/80 border-y border-r border-warning-200 p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ux bg-warning-600 text-white font-black text-sm">
                    P1
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-ux-sm bg-warning-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                        Golden Hour
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-ink-900">
                        Money left my bank account or UPI within the last 2 hours
                      </h2>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-ink-700">
                      Immediate transaction freeze window: Capture debit bank, suspect UPI/account, and 12-digit UTR reference to signal 1930 / CFCFRMS nodal desks.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/report?urgency=golden-hour"
                    className="ux-target inline-flex items-center justify-center gap-2 rounded-ux bg-warning-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-warning-700 transition w-full md:w-auto"
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <span>Initiate Rapid Banking Freeze</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* PRIORITY 2: STANDARD INCIDENT REPORTING */}
            <div className="border-l-4 border-ink-900 bg-white border-y border-r border-ink-200 p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ux bg-ink-800 text-white font-black text-sm">
                    P2
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-ux-sm bg-ink-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-800">
                        Past Incident
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-ink-900">
                        I want to file a formal complaint for an incident that already occurred
                      </h2>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-ink-600">
                      Extortion, unauthorized debits, identity spoofing, or loan app blackmail. We translate your natural description into official NCRP classifications.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href="/report"
                    className="ux-target inline-flex items-center justify-center gap-2 rounded-ux bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-800 transition w-full md:w-auto"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <span>File Incident Complaint</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* PRIORITY 3: PRE-TRANSACTION VERIFICATION */}
            <div className="border-l-4 border-brand-500 bg-brand-50/50 border-y border-r border-brand-200 p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ux bg-brand-600 text-white font-black text-sm">
                    P3
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-ux-sm bg-brand-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-800">
                        Pre-Payment Check
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-ink-900">
                        I want to verify a phone number, UPI ID, bank account, or link before acting
                      </h2>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-ink-600">
                      Heuristic risk analysis checking for homograph phishing domains, mule account patterns, reported UPI handles, and trojan screen-sharing applications.
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/check"
                    className="ux-target inline-flex items-center justify-center gap-2 rounded-ux border-2 border-brand-500 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50 transition w-full md:w-auto"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <span>Inspect Suspect Identifier</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. DIRECT INTAKE DISPATCH BAR (RAPID NARRATIVE INPUT)
          ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="border border-ink-300 bg-white p-6 sm:p-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Direct Intake Terminal</span>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-ink-900">
              Describe what happened in your own words
            </h2>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">
              No need to know legal categories or IPC sections. Type or paste the incident narrative below. The triage engine maps it to statutory classifications, extracts transaction references, and flags time-critical banking freeze requirements.
            </p>
          </div>

          <form onSubmit={handleQuickSubmit} className="mt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="quick-narrative" className="sr-only">
                Describe incident
              </label>
              <input
                id="quick-narrative"
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder="e.g. Received a call claiming my parcel has contraband, sent 45000 on PhonePe to verify innocence..."
                className="flex-1 rounded-ux border-2 border-ink-300 px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="ux-target inline-flex items-center justify-center rounded-ux bg-ink-900 px-6 py-3 text-base font-bold text-white hover:bg-ink-800 transition whitespace-nowrap"
              >
                <span>Triage Incident</span>
              </button>
            </div>
          </form>

          {/* Assisted Mode Quick Toggle */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 pt-4 text-xs text-ink-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink-800">Assisted Guided Reporting:</span>
              <span>Need one simplified question at a time with optional voice read-aloud?</span>
            </div>
            <button
              type="button"
              onClick={() => setAssist(!assist)}
              className={`font-bold underline underline-offset-2 ${assist ? "text-brand-700" : "text-ink-800"}`}
            >
              {assist ? "Assisted Mode is ON (Click to turn off)" : "Turn on Assisted Mode"}
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. STATUTORY INVESTIGATION & RESTITUTION REALITY (NOT MARKETING BLURB)
          ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Golden Hour Recovery Realities */}
          <div className="border border-ink-200 p-6 bg-ink-50">
            <span className="text-xs font-bold uppercase tracking-wider text-warning-700 block">
              Time Decay Analysis
            </span>
            <h3 className="mt-1 text-lg font-bold text-ink-900">
              Why the first 120 minutes determine fund recovery
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-600">
              In financial cyber fraud, illicit transfers move rapidly across multi-layer mule accounts. Statutory data indicates freeze efficiency declines dramatically with each hour of delay.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink-900">Within 1 Hour (Golden Hour)</span>
                  <span className="text-success-700">~92% Freeze Feasibility</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full bg-ink-200 rounded-ux-sm overflow-hidden">
                  <div className="h-full bg-success-600 rounded-ux-sm" style={{ width: "92%" }}></div>
                </div>
                <span className="text-[11px] text-ink-500 mt-1 block">Funds typically reside in first-hop beneficiary bank before mule switch dispersal.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink-900">1 to 24 Hours</span>
                  <span className="text-warning-700">~48% Partial Freeze</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full bg-ink-200 rounded-ux-sm overflow-hidden">
                  <div className="h-full bg-warning-600 rounded-ux-sm" style={{ width: "48%" }}></div>
                </div>
                <span className="text-[11px] text-ink-500 mt-1 block">Layered across multiple ATM withdrawals and crypto OTC ramps.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink-900">After 24 Hours</span>
                  <span className="text-danger-700">&lt;12% Recovery Probability</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full bg-ink-200 rounded-ux-sm overflow-hidden">
                  <div className="h-full bg-danger-600 rounded-ux-sm" style={{ width: "12%" }}></div>
                </div>
                <span className="text-[11px] text-ink-500 mt-1 block">Requires court lien enforcement under Section 503 BNSS for recovery of locked balances.</span>
              </div>
            </div>
          </div>

          {/* Statutory 7-Stage Restitution Journey */}
          <div className="border border-ink-200 p-6 bg-white">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
              Statutory Resolution Path
            </span>
            <h3 className="mt-1 text-lg font-bold text-ink-900">
              From incident freeze to magistrate refund order
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-600">
              Unlike opaque complaint portals that show indeterminate "Under Process" tags, CasePilot maps cases against the statutory 7-stage Bharatiya Nagarik Suraksha Sanhita (BNSS) restitution framework.
            </p>

            <div className="mt-4 border-t border-ink-200 divide-y divide-ink-100 text-xs">
              <div className="py-2.5 flex items-start gap-2.5">
                <span className="font-bold text-ink-900 shrink-0 w-16">Stage 1–2</span>
                <div>
                  <span className="font-semibold text-ink-900 block">Immediate Intake & Payment Switch Freeze</span>
                  <span className="text-ink-500">CFCFRMS dispatch, beneficiary account lien placement within 2 hours.</span>
                </div>
              </div>
              <div className="py-2.5 flex items-start gap-2.5">
                <span className="font-bold text-ink-900 shrink-0 w-16">Stage 3–4</span>
                <div>
                  <span className="font-semibold text-ink-900 block">FIR Conversion & Evidence Audit</span>
                  <span className="text-ink-500">Cyber Police Station verification within 15-day statutory SLA window.</span>
                </div>
              </div>
              <div className="py-2.5 flex items-start gap-2.5">
                <span className="font-bold text-ink-900 shrink-0 w-16">Stage 5–6</span>
                <div>
                  <span className="font-semibold text-ink-900 block">Lien Confirmation & Section 503 BNSS Application</span>
                  <span className="text-ink-500">Magistrate petition filed for release of frozen funds to genuine victim account.</span>
                </div>
              </div>
              <div className="py-2.5 flex items-start gap-2.5">
                <span className="font-bold text-ink-900 shrink-0 w-16">Stage 7</span>
                <div>
                  <span className="font-semibold text-success-700 block">Account Restitution & Reversal Complete</span>
                  <span className="text-ink-500">Bank executes court order; funds credited back to complainant.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ink-100">
              <Link
                href="/track"
                className="text-xs font-bold text-brand-600 underline underline-offset-2 hover:text-brand-800 inline-flex items-center gap-1"
              >
                <span>Track an existing complaint status</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ARCHITECTURE HONESTY / WHAT'S REAL STRIP
          ========================================================================= */}
      <section className="border-t border-ink-200 bg-ink-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900">Calm, Accountable Civic Engineering</h3>
              <p className="mt-1 text-xs text-ink-600 max-w-2xl leading-relaxed">
                CasePilot is built to demonstrate what a citizen-first cyber incident portal looks like when designed around urgent human needs: clear triage priorities, emergency banking intervention, and legal accountability.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/about"
                className="rounded-ux border border-ink-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-800 hover:bg-ink-100 transition"
              >
                What is Real vs Mocked
              </Link>
              <Link
                href="/compare"
                className="rounded-ux border border-ink-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-800 hover:bg-ink-100 transition"
              >
                Before & After Comparison
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
