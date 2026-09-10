import { MongoClient } from "mongodb";

let storageCollection = null;
let resourceCollection = null;

export async function connectMongo() {
  if (!process.env.MONGODB_URI) return null;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const database = client.db(process.env.MONGODB_DB_NAME || "loom_plm");
  storageCollection = database.collection("storage");
  await storageCollection.createIndex({ key: 1, shared: 1 }, { unique: true });

  resourceCollection = database.collection("resources");
  const existingIndexes = await resourceCollection.listIndexes().toArray();

  for (const index of existingIndexes) {
    if (index.name === "_id_") continue;
    try {
      await resourceCollection.dropIndex(index.name);
    } catch (e) {
      // Ignore indexes that are already gone or cannot be dropped.
    }
  }

  await resourceCollection.createIndex({ resource: 1, id: 1 });
  return storageCollection;
}

export function getStorageCollection() {
  return storageCollection;
}

export function getResourceCollection() {
  return resourceCollection;
}