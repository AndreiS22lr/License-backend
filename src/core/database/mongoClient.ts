import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb+srv://replace-with-username:replace-with-password@test-cluster-connection.r57kqfb.mongodb.net/?retryWrites=true&w=majority&appName=test-cluster-connection";
const databasebName = process.env.DATABASE_NAME || "project-database";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(databasebName);
  console.log("✅ Connected to MongoDB");
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectToMongo() first.");
  }
  return db;
}
