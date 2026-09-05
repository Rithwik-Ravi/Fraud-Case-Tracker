"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestOTP, verifyOTP } from "@/actions/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(""); // Only for prototype display
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await requestOTP(phone);
      if (res.error) {
        setError(res.error);
      } else {
        setGeneratedOtp(res.otp!);
        setStep("OTP");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await verifyOTP(phone, otp);
      if (res.error) {
        setError(res.error);
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      {step === "PHONE" ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Verify your identity</h2>
            <p className="mt-2 text-sm text-ink-600">
              Please enter your 10-digit mobile number.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-ink-900">
              Mobile Number
            </label>
            <div className="mt-2 flex rounded-md shadow-sm ring-1 ring-inset ring-ink-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-600 sm:max-w-md">
              <span className="flex select-none items-center pl-3 pr-2 text-ink-500 sm:text-sm">
                +91
              </span>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                className="block w-full border-0 bg-transparent py-2.5 pl-1 text-ink-900 placeholder:text-ink-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-danger-600">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={loading || phone.length !== 10}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Enter OTP</h2>
            <p className="mt-2 text-sm text-ink-600">
              We sent a code to +91 {phone}
            </p>
          </div>

          <div className="rounded-ux-md border border-warning-200 bg-warning-50 p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-warning-700">Prototype Note: Simulated SMS</span>
            <Badge variant="warning">{generatedOtp}</Badge>
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-semibold text-ink-900">
              6-digit Code
            </label>
            <div className="mt-2">
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="block w-full rounded-md border-0 py-2.5 px-3.5 text-ink-900 shadow-sm ring-1 ring-inset ring-ink-300 placeholder:text-ink-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 text-center tracking-[0.5em] font-mono text-lg"
                placeholder="------"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-danger-600">{error}</p>}

          <div className="flex flex-col gap-3">
            <Button type="submit" variant="primary" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify and Continue"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2"
            >
              Use a different number
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
