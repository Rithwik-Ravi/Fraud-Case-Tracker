import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppProviders from "@/components/providers/AppProviders";
import AIChatbot from "@/components/chat/AIChatbot";

export const metadata: Metadata = {
  title: "CasePilot — Citizen Cyber Triage & Incident Routing",
  description:
    "CasePilot is an independent civic cyber incident triage and statutory routing service. Immediate situational triage, emergency Golden-Hour banking freeze capture, and statutory case tracking under Indian cyber law.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Noto Sans — universal script coverage for all Indian languages */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <AppProviders>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:text-ink-900 focus:z-50"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <AIChatbot />
        </AppProviders>
      </body>
    </html>
  );
}
