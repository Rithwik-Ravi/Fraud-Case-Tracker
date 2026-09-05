"use client";

import React from "react";
import { useAssist } from "@/context/AssistContext";
import { useLang } from "@/context/LanguageContext";
import { Volume2, Square } from "lucide-react";

interface ReadAloudProps {
  text: string;
  className?: string;
}

export default function ReadAloud({ text, className = "" }: ReadAloudProps) {
  const { speak, stopSpeaking, speaking, canSpeak } = useAssist();
  const { speechLocale, t } = useLang();

  if (!canSpeak || !text.trim()) {
    return null;
  }

  const handleToggle = () => {
    if (speaking) {
      stopSpeaking();
    } else {
      speak(text, speechLocale);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={speaking ? t("assist.stopReading") || "Stop reading" : t("assist.readAloud") || "Read this to me"}
      className={`inline-flex items-center gap-2 rounded-ux border px-3 py-2 text-sm font-semibold transition ${
        speaking
          ? "border-brand-500 bg-brand-50 text-brand-700 animate-pulse"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/40"
      } ${className}`}
    >
      {speaking ? (
        <>
          <Square className="h-4 w-4 fill-current text-brand-600" />
          <span>{t("assist.stopReading") || "Stop reading"}</span>
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4 text-brand-600" />
          <span>{t("assist.readAloud") || "Read this to me"}</span>
        </>
      )}
    </button>
  );
}
