import { MongoClient } from "mongodb";

let storageCollection = null;

export async function connectMongo() {
  if (!process.env.MONGODB_URI) return null;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const database = client.db(process.env.MONGODB_DB_NAME || "loom_plm");
  storageCollection = database.collection("storage");
  await storageCollection.createIndex({ key: 1, shared: 1 }, { unique: true });
  return storageCollection;
}

export function getStorageCollection() {
  return storageCollection;
}