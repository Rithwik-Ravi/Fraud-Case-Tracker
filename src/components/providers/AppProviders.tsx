"use client";

import React from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { AssistProvider } from "@/context/AssistContext";
import { TextSizeProvider } from "@/context/TextSizeContext";
import { AccountProvider } from "@/context/AccountContext";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AssistProvider>
        <TextSizeProvider>
          <AccountProvider>{children}</AccountProvider>
        </TextSizeProvider>
      </AssistProvider>
    </LanguageProvider>
  );
}
