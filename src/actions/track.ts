"use server";

import { getCollections, ComplaintDoc } from "@/lib/mongodb";
import { cookies } from "next/headers";

const SESSION_COOKIE = "surakhsa_session";

export interface SerializedComplaint {
  ack: string;
  phone?: string;
  categoryId: string;
  categoryLabel: string;
  parentCategory: string;
  urgency: "standard" | "urgent" | "golden-hour";
  narrative: string;
  amount?: number;
  bankAccount?: string;
  bankName?: string;
  transactionId?: string;
  freezeRequested: boolean;
  stage: number;
  createdAt: string;
  evidenceFiles?: Array<{ name: string; size: number; sha256: string }>;
  policeUnitAssigned?: string;
  daysRemainingInSla?: number;
}

export async function trackComplaint(ackNumber: string): Promise<{
  error?: string;
  complaint?: SerializedComplaint;
}> {
  if (!ackNumber || ackNumber.trim() === "") {
    return { error: "Please enter an Acknowledgement Number." };
  }

  try {
    const cleanAck = ackNumber.trim().toUpperCase();
    const { complaints } = await getCollections();

    // Query MongoDB by ack
    const doc = await complaints.findOne({
      ack: { $regex: new RegExp(`^${cleanAck}$`, "i") },
    });

    if (!doc) {
      return { error: `No record found for Acknowledgement "${cleanAck}". Please verify the number and try again.` };
    }

    const createdTime = new Date(doc.createdAt).getTime();
    const hoursElapsed = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60));
    
    // Deterministic progression based on time elapsed
    let currentStage = doc.stage || 1;
    if (hoursElapsed > 48) {
      currentStage = Math.max(currentStage, 3);
    } else if (hoursElapsed > 2) {
      currentStage = Math.max(currentStage, 2);
    }

    const serialized: SerializedComplaint = {
      ack: doc.ack,
      phone: doc.phone,
      categoryId: doc.categoryId,
      categoryLabel: doc.categoryLabel,
      parentCategory: doc.parentCategory,
      urgency: doc.urgency,
      narrative: doc.narrative,
      amount: doc.amount,
      bankAccount: doc.bankAccount,
      bankName: doc.bankName,
      transactionId: doc.transactionId,
      freezeRequested: doc.freezeRequested,
      stage: currentStage,
      createdAt: new Date(doc.createdAt).toISOString(),
      evidenceFiles: doc.evidenceFiles,
      policeUnitAssigned: "State Cyber Crime Police Station (HQ)",
      daysRemainingInSla: Math.max(1, 15 - Math.floor(hoursElapsed / 24)),
    };

    return { complaint: serialized };
  } catch (err) {
    console.error("Tracking Error:", err);
    return { error: "Database error retrieving complaint." };
  }
}

export async function getUserComplaints(): Promise<{
  signedIn: boolean;
  phone?: string;
  complaints: SerializedComplaint[];
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return { signedIn: false, complaints: [] };
    }

    const { sessions, complaints } = await getCollections();
    const sess = await sessions.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!sess) {
      return { signedIn: false, complaints: [] };
    }

    const list = await complaints
      .find({ phone: sess.phone })
      .sort({ createdAt: -1 })
      .toArray();

    const mapped: SerializedComplaint[] = list.map((doc) => ({
      ack: doc.ack,
      phone: doc.phone,
      categoryId: doc.categoryId,
      categoryLabel: doc.categoryLabel,
      parentCategory: doc.parentCategory,
      urgency: doc.urgency,
      narrative: doc.narrative,
      amount: doc.amount,
      bankAccount: doc.bankAccount,
      bankName: doc.bankName,
      transactionId: doc.transactionId,
      freezeRequested: doc.freezeRequested,
      stage: doc.stage || 1,
      createdAt: new Date(doc.createdAt).toISOString(),
      evidenceFiles: doc.evidenceFiles,
      policeUnitAssigned: "State Cyber Crime Police Station",
    }));

    return { signedIn: true, phone: sess.phone, complaints: mapped };
  } catch (err) {
    console.error("Get user complaints error:", err);
    return { signedIn: false, complaints: [] };
  }
}
