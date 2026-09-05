"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { checkSuspectAction, reportSuspectAction, CheckVerdict } from "@/actions/check";
import { ShieldAlert, AlertTriangle, CheckCircle, HelpCircle, ArrowRight, Flag, Check } from "lucide-react";

export default function CheckPage() {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<CheckVerdict | null>(null);

  // Suspect reporting
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingLoading, setReportingLoading] = useState(false);
  const [reportedRef, setReportedRef] = useState<string | null>(null);

  const examples = [
    { label: "Bank Spoof URL", value: "sbi.secure-verify.xyz/login" },
    { label: "Punycode Phish", value: "xn--pypal-4ve.com" },
    { label: "Scam UPI VPA", value: "electricity.refund.support@ybl" },
    { label: "Overseas Caller", value: "+92 300 1234567" },
  ];

  const handleRunCheck = async (textToCheck = inputVal) => {
    if (!textToCheck.trim()) return;
    setLoading(true);
    setReportedRef(null);

    try {
      const res = await checkSuspectAction(textToCheck);
      setVerdict(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (val: string) => {
    setInputVal(val);
    handleRunCheck(val);
  };

  const handleReportSuspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal || !reportReason.trim()) return;
    setReportingLoading(true);

    try {
      const res = await reportSuspectAction(inputVal, reportReason);
      if (res.success && res.ref) {
        setReportedRef(res.ref);
        setShowReportForm(false);
        setReportReason("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportingLoading(false);
    }
  };

  const verdictStyles = {
    danger: {
      box: "border-danger-500 bg-danger-50/70",
      badge: "danger" as const,
      icon: <ShieldAlert className="h-7 w-7 text-danger-600 shrink-0 mt-0.5" />,
      badgeLabel: "High Danger Flagged",
    },
    warning: {
      box: "border-warning-500 bg-warning-50/70",
      badge: "warning" as const,
      icon: <AlertTriangle className="h-7 w-7 text-warning-600 shrink-0 mt-0.5" />,
      badgeLabel: "Caution Advised",
    },
    ok: {
      box: "border-success-500 bg-success-50/70",
      badge: "success" as const,
      icon: <CheckCircle className="h-7 w-7 text-success-600 shrink-0 mt-0.5" />,
      badgeLabel: "No Deceptive Pattern",
    },
    unclear: {
      box: "border-ink-300 bg-ink-50",
      badge: "neutral" as const,
      icon: <HelpCircle className="h-7 w-7 text-ink-500 shrink-0 mt-0.5" />,
      badgeLabel: "Unclear Format",
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">
          Suspect Repository Analysis
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Check a suspect, then report it
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          Paste a link, UPI ID, phone number, or email. You get an immediate structural safety analysis — and if it looks deceptive, you can submit it to the national suspect registry.
        </p>
      </div>

      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCheck();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="check-input" className="block text-base font-bold text-ink-900 mb-1.5">
              What were you sent?
            </label>
            <input
              id="check-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g., sbi.secure-verify.xyz/login or 9876543210@ybl"
              className="w-full rounded-ux border-2 border-ink-200 px-4 py-3 font-mono text-base text-ink-900 focus:border-brand-500 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-ink-500 font-semibold">Try examples:</span>
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleExampleClick(ex.value)}
                className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 transition"
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" disabled={loading || !inputVal.trim()} className="py-2.5 px-6">
              {loading ? "Analyzing..." : "Inspect Identifier →"}
            </Button>
          </div>
        </form>
      </Card>

      {/* VERDICT CARD */}
      {verdict && (
        <div className={`rounded-ux-xl border-2 p-6 transition shadow-sm ${verdictStyles[verdict.verdict].box}`}>
          <div className="flex items-start gap-4">
            {verdictStyles[verdict.verdict].icon}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-mono text-base font-bold text-ink-900 break-all">
                  {verdict.query}
                </span>
                <Badge tone={verdictStyles[verdict.verdict].badge}>
                  {verdictStyles[verdict.verdict].badgeLabel}
                </Badge>
              </div>

              <h2 className="text-xl font-bold text-ink-900 mb-3">
                {verdict.title}
              </h2>

              <ul className="space-y-2 text-sm leading-relaxed text-ink-800">
                {verdict.reasons.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-600 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-ink-200/50">
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="ux-target inline-flex items-center gap-1.5 rounded-ux bg-white border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50 transition shadow-sm"
                >
                  <Flag className="h-4 w-4 text-danger-600" />
                  <span>Report this suspect to registry</span>
                </button>

                {verdict.verdict === "danger" && (
                  <Button href="/report" variant="danger" size="sm">
                    Report as Victim Crime →
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT SUBMISSION MODAL / INLINE FORM */}
      {showReportForm && (
        <Card className="p-6 border-2 border-danger-200 bg-white">
          <h2 className="text-lg font-bold text-ink-900 mb-2">
            Submit Suspect to Repository
          </h2>
          <p className="text-xs text-ink-600 mb-4">
            Submitting helps warn other citizens before money or credentials are lost.
          </p>

          <form onSubmit={handleReportSuspect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Suspect Identifier
              </label>
              <input
                type="text"
                disabled
                value={inputVal}
                className="w-full rounded-ux border border-ink-200 bg-ink-50 px-3 py-2 font-mono text-sm text-ink-700"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                What did they try to do? (Reason)
              </label>
              <textarea
                id="reason"
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Sent a fake electricity bill SMS demanding payment via this handle..."
                className="w-full rounded-ux border-2 border-ink-200 p-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="rounded-ux border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50"
              >
                Cancel
              </button>
              <Button type="submit" variant="danger" disabled={reportingLoading}>
                {reportingLoading ? "Saving to MongoDB..." : "Submit Suspect Record"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SUCCESS BANNER AFTER REPORTING */}
      {reportedRef && (
        <div className="rounded-ux-lg border-2 border-success-500/40 bg-success-50 p-5 flex items-center justify-between gap-3 text-success-900">
          <div className="flex items-center gap-3">
            <Check className="h-6 w-6 text-success-600 shrink-0" />
            <div>
              <strong className="block font-semibold">Suspect Logged in Repository</strong>
              <span className="text-xs">
                Reference ID: <strong className="font-mono">{reportedRef}</strong> stored in MongoDB.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
