"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, X, Send, Bot, ShieldAlert, AlertTriangle, PhoneCall, Minimize2, Maximize2, Trash2 } from "lucide-react";
import { useAssist } from "@/context/AssistContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: "openai" | "deterministic";
}

const INITIAL_MESSAGE: Message = {
  id: "msg-welcome",
  role: "assistant",
  content: "Welcome to CasePilot Citizen Cyber Triage. How can I assist you with cyber incident guidance, banking freeze, or digital arrest questions right now?",
  timestamp: "Just now",
};

const SUGGESTED_PROMPTS = [
  "Someone is claiming to be police on a video call right now",
  "Money was debited from my account in the last hour",
  "Someone is blackmailing me with private media",
  "How does statutory case tracking work under BNSS?",
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [engineStatus, setEngineStatus] = useState<"ready" | "openai" | "offline">("ready");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, assist } = useAssist();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "msg-welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      setMessages((prev) => [...prev, botMessage]);

      if (assist) {
        speak(data.reply);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "We encountered a temporary connection issue. If this is an active financial emergency, please call 1930 immediately.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
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
                24/7 AI Triage
              </span>
              <span className="block text-sm font-extrabold text-white">
                Cyber Legal Assistant
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
            isMinimized ? "h-14" : "h-[580px] max-h-[85vh]"
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
                    ? "Active: Offline Knowledge Engine"
                    : "Incident Triage & Statutory Routing"}
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
              {/* Emergency Banner Strip */}
              <div className="bg-warning-50 border-b border-warning-200 px-3.5 py-2 flex items-center justify-between text-xs text-ink-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-700 shrink-0" />
                  <span className="font-semibold text-warning-900">Active Emergency? Call 1930 directly.</span>
                </div>
                <a
                  href="tel:1930"
                  className="rounded-ux bg-danger-600 px-2 py-0.5 font-bold text-white text-[11px] hover:bg-danger-700 transition"
                >
                  Dial 1930
                </a>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-ink-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-ux p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-ink-900 text-white font-medium"
                          : "border border-ink-300 bg-white text-ink-900"
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
                    <span>Analyzing statutory guidance...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestion Pills */}
              {messages.length <= 2 && (
                <div className="border-t border-ink-200 bg-white p-2.5 space-y-1.5">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Common Emergency Questions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
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
                <span>Direct portal routing:</span>
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
                  placeholder="Describe your question or situation..."
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
