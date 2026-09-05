"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Button from "@/components/ui/Button";
import { PhoneOff, ShieldAlert, FileText, Phone } from "lucide-react";

function DigitalArrestContent() {
  const searchParams = useSearchParams();
  const continueToReport = searchParams.get("continue") === "true";

  return (
    <div className="interrupt-screen min-h-screen">
      {/* ── Section 1: THERE IS NO DIGITAL ARREST ────────────── */}
      <div className="border-b border-danger-200 bg-danger-600 text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold uppercase tracking-widest text-white">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            I4C Advisory · MHA India · January 2024
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            There is no<br />
            <span className="text-yellow-300">Digital Arrest.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
            No law in India permits the police, CBI, ED, Narcotics, Customs, Income Tax, or any
            government agency to place you under arrest{" "}
            <strong>over a phone or video call</strong>. This is a scripted scam.
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80">
            The caller is not a government officer. They are a fraudster using fear to steal
            your money. The "FIR", the "warrant", the uniform, the official-looking background —
            all of it is fake.
          </p>
        </div>
      </div>

      {/* ── Section 2: HANG UP NOW ───────────────────────────── */}
      <div className="border-b border-danger-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-700">
              <PhoneOff className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink-900">Step 1 — Hang up right now.</h2>
              <p className="mt-2 text-base leading-relaxed text-ink-600">
                End the call immediately. Do not negotiate, do not pay, and do not share any
                OTP, bank details, or personal documents. The moment you feel pressured to "stay
                on the line", that is the scam working.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                <li className="flex gap-2">
                  <span className="text-danger-600 font-bold">✗</span>
                  Do not call the number back.
                </li>
                <li className="flex gap-2">
                  <span className="text-danger-600 font-bold">✗</span>
                  Do not install any app they ask you to ("AnyDesk", "QuickSupport", etc.).
                </li>
                <li className="flex gap-2">
                  <span className="text-danger-600 font-bold">✗</span>
                  Do not transfer money to "safe accounts", "custody accounts", or "escrow accounts".
                </li>
                <li className="flex gap-2">
                  <span className="text-danger-600 font-bold">✗</span>
                  Do not share your Aadhaar, PAN, bank OTP, or CVV.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: AFTER YOU HANG UP ────────────────────── */}
      <div className="bg-ink-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="w-full">
              <h2 className="text-2xl font-bold text-ink-900">Step 2 — After you hang up.</h2>
              <p className="mt-2 text-base leading-relaxed text-ink-600">
                If you have already lost money or shared details, you must act fast.
                The first hour is critical for intercepting the transaction.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-ux-xl border border-danger-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-danger-700">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                    <span className="font-bold text-base">Call 1930 immediately</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    India&apos;s official National Cybercrime Helpline. Available 24×7.
                    Operators can initiate a banking freeze within the golden hour.
                  </p>
                  <a
                    href="tel:1930"
                    className="mt-3 inline-flex items-center gap-1 rounded-ux bg-danger-600 px-4 py-2 text-sm font-bold text-white hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
                  >
                    Dial 1930 →
                  </a>
                </div>

                <div className="rounded-ux-xl border border-brand-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-brand-700">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                    <span className="font-bold text-base">File at cybercrime.gov.in</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">
                    The official portal for reporting all forms of cybercrime to law enforcement
                    in India.
                  </p>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 rounded-ux border-2 border-brand-500 bg-white px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  >
                    Open portal →
                  </a>
                </div>
              </div>

              {/* Divider + optional continue */}
              <div className="mt-8 border-t border-ink-200 pt-6">
                <p className="text-sm text-ink-500">
                  This is an independent hackathon prototype, not affiliated with the Government of India.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {continueToReport && (
                    <Button href="/report" variant="primary">
                      Continue filing your report →
                    </Button>
                  )}
                  <Button href="/" variant="outline">
                    Back to home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DigitalArrestPage() {
  return (
    <Suspense>
      <DigitalArrestContent />
    </Suspense>
  );
}
