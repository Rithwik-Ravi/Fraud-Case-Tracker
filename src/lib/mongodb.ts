import { MongoClient, Db, ObjectId } from "mongodb";

export const getMongoUri = () => process.env.MONGODB_URI || "";
export const getMongoDbName = () => process.env.MONGODB_DB || "Saarthi";

let activeClient: MongoClient | null = null;

declare global {
  var _mongoActiveClient: MongoClient | undefined;
  var _fallbackComplaints: Map<string, ComplaintDoc> | undefined;
  var _fallbackUsers: Map<string, UserDoc> | undefined;
  var _fallbackSessions: Map<string, SessionDoc> | undefined;
  var _fallbackSuspectReports: Map<string, SuspectReportDoc> | undefined;
}

// In-memory fallback for offline or cold-start environments
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

export async function getMongoClient(): Promise<MongoClient | null> {
  if (process.env.NODE_ENV === "development" && global._mongoActiveClient) {
    return global._mongoActiveClient;
  }
  if (activeClient) {
    return activeClient;
  }

  const uri = getMongoUri();
  if (!uri) {
    return null;
  }
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();

    if (process.env.NODE_ENV === "development") {
      global._mongoActiveClient = client;
    }
    activeClient = client;
    return activeClient;
  } catch (err) {
    console.warn("MongoDB connection attempt failed, continuing with resilient cache:", (err as Error).message);
    return null;
  }
}

export async function getDatabase(): Promise<Db | null> {
  try {
    const client = await getMongoClient();
    if (!client) return null;
    return client.db(getMongoDbName());
  } catch (err) {
    console.warn("MongoDB getDatabase error:", (err as Error).message);
    return null;
  }
}

export interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  idType: "Aadhaar Card" | "Voter ID" | "PAN Card" | "Driving License";
  idNumber: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  verifiedStatus: "DigiLocker Verified" | "Official Identity Record";
}

export const DEFAULT_MOCK_PROFILE: UserProfile = {
  fullName: "Rajesh Kumar Sharma",
  phone: "9600000598",
  email: "rajesh.sharma@gov-portal.demo.in",
  gender: "Male",
  dob: "1988-08-15",
  idType: "Aadhaar Card",
  idNumber: "XXXX-XXXX-4819",
  address: "Flat 402, Shanti Vihar, Sector 9, Rohini",
  district: "North West Delhi",
  state: "Delhi",
  pincode: "110085",
  verifiedStatus: "DigiLocker Verified",
};

export interface UserDoc {
  _id?: ObjectId;
  phone: string;
  createdAt: Date;
  lastLoginAt: Date;
  profile?: UserProfile;
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
