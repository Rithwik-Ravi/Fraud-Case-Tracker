"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { useAssist } from "@/context/AssistContext";
import { useTextSize, TextSize } from "@/context/TextSizeContext";
import { useAccount, maskPhone } from "@/context/AccountContext";

export default function Header() {
  const pathname = usePathname();
  const { lang, setLang, t, languages } = useLang();
  const { assist, setAssist } = useAssist();
  const { textSize, setTextSize } = useTextSize();
  const { phone, loading: accountLoading, signOut } = useAccount();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/", label: t("nav.home") || "Home" },
    { href: "/report", label: t("nav.report") || "Report a crime" },
    { href: "/check", label: t("nav.check") || "Check a suspect" },
    { href: "/track", label: t("nav.track") || "Track a complaint" },
  ];

  return (
    <header className="border-b border-ink-200">
      {/* Disclaimer Banner */}
      <div className="bg-warning-50 border-b border-warning-500/40">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-[13px] leading-snug text-warning-700">
          <strong className="font-semibold">{t("chrome.disclaimerStrong") || "Independent hackathon prototype."}</strong>{" "}
          {t("chrome.disclaimer") || "Not affiliated with, endorsed by, or connected to the Government of India. All data shown is synthetic."}{" "}
          <Link
            className="inline-flex min-h-6 items-center whitespace-nowrap font-semibold underline underline-offset-2"
            href="/about"
          >
            {t("chrome.whatsReal") || "What's real →"}
          </Link>
        </div>
      </div>

      {/* Top Utility Bar */}
      <div className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 text-[13px]">
          <span className="hidden md:inline text-brand-100">
            {t("chrome.tagline") || "A concept redesign of the National Cyber Crime Reporting Portal"}
          </span>

          <div className="flex items-center gap-1 ml-auto">
            {/* Auth Link / Status */}
            {!accountLoading && (
              <>
                {phone ? (
                  <div className="flex items-center gap-2 mr-1">
                    <span className="hidden font-medium text-brand-100 sm:inline">
                      {maskPhone(phone)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex h-7 items-center whitespace-nowrap rounded-ux-sm px-2 text-xs font-semibold text-brand-100 transition hover:bg-brand-600"
                    >
                      {t("chrome.signOut") || "Sign out"}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/signin"
                    className="flex h-7 items-center whitespace-nowrap rounded-ux-sm px-2 text-xs font-semibold text-brand-100 transition hover:bg-brand-600"
                  >
                    {t("chrome.signIn") || "Sign in"}
                  </Link>
                )}
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-brand-500"></span>
              </>
            )}

            {/* Assisted Mode Toggle */}
            <button
              type="button"
              onClick={() => setAssist(!assist)}
              aria-pressed={assist}
              className={`flex h-7 items-center gap-1.5 rounded-ux-sm px-2 text-xs font-semibold transition ${
                assist ? "bg-white text-brand-700 shadow-sm" : "text-brand-100 hover:bg-brand-600"
              }`}
              title="Toggle Assisted Mode (Bigger text, simplified questions, read-aloud)"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"></path>
              </svg>
              <span>{t("assist.on") || "Assisted mode"}</span>
            </button>

            <span aria-hidden="true" className="mx-1 h-4 w-px bg-brand-500"></span>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-expanded={langMenuOpen}
                aria-haspopup="true"
                aria-label="Language selector"
                className="flex h-7 items-center gap-1.5 rounded-ux-sm px-2 text-xs font-semibold text-brand-100 transition hover:bg-brand-600"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"></path>
                </svg>
                <span>{languages.find((l) => l.code === lang)?.endonym || "English"}</span>
                <span className="text-[10px] opacity-70">▼</span>
              </button>

              {langMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-44 rounded-ux-lg border border-ink-200 bg-white py-1 shadow-lg z-50 text-ink-900"
                  role="menu"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      role="menuitem"
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-brand-50 ${
                        lang === l.code ? "bg-brand-50/80 font-bold text-brand-700" : "text-ink-700"
                      }`}
                    >
                      <span>{l.endonym}</span>
                      <span className="text-ink-400">{l.english}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="sr-only">Text size</span>

            {/* Text Size Controls */}
            <button
              type="button"
              onClick={() => setTextSize("sm")}
              aria-pressed={textSize === "sm"}
              aria-label="Smaller text"
              className={`h-7 min-h-0 w-8 rounded-ux-sm text-xs font-semibold transition ${
                textSize === "sm" ? "bg-white text-brand-700 shadow-sm" : "text-brand-100 hover:bg-brand-600"
              }`}
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => setTextSize("base")}
              aria-pressed={textSize === "base"}
              aria-label="Normal text"
              className={`h-7 min-h-0 w-8 rounded-ux-sm text-xs font-semibold transition ${
                textSize === "base" ? "bg-white text-brand-700 shadow-sm" : "text-brand-100 hover:bg-brand-600"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setTextSize("lg")}
              aria-pressed={textSize === "lg"}
              aria-label="Larger text"
              className={`h-7 min-h-0 w-8 rounded-ux-sm text-xs font-semibold transition ${
                textSize === "lg" ? "bg-white text-brand-700 shadow-sm" : "text-brand-100 hover:bg-brand-600"
              }`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Main Branding and Navigation Bar */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link className="flex items-center gap-3 ux-target" href="/">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-ux-lg bg-brand-500 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold tracking-tight text-ink-900">Surakhsa</span>
              <span className="block text-[13px] text-ink-600">सुरक्षा · Cyber crime reporting</span>
            </span>
          </Link>

          <a
            href="tel:1930"
            className="ux-target inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-ux bg-danger-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-danger-600 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"></path>
            </svg>
            <span className="hidden sm:inline">Call 1930</span>
            <span className="sm:hidden">1930</span>
          </a>
        </div>

        <nav aria-label="Main" className="-mx-1 flex flex-wrap gap-1 pb-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`ux-target whitespace-nowrap rounded-ux px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
