"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import { useAssist } from "@/context/AssistContext";
import { useTextSize } from "@/context/TextSizeContext";
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
    { href: "/", label: t("nav.home") || "Emergency Triage" },
    { href: "/report", label: t("nav.report") || "Report Incident" },
    { href: "/check", label: t("nav.check") || "Verify Suspect" },
    { href: "/track", label: t("nav.track") || "Track Complaint" },
  ];

  return (
    <header className="border-b border-ink-200">
      {/* Disclaimer Banner — High-contrast, stark civic notice */}
      <div className="bg-warning-50 border-b border-warning-200">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-xs leading-snug text-ink-900">
          <span className="font-bold uppercase tracking-wider text-warning-700 mr-2">[Notice]</span>
          <strong className="font-semibold">{t("chrome.disclaimerStrong") || "Independent hackathon civic prototype."}</strong>{" "}
          <span>{t("chrome.disclaimer") || "Not affiliated with or endorsed by the Government of India. All demonstration records are synthetic."}</span>{" "}
          <Link
            className="inline-flex min-h-6 items-center whitespace-nowrap font-semibold text-brand-600 underline underline-offset-2 ml-1"
            href="/about"
          >
            {t("chrome.whatsReal") || "What is real vs simulated"}
          </Link>
        </div>
      </div>

      {/* Top Utility Bar — Accessibility & Auth */}
      <div className="bg-ink-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 text-[13px]">
          <span className="hidden md:inline text-ink-300">
            {t("chrome.tagline") || "National Cyber Incident Triage & Statutory Restitution Dispatch"}
          </span>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Auth Link / Status */}
            {!accountLoading && (
              <>
                {phone ? (
                  <div className="flex items-center gap-2 mr-1">
                    <span className="hidden font-medium text-ink-200 sm:inline text-xs">
                      {maskPhone(phone)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="flex h-7 items-center whitespace-nowrap rounded-ux-sm px-2 text-xs font-semibold text-ink-200 transition hover:bg-ink-800"
                    >
                      {t("chrome.signOut") || "Sign out"}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/signin"
                    className="flex h-7 items-center whitespace-nowrap rounded-ux-sm px-2 text-xs font-semibold text-ink-200 transition hover:bg-ink-800"
                  >
                    {t("chrome.signIn") || "Citizen sign in"}
                  </Link>
                )}
                <span aria-hidden="true" className="mx-0.5 h-3.5 w-px bg-ink-700"></span>
              </>
            )}

            {/* Assisted Mode Toggle */}
            <button
              type="button"
              onClick={() => setAssist(!assist)}
              aria-pressed={assist}
              className={`flex h-7 items-center gap-1.5 rounded-ux-sm px-2.5 text-xs font-semibold transition ${
                assist ? "bg-brand-500 text-white" : "text-ink-200 hover:bg-ink-800"
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

            <span aria-hidden="true" className="mx-0.5 h-3.5 w-px bg-ink-700"></span>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-expanded={langMenuOpen}
                aria-haspopup="true"
                aria-label="Language selector"
                className="flex h-7 items-center gap-1.5 rounded-ux-sm px-2 text-xs font-semibold text-ink-200 transition hover:bg-ink-800"
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
                  className="absolute right-0 top-full mt-1.5 w-44 rounded-ux border border-ink-200 bg-white py-1 shadow-md z-50 text-ink-900"
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
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-ink-100 ${
                        lang === l.code ? "bg-ink-100 font-bold text-ink-900" : "text-ink-700"
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
            <div className="flex items-center rounded-ux border border-ink-700 bg-ink-800 p-0.5" role="group" aria-label="Text size controls">
              <button
                type="button"
                onClick={() => setTextSize("sm")}
                aria-pressed={textSize === "sm"}
                aria-label="Smaller text"
                className={`h-6 min-h-0 px-2 rounded-ux-sm text-xs font-semibold transition ${
                  textSize === "sm" ? "bg-white text-ink-900" : "text-ink-300 hover:text-white"
                }`}
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => setTextSize("base")}
                aria-pressed={textSize === "base"}
                aria-label="Normal text"
                className={`h-6 min-h-0 px-2 rounded-ux-sm text-xs font-semibold transition ${
                  textSize === "base" ? "bg-white text-ink-900" : "text-ink-300 hover:text-white"
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setTextSize("lg")}
                aria-pressed={textSize === "lg"}
                aria-label="Larger text"
                className={`h-6 min-h-0 px-2 rounded-ux-sm text-xs font-semibold transition ${
                  textSize === "lg" ? "bg-white text-ink-900" : "text-ink-300 hover:text-white"
                }`}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Branding & Navigation Bar */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3.5">
          {/* Wordmark-Led Identity with Geometric Routed Path Mark */}
          <Link className="flex items-center gap-3 ux-target group" href="/">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-ux bg-ink-900 text-white"
            >
              <svg
                viewBox="0 0 32 32"
                className="h-6 w-6"
                fill="none"
              >
                <path d="M7 24 L14 16 L19 20 L25 9" stroke="#FFFFFF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="25" cy="9" r="3" fill="#D4351C" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-xl font-extrabold tracking-tight text-ink-900 group-hover:text-brand-600 transition">
                CasePilot
              </span>
              <span className="block text-xs font-medium text-ink-500">
                Citizen cyber incident triage & statutory routing
              </span>
            </span>
          </Link>

          {/* Emergency Helpline Direct Dial */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-danger-600">
                National Cyber Helpline
              </span>
              <span className="block text-xs text-ink-500">Available 24 hours daily</span>
            </div>
            <a
              href="tel:1930"
              className="ux-target inline-flex shrink-0 items-center gap-2 rounded-ux bg-danger-500 px-3.5 py-2 text-sm font-bold text-white hover:bg-danger-600 transition"
              aria-label="Dial 1930 National Cyber Helpline"
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
              <span>Call 1930</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main" className="-mx-1 flex flex-wrap gap-1 border-t border-ink-100 py-1.5">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`ux-target whitespace-nowrap rounded-ux px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-ink-900 text-white"
                    : "text-ink-700 hover:bg-ink-100 hover:text-ink-900"
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
