"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "casepilot.assist.v1";
const LEGACY_STORAGE_KEY = "surakhsa.assist.v1";

interface AssistContextType {
  assist: boolean;
  setAssist: (on: boolean) => void;
  speak: (text: string, locale?: string) => boolean;
  stopSpeaking: () => void;
  speaking: boolean;
  canSpeak: boolean;
  hasVoiceFor: (locale: string) => boolean;
  voiceNameFor: (locale: string) => string | null;
}

const AssistContext = createContext<AssistContextType | null>(null);

function matchVoice(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | null {
  const norm = locale.toLowerCase().replace("_", "-");
  const exact = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === norm);
  if (exact) return exact;
  const langPrefix = norm.split("-")[0];
  return voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)) ?? null;
}

function chunkSentences(text: string, maxLen = 180): string[] {
  const sentences = text.match(/[^.!?।\n]+[.!?।\n]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > maxLen) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

export function AssistProvider({ children }: { children: React.ReactNode }) {
  const [assist, setAssistState] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [canSpeak, setCanSpeak] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      setAssistState(stored === "on");
    } catch {}
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      setVoices(synth.getVoices());
    };
    updateVoices();
    synth.addEventListener("voiceschanged", updateVoices);
    return () => {
      synth.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.assist = assist ? "on" : "off";
    }
  }, [assist]);

  const setAssist = useCallback((on: boolean) => {
    setAssistState(on);
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {}
    if (!on && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, locale = "en-IN") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return false;
      const synth = window.speechSynthesis;
      synth.cancel();

      const voice = matchVoice(voices.length ? voices : synth.getVoices(), locale);
      const chunks = chunkSentences(text);
      if (chunks.length === 0) return false;

      chunks.forEach((chunk, index) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = locale;
        if (voice) utterance.voice = voice;
        utterance.rate = 0.92;
        utterance.pitch = 1;
        if (index === chunks.length - 1) {
          utterance.onend = () => setSpeaking(false);
        }
        utterance.onerror = () => setSpeaking(false);
        synth.speak(utterance);
      });

      setSpeaking(true);
      return true;
    },
    [voices]
  );

  const hasVoiceFor = useCallback(
    (locale: string) => {
      return matchVoice(voices, locale) !== null;
    },
    [voices]
  );

  const voiceNameFor = useCallback(
    (locale: string) => {
      return matchVoice(voices, locale)?.name ?? null;
    },
    [voices]
  );

  const value = useMemo(
    () => ({
      assist,
      setAssist,
      speak,
      stopSpeaking,
      speaking,
      canSpeak,
      hasVoiceFor,
      voiceNameFor,
    }),
    [assist, setAssist, speak, stopSpeaking, speaking, canSpeak, hasVoiceFor, voiceNameFor]
  );

  return <AssistContext.Provider value={value}>{children}</AssistContext.Provider>;
}

export function useAssist() {
  const context = useContext(AssistContext);
  if (!context) {
    throw new Error("useAssist must be used within an AssistProvider");
  }
  return context;
}
