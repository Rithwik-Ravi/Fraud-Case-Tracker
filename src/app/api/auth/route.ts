import { NextRequest, NextResponse } from "next/server";
import { getCollections } from "@/lib/mongodb";
import crypto from "crypto";

const SESSION_COOKIE = "surakhsa_session";

function generateDeterministicOtp(phone: string): string {
  // Deterministic 6-digit OTP for testing based on phone number
  const hash = crypto.createHash("sha256").update(phone + "surakhsa_salt_2026").digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 900000 + 100000;
  return num.toString();
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ phone: null });
    }

    const { sessions } = await getCollections();
    const session = await sessions.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return NextResponse.json({ phone: null });
    }

    return NextResponse.json({ phone: session.phone });
  } catch (err) {
    console.error("Auth GET error:", err);
    return NextResponse.json({ phone: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, otp } = body;

    const { users, sessions } = await getCollections();

    if (action === "request_otp") {
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        return NextResponse.json(
          { error: "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9." },
          { status: 400 }
        );
      }

      const generatedOtp = generateDeterministicOtp(phone);
      return NextResponse.json({
        ok: true,
        otp: generatedOtp,
        message: "Demo OTP generated. In production, this would be delivered via SMS.",
      });
    }

    if (action === "verify_otp") {
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        return NextResponse.json({ error: "Invalid mobile number." }, { status: 400 });
      }

      const expectedOtp = generateDeterministicOtp(phone);
      // Also allow common demo OTP 123456 or expectedOtp
      if (otp !== expectedOtp && otp !== "123456") {
        return NextResponse.json({ error: "Incorrect OTP. Please check the code shown above." }, { status: 400 });
      }

      // Upsert user in MongoDB
      const now = new Date();
      await users.updateOne(
        { phone },
        {
          $set: { lastLoginAt: now },
          $setOnInsert: { phone, createdAt: now },
        },
        { upsert: true }
      );

      // Create new session token
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await sessions.insertOne({
        token: sessionToken,
        phone,
        createdAt: now,
        expiresAt,
      });

      const response = NextResponse.json({ ok: true, phone });
      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionToken,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        expires: expiresAt,
      });

      return response;
    }

    if (action === "signout") {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (token) {
        await sessions.deleteOne({ token });
      }

      const response = NextResponse.json({ ok: true });
      response.cookies.set({
        name: SESSION_COOKIE,
        value: "",
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Auth POST error:", err);
    return NextResponse.json({ error: "Authentication service error." }, { status: 500 });
  }
}
