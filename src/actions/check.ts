"use server";

import { getCollections, getFallbackStore, SuspectCheckDoc, SuspectReportDoc } from "@/lib/mongodb";
import { cookies } from "next/headers";

const SESSION_COOKIE = "surakhsa_session";

export interface CheckVerdict {
  query: string;
  kind: "url" | "upi" | "phone" | "email" | "telegram" | "unclear";
  verdict: "danger" | "warning" | "unclear" | "ok";
  title: string;
  reasons: string[];
}

export async function checkSuspectAction(rawInput: string): Promise<CheckVerdict> {
  const query = rawInput.trim();
  const lower = query.toLowerCase();

  let kind: CheckVerdict["kind"] = "unclear";
  let verdict: CheckVerdict["verdict"] = "unclear";
  let title = "We could not tell what this is.";
  const reasons: string[] = [];

  // UPI detection
  if (lower.includes("@") && !lower.includes("http") && !lower.includes("www") && !lower.includes(".com")) {
    kind = "upi";
    const bankHandles = ["@oksbi", "@okhdfcbank", "@okaxis", "@okicici", "@ybl", "@paytm", "@ibl", "@axl"];
    const hasKnownHandle = bankHandles.some((h) => lower.endsWith(h));

    if (lower.includes("refund") || lower.includes("cashback") || lower.includes("support") || lower.includes("helpdesk")) {
      verdict = "danger";
      title = "Do not pay. High-risk deceptive UPI ID.";
      reasons.push("Uses deceptive keywords like 'refund' or 'support' designed to impersonate official customer service.");
      reasons.push("Legitimate customer care never asks you to send money or approve collect requests for a refund.");
    } else if (hasKnownHandle) {
      verdict = "warning";
      title = "Something here warrants caution.";
      reasons.push("This is an individual consumer VPA handle, not an official merchant gateway.");
      reasons.push("Never approve collect requests or enter your UPI PIN to receive funds.");
    } else {
      verdict = "ok";
      title = "Valid UPI address format.";
      reasons.push("Standard VPA syntax. Always verify the recipient's registered beneficiary name in your UPI app before sending.");
    }
  }
  // URL / Website detection
  else if (lower.startsWith("http") || lower.includes(".xyz") || lower.includes(".top") || lower.includes(".online") || lower.includes("xn--") || lower.includes(".com") || lower.includes(".in")) {
    kind = "url";

    if (lower.includes("xn--")) {
      verdict = "danger";
      title = "Do not open. Punycode homograph phishing spoof detected.";
      reasons.push("Punycode (xn--) is used to disguise characters from Cyrillic or Greek alphabets to mimic legitimate bank or brand names.");
    } else if (
      (lower.includes("sbi") || lower.includes("hdfc") || lower.includes("icici") || lower.includes("income-tax") || lower.includes("challan")) &&
      (lower.includes("-") || lower.includes(".xyz") || lower.includes(".club") || lower.includes(".live") || lower.includes("verify") || lower.includes("apk"))
    ) {
      verdict = "danger";
      title = "Phishing clone detected. Do not enter credentials.";
      reasons.push("Impersonates a major Indian bank or government department using an unverified third-level domain.");
      reasons.push("Official government portals always end in .gov.in or .nic.in.");
    } else if (lower.includes("free") || lower.includes("lottery") || lower.includes("win") || lower.includes("reward") || lower.includes("gift")) {
      verdict = "warning";
      title = "High likelihood of promotional scam campaign.";
      reasons.push("Website URL contains classic lottery or reward bait keywords.");
    } else {
      verdict = "ok";
      title = "Standard domain structure.";
      reasons.push("No automated deceptive indicators detected in the URL structure. Always verify HTTPS certificate validity.");
    }
  }
  // Phone number detection
  else if (/^\+?[\d\s-]{10,15}$/.test(lower.replace(/[\s-]/g, ""))) {
    kind = "phone";
    const cleanDigits = lower.replace(/\D/g, "");

    if (cleanDigits.startsWith("92") || cleanDigits.startsWith("234") || cleanDigits.startsWith("1876")) {
      verdict = "danger";
      title = "International high-risk fraud prefix.";
      reasons.push(`Country code +${cleanDigits.slice(0, 2)} is heavily associated with overseas WhatsApp call fraud and job task rackets.`);
    } else if (cleanDigits.length === 10 && !["6", "7", "8", "9"].includes(cleanDigits[0])) {
      verdict = "warning";
      title = "Irregular telephone number format.";
      reasons.push("Indian mobile numbers strictly begin with 6, 7, 8, or 9.");
    } else {
      verdict = "ok";
      title = "Standard Indian telecom number format.";
      reasons.push("Valid number format. Beware if this caller demands OTPs, APK downloads, or bank account details.");
    }
  }
  // Email detection
  else if (lower.includes("@") && lower.includes(".")) {
    kind = "email";
    if (lower.endsWith("@gmail.com") || lower.endsWith("@yahoo.com") || lower.endsWith("@hotmail.com")) {
      verdict = "warning";
      title = "Free public email service used for official claim.";
      reasons.push("Banks and government agencies never communicate official legal or banking notices from public Gmail or Yahoo accounts.");
    } else {
      verdict = "ok";
      title = "Domain mail format.";
      reasons.push("Standard email syntax. Verify the SPF/DKIM authentication header in your email client.");
    }
  }

  // Save to MongoDB suspect_checks for analytics and fraud pattern tracking
  try {
    const collections = await getCollections();
    if (collections) {
      await collections.suspectChecks.insertOne({
        query,
        kind,
        verdict,
        reasons,
        checkedAt: new Date(),
      });
    }
  } catch (err) {
    console.warn("Failed to log suspect check to MongoDB:", (err as Error).message);
  }

  return {
    query,
    kind,
    verdict,
    title,
    reasons,
  };
}

export async function reportSuspectAction(suspectValue: string, reason: string): Promise<{ success: boolean; ref?: string; error?: string }> {
  if (!suspectValue.trim() || !reason.trim()) {
    return { success: false, error: "Please enter both the suspect identifier and your reason." };
  }

  const ref = `SUS-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    let phone: string | undefined;

    const newReport: SuspectReportDoc = {
      ref,
      suspectValue: suspectValue.trim(),
      reason: reason.trim(),
      phone,
      createdAt: new Date(),
    };

    try {
      const collections = await getCollections();
      if (collections) {
        if (token) {
          const sess = await collections.sessions.findOne({ token });
          if (sess) phone = sess.phone;
          newReport.phone = phone;
        }

        await collections.suspectReports.insertOne(newReport);
        getFallbackStore().suspectReports.set(ref, newReport);
        return { success: true, ref };
      }
    } catch (mongoErr) {
      console.warn("MongoDB suspect report error, saving to fallback store:", (mongoErr as Error).message);
    }

    getFallbackStore().suspectReports.set(ref, newReport);
    return { success: true, ref };
  } catch (err) {
    console.error("Report suspect error:", err);
    return { success: true, ref };
  }
}
