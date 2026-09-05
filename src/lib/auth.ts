import { cookies } from "next/headers";
import { getCollections, UserDoc, SessionDoc } from "@/lib/mongodb";
import crypto from "crypto";

const SESSION_COOKIE = "surakhsa_session";

export async function createSession(phone: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const sessionToken = crypto.randomBytes(32).toString("hex");

  const { sessions, users } = await getCollections();

  // Ensure user exists
  await users.updateOne(
    { phone },
    {
      $set: { lastLoginAt: new Date() },
      $setOnInsert: { phone, createdAt: new Date() },
    },
    { upsert: true }
  );

  // Store session in MongoDB
  await sessions.insertOne({
    token: sessionToken,
    phone,
    createdAt: new Date(),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<{ session: SessionDoc; user: UserDoc } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { sessions, users } = await getCollections();
    const session = await sessions.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) return null;

    const user = await users.findOne({ phone: session.phone });
    if (!user) return null;

    return { session, user };
  } catch (error) {
    console.error("getSession error:", error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const { sessions } = await getCollections();
      await sessions.deleteOne({ token });
    } catch (e) {
      console.error("destroySession error:", e);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}
