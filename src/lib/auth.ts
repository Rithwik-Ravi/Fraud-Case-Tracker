import { cookies } from "next/headers";
import { getCollections, getFallbackStore, UserDoc, SessionDoc } from "@/lib/mongodb";
import crypto from "crypto";

const SESSION_COOKIE = "surakhsa_session";

export async function createSession(phone: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const sessionToken = crypto.randomBytes(32).toString("hex");

  try {
    const collections = await getCollections();
    if (collections) {
      // Ensure user exists
      await collections.users.updateOne(
        { phone },
        {
          $set: { lastLoginAt: new Date() },
          $setOnInsert: { phone, createdAt: new Date() },
        },
        { upsert: true }
      );

      // Store session in MongoDB
      await collections.sessions.insertOne({
        token: sessionToken,
        phone,
        createdAt: new Date(),
        expiresAt,
      });
    }
  } catch (err) {
    console.warn("MongoDB createSession warning:", (err as Error).message);
  }

  // Also save to fallback store
  getFallbackStore().sessions.set(sessionToken, {
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
    const collections = await getCollections();
    if (collections) {
      const session = await collections.sessions.findOne({
        token,
        expiresAt: { $gt: new Date() },
      });

      if (session) {
        const user = await collections.users.findOne({ phone: session.phone });
        if (user) return { session, user };
      }
    }
  } catch (error) {
    console.warn("getSession error:", (error as Error).message);
  }

  // Fallback
  const fallbackSess = getFallbackStore().sessions.get(token);
  if (fallbackSess && fallbackSess.expiresAt > new Date()) {
    return {
      session: fallbackSess,
      user: {
        phone: fallbackSess.phone,
        createdAt: fallbackSess.createdAt,
        lastLoginAt: new Date(),
      },
    };
  }

  return null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const collections = await getCollections();
      if (collections) {
        await collections.sessions.deleteOne({ token });
      }
    } catch (e) {
      console.warn("destroySession error:", (e as Error).message);
    }
    getFallbackStore().sessions.delete(token);
  }

  cookieStore.delete(SESSION_COOKIE);
}
