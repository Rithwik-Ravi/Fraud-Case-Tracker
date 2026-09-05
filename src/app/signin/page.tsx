"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, CheckCircle2, FileText, UserPlus, ArrowLeft } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Puducherry"
];

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/track";
  const { refresh } = useAccount();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP" | "REGISTER">("PHONE");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Registration Form State for New Citizens
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female" | "Other">("Male");
  const [regDob, setRegDob] = useState("1995-05-20");
  const [regIdType, setRegIdType] = useState<"Aadhaar Card" | "Voter ID" | "PAN Card" | "Driving License">("Aadhaar Card");
  const [regIdNumber, setRegIdNumber] = useState("");
  const [regState, setRegState] = useState("Delhi");
  const [regDistrict, setRegDistrict] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPincode, setRegPincode] = useState("");

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
      } else if (data.isNewUser) {
        // Transition to New Citizen Registration Form
        setStep("REGISTER");
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

  // Complete Registration for New Citizens
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!regName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!regEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phone: cleanPhone,
          profile: {
            fullName: regName.trim(),
            email: regEmail.trim(),
            gender: regGender,
            dob: regDob,
            idType: regIdType,
            idNumber: regIdNumber.trim() || `XXXX-XXXX-${cleanPhone.slice(-4)}`,
            state: regState,
            district: regDistrict.trim() || "Central",
            address: regAddress.trim() || "Citizen Residence",
            pincode: regPincode.trim() || "110001",
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
      } else {
        await refresh();
        router.push(nextUrl);
      }
    } catch {
      setError("Network error during registration.");
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill sample data for fast demonstration
  const handleQuickFillSampleCitizen = () => {
    const lastDigits = phone.slice(-4) || "7721";
    setRegName("Ananya Verma");
    setRegEmail(`ananya.verma${lastDigits}@citizen-portal.in`);
    setRegGender("Female");
    setRegDob("1996-06-18");
    setRegIdType("Aadhaar Card");
    setRegIdNumber(`XXXX-XXXX-${lastDigits}`);
    setRegState("Delhi");
    setRegDistrict("South Delhi");
    setRegAddress("B-14, Connaught Place, Block B");
    setRegPincode("110001");
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
        {/* Left Column: Sign-in / Registration Card */}
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
              Signs in immediately with a pre-filled, verified citizen profile (<strong>Rajesh Kumar Sharma • +91 9600000598</strong>), linked DigiLocker Aadhaar verification, and pre-seeded complaint (<strong>ACK-2026-314982 for ₹98,765</strong>).
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

          {/* Standard Form Card */}
          <Card className="border-ink-200 bg-white p-6 shadow-sm">
            {step === "REGISTER" ? (
              /* NEW CITIZEN REGISTRATION FORM */
              <div className="space-y-4">
                <div className="border-b border-ink-100 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-600">
                      <UserPlus className="h-3.5 w-3.5" />
                      Step 2 of 2: Profile Registration
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep("PHONE")}
                      className="text-xs font-semibold text-ink-500 hover:text-ink-900 flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" /> Change Number
                    </button>
                  </div>
                  <h2 className="text-lg font-bold text-ink-900 mt-1">
                    New Citizen Profile Setup
                  </h2>
                  <p className="text-xs text-ink-600 mt-0.5">
                    Your number <strong>+91 {phone}</strong> is verified. Please complete your official complainant dossier to register.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleQuickFillSampleCitizen}
                    className="inline-flex items-center gap-1.5 rounded-ux bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition border border-brand-200"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                    Auto-Fill Sample Citizen Details
                  </button>
                </div>

                <form onSubmit={handleCompleteRegistration} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        Full Name (as per National ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Ananya Verma"
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. ananya@example.com"
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        Gender
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as any)}
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 bg-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other / Transgender</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        Identity Document Type
                      </label>
                      <select
                        value={regIdType}
                        onChange={(e) => setRegIdType(e.target.value as any)}
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 bg-white focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        ID Document Number
                      </label>
                      <input
                        type="text"
                        value={regIdNumber}
                        onChange={(e) => setRegIdNumber(e.target.value)}
                        placeholder="XXXX-XXXX-1234"
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        State / Union Territory
                      </label>
                      <select
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 bg-white focus:border-brand-500 focus:outline-none"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        placeholder="e.g. South Delhi"
                        className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="e.g. Flat 101, Block C, Green Park"
                      className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1">
                      PIN Code (6 digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={regPincode}
                      onChange={(e) => setRegPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 110016"
                      className="block w-full rounded-ux border border-ink-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  {error && (
                    <div className="rounded-ux bg-danger-50 p-2.5 text-xs font-medium text-danger-700 border border-danger-200">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center text-sm py-2.5 mt-2 shadow-sm"
                    disabled={loading || !regName.trim() || !regEmail.trim()}
                  >
                    {loading ? "Registering Profile..." : "Complete Registration & Enter Portal →"}
                  </Button>
                </form>
              </div>
            ) : (
              /* STANDARD LOGIN / OTP FLOW */
              <div>
                <div className="mb-4 border-b border-ink-100 pb-3">
                  <h2 className="text-base font-bold text-ink-900">
                    Mobile Number OTP Sign In
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Enter any 10-digit Indian mobile number. Returning citizens are signed in directly; new citizens proceed to profile setup.
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
                          className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <ArrowLeft className="h-3 w-3" /> Change number
                        </button>
                      </div>
                      <p className="text-xs text-ink-600 mb-2">
                        Code generated for <strong>+91 {phone}</strong>:
                      </p>
                      <input
                        id="otp"
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 193024"
                        className="block w-full tracking-[0.25em] text-center rounded-ux border-2 border-brand-500 py-3 text-2xl font-bold text-ink-900 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal focus:border-brand-600 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    {generatedOtp && (
                      <div className="rounded-ux bg-brand-50 border border-brand-200 p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-brand-700 block uppercase tracking-wider">
                            Demonstration Access Code
                          </span>
                          <span className="text-lg font-mono font-bold text-brand-900 tracking-widest">
                            {generatedOtp}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtp(generatedOtp);
                            handleVerifyOtp(undefined, generatedOtp);
                          }}
                          className="rounded-ux bg-white px-2.5 py-1 text-xs font-bold text-brand-700 shadow-sm border border-brand-300 hover:bg-brand-50"
                        >
                          Auto Fill & Sign In
                        </button>
                      </div>
                    )}

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
                      {loading ? "Verifying..." : "Verify & Sign In →"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Pixel-faithful NCRP "CHECK LIST FOR COMPLAINANT" Card */}
        <div className="lg:col-span-6">
          <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-md transition hover:shadow-lg font-sans">
            {/* Green Header with Horizontal Lines */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-0.5 w-14 bg-emerald-700"></div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-emerald-800 uppercase text-center">
                CHECK LIST FOR COMPLAINANT
              </h2>
              <div className="h-0.5 w-14 bg-emerald-700"></div>
            </div>

            {/* Pink / Rose Notice */}
            <p className="text-sm font-bold text-rose-600 mb-4 leading-snug">
              Please keep this information ready before filing your complaint:
            </p>

            {/* Section 1: Mandatory Information */}
            <div className="mb-6 space-y-2">
              <h3 className="text-sm font-black text-ink-900 uppercase tracking-tight">
                Mandatory Information
              </h3>
              <ol className="space-y-1.5 text-xs text-ink-800 leading-relaxed pl-1">
                <li>
                  <span className="font-bold text-ink-900">1.</span> Incident Date and Time.
                </li>
                <li>
                  <span className="font-bold text-ink-900">2.</span> Incident details (minimum 200 characters) without any special characters (<span className="font-mono text-ink-600">#$@^*`&quot;~|!</span>).
                </li>
                <li>
                  <span className="font-bold text-ink-900">3.</span> Soft copy of any national Id ( Voter Id, Driving license, Passport, PAN Card, Aadhaar Card) of complainant in .jpeg, .jpg, .png format (file size should not more than 5 MB).
                </li>
                <li>
                  <span className="font-bold text-ink-900">4.</span> In case of financial fraud, please keep following information ready:
                  <ul className="pl-4 mt-1 space-y-1 text-ink-700">
                    <li>i) Name of the Bank/ Wallet/Merchant</li>
                    <li>ii) 12-digit Transaction id/UTR No.</li>
                    <li>iii) Date of transaction</li>
                    <li>iv) Fraud amount</li>
                  </ul>
                </li>
                <li>
                  <span className="font-bold text-ink-900">5.</span> Soft copy of all the relevant evidences related to the cyber crime (not more than 10 MB each)
                </li>
              </ol>
            </div>

            {/* Section 2: Optional / Desirable Information */}
            <div className="space-y-2 border-t border-ink-100 pt-4">
              <h3 className="text-sm font-black text-ink-900 uppercase tracking-tight">
                Optional/Desirable Information:
              </h3>
              <ol className="space-y-1.5 text-xs text-ink-800 leading-relaxed pl-1">
                <li>
                  <span className="font-bold text-ink-900">1.</span> Suspected website URLs/ Social Media handles (wherever applicable)
                </li>
                <li>
                  <span className="font-bold text-ink-900">2.</span> Suspect Details (if available)
                  <ul className="pl-4 mt-1 space-y-1 text-ink-700">
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

            {/* Official Footer Note */}
            <div className="mt-5 rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-[11px] text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Complies with NCRP National Citizen Onboarding & MHA Cyber Safety Standards.</span>
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
