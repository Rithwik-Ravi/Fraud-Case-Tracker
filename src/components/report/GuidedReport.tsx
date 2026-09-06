"use client";

import React, { useState } from "react";
import { useLang } from "@/context/LanguageContext";
import ReadAloud from "@/components/ui/ReadAloud";
import { ArrowRight, Check } from "lucide-react";

interface GuidedReportProps {
  onConfirm: (composedNarrative: string, amount?: number) => void;
}

interface OptionItem {
  id: string;
  labelKey: string;
  defaultLabel: string;
  narrative: string;
}

export default function GuidedReport({ onConfirm }: GuidedReportProps) {
  const { t } = useLang();

  const contactOptions: OptionItem[] = [
    { id: "call", labelKey: "g.c.call", defaultLabel: "A phone call", narrative: "I got a phone call from someone I did not know." },
    { id: "whatsapp", labelKey: "g.c.whatsapp", defaultLabel: "WhatsApp or SMS", narrative: "I got a message on WhatsApp or SMS from someone I did not know." },
    { id: "social", labelKey: "g.c.social", defaultLabel: "Social media", narrative: "Someone contacted me on social media." },
    { id: "email", labelKey: "g.c.email", defaultLabel: "Email", narrative: "I got an email from someone I did not know." },
    { id: "website", labelKey: "g.c.website", defaultLabel: "A website or app", narrative: "I was using a website or an app when this happened." },
    { id: "person", labelKey: "g.c.person", defaultLabel: "In person", narrative: "Someone approached me in person." },
  ];

  const actionOptions: OptionItem[] = [
    { id: "otp", labelKey: "g.a.otp", defaultLabel: "I shared an OTP or PIN", narrative: "They got me to share an OTP or PIN with them." },
    { id: "app", labelKey: "g.a.app", defaultLabel: "I installed an app they sent", narrative: "They got me to install an app that they sent me." },
    { id: "link", labelKey: "g.a.link", defaultLabel: "I clicked a link and entered bank details", narrative: "I clicked a link they sent and entered my bank details." },
    { id: "sent", labelKey: "g.a.sent", defaultLabel: "I transferred money to them", narrative: "I transferred money to them myself." },
    { id: "photos", labelKey: "g.a.photos", defaultLabel: "They are threatening me with private photos", narrative: "They have private photos or videos of me and are threatening me." },
    { id: "none", labelKey: "g.a.none", defaultLabel: "Nothing yet", narrative: "I did not give them anything yet." },
  ];

  const timingOptions: OptionItem[] = [
    { id: "hour", labelKey: "g.w.hour", defaultLabel: "In the last hour", narrative: "This happened within the last hour." },
    { id: "today", labelKey: "g.w.today", defaultLabel: "Earlier today", narrative: "This happened earlier today." },
    { id: "week", labelKey: "g.w.week", defaultLabel: "In the last few days", narrative: "This happened in the last few days." },
    { id: "older", labelKey: "g.w.older", defaultLabel: "More than a week ago", narrative: "This happened more than a week ago." },
  ];

  const [contact, setContact] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [moneyLeft, setMoneyLeft] = useState<"yes" | "no" | "">("");
  const [amount, setAmount] = useState<string>("");
  const [timing, setTiming] = useState<string>("");
  const [extra, setExtra] = useState<string>("");

  const isComplete = contact && action && moneyLeft && timing;

  // Build the clean structured narrative
  const selectedContact = contactOptions.find((o) => o.id === contact);
  const selectedAction = actionOptions.find((o) => o.id === action);
  const selectedTiming = timingOptions.find((o) => o.id === timing);

  const moneySentence =
    moneyLeft === "yes"
      ? amount
        ? `${Number(amount).toLocaleString("en-IN")} rupees went out of my account.`
        : "Money went out of my account."
      : "No money has left my account so far.";

  const compiledNarrative = [
    selectedContact?.narrative,
    selectedAction?.narrative,
    moneySentence,
    selectedTiming?.narrative,
    extra.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  // Localized human-readable summary bullets
  const summaryBullet = [
    selectedContact ? t(selectedContact.labelKey) || selectedContact.defaultLabel : "",
    selectedAction ? t(selectedAction.labelKey) || selectedAction.defaultLabel : "",
    moneyLeft === "yes"
      ? `${t("g.lostYes") || "Money left my account"}${amount ? ` — ₹${Number(amount).toLocaleString("en-IN")}` : ""}`
      : moneyLeft === "no"
      ? t("g.lostNo") || "No money left my account"
      : "",
    selectedTiming ? t(selectedTiming.labelKey) || selectedTiming.defaultLabel : "",
    extra.trim(),
  ]
    .filter(Boolean)
    .join(". ") + ".";

  const handleConfirm = () => {
    const numAmount = amount ? parseFloat(amount) : undefined;
    onConfirm(compiledNarrative, numAmount);
  };

  return (
    <div className="space-y-8">
      {/* Question 1: Contact */}
      <fieldset>
        <legend className="mb-3 block text-lg font-bold text-ink-900">
          {t("g.q1") || "How did they first contact you?"}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {contactOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setContact(opt.id)}
              aria-pressed={contact === opt.id}
              className={`ux-target flex items-center justify-between rounded-ux border-2 px-5 py-4 text-left text-lg font-medium transition ${
                contact === opt.id
                  ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/30 font-semibold"
                  : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              <span>{t(opt.labelKey) || opt.defaultLabel}</span>
              {contact === opt.id && <Check className="h-5 w-5 text-brand-600 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Question 2: Action */}
      <fieldset>
        <legend className="mb-3 block text-lg font-bold text-ink-900">
          {t("g.q2") || "What did they get you to do?"}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {actionOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAction(opt.id)}
              aria-pressed={action === opt.id}
              className={`ux-target flex items-center justify-between rounded-ux border-2 px-5 py-4 text-left text-lg font-medium transition ${
                action === opt.id
                  ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/30 font-semibold"
                  : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              <span>{t(opt.labelKey) || opt.defaultLabel}</span>
              {action === opt.id && <Check className="h-5 w-5 text-brand-600 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Question 3: Money Movement */}
      <fieldset>
        <legend className="mb-3 block text-lg font-bold text-ink-900">
          {t("g.q3") || "Did money leave your account?"}
        </legend>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMoneyLeft("yes")}
            aria-pressed={moneyLeft === "yes"}
            className={`ux-target min-w-[7rem] rounded-ux border-2 px-6 py-3.5 text-center text-lg font-medium transition ${
              moneyLeft === "yes"
                ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/30 font-semibold"
                : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/40"
            }`}
          >
            {t("g.yes") || "Yes"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMoneyLeft("no");
              setAmount("");
            }}
            aria-pressed={moneyLeft === "no"}
            className={`ux-target min-w-[7rem] rounded-ux border-2 px-6 py-3.5 text-center text-lg font-medium transition ${
              moneyLeft === "no"
                ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/30 font-semibold"
                : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/40"
            }`}
          >
            {t("g.no") || "No"}
          </button>
        </div>

        {moneyLeft === "yes" && (
          <div className="mt-4 rounded-ux-lg border border-danger-200 bg-danger-50/40 p-4">
            <label htmlFor="g-amount" className="mb-1.5 block text-base font-semibold text-ink-900">
              {t("g.amount") || "How much, roughly?"}
            </label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-lg font-semibold text-ink-500">
                ₹
              </span>
              <input
                id="g-amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="62000"
                className="w-full rounded-ux border-2 border-ink-300 bg-white pl-8 pr-4 py-2.5 text-lg font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-sm text-ink-600">
              {t("g.amountHint") || "A rough figure is fine. You can correct it later."}
            </p>
          </div>
        )}
      </fieldset>

      {/* Question 4: Timing */}
      <fieldset>
        <legend className="mb-3 block text-lg font-bold text-ink-900">
          {t("g.q4") || "When did this happen?"}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {timingOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTiming(opt.id)}
              aria-pressed={timing === opt.id}
              className={`ux-target flex items-center justify-between rounded-ux border-2 px-5 py-4 text-left text-lg font-medium transition ${
                timing === opt.id
                  ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/30 font-semibold"
                  : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              <span>{t(opt.labelKey) || opt.defaultLabel}</span>
              {timing === opt.id && <Check className="h-5 w-5 text-brand-600 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Question 5: Additional Info */}
      <div>
        <label htmlFor="g-extra" className="mb-1.5 block text-lg font-bold text-ink-900">
          {t("g.q5") || "Anything else you want to add?"}{" "}
          <span className="text-base font-normal text-ink-500">
            ({t("common.optional") || "optional"})
          </span>
        </label>
        <textarea
          id="g-extra"
          rows={3}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Any account numbers, suspect phone numbers, website addresses, or specific details you recall..."
          className="w-full rounded-ux border-2 border-ink-200 bg-white px-4 py-3 text-lg leading-relaxed text-ink-900 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Summary Confirmation Card */}
      {isComplete ? (
        <div className="rounded-ux-lg border-2 border-brand-200 bg-brand-50/50 p-5 space-y-4">
          <div>
            <p className="mb-1 text-base font-bold text-ink-900">
              {t("g.summary") || "This is what we will send. Please check it."}
            </p>
            <p className="text-lg leading-relaxed text-ink-800 bg-white p-3 rounded-ux border border-brand-100">
              {summaryBullet}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ReadAloud text={summaryBullet} />
            <button
              type="button"
              onClick={handleConfirm}
              className="ux-target inline-flex items-center gap-2 rounded-ux bg-brand-500 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-brand-600 active:bg-brand-700"
            >
              <span>{t("g.confirm") || "Yes, this is right"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-base text-ink-500 italic">
          {t("g.incomplete") || "Answer the questions above and we will write it up for you."}
        </p>
      )}
    </div>
  );
}
