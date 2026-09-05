"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ShieldCheck, PhoneCall, KeyRound, ArrowRight } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/track";
  const { refresh } = useAccount();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_otp", phone: cleanPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate OTP. Please try again.");
      } else {
        setGeneratedOtp(data.otp);
        setStep("OTP");
      }
    } catch {
      setError("Network error. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          phone: cleanPhone,
          otp: otp.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP code.");
      } else {
        await refresh();
        router.push(nextUrl);
      }
    } catch {
      setError("Network error during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Citizen Sign In
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Sign in with your mobile number to view and track all your cyber crime complaints in one place.
        </p>
      </div>

      <Card className="border-ink-200 bg-white p-6 shadow-sm">
        {step === "PHONE" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-ink-900 mb-1">
                Mobile Number
              </label>
              <div className="relative rounded-ux shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-sm font-semibold text-ink-500">+91</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="block w-full rounded-ux border-2 border-ink-200 py-2.5 pl-12 pr-3 text-ink-900 text-base font-medium placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">
                Any valid 10-digit number starting with 6–9 is accepted.
              </p>
            </div>

            {error && (
              <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center text-base py-3"
              disabled={loading || phone.length < 10}
            >
              {loading ? "Generating OTP..." : "Get OTP →"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="otp" className="block text-sm font-semibold text-ink-900">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep("PHONE")}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Change number
                </button>
              </div>

              {generatedOtp && (
                <div className="mb-3 rounded-ux border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
                  <p className="font-semibold mb-1">Demo Environment Code:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold tracking-widest text-ink-900">
                      {generatedOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(generatedOtp)}
                      className="rounded-ux bg-white px-2 py-1 font-semibold text-brand-600 shadow-sm border border-brand-200 hover:bg-brand-50"
                    >
                      Fill Code
                    </button>
                  </div>
                </div>
              )}

              <input
                id="otp"
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="block w-full rounded-ux border-2 border-ink-200 py-2.5 px-3 text-center text-2xl font-mono tracking-widest text-ink-900 focus:border-brand-500 focus:outline-none"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center text-base py-3"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify and Continue →"}
            </Button>
          </form>
        )}
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-ink-500">
          Signing in is never required to file an emergency cyber crime complaint. You can always file anonymously and track via your Acknowledgement Number.
        </p>
        <div className="mt-3">
          <Link href="/report" className="text-xs font-semibold text-brand-600 hover:underline">
            ← Return to Report Form
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-ink-500">Loading sign in...</div>}>
      <SignInForm />
    </Suspense>
  );
}
