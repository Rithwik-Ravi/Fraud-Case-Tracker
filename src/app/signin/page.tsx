"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ShieldCheck, ArrowRight, UserCheck, Sparkles } from "lucide-react";

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

  const handleRequestOtp = async (targetPhone = phone) => {
    setError("");
    const cleanPhone = targetPhone.trim().replace(/\D/g, "");
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

  const handleVerifyOtp = async (e?: React.FormEvent, targetOtp = otp) => {
    if (e) e.preventDefault();
    setError("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!targetOtp || targetOtp.length !== 6) {
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
          otp: targetOtp.trim(),
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

  // 1-Click Judge Demo Sign-In
  const handleQuickDemoSignIn = async () => {
    const demoPhone = "9600000598";
    setPhone(demoPhone);
    setLoading(true);
    setError("");

    try {
      const req = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_otp", phone: demoPhone }),
      });
      const reqData = await req.json();

      if (reqData.ok && reqData.otp) {
        setGeneratedOtp(reqData.otp);
        setOtp(reqData.otp);

        const verifyRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_otp",
            phone: demoPhone,
            otp: reqData.otp,
          }),
        });

        if (verifyRes.ok) {
          await refresh();
          router.push("/track");
          return;
        }
      }
      setError("Failed to auto-sign in. Please use the manual OTP form.");
    } catch {
      setError("Network error during demo login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-8">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Citizen Access & Case Dossier Portal
        </h1>
        <p className="mt-1.5 text-sm text-ink-600 max-w-xl mx-auto">
          Sign in to view your verified complainant profile, Right to Service SLA timeline, and all filed cyber crime reports in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sign-in Card & Demo Profile */}
        <div className="lg:col-span-6 space-y-6">
          {/* Quick Demo Login Banner for Judges */}
          <div className="rounded-ux-lg border-2 border-brand-500/40 bg-brand-50/60 p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-600 shrink-0" />
                <h2 className="text-sm font-bold text-brand-900">
                  Judge & Evaluator Demonstration
                </h2>
              </div>
              <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                1-Click Sign In
              </span>
            </div>
            <p className="text-xs leading-relaxed text-brand-800">
              Signs in immediately with a pre-filled, verified citizen profile (<strong>Rajesh Kumar Sharma • +91 9600000598</strong>), linked Aadhaar verification, and pre-seeded active complaints (including ACK-2026-314982 for ₹98,765).
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={handleQuickDemoSignIn}
              disabled={loading}
              className="w-full justify-center text-sm py-2.5 shadow-sm"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              {loading ? "Authenticating Demo Profile..." : "Sign in as Verified Demo Complainant →"}
            </Button>
          </div>

          {/* Standard OTP Sign In Card */}
          <Card className="border-ink-200 bg-white p-6 shadow-sm">
            <div className="mb-4 border-b border-ink-100 pb-3">
              <h2 className="text-base font-bold text-ink-900">
                Mobile Number OTP Sign In
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Enter any 10-digit Indian mobile number. An instant demonstration code will be generated.
              </p>
            </div>

            {step === "PHONE" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequestOtp();
                }}
                className="space-y-4"
              >
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
                      placeholder="9600000598"
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
                  variant="secondary"
                  className="w-full justify-center text-sm py-2.5"
                  disabled={loading || phone.length < 10}
                >
                  {loading ? "Generating Code..." : "Send OTP Code →"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="otp" className="block text-sm font-semibold text-ink-900">
                      Enter 6-Digit OTP Code
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
                          onClick={() => {
                            setOtp(generatedOtp);
                            handleVerifyOtp(undefined, generatedOtp);
                          }}
                          className="rounded-ux bg-white px-2 py-1 font-semibold text-brand-600 shadow-sm border border-brand-200 hover:bg-brand-50"
                        >
                          Auto-Fill & Submit
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
                  className="w-full justify-center text-sm py-2.5"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Open Dashboard →"}
                </Button>
              </form>
            )}
          </Card>

          <div className="text-center">
            <p className="text-xs text-ink-500">
              Signing in is optional. You can file emergency complaints anonymously without signing in.
            </p>
            <div className="mt-2">
              <Link href="/report" className="text-xs font-semibold text-brand-600 hover:underline">
                ← Return to Report Form
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: CHECK LIST FOR COMPLAINANT (Matching Screenshot 3) */}
        <div className="lg:col-span-6">
          <div className="rounded-ux-lg border border-ink-200 bg-white p-6 shadow-md">
            {/* Green Header Line */}
            <div className="text-center mb-4">
              <h2 className="text-sm font-extrabold tracking-widest text-emerald-700 uppercase flex items-center justify-center gap-2">
                <span className="h-0.5 w-6 bg-emerald-600 inline-block"></span>
                CHECK LIST FOR COMPLAINANT
                <span className="h-0.5 w-6 bg-emerald-600 inline-block"></span>
              </h2>
              <p className="mt-2 text-xs font-semibold text-rose-600">
                Please keep this information ready before filing your complaint:
              </p>
            </div>

            <div className="space-y-4 text-xs text-ink-800 leading-relaxed">
              {/* Mandatory Information */}
              <div>
                <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider mb-1.5">
                  Mandatory Information:
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 text-ink-700">
                  <li>Incident Date and Time.</li>
                  <li>
                    Incident details (minimum 200 characters) without any special characters (<code className="font-mono text-[11px] bg-ink-100 px-1 py-0.5 rounded">#$@^*`~|!</code>).
                  </li>
                  <li>
                    Soft copy of any national Id (Voter Id, Driving license, Passport, PAN Card, Aadhaar Card) of complainant in .jpeg, .jpg, .png format (file size should not more than 5 MB).
                  </li>
                  <li>
                    <strong>In case of financial fraud, please keep following information ready:</strong>
                    <ul className="list-none pl-2 mt-1 space-y-0.5 text-ink-600">
                      <li>i) Name of the Bank/ Wallet/Merchant</li>
                      <li>ii) 12-digit Transaction id/UTR No.</li>
                      <li>iii) Date of transaction</li>
                      <li>iv) Fraud amount</li>
                    </ul>
                  </li>
                  <li>
                    Soft copy of all the relevant evidences related to the cyber crime (not more than 10 MB each).
                  </li>
                </ol>
              </div>

              <div className="border-t border-ink-100 pt-3">
                <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider mb-1.5">
                  Optional/Desirable Information:
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 text-ink-700">
                  <li>Suspected website URLs/ Social Media handles (wherever applicable).</li>
                  <li>
                    Suspect Details (if available):
                    <ul className="list-none pl-2 mt-1 space-y-0.5 text-ink-600">
                      <li>i) Mobile No</li>
                      <li>ii) Email id</li>
                      <li>iii) Bank Account No</li>
                      <li>iv) Address</li>
                      <li>v) Soft copy of photograph of suspect in .jpeg, .jpg, .png format (not more than 5 MB)</li>
                      <li>vi) Any other document through which suspect can be identified.</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
          </div>
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
