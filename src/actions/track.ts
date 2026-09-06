"use server";

import { getCollections, getFallbackStore, ComplaintDoc, UserProfile, DEFAULT_MOCK_PROFILE } from "@/lib/mongodb";
import { cookies } from "next/headers";

const SESSION_COOKIE = "casepilot_session";
const LEGACY_SESSION_COOKIE = "surakhsa_session";

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
  evidenceFiles?: Array<{ name: string; size: number; sha256: string; category?: string; dataUrl?: string }>;
  policeUnitAssigned?: string;
  daysRemainingInSla?: number;
  isSimulatedDemo?: boolean;
}

export async function trackComplaint(ackNumber: string): Promise<{
  error?: string;
  complaint?: SerializedComplaint;
}> {
  if (!ackNumber || ackNumber.trim() === "") {
    return { error: "Please enter an Acknowledgement Number." };
  }

  const cleanAck = ackNumber.trim().toUpperCase();

  try {
    let doc: ComplaintDoc | null | undefined = null;

    // 1. Try MongoDB first
    try {
      const collections = await getCollections();
      if (collections) {
        doc = await collections.complaints.findOne({
          ack: { $regex: new RegExp(`^${cleanAck}$`, "i") },
        });
      }
    } catch (mongoErr) {
      console.warn("MongoDB track query failed, checking fallback:", (mongoErr as Error).message);
    }

    // 2. If not found in MongoDB, check fallback memory store
    if (!doc) {
      doc = getFallbackStore().complaints.get(cleanAck);
      if (!doc) {
        // Search case-insensitively in fallback
        for (const [key, val] of getFallbackStore().complaints.entries()) {
          if (key.toUpperCase() === cleanAck) {
            doc = val;
            break;
          }
        }
      }
    }

    if (!doc) {
      return { error: `No record found for Acknowledgement "${cleanAck}". Please verify the number and try again.` };
    }

    const createdTime = new Date(doc.createdAt).getTime();
    const hoursElapsed = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60));

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

export async function getUserComplaints(clientRecentAcks?: string[]): Promise<{
  signedIn: boolean;
  phone?: string;
  complaints: SerializedComplaint[];
  profile?: UserProfile;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value || cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
    if (!token) {
      return { signedIn: false, complaints: [] };
    }

    let phone: string | undefined;
    let userProfile: UserProfile | undefined;
    const list: ComplaintDoc[] = [];

    // Try MongoDB
    try {
      const collections = await getCollections();
      if (collections) {
        const sess = await collections.sessions.findOne({ token, expiresAt: { $gt: new Date() } });
        if (sess) {
          phone = sess.phone;
          const cleanDigits = phone.replace(/\D/g, "");
          const last10 = cleanDigits.slice(-10);

          // Get profile
          const uDoc = await collections.users.findOne({
            $or: [{ phone }, { phone: cleanDigits }, { phone: { $regex: last10 } }],
          });
          if (uDoc?.profile) {
            userProfile = uDoc.profile;
          } else if (cleanDigits === "9600000598") {
            userProfile = { ...DEFAULT_MOCK_PROFILE, phone: cleanDigits };
          } else {
            userProfile = {
              fullName: "Citizen Account",
              phone: cleanDigits,
              email: `citizen.${last10}@portal.gov.in`,
              gender: "Other",
              dob: "1995-01-01",
              idType: "Aadhaar Card",
              idNumber: `XXXX-XXXX-${last10.slice(-4)}`,
              address: "Registered Citizen Residence",
              district: "Local District",
              state: "Delhi",
              pincode: "110001",
              verifiedStatus: "Official Identity Record",
            };
          }

          // Link any recent unlinked ACKs to this user in database
          if (clientRecentAcks && clientRecentAcks.length > 0) {
            try {
              await collections.complaints.updateMany(
                {
                  ack: { $in: clientRecentAcks },
                  $or: [{ phone: { $exists: false } }, { phone: "" }],
                },
                { $set: { phone: cleanDigits } }
              );
            } catch {}
          }

          const query: any = {
            $or: [
              { phone },
              { phone: cleanDigits },
              { phone: `+91${last10}` },
              { phone: { $regex: last10 } },
              ...(clientRecentAcks && clientRecentAcks.length > 0 ? [{ ack: { $in: clientRecentAcks } }] : []),
            ],
          };

          const found = await collections.complaints.find(query).sort({ createdAt: -1 }).toArray();
          list.push(...found);
        }
      }
    } catch (mongoErr) {
      console.warn("MongoDB user complaints query failed, checking fallback:", (mongoErr as Error).message);
    }

    // Check fallback
    if (!phone) {
      const fallbackSess = getFallbackStore().sessions.get(token);
      if (fallbackSess) phone = fallbackSess.phone;
    }

    if (phone) {
      const cleanDigits = phone.replace(/\D/g, "");
      const last10 = cleanDigits.slice(-10);
      if (!userProfile) {
        if (cleanDigits === "9600000598") {
          userProfile = { ...DEFAULT_MOCK_PROFILE, phone: cleanDigits };
        } else {
          userProfile = {
            fullName: "Citizen Account",
            phone: cleanDigits,
            email: `citizen.${last10}@portal.gov.in`,
            gender: "Other",
            dob: "1995-01-01",
            idType: "Aadhaar Card",
            idNumber: `XXXX-XXXX-${last10.slice(-4)}`,
            address: "Registered Citizen Residence",
            district: "Local District",
            state: "Delhi",
            pincode: "110001",
            verifiedStatus: "Official Identity Record",
          };
        }
      }

      const existingAcks = new Set(list.map((c) => c.ack));
      for (const comp of getFallbackStore().complaints.values()) {
        const compPhone = comp.phone ? comp.phone.replace(/\D/g, "") : "";
        const isMatch = compPhone.endsWith(last10) || (clientRecentAcks && clientRecentAcks.includes(comp.ack));
        if (isMatch && !existingAcks.has(comp.ack)) {
          list.push(comp);
          existingAcks.add(comp.ack);
        }
      }
    }

    // Ensure list is deduplicated and sorted newest first
    const seen = new Set<string>();
    const deduplicated = list.filter((c) => {
      if (seen.has(c.ack)) return false;
      seen.add(c.ack);
      return true;
    });
    deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const mapped: SerializedComplaint[] = deduplicated.map((doc) => ({
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
      policeUnitAssigned: "State Cyber Crime Police Station (HQ)",
    }));

    return { signedIn: !!phone, phone, complaints: mapped, profile: userProfile };
  } catch (err) {
    console.error("Get user complaints error:", err);
    return { signedIn: false, complaints: [] };
  }
}
