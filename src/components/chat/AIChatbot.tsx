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
} from "lucide-react";
import { useAssist } from "@/context/AssistContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: "openai" | "deterministic";
}

export interface ChatReportDraft {
  narrative?: string;
  categoryId?: string;
  categoryLabel?: string;
  amount?: number | null;
  bankName?: string | null;
  utrNumber?: string | null;
  suspectAccount?: string | null;
  suspectPhone?: string | null;
  suspectHandle?: string | null;
  suspectWebsite?: string | null;
  channel?: string | null;
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
    "Welcome to Guided Incident Reporting. I will help you record and organize the facts of your cyber incident step-by-step so you don't have to navigate complex government forms alone.\n\nTo begin, what happened in your own words?",
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
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMode, setChatMode] = useState<"advisory" | "reporting">("advisory");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [advisoryMessages, setAdvisoryMessages] = useState<Message[]>([INITIAL_ADVISORY_MESSAGE]);
  const [reportingMessages, setReportingMessages] = useState<Message[]>([INITIAL_REPORTING_MESSAGE]);
  const [reportDraft, setReportDraft] = useState<ChatReportDraft | null>(null);

  const [engineStatus, setEngineStatus] = useState<"ready" | "openai" | "offline">("ready");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, assist } = useAssist();

  const currentMessages = chatMode === "advisory" ? advisoryMessages : reportingMessages;
  const currentPrompts = chatMode === "advisory" ? ADVISORY_PROMPTS : REPORTING_PROMPTS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [currentMessages, isOpen, isMinimized, chatMode]);

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

      if (data.source === "openai") {
        setEngineStatus("openai");
      } else {
        setEngineStatus("offline");
      }

      if (chatMode === "advisory") {
        setAdvisoryMessages((prev) => [...prev, botMessage]);
      } else {
        setReportingMessages((prev) => [...prev, botMessage]);
        if (data.draft) {
          setReportDraft((prev) => ({
            ...(prev || {}),
            ...data.draft,
            narrative: data.draft.narrative || prev?.narrative || query,
          }));
        }
      }

      if (assist && data.reply) {
        speak(data.reply);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "We encountered a temporary connection issue. If this is an active financial emergency, please call 1930 immediately.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

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

  const handleTransferToReport = () => {
    if (reportDraft) {
      sessionStorage.setItem("casepilot_chatbot_draft", JSON.stringify(reportDraft));
    }
    setIsOpen(false);
    router.push("/report?source=chatbot");
  };

  return (
    <>
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 rounded-ux border-2 border-ink-900 bg-ink-900 px-4 py-3 text-white shadow-xl hover:bg-ink-800 transition"
            aria-label="Open 24/7 AI Cyber Incident Assistant"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-ink-300">
                24/7 AI Assistant
              </span>
              <span className="block text-sm font-extrabold text-white">
                Advice & Guided Report
              </span>
            </div>
            <MessageSquare className="h-5 w-5 text-ink-200 group-hover:text-white transition" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Chat Drawer Window */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md border-2 border-ink-900 bg-white shadow-2xl transition-all ${
            isMinimized ? "h-14" : "h-[620px] max-h-[88vh]"
          } flex flex-col`}
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
                  CasePilot AI Assistant
                </h2>
                <span className="text-[11px] font-medium text-ink-300">
                  {engineStatus === "openai"
                    ? "Active: OpenAI gpt-4o-mini"
                    : engineStatus === "offline"
                    ? "Active: Offline Engine"
                    : "Incident Triage & Intake"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="p-1.5 text-ink-300 hover:text-white rounded-ux hover:bg-ink-800 transition"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-ink-300 hover:text-white rounded-ux hover:bg-ink-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 border-b-2 border-ink-900 bg-ink-100 text-xs font-bold select-none">
                <button
                  type="button"
                  onClick={() => setChatMode("advisory")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 transition ${
                    chatMode === "advisory"
                      ? "bg-white text-ink-900 border-b-2 border-brand-600 shadow-xs"
                      : "text-ink-600 hover:text-ink-900 hover:bg-ink-200/60"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5 text-brand-600" />
                  <span>Ask & Guidance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatMode("reporting")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 transition ${
                    chatMode === "reporting"
                      ? "bg-white text-ink-900 border-b-2 border-brand-600 shadow-xs"
                      : "text-ink-600 hover:text-ink-900 hover:bg-ink-200/60"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-brand-600" />
                  <span>Report Incident</span>
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[9px] font-extrabold text-brand-800">
                    Guided
                  </span>
                </button>
              </div>

              {/* Emergency Banner Strip (In Advisory Mode) */}
              {chatMode === "advisory" && (
                <div className="bg-warning-50 border-b border-warning-200 px-3.5 py-1.5 flex items-center justify-between text-xs text-ink-900">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning-700 shrink-0" />
                    <span className="font-semibold text-warning-900 text-[11px]">Active Emergency? Call 1930 directly.</span>
                  </div>
                  <a
                    href="tel:1930"
                    className="rounded-ux bg-danger-600 px-2 py-0.5 font-bold text-white text-[10px] hover:bg-danger-700 transition"
                  >
                    Dial 1930
                  </a>
                </div>
              )}

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-ink-50/50">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-ux p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-ink-900 text-white font-medium"
                          : "border border-ink-300 bg-white text-ink-900 shadow-2xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-ink-400">{msg.timestamp}</span>
                      {msg.source && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-ink-500 bg-ink-200/60 px-1 py-0.2 rounded-ux-sm">
                          {msg.source === "openai" ? "GPT-4o-mini" : "Rule Engine"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-ink-500 p-2">
                    <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
                    <span>
                      {chatMode === "reporting"
                        ? "Compiling incident draft..."
                        : "Analyzing statutory guidance..."}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* LIVE INCIDENT DRAFT WIDGET (In Reporting Mode) */}
              {chatMode === "reporting" && reportDraft && (reportDraft.amount || reportDraft.bankName || reportDraft.utrNumber || reportDraft.suspectAccount || reportDraft.suspectPhone || reportDraft.categoryLabel) && (
                <div className="border-t-2 border-brand-300 bg-brand-50/80 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-brand-900">
                      <FileText className="h-3.5 w-3.5 text-brand-600" />
                      <span>Live Incident Draft</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-200/70 px-1.5 py-0.2 rounded-ux">
                      Ready to Transfer
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {reportDraft.categoryLabel && (
                      <span className="rounded-ux bg-white border border-brand-200 px-2 py-0.5 text-[11px] font-medium text-ink-800">
                        {reportDraft.categoryLabel}
                      </span>
                    )}
                    {reportDraft.amount && (
                      <span className="rounded-ux bg-white border border-brand-200 px-2 py-0.5 text-[11px] font-bold text-danger-700">
                        ₹{Number(reportDraft.amount).toLocaleString("en-IN")}
                      </span>
                    )}
                    {reportDraft.bankName && (
                      <span className="rounded-ux bg-white border border-brand-200 px-2 py-0.5 text-[11px] font-medium text-ink-800">
                        Bank: {reportDraft.bankName}
                      </span>
                    )}
                    {reportDraft.utrNumber && (
                      <span className="rounded-ux bg-white border border-brand-200 px-2 py-0.5 text-[11px] font-mono text-ink-800">
                        UTR: {reportDraft.utrNumber}
                      </span>
                    )}
                    {reportDraft.suspectAccount && (
                      <span className="rounded-ux bg-white border border-brand-200 px-2 py-0.5 text-[11px] font-mono text-ink-800">
                        UPI: {reportDraft.suspectAccount}
                      </span>
                    )}
                    {reportDraft.suspectPhone && (
                      <span className="rounded-ux bg-white border border-brand-200 px-2 py-0.5 text-[11px] font-medium text-ink-800">
                        📞 {reportDraft.suspectPhone}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleTransferToReport}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-ux bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 transition shadow-xs"
                  >
                    <span>Transfer to Official Report Form</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Prompt Suggestion Pills */}
              {currentMessages.length <= 2 && (
                <div className="border-t border-ink-200 bg-white p-2.5 space-y-1.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    {chatMode === "advisory" ? "Common Emergency Questions" : "Common Incident Types"}
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
                <span>Direct navigation:</span>
                <div className="flex items-center gap-2 font-semibold">
                  <Link href="/digital-arrest" className="text-danger-700 hover:underline">
                    Digital Arrest
                  </Link>
                  <span aria-hidden="true" className="text-ink-300">/</span>
                  <Link href="/report?urgency=golden-hour" className="text-warning-700 hover:underline">
                    Golden Hour Freeze
                  </Link>
                  <span aria-hidden="true" className="text-ink-300">/</span>
                  <Link href="/track" className="text-brand-700 hover:underline">
                    Track SLA
                  </Link>
                </div>
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="border-t-2 border-ink-900 bg-white p-2.5 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    chatMode === "reporting"
                      ? "Describe what happened, loss amount, bank..."
                      : "Describe your question or situation..."
                  }
                  disabled={loading}
                  className="flex-1 rounded-ux border border-ink-300 px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-ux bg-ink-900 p-2 text-white hover:bg-ink-800 disabled:opacity-50 transition"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
