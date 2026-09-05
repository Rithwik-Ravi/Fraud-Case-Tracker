"use server";

import { getCollections, ComplaintDoc } from "@/lib/mongodb";
import { classifyNarrative, TriageResult } from "@/lib/triage";
import { cookies } from "next/headers";

const SESSION_COOKIE = "surakhsa_session";

export async function triageIncidentAction(description: string): Promise<{
  error?: string;
  result?: TriageResult;
}> {
  if (!description || description.trim().length < 10) {
    return { error: "Please describe what happened in at least a few words." };
  }

  const result = classifyNarrative(description);
  return { result };
}

export async function requestFreezeAction(bankAccount: string, amount: number) {
  // Simulate banking network gateway latency
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!bankAccount || bankAccount.trim().length < 5) {
    return { error: "Please enter a valid bank account number or UPI ID." };
  }

  return {
    success: true,
    message: "Freeze request transmitted to Indian Financial Cyber Fraud Reporting System (CFCFRMS / 1930 network). Destination node notified.",
  };
}

export async function saveDraftAction(draftId: string, step: string, data: Record<string, any>) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const { sessions, complaintDrafts } = await getCollections();

    let phone: string | undefined;
    if (token) {
      const sess = await sessions.findOne({ token });
      if (sess) phone = sess.phone;
    }

    await complaintDrafts.updateOne(
      { draftId },
      {
        $set: {
          draftId,
          phone,
          step,
          data,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return { success: true };
  } catch (err) {
    console.error("Save draft error:", err);
    return { error: "Failed to save draft." };
  }
}

export async function submitComplaintAction(data: {
  narrative: string;
  categoryId: string;
  categoryLabel: string;
  parentCategory: string;
  urgency: "standard" | "urgent" | "golden-hour";
  amount?: number;
  bankAccount?: string;
  bankName?: string;
  transactionId?: string;
  freezeRequested: boolean;
  evidenceFiles?: Array<{ name: string; size: number; sha256: string }>;
}): Promise<{ success: boolean; ack?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const { sessions, complaints } = await getCollections();

    let phone: string | undefined;
    if (token) {
      const sess = await sessions.findOne({ token, expiresAt: { $gt: new Date() } });
      if (sess) {
        phone = sess.phone;
      }
    }

    // Generate ACK number in NCRP standard format: ACK-YYYY-XXXXXX
    const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
    const ack = `ACK-${new Date().getFullYear()}-${randomSixDigits}`;

    const newComplaint: ComplaintDoc = {
      ack,
      phone,
      categoryId: data.categoryId,
      categoryLabel: data.categoryLabel,
      parentCategory: data.parentCategory,
      urgency: data.urgency,
      narrative: data.narrative,
      amount: data.amount,
      bankAccount: data.bankAccount,
      bankName: data.bankName,
      transactionId: data.transactionId,
      freezeRequested: data.freezeRequested,
      stage: data.freezeRequested ? 2 : 1, // Stage 1: Filed, Stage 2: Freeze Underway
      createdAt: new Date(),
      evidenceFiles: data.evidenceFiles,
    };

    await complaints.insertOne(newComplaint);

    return { success: true, ack };
  } catch (err) {
    console.error("Submit complaint error:", err);
    return { success: false, error: "Failed to save complaint to MongoDB." };
  }
}
