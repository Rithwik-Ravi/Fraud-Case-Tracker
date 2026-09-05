"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { useAssist } from "@/context/AssistContext";
import { useAccount } from "@/context/AccountContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ReadAloud from "@/components/ui/ReadAloud";
import GuidedReport from "@/components/report/GuidedReport";
import {
  CATEGORIES,
  Category,
  TriageResult,
} from "@/lib/triage";
import {
  triageIncidentAction,
  requestFreezeAction,
  submitComplaintAction,
} from "@/actions/report";
import {
  CheckCircle2,
  ShieldAlert,
  Mic,
  MicOff,
  Clock,
  FileCheck,
  Building2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  UploadCloud,
} from "lucide-react";

type ReportStep = "NARRATIVE" | "FREEZE" | "EVIDENCE" | "REVIEW" | "SUCCESS";

interface EvidenceFileItem {
  name: string;
  size: number;
  sha256: string;
}

export default function ReportPage() {
  const router = useRouter();
  const { lang, t, speechLocale } = useLang();
  const { assist, setAssist } = useAssist();
  const { phone: accountPhone } = useAccount();

  // Local state override for guided vs standard within report
  const [useGuided, setUseGuided] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ReportStep>("NARRATIVE");

  // Narrative inputs
  const [narrative, setNarrative] = useState("");
  const [voiceLang, setVoiceLang] = useState(speechLocale || "en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseNarrativeRef = useRef<string>("");

  // Triage state
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOverridingCategory, setIsOverridingCategory] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);

  // Banking Freeze state
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [suspectAccount, setSuspectAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [freezeRequested, setFreezeRequested] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeMessage, setFreezeMessage] = useState("");

  // Evidence state
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileItem[]>([]);
  const [hashingLoading, setHashingLoading] = useState(false);

  // Final Submission
  const [submitting, setSubmitting] = useState(false);
  const [ackNumber, setAckNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedAck, setCopiedAck] = useState(false);

  // Sync assisted mode default
  useEffect(() => {
    setUseGuided(assist);
  }, [assist]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        setSpeechSupported(true);
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = voiceLang;

        rec.onresult = (event: any) => {
          let sessionTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            sessionTranscript += event.results[i][0].transcript;
          }
          const trimmed = sessionTranscript.trim();
          if (trimmed) {
            const base = baseNarrativeRef.current ? baseNarrativeRef.current.trim() : "";
            setNarrative(base ? `${base} ${trimmed}` : trimmed);
          }
        };

        rec.onerror = () => setIsRecording(false);
        rec.onend = () => {
          setIsRecording(false);
          setNarrative((current) => {
            baseNarrativeRef.current = current;
            return current;
          });
        };
        recognitionRef.current = rec;
      }
    }
  }, [voiceLang]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        baseNarrativeRef.current = narrative;
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setNarrative(exampleText);
  };

  const handleTriage = async (textToTriage = narrative, presetAmount?: number) => {
    if (!textToTriage.trim()) return;
    setErrorMessage("");
    setTriageLoading(true);

    try {
      const res = await triageIncidentAction(textToTriage);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.result) {
        const result = res.result;
        setTriageResult(result);

        const cat = CATEGORIES.find((c) => c.id === result.categoryId) || CATEGORIES[0];
        setSelectedCategory(cat);

        if (presetAmount) {
          setAmount(presetAmount.toString());
        } else if (result.detectedAmount) {
          setAmount(result.detectedAmount.toString());
        }

        // Advance to next step
        if (result.isFinancialFraud && result.moneyMoved) {
          setCurrentStep("FREEZE");
        } else {
          setCurrentStep("EVIDENCE");
        }
      }
    } catch {
      setErrorMessage("Classification service error. Please try again.");
    } finally {
      setTriageLoading(false);
    }
  };

  const handleGuidedConfirm = (composedText: string, presetAmount?: number) => {
    setNarrative(composedText);
    handleTriage(composedText, presetAmount);
  };

  // Compute real SHA-256 for file attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setHashingLoading(true);
    const newItems: EvidenceFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        newItems.push({
          name: file.name,
          size: file.size,
          sha256,
        });
      } catch (err) {
        console.error("Hash error:", err);
      }
    }

    setEvidenceFiles((prev) => [...prev, ...newItems]);
    setHashingLoading(false);
  };

  const handleFreezeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setFreezeLoading(true);

    const numericAmount = parseFloat(amount);
    const res = await requestFreezeAction(bankAccount, isNaN(numericAmount) ? 0 : numericAmount);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setFreezeRequested(true);
      setFreezeMessage(res.message || "Freeze notification successfully dispatched.");
      setCurrentStep("EVIDENCE");
    }
    setFreezeLoading(false);
  };

  const handleFinalSubmit = async () => {
    if (!selectedCategory) return;
    setErrorMessage("");
    setSubmitting(true);

    try {
      const res = await submitComplaintAction({
        narrative,
        categoryId: selectedCategory.id,
        categoryLabel: selectedCategory.label,
        parentCategory: selectedCategory.parent,
        urgency: triageResult?.urgency || selectedCategory.defaultUrgency,
        amount: amount ? parseFloat(amount) : undefined,
        bankAccount: bankAccount || undefined,
        bankName: bankName || undefined,
        transactionId: transactionId || undefined,
        freezeRequested,
        evidenceFiles,
        phone: accountPhone || undefined,
      });

      if (!res.success || !res.ack) {
        setErrorMessage(res.error || "Failed to submit report. Please try again.");
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem("surakhsa.recentAcks.v1") || "[]");
          if (!stored.includes(res.ack)) {
            stored.unshift(res.ack);
            localStorage.setItem("surakhsa.recentAcks.v1", JSON.stringify(stored.slice(0, 20)));
          }
        } catch {}
        setAckNumber(res.ack);
        setCurrentStep("SUCCESS");
      }
    } catch {
      setErrorMessage("Network error submitting complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (ackNumber) {
      navigator.clipboard.writeText(ackNumber);
      setCopiedAck(true);
      setTimeout(() => setCopiedAck(false), 2500);
    }
  };

  const stepNumbers: Record<ReportStep, number> = {
    NARRATIVE: 1,
    FREEZE: 2,
    EVIDENCE: 3,
    REVIEW: 4,
    SUCCESS: 5,
  };

  // SUCCESS SCREEN
  if (currentStep === "SUCCESS" && ackNumber) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-ux-xl border-2 border-success-500/40 bg-success-50/50 p-8 text-center sm:p-10 shadow-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-500 text-white shadow-md">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Complaint Registered Securely
          </h1>
          <p className="mt-3 text-base text-ink-700 max-w-xl mx-auto">
            Your incident report has been persisted in the portal repository and officially timestamped.
          </p>

          {/* Acknowledgement Number Card */}
          <div className="mt-8 rounded-ux-lg border-2 border-brand-200 bg-white p-6 shadow-sm max-w-md mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Official Acknowledgement Number
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-extrabold tracking-widest text-ink-900">
                {ackNumber}
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded-ux border border-ink-200 p-2 text-ink-600 hover:border-brand-500 hover:text-brand-600 transition"
                title="Copy Acknowledgement Number"
              >
                {copiedAck ? <Check className="h-5 w-5 text-success-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Save this number. You do not need to sign in to check the investigation timeline or status updates.
            </p>
          </div>

          {/* Golden Hour / Freeze Notice if applicable */}
          {freezeRequested && (
            <div className="mt-6 rounded-ux border border-warning-200 bg-warning-50 p-4 text-left max-w-md mx-auto text-xs text-warning-900 space-y-1">
              <strong className="block font-semibold">⚡ Golden-Hour Action Active</strong>
              <p>
                A freeze alert for {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "reported funds"} was registered for bank node routing. The nodal bank unit has 2 hours under Right to Service standards to report frozen balances.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track?ack=${ackNumber}`}
              className="ux-target inline-flex items-center gap-2 rounded-ux bg-brand-500 px-6 py-3 text-base font-semibold text-white hover:bg-brand-600 transition shadow-sm w-full sm:w-auto justify-center"
            >
              <span>Track this Complaint</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setNarrative("");
                setTriageResult(null);
                setSelectedCategory(null);
                setAmount("");
                setBankAccount("");
                setBankName("");
                setTransactionId("");
                setFreezeRequested(false);
                setEvidenceFiles([]);
                setAckNumber(null);
                setCurrentStep("NARRATIVE");
              }}
              className="ux-target inline-flex items-center gap-2 rounded-ux border-2 border-ink-200 bg-white px-5 py-3 text-base font-semibold text-ink-700 hover:bg-ink-50 transition w-full sm:w-auto justify-center"
            >
              <RotateCcw className="h-4 w-4" />
              <span>File another report</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Stepper Header */}
      <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm" aria-label="Progress">
        <li className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              currentStep === "NARRATIVE"
                ? "bg-brand-500 text-white"
                : "bg-brand-100 text-brand-700"
            }`}
          >
            1
          </span>
          <span className={currentStep === "NARRATIVE" ? "font-semibold text-ink-900" : "text-ink-600"}>
            {t("rep.s1") || "What happened"}
          </span>
          <span aria-hidden="true" className="mx-1 text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              currentStep === "FREEZE"
                ? "bg-brand-500 text-white"
                : stepNumbers[currentStep] > 2
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            2
          </span>
          <span className={currentStep === "FREEZE" ? "font-semibold text-ink-900" : "text-ink-500"}>
            {t("rep.s2") || "Act fast"}
          </span>
          <span aria-hidden="true" className="mx-1 text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              currentStep === "EVIDENCE"
                ? "bg-brand-500 text-white"
                : stepNumbers[currentStep] > 3
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            3
          </span>
          <span className={currentStep === "EVIDENCE" ? "font-semibold text-ink-900" : "text-ink-500"}>
            {t("rep.s3") || "Details"}
          </span>
          <span aria-hidden="true" className="mx-1 text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
              currentStep === "REVIEW"
                ? "bg-brand-500 text-white"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            4
          </span>
          <span className={currentStep === "REVIEW" ? "font-semibold text-ink-900" : "text-ink-500"}>
            {t("rep.s4") || "Review"}
          </span>
        </li>
      </ol>

      {/* Assisted Mode Toggle Banner */}
      <div className="mb-6 rounded-ux-lg border border-brand-200 bg-brand-50/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <p className="text-sm font-semibold text-brand-900">
              {useGuided
                ? t("assist.banner") || "Assisted mode is on. Text is larger, and instead of one big box we ask a few simple questions."
                : "Prefer simple multiple-choice questions instead of typing?"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextVal = !useGuided;
              setUseGuided(nextVal);
              setAssist(nextVal);
            }}
            className="whitespace-nowrap rounded-ux border border-brand-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition shrink-0"
          >
            {useGuided
              ? t("assist.switchToTyping") || "I would rather type it myself"
              : t("assist.switchToGuided") || "Ask me simple questions instead"}
          </button>
        </div>
      </div>

      {/* STEP 1: NARRATIVE (GUIDED vs STANDARD) */}
      {currentStep === "NARRATIVE" && (
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {t("rep.title") || "What happened?"}
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-600">
              {t("rep.lede") ||
                "Write it however it comes to you — English, Hindi or a mix. There is no wrong way to say it, and you don't need to know what the crime is called."}
            </p>
          </div>

          <Card className="p-6 sm:p-7">
            {useGuided ? (
              <GuidedReport onConfirm={handleGuidedConfirm} />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="voice-lang" className="text-sm font-semibold text-ink-900">
                      {t("rep.voiceLang") || "Language for voice input"}
                    </label>
                    <select
                      id="voice-lang"
                      value={voiceLang}
                      onChange={(e) => setVoiceLang(e.target.value)}
                      className="rounded-ux border-2 border-ink-200 bg-white px-3 py-1.5 text-sm font-medium"
                    >
                      <option value="en-IN">English (India)</option>
                      <option value="hi-IN">हिन्दी</option>
                      <option value="bn-IN">বাংলা</option>
                      <option value="mr-IN">मराठी</option>
                      <option value="ta-IN">தமிழ்</option>
                      <option value="te-IN">తెలుగు</option>
                    </select>
                  </div>

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`inline-flex items-center gap-1.5 rounded-ux px-3 py-1.5 text-xs font-semibold transition ${
                        isRecording
                          ? "bg-danger-500 text-white animate-pulse"
                          : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-3.5 w-3.5" />
                          <span>{t("rep.stop") || "Stop recording"}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5" />
                          <span>{t("rep.speak") || "Speak instead of typing"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <label htmlFor="narrative" className="sr-only">
                  {t("rep.srLabel") || "Describe what happened"}
                </label>
                <textarea
                  id="narrative"
                  rows={7}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="For example: I got a call from someone saying he was from the bank. He asked for an OTP and then money went out of my account…"
                  className="w-full rounded-ux border-2 border-ink-200 bg-white px-4 py-3 text-base leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
                />

                <div className="border-t border-ink-200 pt-4">
                  <p className="mb-2 text-sm font-semibold text-ink-700">
                    {t("rep.examples") || "Or try one of these examples:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleExampleClick(
                          "I got an SMS saying my electricity would be disconnected tonight. I clicked the link, installed an APK, and then 62,000 rupees was debited via UPI to merchant handle sbi.quick@ybl."
                        )
                      }
                      className="ux-target rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                    >
                      UPI fraud
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleExampleClick(
                          "Mujhe call aaya bank manager ban kar. Bola card expire ho gaya hai, renew karne ke liye OTP batao. Maine OTP share kiya aur 35,000 rupay account se cut gaye."
                        )
                      }
                      className="ux-target rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                    >
                      Hinglish
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleExampleClick(
                          "A fake Instagram profile using my personal photos was created. The user is threatening to morph my pictures and message my college friends unless I transfer money."
                        )
                      }
                      className="ux-target rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                    >
                      Impersonation
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleTriage()}
                    disabled={triageLoading || narrative.trim().length < 10}
                    className="ux-target inline-flex items-center gap-2 rounded-ux bg-brand-500 px-6 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span>{triageLoading ? "Classifying..." : t("rep.continue") || "Continue"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* STEP 2: GOLDEN HOUR FREEZE REQUEST */}
      {currentStep === "FREEZE" && (
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-danger-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-danger-700 ring-1 ring-danger-200 mb-2">
              <Clock className="h-3.5 w-3.5" />
              Golden Hour Emergency Freeze
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Stop the money before it moves
            </h1>
            <p className="mt-2 text-base text-ink-600">
              The first hour decides everything. Providing these key transaction details triggers an automated hold notification across India's CFCFRMS bank network.
            </p>
          </div>

          {/* Triaged classification preview */}
          {selectedCategory && (
            <div className="rounded-ux-lg border border-ink-200 bg-ink-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Official Category Classified
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-bold text-brand-700">
                  {selectedCategory.label}
                </span>
                <Badge tone="danger">Golden Hour Priority</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-600">{triageResult?.reasoning}</p>
            </div>
          )}

          <Card className="p-6">
            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bank-name" className="block text-sm font-semibold text-ink-900 mb-1">
                    Your Bank / Payment App
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., State Bank of India / PhonePe"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-base focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="bank-acc" className="block text-sm font-semibold text-ink-900 mb-1">
                    Your Debited Account / UPI ID
                  </label>
                  <input
                    id="bank-acc"
                    type="text"
                    required
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g., 9876543210@ybl or A/C No."
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-base focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="suspect-acc" className="block text-sm font-semibold text-ink-900 mb-1">
                    Suspect Account / UPI ID (if known)
                  </label>
                  <input
                    id="suspect-acc"
                    type="text"
                    value={suspectAccount}
                    onChange={(e) => setSuspectAccount(e.target.value)}
                    placeholder="e.g., fraud.merchant@axisbank"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-base focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-ink-900 mb-1">
                    Amount Lost (₹)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="62000"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-base font-semibold focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="utr" className="block text-sm font-semibold text-ink-900 mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  id="utr"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="12-digit UTR from SMS or UPI app receipt (optional but recommended)"
                  className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-base focus:border-brand-500 focus:outline-none"
                />
              </div>

              {errorMessage && (
                <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ink-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep("EVIDENCE")}
                  className="text-sm font-semibold text-ink-600 hover:text-ink-900 underline"
                >
                  Skip freeze request for now →
                </button>

                <Button type="submit" variant="danger" disabled={freezeLoading} className="py-3 px-6 text-base">
                  {freezeLoading ? "Transmitting freeze request..." : "Dispatch Immediate Bank Freeze →"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* STEP 3: EVIDENCE & ATTACHMENTS */}
      {currentStep === "EVIDENCE" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Attach Evidence & Confirm Category
            </h1>
            <p className="mt-2 text-base text-ink-600">
              Screenshots, payment receipts, chat exports, or SMS records. Every attachment has its SHA-256 digital fingerprint calculated on your device for legal chain-of-custody.
            </p>
          </div>

          {/* Official Category Verification & Override */}
          <Card className="p-5 border-ink-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Assigned Category
              </span>
              <button
                type="button"
                onClick={() => setIsOverridingCategory(!isOverridingCategory)}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                {isOverridingCategory ? "Keep assigned category" : "Change category"}
              </button>
            </div>

            {!isOverridingCategory ? (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-900">{selectedCategory?.label}</h3>
                  <p className="text-xs text-ink-500">{selectedCategory?.parent}</p>
                </div>
                <Badge tone={selectedCategory?.defaultUrgency === "golden-hour" ? "danger" : "warning"}>
                  {selectedCategory?.defaultUrgency}
                </Badge>
              </div>
            ) : (
              <div className="mt-2">
                <label htmlFor="cat-override" className="block text-xs font-semibold text-ink-700 mb-1">
                  Select Official Category:
                </label>
                <select
                  id="cat-override"
                  value={selectedCategory?.id}
                  onChange={(e) => {
                    const cat = CATEGORIES.find((c) => c.id === e.target.value);
                    if (cat) setSelectedCategory(cat);
                  }}
                  className="w-full rounded-ux border-2 border-ink-200 p-2.5 text-sm font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent}: {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Card>

          {/* Evidence Upload */}
          <Card className="p-6">
            <div className="border-2 border-dashed border-ink-300 rounded-ux-lg p-6 text-center hover:border-brand-500 transition bg-ink-50/50">
              <UploadCloud className="mx-auto h-10 w-10 text-ink-400 mb-2" />
              <p className="text-sm font-semibold text-ink-800">
                Upload screenshots, PDFs, or photos of messages
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Files are analyzed and hashed locally using Web Crypto SHA-256.
              </p>
              <label className="mt-4 inline-flex items-center gap-2 rounded-ux bg-white border-2 border-ink-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 cursor-pointer shadow-sm">
                <span>Select Files</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="sr-only"
                  accept="image/*,.pdf,.txt"
                />
              </label>
            </div>

            {hashingLoading && (
              <p className="mt-3 text-center text-xs text-brand-600 font-semibold animate-pulse">
                Computing SHA-256 cryptographic fingerprints on device...
              </p>
            )}

            {evidenceFiles.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-600">
                  Attached Digital Evidence ({evidenceFiles.length})
                </p>
                <div className="divide-y divide-ink-100 rounded-ux border border-ink-200 bg-white">
                  {evidenceFiles.map((file, idx) => (
                    <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-ink-900 block">{file.name}</span>
                        <span className="font-mono text-[11px] text-ink-500 break-all">
                          SHA-256: {file.sha256}
                        </span>
                      </div>
                      <span className="text-ink-500 font-medium shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-ink-200">
              <button
                type="button"
                onClick={() => setCurrentStep(triageResult?.isFinancialFraud ? "FREEZE" : "NARRATIVE")}
                className="text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                ← Back
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentStep("REVIEW")}
                className="py-3 px-6 text-base"
              >
                Proceed to Review →
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {currentStep === "REVIEW" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Review and File Complaint
            </h1>
            <p className="mt-2 text-base text-ink-600">
              Please verify the information below before permanent filing. All submissions receive an official tracking ACK number.
            </p>
          </div>

          <Card className="p-6 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Official NCRP Classification
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xl font-bold text-ink-900">{selectedCategory?.label}</span>
                <Badge tone={selectedCategory?.defaultUrgency === "golden-hour" ? "danger" : "neutral"}>
                  {selectedCategory?.parent}
                </Badge>
              </div>
            </div>

            <div className="border-t border-ink-200 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                Incident Description
              </p>
              <div className="rounded-ux bg-ink-50 p-4 text-base leading-relaxed text-ink-800">
                {narrative}
              </div>
              <div className="mt-2">
                <ReadAloud text={narrative} />
              </div>
            </div>

            {freezeRequested && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-danger-600 mb-1">
                  Golden-Hour Banking Freeze Notification
                </p>
                <div className="rounded-ux bg-danger-50/60 border border-danger-200 p-3 text-sm text-danger-900 space-y-1">
                  <p><strong>Bank:</strong> {bankName || "Not specified"}</p>
                  <p><strong>Account/UPI:</strong> {bankAccount || "Not specified"}</p>
                  {amount && <p><strong>Amount:</strong> ₹{Number(amount).toLocaleString("en-IN")}</p>}
                  {transactionId && <p><strong>UTR:</strong> {transactionId}</p>}
                </div>
              </div>
            )}

            {evidenceFiles.length > 0 && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Attached Evidence Items ({evidenceFiles.length})
                </p>
                <ul className="list-disc list-inside text-sm text-ink-700">
                  {evidenceFiles.map((f, i) => (
                    <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-ink-200">
              <button
                type="button"
                onClick={() => setCurrentStep("EVIDENCE")}
                className="text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                ← Edit Details
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="py-3.5 px-8 text-lg font-bold shadow-md"
              >
                {submitting ? "Registering in MongoDB..." : "File Official Complaint →"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
