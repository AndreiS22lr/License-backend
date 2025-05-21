import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb+srv://andreistrava:651Rp5nx5vlipFWI@licenta-cluster.icbxa5c.mongodb.net/?retryWrites=true&w=majority&appName=licenta-cluster";
const databasebName = process.env.DB_NAME || "licenta_database";

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
