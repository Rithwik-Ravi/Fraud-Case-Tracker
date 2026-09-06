"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  AlertTriangle,
  Minimize2,
  Maximize2,
  Trash2,
  FileText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  Clock,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Square,
} from "lucide-react";
import { useAssist } from "@/context/AssistContext";
import { useLang } from "@/context/LanguageContext";
import { SpeechController } from "@/lib/voice";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: "openai" | "deterministic";
  draft?: ChatReportDraft | null;
}

export interface ChatReportDraft {
  narrative?: string;
  categoryId?: string;
  categoryLabel?: string;
  amount?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  paymentMode?: string | null;
  utrNumber?: string | null;
  suspectAccount?: string | null;
  suspectName?: string | null;
  suspectPhone?: string | null;
  suspectHandle?: string | null;
  suspectWebsite?: string | null;
  channel?: string | null;
  incidentDate?: string | null;
  isReadyToReport?: boolean;
}

const INITIAL_ADVISORY_MESSAGE: Message = {
  id: "msg-welcome-advisory",
  role: "assistant",
  content:
    "Welcome to CasePilot Citizen Cyber Advisory. How can I assist you with cyber incident guidance, banking freeze, or digital arrest questions right now?",
  timestamp: "Just now",
};

const INITIAL_REPORTING_MESSAGE: Message = {
  id: "msg-welcome-reporting",
  role: "assistant",
  content:
    "Welcome to Guided Incident Intake. I will help you document your cyber incident step-by-step and explain each statutory detail needed for an immediate bank freeze and police FIR under Indian law.\n\nTo begin, what happened in your own words? (Feel free to type or tap the microphone to speak).",
  timestamp: "Just now",
};

const ADVISORY_PROMPTS = [
  "Someone is claiming to be police on a video call right now",
  "Money was debited from my account in the last hour",
  "Someone is blackmailing me with private media",
  "How does statutory case tracking work under BNSS?",
];

const REPORTING_PROMPTS = [
  "Cheated of ₹25,000 on Google Pay / UPI",
  "Telegram part-time task / work from home scam",
  "Electricity bill SMS link with APK download",
  "Fake investment / trading group on WhatsApp",
];

export default function AIChatbot() {
  const router = useRouter();
  const { t, lang } = useLang();

  // Chat window state: closed by default with floating robot icon and initial welcoming speech bubble
  const [isOpen, setIsOpen] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [bubbleInput, setBubbleInput] = useState("");
  const [chatMode, setChatMode] = useState<"advisory" | "reporting">("reporting");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [advisoryMessages, setAdvisoryMessages] = useState<Message[]>([INITIAL_ADVISORY_MESSAGE]);
  const [reportingMessages, setReportingMessages] = useState<Message[]>([INITIAL_REPORTING_MESSAGE]);
  const [reportDraft, setReportDraft] = useState<ChatReportDraft | null>(null);

  const [engineStatus, setEngineStatus] = useState<"ready" | "openai" | "offline">("ready");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, assist } = useAssist();

  // ── Voice Assistance (Grace from ElevenLabs) ───────────────────────────────
  const [voiceAssistance, setVoiceAssistance] = useState(false);
  const voiceAssistanceRef = useRef(voiceAssistance);

  // Sync ref and initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("casepilot_voice_guidance");
      if (stored === "true") {
        setVoiceAssistance(true);
        voiceAssistanceRef.current = true;
      }
    } catch {}
  }, []);

  useEffect(() => {
    voiceAssistanceRef.current = voiceAssistance;
  }, [voiceAssistance]);

  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);

  // ── Speech Recognition (Voice to Text) ─────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">(lang === "hi" ? "hi-IN" : "en-IN");
  const recognitionRef = useRef<any>(null);

  // Sync speech input language with site language
  useEffect(() => {
    if (lang === "hi") {
      setSpeechLang("hi-IN");
    } else {
      setSpeechLang("en-IN");
    }
  }, [lang]);

  // Initialize browser speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = speechLang;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setInput(currentTranscript);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("[SpeechRecognition] error:", e.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [speechLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Microphone voice input is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      try {
        SpeechController.stop();
        setPlayingMsgId(null);
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn("[SpeechRecognition] start error:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  const toggleVoiceAssistance = () => {
    setVoiceAssistance((prev) => {
      const next = !prev;
      voiceAssistanceRef.current = next;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("casepilot_voice_guidance", next ? "true" : "false");
        } catch {}
      }
      if (!next) {
        SpeechController.stop();
        setPlayingMsgId(null);
      } else {
        // When turned ON, immediately speak the latest assistant message
        const messages = chatMode === "advisory" ? advisoryMessages : reportingMessages;
        const latestBot = [...messages].reverse().find((m) => m.role === "assistant");
        if (latestBot) {
          SpeechController.speak(latestBot.content, {
            id: latestBot.id,
            onStart: () => setPlayingMsgId(latestBot.id),
            onEnd: () => setPlayingMsgId((curr) => (curr === latestBot.id ? null : curr)),
          });
        }
      }
      return next;
    });
  };

  const toggleSpeakMessage = (id: string, text: string) => {
    if (playingMsgId === id) {
      SpeechController.stop();
      setPlayingMsgId(null);
    } else {
      SpeechController.speak(text, {
        id,
        onStart: () => setPlayingMsgId(id),
        onEnd: () => setPlayingMsgId((curr) => (curr === id ? null : curr)),
      });
    }
  };

  const currentMessages = chatMode === "advisory" ? advisoryMessages : reportingMessages;
  const currentPrompts = chatMode === "advisory" ? ADVISORY_PROMPTS : REPORTING_PROMPTS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [currentMessages, isOpen, chatMode]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (chatMode === "advisory") {
      setAdvisoryMessages((prev) => [...prev, userMessage]);
    } else {
      setReportingMessages((prev) => [...prev, userMessage]);
    }

    setInput("");
    setLoading(true);

    try {
      const history = currentMessages
        .filter((m) => !m.id.startsWith("msg-welcome"))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: chatMode,
          messages: [...history, { role: "user", content: query }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to receive guidance.");
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "No response received. Please dial 1930 for immediate assistance.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data.source,
      };

      // IMMEDIATELY start speaking the moment AI sends text if overall speaker is on
      if ((voiceAssistanceRef.current || assist) && data.reply) {
        SpeechController.speak(data.reply, {
          id: botMessage.id,
          onStart: () => setPlayingMsgId(botMessage.id),
          onEnd: () => setPlayingMsgId((curr) => (curr === botMessage.id ? null : curr)),
        });
      }

      if (data.source === "openai") {
        setEngineStatus("openai");
      } else {
        setEngineStatus("offline");
      }

      if (chatMode === "advisory") {
        setAdvisoryMessages((prev) => [...prev, botMessage]);
      } else {
        // Update cumulative report draft
        let updatedDraft: ChatReportDraft | null = null;
        if (data.draft) {
          updatedDraft = {
            ...(reportDraft || {}),
            ...data.draft,
            narrative: data.draft.narrative || reportDraft?.narrative || query,
          };
          setReportDraft(updatedDraft);
          botMessage.draft = updatedDraft;

          // Auto-sync into sessionStorage & broadcast live custom event so open report page populates in real time
          if (typeof window !== "undefined") {
            sessionStorage.setItem("casepilot_chatbot_draft", JSON.stringify(updatedDraft));
            window.dispatchEvent(
              new CustomEvent("casepilot:apply-draft", { detail: updatedDraft })
            );
          }
        } else if (reportDraft) {
          botMessage.draft = reportDraft;
        }

        setReportingMessages((prev) => [...prev, botMessage]);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "We encountered a temporary connection issue. If this is an active financial emergency, please call 1930 immediately.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      if ((voiceAssistanceRef.current || assist) && errorMessage.content) {
        SpeechController.speak(errorMessage.content, {
          id: errorMessage.id,
          onStart: () => setPlayingMsgId(errorMessage.id),
          onEnd: () => setPlayingMsgId((curr) => (curr === errorMessage.id ? null : curr)),
        });
      }

      if (chatMode === "advisory") {
        setAdvisoryMessages((prev) => [...prev, errorMessage]);
      } else {
        setReportingMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (chatMode === "advisory") {
      setAdvisoryMessages([INITIAL_ADVISORY_MESSAGE]);
    } else {
      setReportingMessages([INITIAL_REPORTING_MESSAGE]);
      setReportDraft(null);
    }
  };

  const [transferredSuccess, setTransferredSuccess] = useState(false);

  const handleTransferToReport = () => {
    if (reportDraft) {
      sessionStorage.setItem("casepilot_chatbot_draft", JSON.stringify(reportDraft));
      // Dispatch live custom event for any open report page to instantly populate
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("casepilot:apply-draft", { detail: reportDraft })
        );
      }
    }
    setTransferredSuccess(true);
    setTimeout(() => setTransferredSuccess(false), 3500);

    // If already on /report, smoothly scroll to form; otherwise navigate
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/report")) {
      window.scrollTo({ top: 180, behavior: "smooth" });
    } else {
      router.push("/report?source=chatbot");
    }
  };

  return (
    <>
      {/* Floating Robot Icon Launcher & Entry Speech Bubble (When drawer is closed) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 pointer-events-auto">
          {/* Conversational Speech Bubble appearing on entry */}
          {showSpeechBubble && (
            <div
              className="relative w-[320px] sm:w-[360px] max-w-[calc(100vw-2.5rem)] rounded-2xl border-2 border-ink-900 bg-white p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 select-none"
              role="region"
              aria-label="CasePilot AI Assistant Greeting"
            >
              {/* Speech bubble caret pointing down towards robot button */}
              <div
                className="absolute -bottom-2.5 right-7 sm:right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink-900 bg-white"
                aria-hidden="true"
              />

              {/* Header inside bubble */}
              <div className="flex items-center justify-between gap-2 border-b border-ink-100 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700 flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5 text-brand-600" />
                    {t("chat.bubbleTitle") || "CasePilot 24/7 AI"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeechBubble(false);
                  }}
                  className="rounded-ux p-1 text-ink-400 hover:text-ink-800 hover:bg-ink-100 transition"
                  title="Dismiss message"
                  aria-label="Dismiss message"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Conversational Text */}
              <div
                onClick={() => {
                  setIsOpen(true);
                  setShowSpeechBubble(false);
                }}
                className="cursor-pointer group"
              >
                <p className="text-xs sm:text-sm font-semibold text-ink-900 leading-snug group-hover:text-brand-700 transition">
                  {t("chat.bubbleGreeting") ||
                    "Did something happen? I'm here to help you step-by-step. Just describe what happened or click here to chat!"}
                </p>
              </div>

              {/* Quick Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = bubbleInput.trim();
                  setIsOpen(true);
                  setShowSpeechBubble(false);
                  if (q) {
                    handleSend(q);
                    setBubbleInput("");
                  }
                }}
                className="mt-3 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={bubbleInput}
                  onChange={(e) => setBubbleInput(e.target.value)}
                  placeholder={t("chat.bubblePlaceholder") || "Describe what happened..."}
                  className="flex-1 rounded-ux border-2 border-ink-200 bg-ink-50 px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none transition"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-ux bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition shadow-xs shrink-0 gap-1"
                  title={t("chat.bubbleAction") || "Ask AI"}
                >
                  <span>{t("chat.bubbleAction") || "Ask AI"}</span>
                  <Send className="h-3 w-3" />
                </button>
              </form>
            </div>
          )}

          {/* Floating Robot Icon Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setShowSpeechBubble(false);
            }}
            className="relative group flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 border-ink-900 bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-400 text-white shadow-2xl hover:shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-brand-400/40"
            aria-label={t("chat.robotAria") || "Open CasePilot AI Cyber Incident Assistant"}
            title="CasePilot AI Assistant"
          >
            {/* Live 24/7 status indicator dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>

            <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-white group-hover:rotate-6 transition-transform duration-200" />
          </button>
        </div>
      )}

      {/* Chat Drawer Window (When expanded) */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-w-lg border-2 border-ink-900 bg-white shadow-2xl h-[640px] max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-label="CasePilot AI Cyber Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-ink-900 bg-ink-900 px-4 py-3 text-white select-none">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-ux bg-brand-500 text-white font-black text-xs">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold tracking-tight leading-none text-white">
                  {t("chat.title") || "CasePilot AI Assistant"}
                </h2>
                <span className="text-[11px] font-medium text-ink-300">
                  {engineStatus === "openai"
                    ? (t("chat.activeOpenAi") || "Active: OpenAI gpt-4o-mini")
                    : engineStatus === "offline"
                    ? (t("chat.activeOffline") || "Active: Offline Engine")
                    : (t("chat.activeTriage") || "Live Incident Triage Desk")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleVoiceAssistance}
                title={
                  voiceAssistance
                    ? "Grace AI Voice Guidance Active (click to mute)"
                    : "Grace AI Voice Guidance Muted (click to listen to replies automatically)"
                }
                className={`p-1.5 rounded-ux transition flex items-center gap-1.5 ${
                  voiceAssistance
                    ? "text-emerald-400 bg-ink-800/90 hover:bg-ink-700 ring-1 ring-emerald-500/50"
                    : "text-ink-400 hover:text-white hover:bg-ink-800"
                }`}
                aria-label={voiceAssistance ? "Mute Grace AI voice guidance" : "Enable Grace AI voice guidance"}
              >
                {voiceAssistance ? (
                  <>
                    <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 hidden sm:inline">
                      {t("chat.graceOn") || "Grace ON"}
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span className="text-[10px] font-medium text-ink-400 hidden sm:inline">
                      {t("chat.voice") || "Voice"}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearChat}
                title="Reset conversation"
                className="p-1.5 text-ink-300 hover:text-white rounded-ux hover:bg-ink-800 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-1.5 text-ink-300 hover:text-white rounded-ux hover:bg-ink-800 transition"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
              {/* Mode Switcher Tabs */}
              <div className="flex items-center border-b border-ink-200 bg-white">
                <button
                  type="button"
                  onClick={() => setChatMode("reporting")}
                  className={`flex-1 py-2 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
                    chatMode === "reporting"
                      ? "border-brand-600 text-brand-700 bg-brand-50/50"
                      : "border-transparent text-ink-500 hover:text-ink-900"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{t("chat.reportTab") || "Report Incident"}</span>
                  <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] px-1 py-0.2 font-mono uppercase tracking-wider">
                    {t("chat.liveIntake") || "Live Intake"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode("advisory")}
                  className={`flex-1 py-2 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
                    chatMode === "advisory"
                      ? "border-brand-600 text-brand-700 bg-brand-50/50"
                      : "border-transparent text-ink-500 hover:text-ink-900"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>{t("chat.guidanceTab") || "Ask & Guidance"}</span>
                </button>
              </div>

              {/* Emergency Banner */}
              {chatMode === "advisory" && (
                <div className="bg-danger-50 border-b border-danger-200 px-3.5 py-2 flex items-center justify-between gap-2 text-danger-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-danger-600 shrink-0" />
                    <span className="text-[11px] font-semibold">
                      {t("chat.emergencyNotice") || "Active Emergency? Call 1930 directly."}
                    </span>
                  </div>
                  <a
                    href="tel:1930"
                    className="rounded-ux bg-danger-600 px-2 py-0.5 font-bold text-white text-[10px] hover:bg-danger-700 transition"
                  >
                    {t("chat.dial1930") || "Dial 1930"}
                  </a>
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-ink-50/50">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[94%] rounded-ux p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-ink-900 text-white font-medium"
                          : "border border-ink-300 bg-white text-ink-900 shadow-2xs"
                      }`}
                    >
                      {/* Acknowledgement and guidance prose */}
                      <FormattedMessageContent content={msg.content} />

                      {/* STATUTORY FIELD INTAKE TABLE (Rendered right after the acknowledgement text) */}
                      {chatMode === "reporting" && msg.role === "assistant" && msg.draft && (
                        <IntakeChecklistTable
                          draft={msg.draft}
                          onTransfer={handleTransferToReport}
                          transferredSuccess={transferredSuccess}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-ink-400">{msg.timestamp}</span>
                      {msg.source && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-ink-500 bg-ink-200/60 px-1 py-0.2 rounded-ux-sm">
                          {msg.source === "openai" ? "GPT-4o-mini" : "Rule Engine"}
                        </span>
                      )}

                      {msg.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => toggleSpeakMessage(msg.id, msg.content)}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded transition ${
                            playingMsgId === msg.id
                              ? "bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs"
                              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          }`}
                          title={playingMsgId === msg.id ? "Stop Grace voice" : "Listen in Grace AI voice"}
                        >
                          {playingMsgId === msg.id ? (
                            <>
                              <Square className="h-2.5 w-2.5 text-brand-600 fill-brand-600 animate-pulse" />
                              <span>{t("chat.stopGrace") || "Stop Grace"}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-2.5 w-2.5 text-zinc-500" />
                              <span>{t("chat.listenGrace") || "Listen (Grace)"}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-ink-500 p-2">
                    <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
                    <span>
                      {chatMode === "reporting"
                        ? "Verifying statutory checklist..."
                        : "Analyzing statutory guidance..."}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestion Pills */}
              {currentMessages.length <= 2 && (
                <div className="border-t border-ink-200 bg-white p-2.5 space-y-1.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    {chatMode === "advisory"
                      ? (t("chat.commonQuestions") || "Common Emergency Questions")
                      : (t("chat.commonScenarios") || "Common Incident Scenarios")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="rounded-ux border border-ink-300 bg-ink-50 px-2 py-1 text-left text-[11px] text-ink-800 hover:bg-ink-100 hover:border-ink-400 transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Link Navigation Actions */}
              <div className="border-t border-ink-200 bg-ink-50 px-3 py-1.5 flex items-center justify-between text-[11px] text-ink-600">
                <span>Quick routing:</span>
                <div className="flex items-center gap-2 font-semibold">
                  <Link href="/digital-arrest" className="text-danger-700 hover:underline">
                    Digital Arrest
                  </Link>
                  <span aria-hidden="true" className="text-ink-300">/</span>
                  <Link href="/report?urgency=golden-hour" className="text-warning-700 hover:underline">
                    Freeze
                  </Link>
                  <span aria-hidden="true" className="text-ink-300">/</span>
                  <Link href="/track" className="text-brand-700 hover:underline">
                    Track
                  </Link>
                </div>
              </div>

              {/* Voice-to-Text Listening Indicator */}
              {isListening && (
                <div className="bg-red-50 border-t border-red-200 px-3 py-1.5 flex items-center justify-between text-xs text-red-700 animate-pulse select-none">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    <span className="font-semibold text-[11px]">
                      Listening in {speechLang === "hi-IN" ? "हिन्दी / Hinglish" : "English"}... Speak clearly
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="text-[10px] font-bold text-red-800 bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded transition"
                  >
                    Done Speaking
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isListening) stopListening();
                  handleSend();
                }}
                className="border-t-2 border-ink-900 bg-white p-2.5 flex items-center gap-1.5"
              >
                {/* Speech Input Language Switcher */}
                <button
                  type="button"
                  onClick={() => setSpeechLang((prev) => (prev === "hi-IN" ? "en-IN" : "hi-IN"))}
                  title={`Speech input language: ${speechLang === "hi-IN" ? "Hindi / Hinglish" : "English"}`}
                  className="rounded px-1.5 py-1 text-[10px] font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 shrink-0 transition"
                >
                  {speechLang === "hi-IN" ? "हिन्दी" : "EN"}
                </button>

                {/* Voice-to-Text Microphone Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Click to stop recording" : "Click to speak to CasePilot"}
                  className={`rounded-ux p-2 transition shrink-0 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse shadow-md"
                      : "bg-ink-100 text-ink-700 hover:bg-ink-200 hover:text-ink-900"
                  }`}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : (t("chat.inputPlaceholder") || "Describe what happened, or tap mic to speak...")
                  }
                  disabled={loading}
                  className={`flex-1 rounded-ux border px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none transition ${
                    isListening
                      ? "border-red-400 bg-red-50/20"
                      : "border-ink-300 focus:border-ink-900"
                  }`}
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-ux bg-ink-900 p-2 text-white hover:bg-ink-800 disabled:opacity-50 transition shrink-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
        </div>
      )}
    </>
  );
}

/**
 * Renders bold tags and bullets smoothly instead of raw markdown syntax
 */
function FormattedMessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-zinc-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="text-zinc-600 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
              <div className="min-w-0 text-zinc-800">{formatInline(trimmed.slice(2))}</div>
            </div>
          );
        }
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-1">
              <span className="font-mono text-zinc-500 font-bold shrink-0 text-[11px] mt-0.5">
                {numberedMatch[1]}.
              </span>
              <div className="min-w-0 text-zinc-800">{formatInline(numberedMatch[2])}</div>
            </div>
          );
        }
        return <div key={idx}>{formatInline(line)}</div>;
      })}
    </div>
  );
}

/**
 * Clean, minimal ChatGPT-style statutory checklist table rendered directly inside
 * the assistant message bubble in Reporting mode.
 * Shows all 11 required fields with minimal green checkmarks.
 */
function IntakeChecklistTable({
  draft,
  onTransfer,
  transferredSuccess,
}: {
  draft: ChatReportDraft;
  onTransfer: () => void;
  transferredSuccess?: boolean;
}) {
  const checklistItems = [
    {
      id: "cat",
      name: "Crime Classification",
      desc: "Determines statutory sections under BNS & IT Act",
      value: draft.categoryLabel || null,
    },
    {
      id: "amt",
      name: "Reported Loss",
      desc: "Mandatory under BNSS 503 for FIR & fund restitution",
      value: draft.amount ? `₹${Number(draft.amount).toLocaleString("en-IN")}` : null,
    },
    {
      id: "bank",
      name: "Your Bank / App",
      desc: "Needed for home bank dispute claim & chargeback",
      value: draft.bankName || null,
    },
    {
      id: "debit",
      name: "Your Account / Mobile",
      desc: "Required for RBI account owner authentication",
      value: draft.bankAccount || null,
    },
    {
      id: "mode",
      name: "Payment Mode",
      desc: "Identifies payment channel & reversal route",
      value: draft.paymentMode || null,
    },
    {
      id: "utr",
      name: "12-Digit Transaction UTR",
      desc: "Critical for 1930 / CFCFRMS instant bank freeze",
      value: draft.utrNumber || null,
    },
    {
      id: "acc",
      name: "Suspect Account / UPI",
      desc: "Required for Section 94 BNSS debit-freeze notice",
      value: draft.suspectAccount || null,
    },
    {
      id: "phone",
      name: "Suspect Phone / Contact",
      desc: "Required for Section 91/94 BNSS CDR telecom tracing",
      value: draft.suspectPhone || null,
    },
    {
      id: "name",
      name: "Suspect Name / Alias",
      desc: "Documents criminal impersonation (BNS 319 / 318)",
      value: draft.suspectName || null,
    },
    {
      id: "ch",
      name: "Platform / Channel",
      desc: "Preserves digital forensics under BSA Section 63",
      value: draft.channel || null,
    },
    {
      id: "date",
      name: "Incident Date / Time",
      desc: "Establishes 120-min Golden Hour priority & RBI window",
      value: draft.incidentDate || null,
    },
  ];

  const countFilled = checklistItems.filter((i) => Boolean(i.value)).length;
  const countTotal = checklistItems.length;
  const progressPercent = Math.round((countFilled / countTotal) * 100);

  return (
    <div className="mt-3 rounded-xl border border-zinc-200/90 bg-white overflow-hidden shadow-2xs font-sans not-prose">
      {/* Sleek Minimal Header (ChatGPT Style) */}
      <div className="px-3.5 py-2.5 bg-zinc-50/80 border-b border-zinc-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-zinc-900 tracking-tight">
            Case Intake Checklist
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium text-zinc-500">
          {countFilled} of {countTotal} captured ({progressPercent}%)
        </span>
      </div>

      {/* Thin Micro Progress Bar */}
      <div className="h-0.5 w-full bg-zinc-100">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Minimalist Rows */}
      <div className="divide-y divide-zinc-100 text-xs">
        {checklistItems.map((item) => {
          const isFilled = Boolean(item.value);
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between px-3.5 py-1.5 transition-colors ${
                isFilled ? "bg-emerald-50/20" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-3">
                {isFilled ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                ) : (
                  <span className="h-3.5 w-3.5 flex items-center justify-center text-zinc-300 shrink-0 text-xs select-none">
                    ·
                  </span>
                )}
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] truncate ${
                      isFilled ? "text-zinc-700 font-medium" : "text-zinc-500"
                    }`}
                  >
                    {item.name}
                  </span>
                  {!isFilled && (
                    <span className="text-[9.5px] text-zinc-400 truncate leading-tight">
                      {item.desc}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                {isFilled ? (
                  <span className="font-mono text-[11px] font-semibold text-zinc-900">
                    {item.value}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 italic">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clean Minimalist Transfer Action */}
      <div className="px-3.5 py-2.5 bg-zinc-50/60 border-t border-zinc-200/70 flex items-center justify-between gap-3">
        <span className="text-[10px] text-zinc-500 truncate">
          {countFilled >= 2 ? "Ready to auto-fill official report" : "Answer AI follow-ups above"}
        </span>
        <button
          type="button"
          onClick={onTransfer}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-2xs shrink-0 ${
            transferredSuccess
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-zinc-900 hover:bg-zinc-800"
          }`}
        >
          {transferredSuccess ? (
            <>
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Transferred to Form!</span>
            </>
          ) : (
            <>
              <span>Transfer to Form</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
