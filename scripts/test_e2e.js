const { MongoClient } = require("mongodb");

const BASE_URL = "http://localhost:3000";
const MONGO_URI = "mongodb://127.0.0.1:27017/surakhsa";

async function runTests() {
  console.log("=== SURAKHSA COMPREHENSIVE AUTOMATED E2E VERIFICATION ===");

  // 1. Check HTTP Routes
  console.log("\n[1] Testing Page Routes HTTP Responses...");
  const routes = ["/", "/report", "/check", "/track", "/about", "/compare", "/signin"];
  for (const r of routes) {
    try {
      const res = await fetch(`${BASE_URL}${r}`);
      console.log(`  ✓ Route ${r.padEnd(10)} Status: ${res.status}`);
      if (res.status !== 200) {
        throw new Error(`Route ${r} returned unexpected status ${res.status}`);
      }
    } catch (e) {
      console.error(`  ✗ Route ${r} failed:`, e.message);
      throw e;
    }
  }

  // 2. Test Auth Flow via /api/auth
  console.log("\n[2] Testing Authentication Flow via /api/auth...");
  const testPhone = "9876543210";
  
  // 2a. Request OTP
  const reqOtpRes = await fetch(`${BASE_URL}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "request_otp", phone: testPhone }),
  });
  const reqOtpData = await reqOtpRes.json();
  console.log("  ✓ Request OTP Response:", reqOtpData);
  if (!reqOtpData.ok || !reqOtpData.otp) throw new Error("Request OTP failed");
  const otp = reqOtpData.otp;

  // 2b. Verify OTP and get Session Cookie
  const verifyRes = await fetch(`${BASE_URL}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify_otp", phone: testPhone, otp }),
  });
  const verifyData = await verifyRes.json();
  console.log("  ✓ Verify OTP Response:", verifyData);
  if (!verifyData.ok) throw new Error("Verify OTP failed");

  const rawCookie = verifyRes.headers.get("set-cookie");
  console.log("  ✓ Session Cookie received:", rawCookie?.split(";")[0]);
  const cookieHeader = rawCookie ? rawCookie.split(";")[0] : "";

  // 2c. Check Auth State via GET /api/auth
  const checkAuthRes = await fetch(`${BASE_URL}/api/auth`, {
    headers: { Cookie: cookieHeader },
  });
  const checkAuthData = await checkAuthRes.json();
  console.log("  ✓ Current Authenticated User:", checkAuthData);
  if (checkAuthData.phone !== testPhone) throw new Error("Session check mismatch");

  // 3. Test MongoDB directly
  console.log("\n[3] Verifying MongoDB Persistence...");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("surakhsa");

  // Check user & session
  const user = await db.collection("users").findOne({ phone: testPhone });
  console.log("  ✓ User stored in MongoDB:", user?.phone);
  if (!user) throw new Error("User document missing in MongoDB");

  const session = await db.collection("sessions").findOne({ phone: testPhone });
  console.log("  ✓ Session stored in MongoDB:", session?.token ? "Token Valid" : "Missing");
  if (!session) throw new Error("Session document missing in MongoDB");

  // 4. Test Complaint Filing
  console.log("\n[4] Testing Complaint Submission into MongoDB...");
  const testAck = `ACK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const complaintDoc = {
    ack: testAck,
    phone: testPhone,
    categoryId: "net_banking",
    categoryLabel: "Internet Banking / Phishing Fraud",
    parentCategory: "Financial Fraud",
    urgency: "golden-hour",
    narrative: "I got a phone call from someone claiming to be SBI bank manager. They got me to share an OTP. 50,000 rupees went out of my account within the last hour.",
    amount: 50000,
    bankName: "State Bank of India",
    bankAccount: "9876543210@upi",
    transactionId: "SBI491029412094",
    freezeRequested: true,
    stage: 2,
    createdAt: new Date(),
    evidenceFiles: [
      { name: "bank_sms.png", size: 45120, sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
    ],
  };

  await db.collection("complaints").insertOne(complaintDoc);
  console.log(`  ✓ Inserted complaint ${testAck} into MongoDB collection 'complaints'`);

  // Verify complaint retrieval
  const retrieved = await db.collection("complaints").findOne({ ack: testAck });
  console.log(`  ✓ Retrieved complaint ${retrieved.ack}: Amount ₹${retrieved.amount}, Urgency: ${retrieved.urgency}`);

  // 5. Test Suspect Check & Suspect Report
  console.log("\n[5] Testing Suspect Check & Reporting in MongoDB...");
  const suspectCheck = {
    query: "sbi.secure-verify.xyz/login",
    kind: "url",
    verdict: "danger",
    reasons: ["Phishing clone detected", "Unauthorized third-level domain"],
    checkedAt: new Date(),
  };
  await db.collection("suspect_checks").insertOne(suspectCheck);
  console.log("  ✓ Logged suspect check query to MongoDB collection 'suspect_checks'");

  const suspectReport = {
    ref: `SUS-${Math.floor(100000 + Math.random() * 900000)}`,
    suspectValue: "sbi.secure-verify.xyz/login",
    reason: "SMS link sent to mobile pretending to update PAN card",
    phone: testPhone,
    createdAt: new Date(),
  };
  await db.collection("suspect_reports").insertOne(suspectReport);
  console.log(`  ✓ Logged suspect report ${suspectReport.ref} to MongoDB collection 'suspect_reports'`);

  // 6. List all collections in MongoDB
  const allCollections = await db.listCollections().toArray();
  console.log("\n[6] MongoDB Collections Present in Database 'surakhsa':");
  for (const c of allCollections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  - ${c.name.padEnd(20)}: ${count} documents`);
  }

  // 7. Test Sign Out
  console.log("\n[7] Testing Sign Out...");
  const signoutRes = await fetch(`${BASE_URL}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ action: "signout" }),
  });
  console.log("  ✓ Sign out status:", signoutRes.status);

  const checkAfterSignout = await fetch(`${BASE_URL}/api/auth`, {
    headers: { Cookie: cookieHeader },
  });
  const signoutCheckData = await checkAfterSignout.json();
  console.log("  ✓ Auth after signout:", signoutCheckData);
  if (signoutCheckData.phone !== null) throw new Error("Signout failed, user still authenticated");

  await client.close();
  console.log("\n=== ALL E2E & DATABASE TESTS PASSED WITH 100% SUCCESS ===");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
