"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useLang } from "@/context/LanguageContext";
import { useAssist } from "@/context/AssistContext";

export default function Home() {
  const { t } = useLang();
  const { assist, setAssist } = useAssist();

  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                <span className="h-2 w-2 rounded-full bg-success-500" aria-hidden="true"></span>
                {t("home.badge") || "One door. Not three."}
              </p>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl">
                {t("home.h1a") || "Tell us what happened."}
                <span className="block text-brand-600">
                  {t("home.h1b") || "We'll handle the paperwork."}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
                {t("home.heroLede") ||
                  "Reporting a cyber crime today means choosing between three confusing doors, then decoding a form written for police officers. Here, you describe it in your own words — in your own language — and we work out the rest."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/report" variant="primary" size="lg">
                  {t("home.ctaReport") || "Report what happened"}
                  <span aria-hidden="true">→</span>
                </Button>
                <Button href="/track" variant="outline" size="lg">
                  {t("home.ctaTrack") || "Track a complaint"}
                </Button>
                <Button href="/check" variant="outline" size="lg">
                  {t("home.ctaCheck") || "Check before you pay"}
                </Button>
              </div>
              <p className="mt-4 text-sm text-ink-500">
                {t("home.ctaNote") || "Takes about 3 minutes. You can stop and come back at any time."}
              </p>

              <div className="mt-6 rounded-ux-lg border border-brand-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAssist(!assist)}
                    aria-pressed={assist}
                    className={`ux-target inline-flex items-center gap-2 rounded-ux border-2 px-4 py-2.5 text-base font-semibold transition ${
                      assist
                        ? "border-brand-600 bg-brand-50 text-brand-800"
                        : "border-brand-500 bg-white text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    {assist
                      ? t("assist.turnOff") || "Turn off assisted mode"
                      : t("assist.turnOn") || "Turn on assisted mode"}
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {t("assist.blurb") || "Bigger text, one question at a time, and we can read the page out loud."}
                </p>
              </div>
            </div>

            {/* Emergency Golden Hour Card */}
            <Card variant="danger">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-danger-600">
                {t("home.goldenEyebrow") || "If money has just left your account"}
              </p>
              <h2 className="text-xl font-bold text-ink-900">
                {t("home.goldenTitle") || "The first hour decides everything"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {t("home.goldenBody") ||
                  "Stolen money moves through a chain of mule accounts within hours. A freeze request that reaches the bank early can stop it. One that arrives tomorrow usually cannot."}
              </p>
              <ul className="mt-5 space-y-3">
                <li>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {t("home.rec1w") || "Within 1 hour"}
                    </span>
                    <span className="text-xs text-ink-600">
                      {t("home.rec1c") || "Highest chance of freezing the money"}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-200"
                    role="img"
                    aria-label="Within 1 hour: Highest chance of freezing the money"
                  >
                    <div className="h-full rounded-full bg-success-500" style={{ width: "92%" }}></div>
                  </div>
                </li>
                <li>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {t("home.rec2w") || "1–24 hours"}
                    </span>
                    <span className="text-xs text-ink-600">
                      {t("home.rec2c") || "Money is moving through mule accounts"}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-200"
                    role="img"
                    aria-label="1–24 hours: Money is moving through mule accounts"
                  >
                    <div className="h-full rounded-full bg-warning-500" style={{ width: "48%" }}></div>
                  </div>
                </li>
                <li>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {t("home.rec3w") || "After 24 hours"}
                    </span>
                    <span className="text-xs text-ink-600">
                      {t("home.rec3c") || "Usually withdrawn or layered abroad"}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-200"
                    role="img"
                    aria-label="After 24 hours: Usually withdrawn or layered abroad"
                  >
                    <div className="h-full rounded-full bg-danger-500" style={{ width: "12%" }}></div>
                  </div>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                {t("home.recNote") ||
                  "Illustrative figures based on the rationale behind India's 1930 golden-hour helpline. Not official statistics."}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Grid: What we changed */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          {t("home.changed") || "What we changed"}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <h3 className="text-base font-bold text-ink-900">
              {t("home.c1t") || "You don't classify the crime"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t("home.c1b") ||
                "The current portal asks you to pick between “Women/Children”, “Financial Fraud” and “Other Cyber Crime” before you can start. You describe what happened; we map it to the official category and show you our reasoning."}
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold text-ink-900">
              {t("home.c2t") || "Freezing the money comes first"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t("home.c2b") ||
                "Where funds have just moved, we collect the six fields a bank needs to act, raise the freeze request, and only then ask for the full statement."}
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold text-ink-900">
              {t("home.c3t") || "Written for a frightened person"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t("home.c3b") ||
                "Short sentences, one question per screen, no legal jargon, and a running explanation of what happens next."}
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold text-ink-900">
              {t("home.c4t") || "Status you can actually read"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t("home.c4b") ||
                "Not “Under Process”. Which police unit holds it, what they are waiting for, how long they have under the Right to Service Act, and how to escalate."}
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold text-ink-900">
              {t("home.c5t") || "Works on a slow phone"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t("home.c5b") ||
                "Mobile-first, large touch targets, adjustable text size, visible focus rings, and full keyboard operation — following GIGW 3.0 and the UX4G accessibility guidance."}
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold text-ink-900">
              {t("home.c6t") || "Honest about limits"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t("home.c6b") ||
                "Every mocked dependency is labelled in the interface itself, and listed on the “What's real” page."}
            </p>
          </Card>
        </div>

        <div className="mt-10 rounded-ux-xl border border-ink-200 bg-ink-50 p-6">
          <p className="text-sm leading-relaxed text-ink-700">
            <strong className="font-semibold text-ink-900">
              {t("home.sideStrong") || "Want the side-by-side?"}
            </strong>{" "}
            See the current journey and this one, screen for screen, on the{" "}
            <Link className="font-medium text-brand-600 underline underline-offset-2" href="/compare">
              before and after page
            </Link>.
          </p>
        </div>
      </section>
    </>
  );
}
