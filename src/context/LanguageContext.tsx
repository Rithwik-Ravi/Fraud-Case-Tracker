"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { DEFAULT_LANG, LANGUAGES, SPEECH_LOCALE, isLangCode, translate, Language } from "@/lib/i18n";

const STORAGE_KEY = "casepilot.lang.v1";
const LEGACY_STORAGE_KEY = "surakhsa.lang.v1";

interface LanguageContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
  speechLocale: string;
  unreviewed: boolean;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored && isLangCode(stored)) {
        setLangState(stored);
        return;
      }
    } catch {}

    const detected = (navigator.languages?.map((l) => l.split("-")[0]) ?? []).find(isLangCode);
    if (detected) {
      setLangState(detected);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((newLang: string) => {
    if (!isLangCode(newLang)) return;
    setLangState(newLang);
    try {
      window.localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string) => translate(lang, key),
      speechLocale: SPEECH_LOCALE[lang] || "en-IN",
      unreviewed: LANGUAGES.find((l) => l.code === lang)?.unreviewed ?? false,
      languages: LANGUAGES,
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLang must be used within a LanguageProvider");
  }
  return context;
}
