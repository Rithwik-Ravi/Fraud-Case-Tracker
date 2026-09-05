import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/surakhsa";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

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

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  const c = await clientPromise;
  return c.db("surakhsa");
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
