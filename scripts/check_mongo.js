const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Load .env.local or .env
function loadEnv() {
  const envPath = fs.existsSync(".env.local") ? ".env.local" : ".env";
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  const dbName = env.MONGODB_DB || process.env.MONGODB_DB || "Saarthi";

  if (!uri) {
    console.error("No MONGODB_URI found in .env.local or .env");
    return;
  }

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas!");

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`Collections in database '${dbName}':`, collections.map(c => c.name));

    if (collections.some(c => c.name === "complaints")) {
      const count = await db.collection("complaints").countDocuments();
      console.log(`Total complaints stored: ${count}`);

      const recent = await db.collection("complaints").find().sort({ createdAt: -1 }).limit(5).toArray();
      console.log("\nRecent 5 complaints in MongoDB:");
      console.log(JSON.stringify(recent, null, 2));
    } else {
      console.log("No 'complaints' collection found yet in database:", dbName);
      
      // Let's also check other databases on this cluster
      const adminDb = client.db().admin();
      const dbs = await adminDb.listDatabases();
      console.log("All databases in this MongoDB cluster:", dbs.databases.map(d => d.name));
    }
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err.message);
  } finally {
    await client.close();
  }
}

main();
