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
  INDIAN_JURISDICTIONS,
  NATIONAL_ID_TYPES,
  INCIDENT_CHANNELS,
} from "@/lib/jurisdiction";
import {
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
  Download,
  Cpu,
  Bot,
  Sparkles,
  UserCheck,
  MapPin,
  User,
  Globe,
  Phone,
  FileText,
  Lock,
  Calendar,
  Layers,
} from "lucide-react";

type ReportStep = "NARRATIVE" | "FREEZE" | "DETAILS" | "KYC" | "EVIDENCE" | "REVIEW" | "SUCCESS";

interface EvidenceFileItem {
  name: string;
  size: number;
  sha256: string;
  category?: string;
}

export default function ReportPage() {
  const router = useRouter();
  const { lang, t, speechLocale } = useLang();
  const { assist, setAssist } = useAssist();
  const { phone: accountPhone } = useAccount();

  // Local state override for guided vs standard within report
  const [useGuided, setUseGuided] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ReportStep>("NARRATIVE");

  // Step 1: Narrative inputs
  const [narrative, setNarrative] = useState("");
  const [voiceLang, setVoiceLang] = useState(speechLocale || "en-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseNarrativeRef = useRef<string>("");

  // Triage state & AI Auto-fill
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOverridingCategory, setIsOverridingCategory] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);
  const [extractedPills, setExtractedPills] = useState<string[]>([]);

  // Step 2: Banking Freeze state (Golden Hour)
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [suspectAccount, setSuspectAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [freezeRequested, setFreezeRequested] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeMessage, setFreezeMessage] = useState("");

  // Step 3: Structured Incident & Suspect Details
  const [platformChannel, setPlatformChannel] = useState<string>("WhatsApp");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [delayReason, setDelayReason] = useState<string>("Reported promptly (<24 hours)");
  const [suspectName, setSuspectName] = useState<string>("");
  const [suspectPhone, setSuspectPhone] = useState<string>("");
  const [suspectHandle, setSuspectHandle] = useState<string>("");
  const [suspectWebsite, setSuspectWebsite] = useState<string>("");
  const [suspectDetails, setSuspectDetails] = useState<string>("");

  // Step 4: Complainant KYC & Police Station Jurisdiction
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [gender, setGender] = useState<string>("Male");
  const [dob, setDob] = useState<string>("");
  const [idType, setIdType] = useState<string>("Aadhaar Card");
  const [idNumber, setIdNumber] = useState<string>("");
  const [stateName, setStateName] = useState<string>("Delhi");
  const [district, setDistrict] = useState<string>("South West Delhi");
  const [policeStation, setPoliceStation] = useState<string>("Cyber Crime Police Station, South West (Dwarka)");
  const [address, setAddress] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");

  // Step 5: Evidence state
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileItem[]>([]);
  const [hashingLoading, setHashingLoading] = useState(false);

  // Step 6: Review & Statutory Undertaking
  const [undertakingAccepted, setUndertakingAccepted] = useState<boolean>(false);

  // Final Submission
  const [submitting, setSubmitting] = useState(false);
  const [ackNumber, setAckNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedAck, setCopiedAck] = useState(false);

  // Sync assisted mode default & pre-fill phone from account
  useEffect(() => {
    setUseGuided(assist);
  }, [assist]);

  useEffect(() => {
    if (accountPhone && !phone) {
      setPhone(accountPhone);
    }
  }, [accountPhone, phone]);

  // Handle cascading state -> district -> police station
  useEffect(() => {
    const foundState = INDIAN_JURISDICTIONS.find((s) => s.state === stateName);
    if (foundState && foundState.districts.length > 0) {
      const matchDist = foundState.districts.find((d) => d.district === district) || foundState.districts[0];
      setDistrict(matchDist.district);
      setPoliceStation(matchDist.policeStation);
    }
  }, [stateName]);

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const foundState = INDIAN_JURISDICTIONS.find((s) => s.state === stateName);
    const foundDist = foundState?.districts.find((d) => d.district === newDistrict);
    if (foundDist) {
      setPoliceStation(foundDist.policeStation);
    }
  };

  // PDF download helper
  const downloadPdf = async () => {
    if (!ackNumber) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(11, 12, 12);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("CasePilot — National Cyber Incident Confirmation", 14, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Official Citizen Acknowledgment & Statutory Chain-of-Custody Record", 14, 20);

    // Body
    doc.setTextColor(11, 12, 12);
    let y = 36;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Acknowledgement Number", 14, y); y += 6;
    doc.setFontSize(18);
    doc.setTextColor(29, 112, 184);
    doc.text(ackNumber, 14, y); y += 10;
    doc.setTextColor(11, 12, 12);

    const row = (label: string, value: string) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(label, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "Not Specified", 70, y);
      y += 6.5;
    };

    row("Filed at:", new Date().toLocaleString("en-IN"));
    if (selectedCategory) {
      row("Official Category:", selectedCategory.label);
      row("Parent Classification:", selectedCategory.parent);
    }
    if (triageResult) {
      row("Statutory Urgency:", triageResult.urgency.toUpperCase());
      row("Classification Engine:", triageResult.source === "ai" ? "AI-assisted (gpt-4o-mini)" : "Rule-based engine");
    }
    if (amount) {
      row("Reported Loss:", `\u20B9${Number(amount).toLocaleString("en-IN")}`);
    }
    if (freezeRequested) {
      row("Bank Freeze Alert:", "Dispatched via CFCFRMS / 1930 Gateway");
    }

    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("INCIDENT & SUSPECT PARTICULARS", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    row("Platform / Channel:", platformChannel);
    if (incidentDate) row("Incident Timing:", incidentDate);
    if (suspectName) row("Suspect Name / Alias:", suspectName);
    if (suspectPhone) row("Suspect Contact:", suspectPhone);
    if (suspectAccount) row("Suspect Bank/UPI:", suspectAccount);
    if (suspectHandle) row("Suspect Handle / Link:", suspectHandle);
    if (suspectWebsite) row("Suspect Malicious URL:", suspectWebsite);

    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("COMPLAINANT IDENTITY & POLICE JURISDICTION", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (fullName) row("Complainant Name:", fullName);
    row("Registered Mobile:", phone || accountPhone || "Verified in session");
    if (email) row("Complainant Email:", email);
    if (idType && idNumber) row("National ID Proof:", `${idType} (${idNumber})`);
    row("Jurisdiction State:", stateName);
    row("Police District:", district);
    row("Assigned Cyber Station:", policeStation);

    if (evidenceFiles.length > 0) {
      y += 2;
      doc.setFillColor(240, 244, 248);
      doc.rect(14, y, pageW - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(20, 60, 110);
      doc.text("DIGITAL EVIDENCE VAULT (SHA-256 DIGESTS - SEC 63 BSA)", 16, y + 4.5);
      doc.setTextColor(11, 12, 12);
      y += 9;

      evidenceFiles.forEach((f) => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
        const line = `${f.name} [${f.category || "Evidence"}]: ${f.sha256.slice(0, 36)}...`;
        doc.text(line, 14, y); y += 4.5;
      });
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(248, 249, 250);
    doc.rect(0, pageH - 18, pageW, 18, "F");
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.5);
    doc.setTextColor(80, 90, 95);
    doc.text(
      "Statutory Record under BNSS Section 173(3) and BSA Section 63. Official inquiry routed to designated Cyber Cell.",
      14, pageH - 10
    );

    doc.save(`CasePilot-Complaint-${ackNumber}.pdf`);
  };

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

  // STEP 1 AI TRIAGE & FORM PRE-POPULATION
  const handleTriage = async (textToTriage = narrative, presetAmount?: number) => {
    if (!textToTriage.trim()) return;
    setErrorMessage("");
    setTriageLoading(true);

    try {
      // Call /api/triage — AI-assisted entity extraction
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative: textToTriage }),
      });

      if (!res.ok) throw new Error(`Triage API error ${res.status}`);
      const result: TriageResult = await res.json();

      // Digital Arrest interrupt — redirect immediately to circuit breaker
      if (result.isDigitalArrest) {
        window.location.href = "/digital-arrest?continue=true";
        return;
      }

      setTriageResult(result);
      const cat = CATEGORIES.find((c) => c.id === result.categoryId) || CATEGORIES[0];
      setSelectedCategory(cat);

      // ✨ AUTO-FILL FORM BOXES ACROSS ALL STEPS FROM AI EXTRACTION ✨
      if (result.extractedFields) {
        const ef = result.extractedFields;
        if (ef.bankName) setBankName(ef.bankName);
        if (ef.bankAccount) setBankAccount(ef.bankAccount);
        if (ef.suspectAccount) setSuspectAccount(ef.suspectAccount);
        if (ef.utrNumber) setTransactionId(ef.utrNumber);
        if (ef.amount) setAmount(ef.amount.toString());
        if (ef.paymentMode) setPaymentMode(ef.paymentMode);
        if (ef.channel) setPlatformChannel(ef.channel);
        if (ef.suspectName) setSuspectName(ef.suspectName);
        if (ef.suspectPhone) setSuspectPhone(ef.suspectPhone);
        if (ef.suspectHandle) setSuspectHandle(ef.suspectHandle);
        if (ef.suspectWebsite) setSuspectWebsite(ef.suspectWebsite);
        if (ef.incidentDate) setIncidentDate(ef.incidentDate);
        if (ef.delayReason) setDelayReason(ef.delayReason);
      } else if (presetAmount) {
        setAmount(presetAmount.toString());
      } else if (result.detectedAmount) {
        setAmount(result.detectedAmount.toString());
      }

      if (result.extractedPills && result.extractedPills.length > 0) {
        setExtractedPills(result.extractedPills);
      }

      // Advance to next step (Golden Hour Freeze if money moved, otherwise Details)
      if (result.isFinancialFraud && result.moneyMoved) {
        setCurrentStep("FREEZE");
      } else {
        setCurrentStep("DETAILS");
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
          category: file.name.toLowerCase().includes("bank") ? "Bank Statement" : "Chat Screenshot",
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
      setCurrentStep("DETAILS");
    }
    setFreezeLoading(false);
  };

  const handleFinalSubmit = async () => {
    if (!selectedCategory) return;
    if (!undertakingAccepted) {
      setErrorMessage("Please accept the statutory declaration undertaking before submitting.");
      return;
    }
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
        suspectAccount: suspectAccount || undefined,
        paymentMode: paymentMode || undefined,
        freezeRequested,
        incidentDate: incidentDate || undefined,
        platformChannel: platformChannel || undefined,
        delayReason: delayReason || undefined,
        suspectDetails: {
          name: suspectName || undefined,
          mobile: suspectPhone || undefined,
          account: suspectAccount || undefined,
          handle: suspectHandle || undefined,
          website: suspectWebsite || undefined,
          details: suspectDetails || undefined,
        },
        complainantKYC: {
          fullName: fullName || undefined,
          email: email || undefined,
          phone: phone || accountPhone || undefined,
          gender: gender || undefined,
          dob: dob || undefined,
          idType: idType || undefined,
          idNumber: idNumber || undefined,
          state: stateName || undefined,
          district: district || undefined,
          policeStation: policeStation || undefined,
          address: address || undefined,
          pincode: pincode || undefined,
        },
        undertakingAccepted,
        evidenceFiles,
        phone: phone || accountPhone || undefined,
      });

      if (!res.success || !res.ack) {
        setErrorMessage(res.error || "Failed to submit report. Please try again.");
      } else {
        try {
          const stored = JSON.parse(
            localStorage.getItem("casepilot.recentAcks.v1") ||
            localStorage.getItem("surakhsa.recentAcks.v1") ||
            "[]"
          );
          if (!stored.includes(res.ack)) {
            stored.unshift(res.ack);
            localStorage.setItem("casepilot.recentAcks.v1", JSON.stringify(stored.slice(0, 20)));
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
    DETAILS: 3,
    KYC: 4,
    EVIDENCE: 5,
    REVIEW: 6,
    SUCCESS: 7,
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
            Official Cyber Complaint Registered
          </h1>
          <p className="mt-3 text-base text-ink-700 max-w-xl mx-auto">
            Your complaint has been formally registered in the state cyber portal repository and cryptographically timestamped.
          </p>

          {/* Acknowledgement Number Card */}
          <div className="mt-8 rounded-ux-lg border-2 border-brand-200 bg-white p-6 shadow-sm max-w-md mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Statutory Acknowledgement Number (ACK)
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
              Save this tracking code. It serves as your legal reference under Section 173(3) of Bharatiya Nagarik Suraksha Sanhita (BNSS).
            </p>
          </div>

          {/* Police Station Jurisdiction Assignment Card */}
          <div className="mt-6 rounded-ux border border-ink-200 bg-white p-4 max-w-md mx-auto text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-brand-700 font-bold uppercase tracking-wider mb-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Assigned Cyber Crime Jurisdiction</span>
            </div>
            <p className="text-ink-900 font-semibold">{policeStation}</p>
            <p className="text-ink-600">{district}, {stateName}</p>
          </div>

          {/* Golden Hour / Freeze Notice if applicable */}
          {freezeRequested && (
            <div className="mt-4 rounded-ux border border-warning-200 bg-warning-50 p-4 text-left max-w-md mx-auto text-xs text-warning-900 space-y-1">
              <strong className="block font-semibold">⚡ Golden-Hour Bank Alert Dispatched</strong>
              <p>
                An inter-bank lien alert for {amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "reported funds"} was transmitted to the 1930 / CFCFRMS nodal network.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track?ack=${ackNumber}`}
              className="ux-target inline-flex items-center gap-2 rounded-ux bg-brand-500 px-6 py-3 text-base font-semibold text-white hover:bg-brand-600 transition shadow-sm w-full sm:w-auto justify-center"
            >
              <span>Track Resolution Timeline</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={downloadPdf}
              className="ux-target inline-flex items-center gap-2 rounded-ux border-2 border-brand-500 bg-white px-5 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50 transition w-full sm:w-auto justify-center"
            >
              <Download className="h-4 w-4" />
              <span>Download Stamped PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNarrative("");
                setTriageResult(null);
                setSelectedCategory(null);
                setExtractedPills([]);
                setAmount("");
                setBankAccount("");
                setBankName("");
                setTransactionId("");
                setSuspectAccount("");
                setSuspectName("");
                setSuspectPhone("");
                setSuspectHandle("");
                setSuspectWebsite("");
                setFreezeRequested(false);
                setEvidenceFiles([]);
                setUndertakingAccepted(false);
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
      {/* 6-Stage Stepper Header */}
      <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs sm:text-sm" aria-label="Progress">
        <li className="flex items-center gap-1.5">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              currentStep === "NARRATIVE"
                ? "bg-brand-500 text-white"
                : "bg-brand-100 text-brand-700"
            }`}
          >
            1
          </span>
          <span className={currentStep === "NARRATIVE" ? "font-semibold text-ink-900" : "text-ink-600"}>
            Incident
          </span>
          <span aria-hidden="true" className="text-ink-300">›</span>
        </li>

        {/* Emergency Freeze Step (Shown or skipped) */}
        <li className="flex items-center gap-1.5">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              currentStep === "FREEZE"
                ? "bg-danger-600 text-white"
                : stepNumbers[currentStep] > 2
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            2
          </span>
          <span className={currentStep === "FREEZE" ? "font-semibold text-danger-700" : "text-ink-500"}>
            Freeze
          </span>
          <span aria-hidden="true" className="text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-1.5">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              currentStep === "DETAILS"
                ? "bg-brand-500 text-white"
                : stepNumbers[currentStep] > 3
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            3
          </span>
          <span className={currentStep === "DETAILS" ? "font-semibold text-ink-900" : "text-ink-500"}>
            Suspect
          </span>
          <span aria-hidden="true" className="text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-1.5">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              currentStep === "KYC"
                ? "bg-brand-500 text-white"
                : stepNumbers[currentStep] > 4
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            4
          </span>
          <span className={currentStep === "KYC" ? "font-semibold text-ink-900" : "text-ink-500"}>
            KYC & Station
          </span>
          <span aria-hidden="true" className="text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-1.5">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              currentStep === "EVIDENCE"
                ? "bg-brand-500 text-white"
                : stepNumbers[currentStep] > 5
                ? "bg-brand-100 text-brand-700"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            5
          </span>
          <span className={currentStep === "EVIDENCE" ? "font-semibold text-ink-900" : "text-ink-500"}>
            Evidence
          </span>
          <span aria-hidden="true" className="text-ink-300">›</span>
        </li>

        <li className="flex items-center gap-1.5">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              currentStep === "REVIEW"
                ? "bg-brand-500 text-white"
                : "bg-ink-200 text-ink-600"
            }`}
          >
            6
          </span>
          <span className={currentStep === "REVIEW" ? "font-semibold text-ink-900" : "text-ink-500"}>
            Review
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
                ? t("assist.banner") || "Assisted mode is on. Simple step-by-step guidance enabled."
                : "Prefer multiple-choice questions instead of typing?"}
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

      {/* STEP 1: NARRATIVE & AI AUTO-FILL INTAKE */}
      {currentStep === "NARRATIVE" && (
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {t("rep.title") || "What happened?"}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-600">
              Write or speak your story however it comes to you (English, Hindi, or mixed). Our AI engine will understand, classify the crime, and automatically populate all the required form boxes.
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
                      {t("rep.voiceLang") || "Voice Language"}
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
                  placeholder="For example: I got a call on WhatsApp from someone claiming to be an SBI officer saying my card was blocked. He asked for an OTP and then 62,000 rupees was debited via UPI to merchant handle sbi.quick@ybl. UTR is 423456789012..."
                  className="w-full rounded-ux border-2 border-ink-200 bg-white px-4 py-3 text-base leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
                />

                <div className="border-t border-ink-200 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-500">
                    {t("rep.examples") || "Or try one of these real-life scenarios:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleExampleClick(
                          "I got an SMS saying my electricity would be disconnected tonight. I clicked the link, installed an APK, and then 62,000 rupees was debited via UPI to merchant handle sbi.quick@ybl with UTR 423456789012."
                        )
                      }
                      className="ux-target rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                    >
                      UPI & APK Fraud
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleExampleClick(
                          "Mujhe call aaya bank manager ban kar. Bola card renew karne ke liye OTP batao. Maine OTP share kiya aur 35,000 rupay account se cut gaye suspect VPA fraud.node@axisbank par."
                        )
                      }
                      className="ux-target rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                    >
                      Hinglish Banking Fraud
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleExampleClick(
                          "A fake Instagram account @priya_m_official was created using my personal pictures. The user is blackmailing me on WhatsApp demanding money or threatening to share morphed media."
                        )
                      }
                      className="ux-target rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                    >
                      Social Media Extortion
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-6 flex justify-between items-center">
                  <span className="text-xs text-ink-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                    AI extracts entities & auto-fills all boxes
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTriage()}
                    disabled={triageLoading || narrative.trim().length < 10}
                    className="ux-target inline-flex items-center gap-2 rounded-ux bg-brand-500 px-6 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span>{triageLoading ? "Analyzing & Filling Boxes..." : "Auto-Fill & Continue"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* STEP 2: GOLDEN HOUR FREEZE REQUEST (CONDITIONAL) */}
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
              The first 120 minutes decide everything. These details were auto-filled by AI from your story. Confirming them transmits an immediate lien alert across India's CFCFRMS bank network.
            </p>
          </div>

          {/* AI Extracted Entity Pills preview */}
          {extractedPills.length > 0 && (
            <div className="rounded-ux-lg border border-brand-200 bg-brand-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                <span>AI Extracted Facts (Auto-Populated)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extractedPills.map((pill, idx) => (
                  <span key={idx} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200 shadow-2xs">
                    {pill}
                  </span>
                ))}
              </div>
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
                    placeholder="e.g., State Bank of India / HDFC"
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

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="suspect-acc" className="block text-sm font-semibold text-ink-900 mb-1">
                    Suspect Account / UPI ID
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

                <div>
                  <label htmlFor="payment-mode" className="block text-sm font-semibold text-ink-900 mb-1">
                    Payment Mode
                  </label>
                  <select
                    id="payment-mode"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-base bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="UPI">UPI (GPay/PhonePe/Paytm)</option>
                    <option value="Net Banking">Net Banking (IMPS/NEFT/RTGS)</option>
                    <option value="Credit/Debit Card">Credit / Debit Card</option>
                    <option value="AEPS">AEPS / Biometric</option>
                    <option value="Wallet">Prepaid Wallet</option>
                    <option value="Crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="utr" className="block text-sm font-semibold text-ink-900 mb-1">
                  12-Digit Transaction Reference / UTR Number
                </label>
                <input
                  id="utr"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="12-digit UTR from SMS or UPI app receipt"
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
                  onClick={() => setCurrentStep("DETAILS")}
                  className="text-sm font-semibold text-ink-600 hover:text-ink-900 underline"
                >
                  Skip freeze alert for now
                </button>

                <Button type="submit" variant="danger" disabled={freezeLoading} className="py-3 px-6 text-base font-bold">
                  {freezeLoading ? "Transmitting freeze notice..." : "Dispatch Immediate Bank Freeze"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* STEP 3: INCIDENT PARAMETERS & SUSPECT DETAILS */}
      {currentStep === "DETAILS" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Incident & Suspect Details
            </h1>
            <p className="mt-2 text-base text-ink-600">
              Law enforcement requires specific suspect handles and platform channels to issue preservation orders and subpoenas.
            </p>
          </div>

          <Card className="p-6 space-y-6">
            {/* Platform / Channel Selection */}
            <div>
              <label className="block text-sm font-bold text-ink-900 mb-2">
                Platform / Channel Where Scam Occurred:
              </label>
              <div className="flex flex-wrap gap-2">
                {INCIDENT_CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setPlatformChannel(ch)}
                    className={`rounded-ux px-3 py-1.5 text-xs font-semibold border transition ${
                      platformChannel === ch
                        ? "bg-brand-500 text-white border-brand-600 shadow-xs"
                        : "bg-ink-50 text-ink-700 border-ink-200 hover:bg-ink-100"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-ink-100">
              <div>
                <label htmlFor="inc-date" className="block text-sm font-semibold text-ink-900 mb-1">
                  Incident Date & Approximate Time
                </label>
                <input
                  id="inc-date"
                  type="text"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  placeholder="e.g., Today at 11:30 AM or 05/09/2026"
                  className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="delay-reason" className="block text-sm font-semibold text-ink-900 mb-1">
                  Delay Reason (if reported after 24h)
                </label>
                <select
                  id="delay-reason"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-sm bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="Reported promptly (<24 hours)">Reported promptly (&lt;24 hours)</option>
                  <option value="Realized fraud late after bank statement">Realized fraud late after bank statement</option>
                  <option value="Was gathering transaction evidence & receipts">Was gathering transaction evidence & receipts</option>
                  <option value="Threatened / intimidated by the suspect">Threatened / intimidated by the suspect</option>
                  <option value="Approached local bank branch first">Approached local bank branch first</option>
                  <option value="Other valid reason">Other valid reason</option>
                </select>
              </div>
            </div>

            {/* Suspect Identifiers */}
            <div className="pt-4 border-t border-ink-200 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                  Suspect Identifiers (If known / Auto-filled by AI)
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="suspect-name" className="block text-xs font-semibold text-ink-700 mb-1">
                    Suspect Name / Impersonated Alias
                  </label>
                  <input
                    id="suspect-name"
                    type="text"
                    value={suspectName}
                    onChange={(e) => setSuspectName(e.target.value)}
                    placeholder="e.g., Bank Manager Rajesh / Fake CBI Officer"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="suspect-phone" className="block text-xs font-semibold text-ink-700 mb-1">
                    Suspect Mobile / WhatsApp Number
                  </label>
                  <input
                    id="suspect-phone"
                    type="text"
                    value={suspectPhone}
                    onChange={(e) => setSuspectPhone(e.target.value)}
                    placeholder="e.g., +91 9876543210"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="suspect-handle" className="block text-xs font-semibold text-ink-700 mb-1">
                    Social Media Handle / Telegram ID / Group Link
                  </label>
                  <input
                    id="suspect-handle"
                    type="text"
                    value={suspectHandle}
                    onChange={(e) => setSuspectHandle(e.target.value)}
                    placeholder="e.g., @invest_guru_99 or t.me/vip_task"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="suspect-web" className="block text-xs font-semibold text-ink-700 mb-1">
                    Phishing Website / Malicious APK Download Link
                  </label>
                  <input
                    id="suspect-web"
                    type="text"
                    value={suspectWebsite}
                    onChange={(e) => setSuspectWebsite(e.target.value)}
                    placeholder="e.g., http://sbi-kyc-update.site"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="suspect-extra" className="block text-xs font-semibold text-ink-700 mb-1">
                  Additional Suspect Details / Physical Address
                </label>
                <input
                  id="suspect-extra"
                  type="text"
                  value={suspectDetails}
                  onChange={(e) => setSuspectDetails(e.target.value)}
                  placeholder="Any other details (accent, email, crypto wallet address, fake badge ID)"
                  className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-ink-200">
              <button
                type="button"
                onClick={() => setCurrentStep(triageResult?.isFinancialFraud && triageResult?.moneyMoved ? "FREEZE" : "NARRATIVE")}
                className="text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                Back
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentStep("KYC")}
                className="py-3 px-6 text-base"
              >
                Continue to Complainant KYC
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: COMPLAINANT KYC & POLICE STATION JURISDICTION */}
      {currentStep === "KYC" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Complainant KYC & Police Station
            </h1>
            <p className="mt-2 text-base text-ink-600">
              Under BNSS Section 173(3), police investigation requires verified complainant identity and routing to the designated Cyber Crime Police Station.
            </p>
          </div>

          <Card className="p-6 space-y-6">
            {/* Complainant Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                  Complainant Identity Particulars
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="kyc-name" className="block text-xs font-semibold text-ink-700 mb-1">
                    Full Name (as per Official ID) *
                  </label>
                  <input
                    id="kyc-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Rajesh Kumar Sharma"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="kyc-phone" className="block text-xs font-semibold text-ink-700 mb-1">
                    Mobile Number (for SMS Tracking & Verification) *
                  </label>
                  <input
                    id="kyc-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 9876543210"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="kyc-email" className="block text-xs font-semibold text-ink-700 mb-1">
                    Email Address (for PDF confirmation)
                  </label>
                  <input
                    id="kyc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="kyc-gender" className="block text-xs font-semibold text-ink-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="kyc-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="kyc-dob" className="block text-xs font-semibold text-ink-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="kyc-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="kyc-idtype" className="block text-xs font-semibold text-ink-700 mb-1">
                    National ID Type
                  </label>
                  <select
                    id="kyc-idtype"
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none"
                  >
                    {NATIONAL_ID_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="kyc-idnumber" className="block text-xs font-semibold text-ink-700 mb-1">
                    ID Document Number (Masked or Partial)
                  </label>
                  <input
                    id="kyc-idnumber"
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g., XXXX-XXXX-4819 or PAN"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Jurisdictional Routing */}
            <div className="pt-4 border-t border-ink-200 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                  Police Jurisdiction & Residence Address
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="juris-state" className="block text-xs font-semibold text-ink-700 mb-1">
                    State / Union Territory *
                  </label>
                  <select
                    id="juris-state"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none font-semibold text-ink-900"
                  >
                    {INDIAN_JURISDICTIONS.map((j) => (
                      <option key={j.state} value={j.state}>{j.state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="juris-district" className="block text-xs font-semibold text-ink-700 mb-1">
                    District *
                  </label>
                  <select
                    id="juris-district"
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none font-semibold text-ink-900"
                  >
                    {INDIAN_JURISDICTIONS.find((s) => s.state === stateName)?.districts.map((d) => (
                      <option key={d.district} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-ux bg-ink-50 border border-ink-200 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">
                  Designated Cyber Crime Police Station (Auto-Mapped)
                </p>
                <input
                  type="text"
                  value={policeStation}
                  onChange={(e) => setPoliceStation(e.target.value)}
                  className="w-full rounded-ux border border-ink-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900"
                />
                <p className="mt-1.5 text-[11px] text-ink-500">
                  This station will receive legal custody of your complaint under Section 173(3) of BNSS.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label htmlFor="kyc-addr" className="block text-xs font-semibold text-ink-700 mb-1">
                    Residence Address
                  </label>
                  <input
                    id="kyc-addr"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No., Street, Locality"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="kyc-pin" className="block text-xs font-semibold text-ink-700 mb-1">
                    6-Digit Pincode
                  </label>
                  <input
                    id="kyc-pin"
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="110001"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-ink-200">
              <button
                type="button"
                onClick={() => setCurrentStep("DETAILS")}
                className="text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                Back
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentStep("EVIDENCE")}
                className="py-3 px-6 text-base"
              >
                Continue to Evidence Vault
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 5: EVIDENCE VAULT & ATTACHMENTS */}
      {currentStep === "EVIDENCE" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Evidence Vault & Category Confirmation
            </h1>
            <p className="mt-2 text-base text-ink-600">
              Attach screenshots, bank statements, or chats. Every attachment receives a cryptographic SHA-256 digital fingerprint calculated on your device for legal chain-of-custody under Section 63 BSA.
            </p>
          </div>

          {/* Official Category Verification & Override */}
          <Card className="p-5 border-ink-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Statutory Classified Category
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
                Upload screenshots, payment receipts, or chat logs
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
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={file.category || "Screenshot"}
                          onChange={(e) => {
                            const updated = [...evidenceFiles];
                            updated[idx].category = e.target.value;
                            setEvidenceFiles(updated);
                          }}
                          className="rounded-ux border border-ink-200 px-2 py-1 text-[11px] bg-white font-medium text-ink-700"
                        >
                          <option value="Bank Statement">Bank Statement</option>
                          <option value="Chat Screenshot">Chat Screenshot</option>
                          <option value="Transaction SMS">Transaction SMS</option>
                          <option value="Call Log">Call Log</option>
                          <option value="ID Proof">ID Proof</option>
                        </select>
                        <span className="text-ink-500 font-medium">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-ink-200">
              <button
                type="button"
                onClick={() => setCurrentStep("KYC")}
                className="text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                Back
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentStep("REVIEW")}
                className="py-3 px-6 text-base font-bold"
              >
                Proceed to Review & Submit
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 6: COMPREHENSIVE REVIEW & STATUTORY UNDERTAKING */}
      {currentStep === "REVIEW" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Review and File Official Complaint
            </h1>
            <p className="mt-2 text-base text-ink-600">
              Please verify the statutory details below before official submission. An official tracking ACK number will be generated immediately.
            </p>
          </div>

          <Card className="p-6 space-y-5">
            {/* Classification & Urgency */}
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

            {/* Narrative */}
            <div className="border-t border-ink-200 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                Incident Description & Statement of Facts
              </p>
              <div className="rounded-ux bg-ink-50 p-4 text-sm leading-relaxed text-ink-800 whitespace-pre-wrap">
                {narrative}
              </div>
              <div className="mt-2">
                <ReadAloud text={narrative} />
              </div>
            </div>

            {/* Banking Freeze Details */}
            {freezeRequested && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-danger-600 mb-1">
                  Golden-Hour Banking Freeze Notification Active
                </p>
                <div className="rounded-ux bg-danger-50/60 border border-danger-200 p-3 text-sm text-danger-900 space-y-1">
                  <p><strong>Bank:</strong> {bankName || "Not specified"}</p>
                  <p><strong>Debited Account:</strong> {bankAccount || "Not specified"}</p>
                  {amount && <p><strong>Reported Loss:</strong> ₹{Number(amount).toLocaleString("en-IN")}</p>}
                  {transactionId && <p><strong>UTR:</strong> {transactionId}</p>}
                  {suspectAccount && <p><strong>Suspect Account:</strong> {suspectAccount}</p>}
                </div>
              </div>
            )}

            {/* Suspect Particulars */}
            {(suspectName || suspectPhone || suspectHandle || suspectWebsite) && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Suspect Information
                </p>
                <div className="rounded-ux bg-ink-50 p-3 text-xs text-ink-800 space-y-1">
                  {suspectName && <p><strong>Suspect Name / Alias:</strong> {suspectName}</p>}
                  {suspectPhone && <p><strong>Suspect Contact:</strong> {suspectPhone}</p>}
                  {suspectHandle && <p><strong>Social Handle / Group:</strong> {suspectHandle}</p>}
                  {suspectWebsite && <p><strong>Malicious Link:</strong> {suspectWebsite}</p>}
                </div>
              </div>
            )}

            {/* Complainant KYC & Police Station */}
            <div className="border-t border-ink-200 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                Complainant Identity & Jurisdiction Assignment
              </p>
              <div className="rounded-ux bg-ink-50 p-3 text-xs text-ink-800 space-y-1">
                <p><strong>Complainant:</strong> {fullName || "Not specified"} ({phone || accountPhone || "Verified in session"})</p>
                {email && <p><strong>Email:</strong> {email}</p>}
                <p><strong>Assigned Cyber Station:</strong> {policeStation}, {district}, {stateName}</p>
              </div>
            </div>

            {/* Evidence items */}
            {evidenceFiles.length > 0 && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Attached Evidence Items ({evidenceFiles.length})
                </p>
                <ul className="list-disc list-inside text-xs text-ink-700 space-y-0.5">
                  {evidenceFiles.map((f, i) => (
                    <li key={i}>{f.name} [{(f.size / 1024).toFixed(1)} KB] — SHA-256: {f.sha256.slice(0, 24)}...</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Statutory Undertaking under Section 217 BNS */}
            <div className="border-t border-ink-200 pt-4">
              <label className="flex items-start gap-3 rounded-ux border-2 border-brand-200 bg-brand-50/40 p-3.5 cursor-pointer hover:bg-brand-50 transition">
                <input
                  type="checkbox"
                  checked={undertakingAccepted}
                  onChange={(e) => setUndertakingAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 shrink-0"
                />
                <span className="text-xs leading-relaxed text-ink-900 font-medium">
                  <strong>Statutory Declaration:</strong> I hereby solemnly declare that the facts and particulars stated above are true to the best of my knowledge and belief, and no material information has been suppressed. I understand that submitting false or misleading information to a public authority is a punishable offense under Section 217 of the Bharatiya Nyaya Sanhita (BNS).
                </span>
              </label>
            </div>

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
                Edit Details
              </button>

              <Button
                type="button"
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={submitting || !undertakingAccepted}
                className="py-3.5 px-8 text-lg font-bold"
              >
                {submitting ? "Registering Official Record..." : "File Official Complaint"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
