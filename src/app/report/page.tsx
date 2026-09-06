"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  classifyNarrative,
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
  CheckCircle,
  CheckCircle2,
  ShieldAlert,
  Mic,
  MicOff,
  Clock,
  FileCheck,
  Building2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
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
  EyeOff,
  Shield,
  ShieldCheck,
  HeartHandshake,
  Server,
  Terminal,
  LockKeyhole,
  Coins,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  HardDrive,
} from "lucide-react";

type ReportStep = "NARRATIVE" | "FREEZE" | "DETAILS" | "KYC" | "EVIDENCE" | "REVIEW" | "SUCCESS";

interface EvidenceFileItem {
  name: string;
  size: number;
  sha256: string;
  category?: string;
  dataUrl?: string;
}

/**
 * Client-side canvas downscaling utility.
 * Compresses screenshots to max 1200px width/height and 0.75 JPEG quality (~150-250KB).
 * Comfortably fits in MongoDB documents (16MB limit) and enables instant PDF embedding.
 */
function compressImageToDataUrl(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportPage() {
  const router = useRouter();
  const { lang, t, speechLocale } = useLang();
  const { assist, setAssist } = useAssist();
  const { phone: accountPhone } = useAccount();

  // Local state override for guided vs standard within report
  const [useGuided, setUseGuided] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ReportStep>("NARRATIVE");
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

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

  // Step 2: Priority Desk state
  // 2A: Banking Freeze state (Golden Hour)
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [suspectAccount, setSuspectAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [freezeRequested, setFreezeRequested] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeMessage, setFreezeMessage] = useState("");
  // 2B & 2C: Safety Desk & System Containment Desk acknowledgments
  const [safetyDeskAcknowledged, setSafetyDeskAcknowledged] = useState<boolean>(false);
  const [containmentAcknowledged, setContainmentAcknowledged] = useState<boolean>(false);

  // Step 3: Structured Incident & Suspect Details (Common NCRP Fields)
  const [platformChannel, setPlatformChannel] = useState<string>("WhatsApp");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [delayReason, setDelayReason] = useState<string>("Reported promptly (<24 hours)");
  const [suspectName, setSuspectName] = useState<string>("");
  const [suspectPhone, setSuspectPhone] = useState<string>("");
  const [suspectHandle, setSuspectHandle] = useState<string>("");
  const [suspectWebsite, setSuspectWebsite] = useState<string>("");
  const [suspectDetails, setSuspectDetails] = useState<string>("");

  // Category-Specific Dynamic Fields
  const [cryptoNetwork, setCryptoNetwork] = useState<string>("TRC-20 (Tron)");
  const [victimWallet, setVictimWallet] = useState<string>("");
  const [suspectWallet, setSuspectWallet] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [cryptoExchange, setCryptoExchange] = useState<string>("");

  const [encryptedExtension, setEncryptedExtension] = useState<string>("");
  const [ransomNoteFile, setRansomNoteFile] = useState<string>("");
  const [ransomDemanded, setRansomDemanded] = useState<string>("");
  const [ransomWalletAddress, setRansomWalletAddress] = useState<string>("");

  const [targetDomain, setTargetDomain] = useState<string>("");
  const [serverIp, setServerIp] = useState<string>("");
  const [defacerHandle, setDefacerHandle] = useState<string>("");

  const [imposterUrl, setImposterUrl] = useState<string>("");
  const [genuineUrl, setGenuineUrl] = useState<string>("");
  const [socialPlatform, setSocialPlatform] = useState<string>("Instagram");

  const [maliciousApkName, setMaliciousApkName] = useState<string>("");

  const [threatenedContent, setThreatenedContent] = useState<string>("");
  const [extortionDemand, setExtortionDemand] = useState<string>("");
  const [harassmentMedium, setHarassmentMedium] = useState<string>("WhatsApp");

  // Step 4: Complainant KYC & Police Station Jurisdiction (Track 1A vs Track 1B)
  const [reportAnonymously, setReportAnonymously] = useState<boolean>(false);
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
  const [draftBannerMessage, setDraftBannerMessage] = useState<string>("");

  /**
   * Universal draft populator: applies fields from either initial sessionStorage
   * or real-time live events broadcast by the open AI Chatbot drawer.
   */
  const applyDraftToForm = useCallback((draft: any) => {
    if (!draft) return;

    if (draft.narrative) setNarrative(draft.narrative);
    if (draft.amount !== undefined && draft.amount !== null) {
      setAmount(draft.amount.toString());
    }
    if (draft.bankName) setBankName(draft.bankName);
    if (draft.bankAccount) {
      setBankAccount(draft.bankAccount);
    } else if (phone || accountPhone) {
      setBankAccount(phone || accountPhone || "");
    }
    if (draft.paymentMode) setPaymentMode(draft.paymentMode);
    if (draft.utrNumber) setTransactionId(draft.utrNumber);
    if (draft.suspectAccount) setSuspectAccount(draft.suspectAccount);
    if (draft.suspectName) setSuspectName(draft.suspectName);
    if (draft.suspectPhone) setSuspectPhone(draft.suspectPhone);
    if (draft.suspectHandle) setSuspectHandle(draft.suspectHandle);
    if (draft.suspectWebsite) setSuspectWebsite(draft.suspectWebsite);
    if ((draft as any).suspectDetails) setSuspectDetails((draft as any).suspectDetails);
    if (draft.channel) setPlatformChannel(draft.channel);
    if (draft.incidentDate) setIncidentDate(draft.incidentDate);
    if (draft.reportAnonymously !== undefined) setReportAnonymously(Boolean(draft.reportAnonymously));

    // Synchronize attached evidence files from AI Chatbot
    if ((draft as any).evidenceFiles && Array.isArray((draft as any).evidenceFiles) && (draft as any).evidenceFiles.length > 0) {
      setEvidenceFiles((prev) => {
        const existingHashes = new Set(prev.map((f) => f.sha256));
        const newOnes = (draft as any).evidenceFiles.filter((f: any) => !existingHashes.has(f.sha256));
        return [...prev, ...newOnes];
      });
    }

    // Category-specific parameters
    if (draft.categorySpecificFields) {
      const cs = draft.categorySpecificFields;
      if (cs.cryptoNetwork) setCryptoNetwork(cs.cryptoNetwork);
      if (cs.victimWallet) setVictimWallet(cs.victimWallet);
      if (cs.suspectWallet) setSuspectWallet(cs.suspectWallet);
      if (cs.transactionHash) setTransactionHash(cs.transactionHash);
      if (cs.cryptoExchange) setCryptoExchange(cs.cryptoExchange);

      if (cs.encryptedExtension) setEncryptedExtension(cs.encryptedExtension);
      if (cs.ransomNoteFile) setRansomNoteFile(cs.ransomNoteFile);
      if (cs.ransomDemanded) setRansomDemanded(cs.ransomDemanded);
      if (cs.ransomWalletAddress) setRansomWalletAddress(cs.ransomWalletAddress);

      if (cs.targetDomain) setTargetDomain(cs.targetDomain);
      if (cs.serverIp) setServerIp(cs.serverIp);
      if (cs.defacerHandle) setDefacerHandle(cs.defacerHandle);

      if (cs.imposterUrl) setImposterUrl(cs.imposterUrl);
      if (cs.genuineUrl) setGenuineUrl(cs.genuineUrl);
      if (cs.socialPlatform) setSocialPlatform(cs.socialPlatform);

      if (cs.maliciousApkName) setMaliciousApkName(cs.maliciousApkName);

      if (cs.threatenedContent) setThreatenedContent(cs.threatenedContent);
      if (cs.extortionDemand) setExtortionDemand(cs.extortionDemand);
      if (cs.harassmentMedium) setHarassmentMedium(cs.harassmentMedium);
    }

    let foundCategory: Category | undefined;
    if (draft.categoryId) {
      foundCategory = CATEGORIES.find((c) => c.id === draft.categoryId);
      if (foundCategory) setSelectedCategory(foundCategory);
    }

    const pills: string[] = [];
    if (draft.categoryLabel) pills.push(`Category: ${draft.categoryLabel}`);
    if (draft.amount) pills.push(`Loss: ₹${Number(draft.amount).toLocaleString("en-IN")}`);
    if (draft.bankName) pills.push(`Bank: ${draft.bankName}`);
    if (draft.utrNumber) pills.push(`UTR: ${draft.utrNumber}`);
    if (draft.suspectAccount) pills.push(`UPI: ${draft.suspectAccount}`);
    if (draft.suspectPhone) pills.push(`Suspect: ${draft.suspectPhone}`);
    if (draft.suspectName) pills.push(`Alias: ${draft.suspectName}`);
    if (draft.categorySpecificFields?.suspectWallet) {
      pills.push(`Wallet: ${draft.categorySpecificFields.suspectWallet.slice(0, 10)}...`);
    }
    if (draft.categorySpecificFields?.encryptedExtension) {
      pills.push(`Ext: ${draft.categorySpecificFields.encryptedExtension}`);
    }
    if (draft.categorySpecificFields?.targetDomain) {
      pills.push(`Target: ${draft.categorySpecificFields.targetDomain}`);
    }
    if (draft.categorySpecificFields?.imposterUrl) {
      pills.push(`Imposter: ${draft.categorySpecificFields.imposterUrl}`);
    }
    if (pills.length > 0) setExtractedPills(pills);

    setDraftBannerMessage("✨ Auto-filled statutory incident facts & category parameters from your AI Assistant!");

    // Advance to next step only if user is currently sitting on the initial empty narrative screen
    setCurrentStep((prev) => {
      if (prev === "NARRATIVE") {
        const desk = foundCategory?.priorityDeskType || (draft.amount && Number(draft.amount) > 0 ? "banking_freeze" : "none");
        return desk !== "none" ? "FREEZE" : "DETAILS";
      }
      return prev; // keep the user on their current step if they are already on FREEZE or DETAILS!
    });
  }, [phone, accountPhone]);

  // Real-time live draft synchronization between floating AI Chatbot & this report page
  useEffect(() => {
    // 1. Initial check from sessionStorage
    try {
      const savedDraft = sessionStorage.getItem("casepilot_chatbot_draft");
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        applyDraftToForm(draft);
      }
    } catch (e) {
      console.warn("Could not load chatbot draft:", e);
    }

    // 2. Real-time event listener for live transfer from the open AI Chatbot drawer
    const handleDraftEvent = (e: any) => {
      if (e?.detail) {
        applyDraftToForm(e.detail);
      }
    };

    window.addEventListener("casepilot:apply-draft" as any, handleDraftEvent);
    return () => {
      window.removeEventListener("casepilot:apply-draft" as any, handleDraftEvent);
    };
  }, [applyDraftToForm]);

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

  const handleResetForm = () => {
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
    setSuspectDetails("");
    setFreezeRequested(false);
    setFreezeMessage("");
    setSafetyDeskAcknowledged(false);
    setContainmentAcknowledged(false);

    // Reset Category-Specific Fields
    setCryptoNetwork("TRC-20 (Tron)");
    setVictimWallet("");
    setSuspectWallet("");
    setTransactionHash("");
    setCryptoExchange("");
    setEncryptedExtension("");
    setRansomNoteFile("");
    setRansomDemanded("");
    setRansomWalletAddress("");
    setTargetDomain("");
    setServerIp("");
    setDefacerHandle("");
    setImposterUrl("");
    setGenuineUrl("");
    setSocialPlatform("Instagram");
    setMaliciousApkName("");
    setThreatenedContent("");
    setExtortionDemand("");
    setHarassmentMedium("WhatsApp");
    setReportAnonymously(false);

    setEvidenceFiles([]);
    setUndertakingAccepted(false);
    setAckNumber(null);
    setErrorMessage("");
    setDraftBannerMessage("");
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("casepilot_chatbot_draft");
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setCurrentStep("NARRATIVE");
    setShowResetModal(false);
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
      const sectionName = selectedCategory.section === "WOMEN_CHILDREN"
        ? "Women / Children Related Crime"
        : selectedCategory.section === "FINANCIAL"
        ? "Financial Fraud"
        : "Other Cyber Crime";
      row("NCRP Statutory Pillar:", sectionName);
      row("Official Subcategory:", selectedCategory.subCategory || selectedCategory.label);
      if (selectedCategory.statutoryCitations && selectedCategory.statutoryCitations.length > 0) {
        row("Applicable Laws:", selectedCategory.statutoryCitations.slice(0, 2).join(", "));
      }
    }
    if (triageResult) {
      row("Statutory Urgency:", triageResult.urgency.toUpperCase());
      row("Classification Engine:", triageResult.source === "ai" ? "AI-assisted (gpt-4o-mini)" : "Rule-based engine");
    }
    if (reportAnonymously) {
      row("NCRP Track:", "Track 1A (Report Anonymously - Identity Withheld)");
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
    if (suspectDetails) row("Additional Suspect Info:", suspectDetails);

    // Dynamic category-specific particulars
    if (cryptoNetwork || suspectWallet || transactionHash) {
      y += 2;
      doc.setFillColor(240, 244, 248);
      doc.rect(14, y, pageW - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(20, 60, 110);
      doc.text("CRYPTOCURRENCY & BLOCKCHAIN PARAMETERS", 16, y + 4.5);
      doc.setTextColor(11, 12, 12);
      y += 9;

      if (cryptoNetwork) row("Blockchain Network:", cryptoNetwork);
      if (suspectWallet) row("Suspect Wallet:", suspectWallet);
      if (transactionHash) row("Transaction Hash (TxID):", transactionHash);
      if (victimWallet) row("Complainant Wallet:", victimWallet);
      if (cryptoExchange) row("Exchange Involved:", cryptoExchange);
    }

    if (encryptedExtension || ransomDemanded) {
      y += 2;
      doc.setFillColor(240, 244, 248);
      doc.rect(14, y, pageW - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(20, 60, 110);
      doc.text("RANSOMWARE ATTACK PARAMETERS", 16, y + 4.5);
      doc.setTextColor(11, 12, 12);
      y += 9;

      if (encryptedExtension) row("Encrypted Extension:", encryptedExtension);
      if (ransomNoteFile) row("Ransom Note File:", ransomNoteFile);
      if (ransomDemanded) row("Ransom Demand:", ransomDemanded);
      if (ransomWalletAddress) row("Extortion Wallet / URL:", ransomWalletAddress);
    }

    if (targetDomain || defacerHandle) {
      y += 2;
      doc.setFillColor(240, 244, 248);
      doc.rect(14, y, pageW - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(20, 60, 110);
      doc.text("INFRASTRUCTURE & DEFACEMENT PARAMETERS", 16, y + 4.5);
      doc.setTextColor(11, 12, 12);
      y += 9;

      if (targetDomain) row("Target Domain:", targetDomain);
      if (serverIp) row("Host Server IP:", serverIp);
      if (defacerHandle) row("Defacer Alias:", defacerHandle);
    }

    if (imposterUrl || genuineUrl) {
      y += 2;
      doc.setFillColor(240, 244, 248);
      doc.rect(14, y, pageW - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(20, 60, 110);
      doc.text("SOCIAL MEDIA IMPERSONATION PARTICULARS", 16, y + 4.5);
      doc.setTextColor(11, 12, 12);
      y += 9;

      if (socialPlatform) row("Platform:", socialPlatform);
      if (imposterUrl) row("Imposter Profile:", imposterUrl);
      if (genuineUrl) row("Genuine Profile:", genuineUrl);
    }

    if (threatenedContent || extortionDemand) {
      y += 2;
      doc.setFillColor(240, 244, 248);
      doc.rect(14, y, pageW - 28, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.setTextColor(20, 60, 110);
      doc.text("CYBER SAFETY & HARASSMENT PARTICULARS", 16, y + 4.5);
      doc.setTextColor(11, 12, 12);
      y += 9;

      if (harassmentMedium) row("Harassment Medium:", harassmentMedium);
      if (threatenedContent) row("Threatened Content:", threatenedContent);
      if (extortionDemand) row("Coercion Demand:", extortionDemand);
    }

    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("COMPLAINANT IDENTITY & POLICE JURISDICTION", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (reportAnonymously) {
      row("Complainant Status:", "PROTECTED ANONYMOUS (Track 1A - Identity Withheld)");
    } else {
      if (fullName) row("Complainant Name:", fullName);
      row("Registered Mobile:", phone || accountPhone || "Verified in session");
      if (email) row("Complainant Email:", email);
      if (idType && idNumber) row("National ID Proof:", `${idType} (${idNumber})`);
    }
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

    // ── ANNEXURE PAGES: CERTIFIED EVIDENCE IMAGE EXHIBITS (SEC 63 BSA) ──
    const imageExhibits = evidenceFiles.filter((f) => f.dataUrl && f.dataUrl.startsWith("data:image"));
    if (imageExhibits.length > 0) {
      imageExhibits.forEach((img, idx) => {
        doc.addPage();
        const pW = doc.internal.pageSize.getWidth();
        const pH = doc.internal.pageSize.getHeight();

        // Official Exhibit Banner
        doc.setFillColor(11, 12, 12);
        doc.rect(0, 0, pW, 18, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`ANNEXURE ${idx + 1} — CERTIFIED DIGITAL EVIDENCE EXHIBIT`, 14, 12);

        // Subheader with Section 63 BSA statutory citation
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        doc.setTextColor(50, 60, 65);
        doc.text(`Statutory Chain of Custody: Admissible under Section 63, Bharatiya Sakshya Adhiniyam (BSA), 2023`, 14, 24);
        doc.text(`NCRP Complaint ACK: ${ackNumber} | Exhibit File: ${img.name} (${img.category || "Digital Evidence"})`, 14, 29);

        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
        doc.setTextColor(20, 60, 110);
        doc.text(`SHA-256 Digest:`, 14, 34);
        doc.setFont("courier", "normal"); doc.setFontSize(7);
        doc.setTextColor(30, 30, 30);
        doc.text(img.sha256, 38, 34);

        // Stamped Exhibit Frame
        const frameX = 14;
        const frameY = 38;
        const frameW = pW - 28;
        const frameH = pH - 60;

        // Image Embed inside Frame
        try {
          doc.addImage(img.dataUrl!, "JPEG", frameX + 2, frameY + 2, frameW - 4, frameH - 16, undefined, "FAST");
        } catch (e1) {
          try {
            doc.addImage(img.dataUrl!, frameX + 2, frameY + 2, frameW - 4, frameH - 16);
          } catch (e2) {
            console.warn("Could not render image exhibit into PDF:", e2);
          }
        }

        // Draw border around the exhibit
        doc.setDrawColor(20, 60, 110);
        doc.setLineWidth(0.6);
        doc.rect(frameX, frameY, frameW, frameH);

        // Official seal text at bottom of frame
        doc.setFillColor(240, 244, 248);
        doc.rect(frameX, frameY + frameH - 12, frameW, 12, "F");
        doc.setFont("helvetica", "bolditalic"); doc.setFontSize(7);
        doc.setTextColor(20, 60, 110);
        doc.text(`CERTIFIED TAMPER-EVIDENT EVIDENCE ATTACHMENT • STORED VIA CASEPILOT CRYPTOGRAPHIC VAULT`, frameX + 4, frameY + frameH - 4.5);

        // Exhibit page footer
        doc.setFillColor(248, 249, 250);
        doc.rect(0, pH - 15, pW, 15, "F");
        doc.setFont("helvetica", "italic"); doc.setFontSize(7);
        doc.setTextColor(90, 100, 105);
        doc.text("Official Complaint Exhibit for Designated Cyber Crime Police Station and Banking Nodal Officer.", 14, pH - 6);
      });
    }

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

  const applyTriageResult = (result: TriageResult, presetAmount?: number) => {
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

      // Category-Specific Dynamic Fields (nested or direct)
      const cs = (ef.categorySpecificFields || ef) as Record<string, any>;
      if (cs.cryptoNetwork) setCryptoNetwork(cs.cryptoNetwork);
      if (cs.victimWallet) setVictimWallet(cs.victimWallet);
      if (cs.suspectWallet) setSuspectWallet(cs.suspectWallet);
      if (cs.transactionHash) setTransactionHash(cs.transactionHash);
      if (cs.cryptoExchange) setCryptoExchange(cs.cryptoExchange);

      if (cs.encryptedExtension) setEncryptedExtension(cs.encryptedExtension);
      if (cs.ransomNoteFile) setRansomNoteFile(cs.ransomNoteFile);
      if (cs.ransomDemanded) setRansomDemanded(cs.ransomDemanded);
      if (cs.ransomWalletAddress) setRansomWalletAddress(cs.ransomWalletAddress);

      if (cs.targetDomain) setTargetDomain(cs.targetDomain);
      if (cs.serverIp) setServerIp(cs.serverIp);
      if (cs.defacerHandle) setDefacerHandle(cs.defacerHandle);

      if (cs.imposterUrl) setImposterUrl(cs.imposterUrl);
      if (cs.genuineUrl) setGenuineUrl(cs.genuineUrl);
      if (cs.socialPlatform) setSocialPlatform(cs.socialPlatform);

      if (cs.maliciousApkName) setMaliciousApkName(cs.maliciousApkName);

      if (cs.threatenedContent) setThreatenedContent(cs.threatenedContent);
      if (cs.extortionDemand) setExtortionDemand(cs.extortionDemand);
      if (cs.harassmentMedium) setHarassmentMedium(cs.harassmentMedium);
    } else if (presetAmount) {
      setAmount(presetAmount.toString());
    } else if (result.detectedAmount) {
      setAmount(result.detectedAmount.toString());
    }

    if (result.extractedPills && result.extractedPills.length > 0) {
      setExtractedPills(result.extractedPills);
    }

    // Dynamic Step 2 Routing:
    // 1. Banking Freeze (Financial Fraud / money moved)
    // 2. Emergency Safety Desk (Women / Child Safety / Sextortion / Harassment)
    // 3. System Containment Desk (Ransomware / Hacking / Defacement)
    // 4. None -> Skip directly to Details
    const desk = result.priorityDeskType || cat.priorityDeskType || (result.isFinancialFraud && result.moneyMoved ? "banking_freeze" : "none");
    if (desk !== "none") {
      setCurrentStep("FREEZE");
    } else {
      setCurrentStep("DETAILS");
    }
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
      applyTriageResult(result, presetAmount);
    } catch (err) {
      console.warn("[report] triage API error, applying local rule engine fallback:", err);
      try {
        const fallback = classifyNarrative(textToTriage);
        applyTriageResult(fallback, presetAmount);
      } catch (fallbackErr) {
        console.error("[report] local triage fallback error:", fallbackErr);
        setErrorMessage("Classification service error. Please try again.");
      }
    } finally {
      setTriageLoading(false);
    }
  };

  const handleGuidedConfirm = (composedText: string, presetAmount?: number) => {
    setNarrative(composedText);
    handleTriage(composedText, presetAmount);
  };

  // Compute real SHA-256 and compressed Data URL for file attachments
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

        // Generate compressed data URL for images
        let dataUrl: string | undefined;
        try {
          dataUrl = await compressImageToDataUrl(file);
        } catch (e) {
          console.warn("Could not generate dataUrl for file:", e);
        }

        newItems.push({
          name: file.name,
          size: file.size,
          sha256,
          category: file.name.toLowerCase().includes("bank") ? "Bank Statement" : "Chat Screenshot",
          dataUrl,
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
    const res = await requestFreezeAction(
      bankAccount.trim() || phone || accountPhone || "Primary Linked Account",
      isNaN(numericAmount) ? 0 : numericAmount
    );

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
        section: selectedCategory.section,
        subCategory: selectedCategory.subCategory,
        reportAnonymously,
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
        categorySpecificFields: {
          cryptoNetwork: cryptoNetwork || undefined,
          victimWallet: victimWallet || undefined,
          suspectWallet: suspectWallet || undefined,
          transactionHash: transactionHash || undefined,
          cryptoExchange: cryptoExchange || undefined,
          encryptedExtension: encryptedExtension || undefined,
          ransomNoteFile: ransomNoteFile || undefined,
          ransomDemanded: ransomDemanded || undefined,
          ransomWalletAddress: ransomWalletAddress || undefined,
          targetDomain: targetDomain || undefined,
          serverIp: serverIp || undefined,
          defacerHandle: defacerHandle || undefined,
          imposterUrl: imposterUrl || undefined,
          genuineUrl: genuineUrl || undefined,
          socialPlatform: socialPlatform || undefined,
          maliciousApkName: maliciousApkName || undefined,
          threatenedContent: threatenedContent || undefined,
          extortionDemand: extortionDemand || undefined,
          harassmentMedium: harassmentMedium || undefined,
        },
        suspectDetails: {
          name: suspectName || undefined,
          mobile: suspectPhone || undefined,
          account: suspectAccount || undefined,
          handle: suspectHandle || undefined,
          website: suspectWebsite || undefined,
          details: suspectDetails || undefined,
        },
        complainantKYC: reportAnonymously
          ? {
              state: stateName || undefined,
              district: district || undefined,
              policeStation: policeStation || undefined,
            }
          : {
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
        phone: reportAnonymously ? undefined : (phone || accountPhone || undefined),
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
      {/* Draft Transfer Notification Banner */}
      {draftBannerMessage && (
        <div className="mb-6 rounded-ux border-2 border-emerald-500 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{draftBannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setDraftBannerMessage("")}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stepper Header with Back-and-Forth Navigation & Reset Option */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-100 pb-4">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs sm:text-sm" aria-label="Progress">
          {[
            { key: "NARRATIVE" as ReportStep, num: 1, labelKey: "report.stepIncident", fallback: "Incident" },
            {
              key: "FREEZE" as ReportStep,
              num: 2,
              labelKey:
                selectedCategory?.priorityDeskType === "safety_desk"
                  ? "report.stepSafety"
                  : selectedCategory?.priorityDeskType === "system_containment"
                  ? "report.stepContainment"
                  : "report.stepFreeze",
              fallback:
                selectedCategory?.priorityDeskType === "safety_desk"
                  ? "Safety Desk"
                  : selectedCategory?.priorityDeskType === "system_containment"
                  ? "Containment"
                  : selectedCategory?.priorityDeskType === "banking_freeze"
                  ? "Freeze"
                  : "Priority Desk",
            },
            { key: "DETAILS" as ReportStep, num: 3, labelKey: "report.stepSuspect", fallback: "Suspect" },
            { key: "KYC" as ReportStep, num: 4, labelKey: "report.stepKyc", fallback: "KYC & Station" },
            { key: "EVIDENCE" as ReportStep, num: 5, labelKey: "report.stepEvidence", fallback: "Evidence" },
            { key: "REVIEW" as ReportStep, num: 6, labelKey: "report.stepReview", fallback: "Review" },
          ].map((s, idx, arr) => {
            const isActive = currentStep === s.key;
            const canGoBack = stepNumbers[currentStep] > s.num;
            const isFuture = stepNumbers[currentStep] < s.num;

            if (canGoBack) {
              return (
                <li key={s.key} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s.key)}
                    className="flex items-center gap-1.5 hover:opacity-75 transition cursor-pointer group focus:outline-none"
                    title={`Go back to step ${s.num}: ${t(s.labelKey) || s.fallback}`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 group-hover:bg-emerald-200 transition">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 group-hover:underline">
                      {t(s.labelKey) || s.fallback}
                    </span>
                  </button>
                  {idx < arr.length - 1 && (
                    <span aria-hidden="true" className="text-ink-300 select-none ml-1">
                      ›
                    </span>
                  )}
                </li>
              );
            }

            return (
              <li key={s.key} className="flex items-center gap-1.5 select-none">
                <div
                  className={`flex items-center gap-1.5 ${
                    isFuture ? "opacity-45 cursor-not-allowed" : "cursor-default"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-brand-500 text-white shadow-xs scale-105"
                        : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      isActive
                        ? "font-extrabold text-ink-900 underline underline-offset-4 decoration-brand-500 decoration-2"
                        : "text-ink-400 font-medium"
                    }`}
                  >
                    {t(s.labelKey) || s.fallback}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <span aria-hidden="true" className="text-ink-300 select-none ml-1">
                    ›
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* Start New Report / Reset Form Button */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="inline-flex items-center gap-1.5 rounded-ux border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:border-danger-300 hover:bg-danger-50/50 hover:text-danger-700 transition shrink-0 self-start sm:self-auto shadow-2xs"
          title="Reset the complaint form to step 1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t("report.startNew") || "Start New Report / Reset"}</span>
        </button>
      </div>

      {/* AI Chatbot Imported Draft Alert Banner */}
      {draftBannerMessage && (
        <div className="mb-6 rounded-ux-lg border-2 border-brand-400 bg-brand-50 p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-brand-600 shrink-0" />
            <p className="text-sm font-bold text-brand-900">
              {draftBannerMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDraftBannerMessage("")}
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

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

      {/* STEP 2: DYNAMIC PRIORITY DESK (BANKING FREEZE / SAFETY DESK / SYSTEM CONTAINMENT) */}
      {currentStep === "FREEZE" && (
        <div className="space-y-6">
          {/* 2A: EMERGENCY SAFETY DESK (WOMEN / CHILD SAFETY / SEXTORTION / CYBER BULLYING) */}
          {selectedCategory?.priorityDeskType === "safety_desk" ? (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-800 ring-1 ring-purple-300 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
                  NCRP Emergency Safety & Rapid Takedown Protocol
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                  Your Safety & Privacy Come First
                </h1>
                <p className="mt-2 text-base text-ink-600">
                  You are not at fault. Law enforcement cyber cells treat online harassment, intimate image extortion, and stalking with strict confidentiality and high priority.
                </p>
              </div>

              {/* Legal Protection & Rapid Takedown Banner */}
              <div className="rounded-ux-lg border-2 border-purple-300 bg-purple-50/70 p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <HeartHandshake className="h-6 w-6 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-purple-950">
                      Mandatory 24-Hour Social Media Takedown Rule
                    </h3>
                    <p className="mt-1 text-xs text-purple-900 leading-relaxed">
                      Under <strong>Rule 3(2)(b) of the Information Technology (Intermediary Guidelines) Rules, 2021</strong>, major social media platforms (Instagram, WhatsApp, Facebook, Telegram, X) are legally mandated to remove non-consensual explicit or morphed content within <strong>24 hours</strong> of receiving an official grievance or user complaint.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety Action Guidance Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4 border-ink-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1.5">
                    <FileCheck className="h-4 w-4 text-brand-600" />
                    <span>Preserve Chat & Media Evidence</span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    Do not delete messages, call logs, extortion demands, or profile links. Take full-screen captures showing phone numbers and timestamps for Section 63 BSA legal chain-of-custody.
                  </p>
                </Card>

                <Card className="p-4 border-ink-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1.5">
                    <AlertTriangle className="h-4 w-4 text-danger-600" />
                    <span>Do Not Pay Extortionists</span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    Paying money does not guarantee media deletion—extortionists routinely demand larger amounts. Prompt official reporting cuts off their leverage and alerts nodal officers.
                  </p>
                </Card>

                <Card className="p-4 border-ink-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1.5">
                    <EyeOff className="h-4 w-4 text-purple-700" />
                    <span>Anonymous Option (Track 1A)</span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    Under NCRP guidelines, complaints regarding women and child safety can be filed completely anonymously in Step 4. Your name and phone number will not be shared.
                  </p>
                </Card>

                <Card className="p-4 border-ink-200">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1.5">
                    <Lock className="h-4 w-4 text-brand-600" />
                    <span>Statutory Criminal Penalties</span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    Perpetrators face rigorous imprisonment under IT Act Section 67 / 67A / 67B and Bharatiya Nyaya Sanhita (BNS) Sections 78 (Stalking), 79 (Insult to Modesty), and 351 (Criminal Intimidation).
                  </p>
                </Card>
              </div>

              {/* 24x7 Government Helplines */}
              <div className="rounded-ux-lg border border-ink-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">
                  Direct Emergency Helplines (Toll-Free & Confidential)
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-ux border border-brand-200 bg-brand-50/50 p-3 text-center">
                    <span className="block text-2xl font-extrabold text-brand-700">1930</span>
                    <span className="text-xs font-semibold text-ink-800">National Cyber Helpline</span>
                  </div>
                  <div className="rounded-ux border border-purple-200 bg-purple-50/50 p-3 text-center">
                    <span className="block text-2xl font-extrabold text-purple-700">181</span>
                    <span className="text-xs font-semibold text-ink-800">Women Helpline (24/7)</span>
                  </div>
                  <div className="rounded-ux border border-amber-200 bg-amber-50/50 p-3 text-center">
                    <span className="block text-2xl font-extrabold text-amber-700">1098</span>
                    <span className="text-xs font-semibold text-ink-800">Childline India</span>
                  </div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ink-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep("NARRATIVE")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("report.back") || "Back to Incident"}</span>
                </button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setSafetyDeskAcknowledged(true);
                    setCurrentStep("DETAILS");
                  }}
                  className="py-3 px-6 text-base font-bold bg-purple-700 hover:bg-purple-800 text-white"
                >
                  Acknowledge Safety Protocol & Continue to Details
                </Button>
              </div>
            </div>
          ) : selectedCategory?.priorityDeskType === "system_containment" ? (
            /* 2B: SYSTEM CONTAINMENT & FORENSIC INTEGRITY DESK (RANSOMWARE / HACKING / DEFACEMENT) */
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-danger-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-danger-800 ring-1 ring-danger-300 mb-2">
                  <Terminal className="h-3.5 w-3.5 text-danger-700" />
                  CERT-In Incident Containment & Forensic Integrity
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                  Contain the Breach & Preserve Evidence
                </h1>
                <p className="mt-2 text-base text-ink-600">
                  Active malware, ransomware, or unauthorized system compromise requires immediate isolation to stop lateral infection across network nodes and preserve volatile RAM forensics.
                </p>
              </div>

              {/* Critical Containment Checklist */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-4 border-2 border-danger-200 bg-danger-50/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-danger-900 mb-1.5">
                    <Server className="h-4 w-4 text-danger-700" />
                    <span>1. Isolate Host from Network Immediately</span>
                  </div>
                  <p className="text-xs text-ink-700 leading-relaxed">
                    Physically unplug Ethernet (LAN) cables and disable Wi-Fi and Bluetooth on affected workstations/servers. Halts active command-and-control (C2) beacons and encryptor propagation.
                  </p>
                </Card>

                <Card className="p-4 border-2 border-amber-200 bg-amber-50/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-1.5">
                    <HardDrive className="h-4 w-4 text-amber-700" />
                    <span>2. Do NOT Power Off or Reboot</span>
                  </div>
                  <p className="text-xs text-ink-700 leading-relaxed">
                    Avoid hard-rebooting affected hosts. Volatile memory (RAM) contains decryption keys, malicious process injection paths, and socket states critical for forensic analysis.
                  </p>
                </Card>

                <Card className="p-4 border-2 border-brand-200 bg-brand-50/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-brand-900 mb-1.5">
                    <LockKeyhole className="h-4 w-4 text-brand-700" />
                    <span>3. Air-Gap Backup Storage Repositories</span>
                  </div>
                  <p className="text-xs text-ink-700 leading-relaxed">
                    Immediately detach offline backup hard drives, Network Attached Storage (NAS), and cloud sync clients to shield unaffected data snapshots from encryption.
                  </p>
                </Card>

                <Card className="p-4 border-2 border-ink-200 bg-white">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1.5">
                    <FileText className="h-4 w-4 text-ink-700" />
                    <span>4. Preserve Server & Firewall Logs</span>
                  </div>
                  <p className="text-xs text-ink-700 leading-relaxed">
                    Pursuant to CERT-In Section 70B directives, export and preserve firewall syslog records, reverse-proxy access logs, and active directory authentication logs (minimum 180-day mandate).
                  </p>
                </Card>
              </div>

              {/* Ransomware Payment Warning Banner */}
              <div className="rounded-ux-lg border border-danger-300 bg-danger-50/70 p-4 text-xs text-danger-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-danger-950">
                  <AlertCircle className="h-4 w-4 text-danger-700" />
                  National Cybersecurity Advisory on Extortion & Ransom Payments
                </p>
                <p className="leading-relaxed">
                  Indian law enforcement and CERT-In strongly advise against paying ransoms. Paying funds transnational criminal syndicates and provides zero guarantee of legitimate decryption keys.
                </p>
              </div>

              {/* Step Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ink-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep("NARRATIVE")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("report.back") || "Back to Incident"}</span>
                </button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setContainmentAcknowledged(true);
                    setCurrentStep("DETAILS");
                  }}
                  className="py-3 px-6 text-base font-bold bg-danger-600 hover:bg-danger-700 text-white"
                >
                  Confirm System Containment & Proceed to Details
                </Button>
              </div>
            </div>
          ) : (
            /* 2C: BANKING FREEZE (GOLDEN HOUR) DESK (FINANCIAL FRAUD) */
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
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="e.g., 9876543210@ybl or A/C No. (Optional for freeze)"
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep("NARRATIVE")}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{t("report.back") || "Back"}</span>
                      </button>
                      <span className="text-ink-300">|</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep("DETAILS")}
                        className="text-sm font-semibold text-ink-600 hover:text-ink-900 underline"
                      >
                        Skip freeze alert for now
                      </button>
                    </div>

                    <Button type="submit" variant="danger" disabled={freezeLoading} className="py-3 px-6 text-base font-bold">
                      {freezeLoading ? "Transmitting freeze notice..." : "Dispatch Immediate Bank Freeze"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
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
                  <label htmlFor="suspect-account" className="block text-xs font-semibold text-ink-700 mb-1">
                    Suspect UPI ID / Beneficiary Account Number
                  </label>
                  <input
                    id="suspect-account"
                    type="text"
                    value={suspectAccount}
                    onChange={(e) => setSuspectAccount(e.target.value)}
                    placeholder="e.g., fraud.node@axisbank or 9876543210@paytm"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none font-mono"
                  />
                </div>

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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            {/* DYNAMIC CATEGORY-SPECIFIC PARAMETER CARDS */}

            {/* 1. Cryptocurrency Fraud Parameters */}
            {(selectedCategory?.subCategory === "Cryptocurrency Crime" ||
              selectedCategory?.id === "cryptocurrency_crime" ||
              paymentMode === "Crypto") && (
              <div className="pt-4 border-t border-ink-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                    Cryptocurrency & Blockchain Traceability Parameters
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="crypto-network" className="block text-xs font-semibold text-ink-700 mb-1">
                      Blockchain Network
                    </label>
                    <select
                      id="crypto-network"
                      value={cryptoNetwork}
                      onChange={(e) => setCryptoNetwork(e.target.value)}
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none font-medium"
                    >
                      <option value="TRC-20 (Tron)">TRC-20 (Tron / USDT)</option>
                      <option value="ERC-20 (Ethereum)">ERC-20 (Ethereum)</option>
                      <option value="Bitcoin Network">Bitcoin (BTC Mainnet)</option>
                      <option value="BEP-20 (BNB Smart Chain)">BEP-20 (BNB Smart Chain)</option>
                      <option value="Solana Network">Solana (SOL)</option>
                      <option value="Polygon">Polygon (MATIC)</option>
                      <option value="Other Network">Other Blockchain</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="crypto-exchange" className="block text-xs font-semibold text-ink-700 mb-1">
                      Exchange Involved (if applicable)
                    </label>
                    <input
                      id="crypto-exchange"
                      type="text"
                      value={cryptoExchange}
                      onChange={(e) => setCryptoExchange(e.target.value)}
                      placeholder="e.g., WazirX, CoinDCX, Binance, SunCrypto"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="suspect-wallet" className="block text-xs font-semibold text-ink-700 mb-1">
                      Suspect Receiving Wallet Address
                    </label>
                    <input
                      id="suspect-wallet"
                      type="text"
                      value={suspectWallet}
                      onChange={(e) => setSuspectWallet(e.target.value)}
                      placeholder="e.g., TXYZ99824... or 0x71C..."
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="tx-hash" className="block text-xs font-semibold text-ink-700 mb-1">
                      Transaction Hash / TxID
                    </label>
                    <input
                      id="tx-hash"
                      type="text"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      placeholder="e.g., 0x4f8a9b2... or 64-character hash"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="victim-wallet" className="block text-xs font-semibold text-ink-700 mb-1">
                    Your Debited Wallet Address (Complainant Sender)
                  </label>
                  <input
                    id="victim-wallet"
                    type="text"
                    value={victimWallet}
                    onChange={(e) => setVictimWallet(e.target.value)}
                    placeholder="e.g., Your personal wallet address or funding exchange UID"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 2. Ransomware Parameters */}
            {(selectedCategory?.subCategory === "Ransomware" ||
              selectedCategory?.id === "ransomware") && (
              <div className="pt-4 border-t border-ink-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-danger-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                    Ransomware Attack Parameters & Extortion Demands
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="enc-ext" className="block text-xs font-semibold text-ink-700 mb-1">
                      Encrypted File Extension
                    </label>
                    <input
                      id="enc-ext"
                      type="text"
                      value={encryptedExtension}
                      onChange={(e) => setEncryptedExtension(e.target.value)}
                      placeholder="e.g., .lockbit3, .blackcat, .phobos, .mallox"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="ransom-note" className="block text-xs font-semibold text-ink-700 mb-1">
                      Ransom Note Filename
                    </label>
                    <input
                      id="ransom-note"
                      type="text"
                      value={ransomNoteFile}
                      onChange={(e) => setRansomNoteFile(e.target.value)}
                      placeholder="e.g., README_RESTORE.txt, DECRYPT_INFO.html"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ransom-demanded" className="block text-xs font-semibold text-ink-700 mb-1">
                      Ransom Amount Demanded
                    </label>
                    <input
                      id="ransom-demanded"
                      type="text"
                      value={ransomDemanded}
                      onChange={(e) => setRansomDemanded(e.target.value)}
                      placeholder="e.g., 0.5 BTC, $25,000 in Monero, ₹10 Lakhs"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="ransom-wallet" className="block text-xs font-semibold text-ink-700 mb-1">
                      Attacker Receiving Address / Tor Portal Link
                    </label>
                    <input
                      id="ransom-wallet"
                      type="text"
                      value={ransomWalletAddress}
                      onChange={(e) => setRansomWalletAddress(e.target.value)}
                      placeholder="e.g., bc1q... or http://lockbit...onion"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Website Defacement / Infrastructure Compromise */}
            {(selectedCategory?.subCategory === "Website Defacement" ||
              selectedCategory?.id === "website_defacement" ||
              selectedCategory?.id === "hacking_intrusion") && (
              <div className="pt-4 border-t border-ink-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                    Infrastructure Compromise & Defacement Parameters
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="target-domain" className="block text-xs font-semibold text-ink-700 mb-1">
                      Target Domain / Defaced URL
                    </label>
                    <input
                      id="target-domain"
                      type="text"
                      value={targetDomain}
                      onChange={(e) => setTargetDomain(e.target.value)}
                      placeholder="e.g., https://portal.example.gov.in"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="server-ip" className="block text-xs font-semibold text-ink-700 mb-1">
                      Host Server IP / Cloud Provider
                    </label>
                    <input
                      id="server-ip"
                      type="text"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      placeholder="e.g., 103.21.x.x / AWS"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="defacer-handle" className="block text-xs font-semibold text-ink-700 mb-1">
                    Defacer Alias / Hacktivist Group Signature
                  </label>
                  <input
                    id="defacer-handle"
                    type="text"
                    value={defacerHandle}
                    onChange={(e) => setDefacerHandle(e.target.value)}
                    placeholder="e.g., Defaced by AnonGhost / Team_Zero"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. Social Media Impersonation / Fake Profile */}
            {(selectedCategory?.subCategory === "Impersonating Profile / Account" ||
              selectedCategory?.id === "social_media_impersonation") && (
              <div className="pt-4 border-t border-ink-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                    Social Media Impersonation & Fake Profile Details
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="social-plat" className="block text-xs font-semibold text-ink-700 mb-1">
                      Platform
                    </label>
                    <select
                      id="social-plat"
                      value={socialPlatform}
                      onChange={(e) => setSocialPlatform(e.target.value)}
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="X (Twitter)">X (Twitter)</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Telegram">Telegram</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Snapchat">Snapchat</option>
                      <option value="Other">Other Platform</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="imposter-url" className="block text-xs font-semibold text-ink-700 mb-1">
                      Imposter / Fake Profile URL *
                    </label>
                    <input
                      id="imposter-url"
                      type="text"
                      value={imposterUrl}
                      onChange={(e) => setImposterUrl(e.target.value)}
                      placeholder="e.g., instagram.com/rajesh_sharma_official_real"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="genuine-url" className="block text-xs font-semibold text-ink-700 mb-1">
                      Your Genuine / Original Profile URL
                    </label>
                    <input
                      id="genuine-url"
                      type="text"
                      value={genuineUrl}
                      onChange={(e) => setGenuineUrl(e.target.value)}
                      placeholder="e.g., instagram.com/rajesh_sharma"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Malicious APK Details */}
            {(selectedCategory?.subCategory === "Malicious Mobile Apps / APK" ||
              selectedCategory?.id === "mobile_malicious_apk") && (
              <div className="pt-4 border-t border-ink-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-danger-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                    Malicious Mobile App / APK Parameters
                  </h3>
                </div>

                <div>
                  <label htmlFor="apk-name" className="block text-xs font-semibold text-ink-700 mb-1">
                    Malicious APK / Package Name
                  </label>
                  <input
                    id="apk-name"
                    type="text"
                    value={maliciousApkName}
                    onChange={(e) => setMaliciousApkName(e.target.value)}
                    placeholder="e.g., SBI_Reward_Update.apk or com.device.support.quick"
                    className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 6. Women / Child Safety & Cyber Harassment Parameters */}
            {(selectedCategory?.section === "WOMEN_CHILDREN" ||
              selectedCategory?.id === "sextortion" ||
              selectedCategory?.id === "cyber_bullying_stalking") && (
              <div className="pt-4 border-t border-ink-200 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-700" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                    Cyber Harassment & Safety Specific Particulars
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="harass-med" className="block text-xs font-semibold text-ink-700 mb-1">
                      Harassment Medium
                    </label>
                    <select
                      id="harass-med"
                      value={harassmentMedium}
                      onChange={(e) => setHarassmentMedium(e.target.value)}
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram DM">Instagram DM</option>
                      <option value="Telegram">Telegram</option>
                      <option value="Video Call">Video Call</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS / Phone Call</option>
                      <option value="Dating App">Dating App</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="threatened-content" className="block text-xs font-semibold text-ink-700 mb-1">
                      Threatened Content / Material
                    </label>
                    <input
                      id="threatened-content"
                      type="text"
                      value={threatenedContent}
                      onChange={(e) => setThreatenedContent(e.target.value)}
                      placeholder="e.g., Morphed private photos, video recording"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="extort-demand" className="block text-xs font-semibold text-ink-700 mb-1">
                      Extortion / Coercion Demands
                    </label>
                    <input
                      id="extort-demand"
                      type="text"
                      value={extortionDemand}
                      onChange={(e) => setExtortionDemand(e.target.value)}
                      placeholder="e.g., Demanding ₹15,000 or sexual favors"
                      className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Clean Manual Modus Operandi Narrative Box (Zero AI calls) */}
            <div className="pt-4 border-t border-ink-200 space-y-2">
              <label htmlFor="modus-narrative" className="block text-sm font-bold text-ink-900">
                Detailed Modus Operandi / Incident Summary (Manual Review)
              </label>
              <p className="text-xs text-ink-500">
                Review or edit the incident narrative below. This description will be directly recorded in your official BNSS 173(3) complaint. Zero automated AI calls will modify this box.
              </p>
              <textarea
                id="modus-narrative"
                rows={4}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe the incident sequence, how the suspect approached you, instructions given, and any other relevant facts..."
                className="w-full rounded-ux border-2 border-ink-200 px-3.5 py-2.5 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-ink-200">
              <button
                type="button"
                onClick={() => {
                  const desk = selectedCategory?.priorityDeskType || (triageResult?.isFinancialFraud && triageResult?.moneyMoved ? "banking_freeze" : "none");
                  setCurrentStep(desk !== "none" ? "FREEZE" : "NARRATIVE");
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("report.back") || "Back"}</span>
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
            {/* NCRP Track 1A Anonymous Complaint Option (For Women & Children Crimes) */}
            {selectedCategory?.section === "WOMEN_CHILDREN" && (
              <div className="rounded-ux-lg border-2 border-purple-300 bg-purple-50/80 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <EyeOff className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-purple-950">
                        NCRP Track 1A — Report Anonymously (Optional)
                      </h4>
                      <p className="mt-0.5 text-xs text-purple-900 leading-relaxed">
                        Under official NCRP portal guidelines, complaints of cybercrime against women and children can be filed completely anonymously. Your identity will NOT be recorded or revealed to the suspect or public.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReportAnonymously(!reportAnonymously)}
                    className={`rounded-ux px-4 py-2 text-xs font-bold transition shrink-0 border ${
                      reportAnonymously
                        ? "bg-purple-700 text-white border-purple-800 shadow-xs"
                        : "bg-white text-purple-800 border-purple-300 hover:bg-purple-100"
                    }`}
                  >
                    {reportAnonymously ? "✓ Track 1A Anonymous Mode Active" : "Enable Anonymous Mode (Track 1A)"}
                  </button>
                </div>
              </div>
            )}

            {/* Complainant Identity */}
            {reportAnonymously ? (
              <div className="rounded-ux-lg border border-purple-200 bg-purple-50/50 p-4 text-xs text-purple-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-purple-950 text-sm">
                  <ShieldCheck className="h-4 w-4 text-purple-700" />
                  Track 1A Active — Complainant KYC Withheld
                </p>
                <p className="leading-relaxed">
                  Full name, contact phone, email address, date of birth, and government identity document requirements are waived and protected under NCRP Track 1A rules.
                </p>
                <p className="text-purple-800 font-medium">
                  Please verify your designated State and Cyber Crime Police Station below so the local Cyber Cell can register your complaint for inquiry.
                </p>
              </div>
            ) : (
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
                      required={!reportAnonymously}
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
                      required={!reportAnonymously}
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
            )}

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
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("report.back") || "Back"}</span>
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
                    <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {file.dataUrl && file.dataUrl.startsWith("data:image") ? (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="h-12 w-12 rounded-ux object-cover border border-ink-200 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-ux bg-ink-100 flex items-center justify-center text-ink-500 font-bold shrink-0 text-[10px]">
                            FILE
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-ink-900 block truncate">{file.name}</span>
                          <span className="font-mono text-[10px] text-ink-500 break-all block">
                            SHA-256: {file.sha256}
                          </span>
                        </div>
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
                        <span className="text-ink-500 font-medium text-[11px]">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-danger-600 hover:text-danger-800 p-1 font-bold text-xs hover:bg-danger-50 rounded transition"
                          title="Remove file"
                        >
                          ✕
                        </button>
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
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("report.back") || "Back"}</span>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Official NCRP Statutory Classification
                  </p>
                  <span className="text-xl font-bold text-ink-900 block mt-0.5">{selectedCategory?.label}</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {selectedCategory?.section === "WOMEN_CHILDREN"
                        ? "Pillar 1: Women / Children Related Crime"
                        : selectedCategory?.section === "FINANCIAL"
                        ? "Pillar 2: Financial Fraud"
                        : "Pillar 3: Other Cyber Crime"}
                    </span>
                    {selectedCategory?.subCategory && (
                      <span className="text-xs text-ink-600 bg-ink-100 px-2 py-0.5 rounded">
                        {selectedCategory.subCategory}
                      </span>
                    )}
                    {reportAnonymously && (
                      <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                        NCRP Track 1A (Anonymous)
                      </span>
                    )}
                  </div>
                </div>
                <Badge tone={selectedCategory?.defaultUrgency === "golden-hour" ? "danger" : "neutral"}>
                  {selectedCategory?.defaultUrgency?.toUpperCase()}
                </Badge>
              </div>

              {selectedCategory?.statutoryCitations && selectedCategory.statutoryCitations.length > 0 && (
                <div className="mt-2 text-[11px] text-ink-500 font-mono">
                  <strong>Statutory Provisions:</strong> {selectedCategory.statutoryCitations.join(" | ")}
                </div>
              )}
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

            {/* Category-Specific Dynamic Review Particulars */}
            {(cryptoNetwork || suspectWallet || transactionHash) && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" />
                  <span>Cryptocurrency Transaction Parameters</span>
                </p>
                <div className="rounded-ux bg-amber-50/50 border border-amber-200 p-3 text-xs text-ink-900 space-y-1">
                  {cryptoNetwork && <p><strong>Network:</strong> {cryptoNetwork}</p>}
                  {suspectWallet && <p><strong>Suspect Wallet:</strong> <span className="font-mono break-all">{suspectWallet}</span></p>}
                  {transactionHash && <p><strong>TxID:</strong> <span className="font-mono break-all">{transactionHash}</span></p>}
                  {victimWallet && <p><strong>Complainant Wallet:</strong> <span className="font-mono break-all">{victimWallet}</span></p>}
                  {cryptoExchange && <p><strong>Exchange:</strong> {cryptoExchange}</p>}
                </div>
              </div>
            )}

            {(encryptedExtension || ransomDemanded || ransomNoteFile) && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-danger-700 mb-1 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Ransomware Extortion Parameters</span>
                </p>
                <div className="rounded-ux bg-danger-50/50 border border-danger-200 p-3 text-xs text-ink-900 space-y-1">
                  {encryptedExtension && <p><strong>Extension:</strong> <span className="font-mono">{encryptedExtension}</span></p>}
                  {ransomNoteFile && <p><strong>Note File:</strong> {ransomNoteFile}</p>}
                  {ransomDemanded && <p><strong>Ransom Demanded:</strong> {ransomDemanded}</p>}
                  {ransomWalletAddress && <p><strong>Extortion Wallet:</strong> <span className="font-mono break-all">{ransomWalletAddress}</span></p>}
                </div>
              </div>
            )}

            {(targetDomain || serverIp || defacerHandle) && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" />
                  <span>Infrastructure & Defacement Parameters</span>
                </p>
                <div className="rounded-ux bg-brand-50/50 border border-brand-200 p-3 text-xs text-ink-900 space-y-1">
                  {targetDomain && <p><strong>Target Domain:</strong> {targetDomain}</p>}
                  {serverIp && <p><strong>Host Server IP:</strong> {serverIp}</p>}
                  {defacerHandle && <p><strong>Defacer Alias:</strong> {defacerHandle}</p>}
                </div>
              </div>
            )}

            {(imposterUrl || genuineUrl) && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Social Media Impersonation Particulars</span>
                </p>
                <div className="rounded-ux bg-ink-50 border border-ink-200 p-3 text-xs text-ink-900 space-y-1">
                  {socialPlatform && <p><strong>Platform:</strong> {socialPlatform}</p>}
                  {imposterUrl && <p><strong>Imposter Profile:</strong> <span className="break-all">{imposterUrl}</span></p>}
                  {genuineUrl && <p><strong>Genuine Profile:</strong> <span className="break-all">{genuineUrl}</span></p>}
                </div>
              </div>
            )}

            {maliciousApkName && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-danger-700 mb-1 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Malicious Mobile App / APK</span>
                </p>
                <div className="rounded-ux bg-ink-50 border border-ink-200 p-3 text-xs text-ink-900">
                  <p><strong>Package Name:</strong> <span className="font-mono">{maliciousApkName}</span></p>
                </div>
              </div>
            )}

            {(threatenedContent || extortionDemand) && (
              <div className="border-t border-ink-200 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
                  <span>Cyber Harassment & Coercion Particulars</span>
                </p>
                <div className="rounded-ux bg-purple-50/50 border border-purple-200 p-3 text-xs text-ink-900 space-y-1">
                  {harassmentMedium && <p><strong>Harassment Medium:</strong> {harassmentMedium}</p>}
                  {threatenedContent && <p><strong>Threatened Content:</strong> {threatenedContent}</p>}
                  {extortionDemand && <p><strong>Coercion Demand:</strong> {extortionDemand}</p>}
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
                {reportAnonymously ? (
                  <p className="text-purple-800 font-semibold flex items-center gap-1">
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Identity Status: PROTECTED ANONYMOUS (Track 1A - Identity Withheld)</span>
                  </p>
                ) : (
                  <>
                    <p><strong>Complainant:</strong> {fullName || "Not specified"} ({phone || accountPhone || "Verified in session"})</p>
                    {email && <p><strong>Email:</strong> {email}</p>}
                  </>
                )}
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
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("report.back") || "Back"}</span>
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

      {/* Safe Form Reset / Register New Incident Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-ux-xl border-2 border-ink-900 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-danger-600 mb-3">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-lg font-bold text-ink-900">
                {t("report.resetTitle") || "Start a New Crime Report?"}
              </h3>
            </div>
            <p className="text-sm text-ink-600 leading-relaxed">
              {t("report.resetBody") ||
                "This will clear your current inputs and reset the form to Step 1, allowing you to report a completely different incident from scratch."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-full sm:w-auto rounded-ux border-2 border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition"
              >
                {t("report.resetCancel") || "Cancel (Keep Current Data)"}
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto rounded-ux bg-danger-600 px-4 py-2 text-xs font-bold text-white hover:bg-danger-700 transition shadow-xs"
              >
                {t("report.resetConfirm") || "Yes, Start New Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
