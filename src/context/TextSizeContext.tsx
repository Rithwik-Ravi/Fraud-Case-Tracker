"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type TextSize = "sm" | "base" | "lg";

const STORAGE_KEY = "surakhsa.textsize.v1";

interface TextSizeContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const TextSizeContext = createContext<TextSizeContextType | null>(null);

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>("base");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as TextSize;
      if (stored && ["sm", "base", "lg"].includes(stored)) {
        setTextSizeState(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.textsize = textSize;
    }
  }, [textSize]);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
    try {
      window.localStorage.setItem(STORAGE_KEY, size);
    } catch {}
  }, []);

  const value = useMemo(() => ({ textSize, setTextSize }), [textSize, setTextSize]);

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}

export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error("useTextSize must be used within a TextSizeProvider");
  }
  return context;
}
