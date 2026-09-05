"use server";

import { createSession, destroySession } from "@/lib/auth";

export async function requestOTP(phone: string) {
  if (!phone || !/^[6-9]\d{9}$/.test(phone.trim())) {
    return { error: "Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9." };
  }

  // Deterministic OTP for demo prototype
  const otp = "248190";
  return { success: true, otp, phone: phone.trim() };
}

export async function verifyOTP(phone: string, otp: string) {
  if (!phone || !otp) {
    return { error: "Missing phone or OTP." };
  }

  const cleanPhone = phone.trim();
  // Allow demo OTP 248190 or 123456
  if (otp.trim() !== "248190" && otp.trim() !== "123456") {
    return { error: "Invalid OTP code." };
  }

  await createSession(cleanPhone);
  return { success: true };
}

export async function logout() {
  await destroySession();
}
