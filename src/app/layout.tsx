import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Surakhsa — Report a cyber crime",
  description: "An independent hackathon prototype reimagining India's National Cyber Crime Reporting Portal, built on the UX4G design system.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <AppProviders>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:text-ink-900 focus:z-50">
            Skip to main content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
