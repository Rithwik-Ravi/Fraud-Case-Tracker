import { MongoClient, Db, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/surakhsa";

const options = {
  serverSelectionTimeoutMS: 4000, // Timeout fast after 4s instead of hanging 30s
  connectTimeoutMS: 4000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _fallbackComplaints: Map<string, ComplaintDoc> | undefined;
  var _fallbackUsers: Map<string, UserDoc> | undefined;
  var _fallbackSessions: Map<string, SessionDoc> | undefined;
  var _fallbackSuspectReports: Map<string, SuspectReportDoc> | undefined;
}

// In-memory fallback for environments (like Vercel preview) where MONGODB_URI is not yet configured
if (!global._fallbackComplaints) global._fallbackComplaints = new Map();
if (!global._fallbackUsers) global._fallbackUsers = new Map();
if (!global._fallbackSessions) global._fallbackSessions = new Map();
if (!global._fallbackSuspectReports) global._fallbackSuspectReports = new Map();

export function getFallbackStore() {
  return {
    complaints: global._fallbackComplaints!,
    users: global._fallbackUsers!,
    sessions: global._fallbackSessions!,
    suspectReports: global._fallbackSuspectReports!,
  };
}

try {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} catch (e) {
  console.warn("MongoDB client initialization warning:", e);
}

export async function getDatabase(): Promise<Db | null> {
  try {
    if (!clientPromise) return null;
    const c = await clientPromise;
    const dbName = process.env.MONGODB_DB || "surakhsa";
    return c.db(dbName);
  } catch (err) {
    console.warn("MongoDB connection unavailable, using resilient fallback store:", (err as Error).message);
    return null;
  }
}

export interface UserDoc {
  _id?: ObjectId;
  phone: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SessionDoc {
  _id?: ObjectId;
  token: string;
  phone: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ComplaintDoc {
  _id?: ObjectId;
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
  createdAt: Date;
  evidenceFiles?: Array<{
    name: string;
    size: number;
    sha256: string;
  }>;
}

export interface ComplaintDraftDoc {
  _id?: ObjectId;
  draftId: string;
  phone?: string;
  step: string;
  data: Record<string, any>;
  updatedAt: Date;
}

export interface SuspectCheckDoc {
  _id?: ObjectId;
  query: string;
  kind: string;
  verdict: "ok" | "warning" | "danger" | "unclear";
  reasons: string[];
  checkedAt: Date;
}

export interface SuspectReportDoc {
  _id?: ObjectId;
  ref: string;
  suspectValue: string;
  reason: string;
  phone?: string;
  createdAt: Date;
}

export interface SettingsDoc {
  _id?: ObjectId;
  key: string;
  value: any;
  updatedAt: Date;
}

export async function getCollections() {
  const db = await getDatabase();
  if (!db) return null;
  return {
    users: db.collection<UserDoc>("users"),
    sessions: db.collection<SessionDoc>("sessions"),
    complaints: db.collection<ComplaintDoc>("complaints"),
    complaintDrafts: db.collection<ComplaintDraftDoc>("complaint_drafts"),
    suspectChecks: db.collection<SuspectCheckDoc>("suspect_checks"),
    suspectReports: db.collection<SuspectReportDoc>("suspect_reports"),
    settings: db.collection<SettingsDoc>("settings"),
  };
}
