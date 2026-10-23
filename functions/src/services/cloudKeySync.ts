import admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Initialize firebase-admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    // In local environments or if already initialized
  }
}

let cachedDb: Firestore | null = null;

function getDb(): Firestore {
  if (!cachedDb) {
    try {
      // Connect to the user's created Firestore database: novotionsalesandlead
      cachedDb = getFirestore('novotionsalesandlead');
      console.log(`[CloudKeySync] Connected to Firestore database: novotionsalesandlead`);
    } catch (_) {
      try {
        cachedDb = getFirestore();
      } catch (err) {
        cachedDb = admin.firestore();
      }
    }
  }
  return cachedDb;
}

export interface CloudKeyData {
  key: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CORE_SEEDS: CloudKeyData[] = [
  { key: 'ShubhamNovotion2027', role: 'LEAD_TEAM', isActive: true },
  { key: 'Nehabhoyar2027', role: 'LEAD_TEAM', isActive: true },
  { key: 'Prajaktanovotion2027', role: 'LEAD_TEAM', isActive: true },
  { key: 'SALES_KEY_2026', role: 'SALES_TEAM', isActive: true },
  { key: 'LEAD_KEY_2026', role: 'LEAD_TEAM', isActive: true },
  { key: 'MICHAEL_SALES_2026', role: 'SALES_TEAM', isActive: true },
  { key: 'SARAH_SALES_2026', role: 'SALES_TEAM', isActive: true },
];

/**
 * Save / Update an access key in Firestore cloud collection.
 */
export async function syncKeyToCloud(keyData: CloudKeyData): Promise<boolean> {
  try {
    const db = getDb();
    await db.collection('access_keys').doc(keyData.key).set({
      key: keyData.key,
      role: keyData.role,
      isActive: keyData.isActive,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[CloudKeySync] Successfully synced key '${keyData.key}' to Cloud Firestore`);
    return true;
  } catch (err: any) {
    console.warn(`[CloudKeySync] Firestore sync skipped: ${err.message}`);
    return false;
  }
}

/**
 * Delete an access key from Firestore cloud collection.
 */
export async function deleteKeyFromCloud(key: string): Promise<boolean> {
  try {
    const db = getDb();
    await db.collection('access_keys').doc(key).delete();
    console.log(`[CloudKeySync] Deleted key '${key}' from Cloud Firestore`);
    return true;
  } catch (err: any) {
    console.warn(`[CloudKeySync] Firestore delete skipped: ${err.message}`);
    return false;
  }
}

/**
 * Fetch a single access key from Firestore cloud collection by key string.
 */
export async function fetchKeyFromCloud(key: string): Promise<CloudKeyData | null> {
  try {
    const db = getDb();
    const cleanKey = key.trim();

    // 1. Try exact document ID
    const doc = await db.collection('access_keys').doc(cleanKey).get();
    if (doc.exists) {
      return doc.data() as CloudKeyData;
    }

    // 2. Try case-insensitive lookup across collection
    const snap = await db.collection('access_keys').get();
    for (const d of snap.docs) {
      const data = d.data() as CloudKeyData;
      if (data.key && data.key.trim().toLowerCase() === cleanKey.toLowerCase()) {
        return data;
      }
    }
  } catch (err: any) {
    console.warn(`[CloudKeySync] Firestore fetch error: ${err.message}`);
  }
  return null;
}

/**
 * Fetch all access keys from Firestore cloud collection.
 */
export async function fetchAllKeysFromCloud(): Promise<CloudKeyData[]> {
  try {
    const db = getDb();
    const snap = await db.collection('access_keys').get();
    const list = snap.docs.map(doc => doc.data() as CloudKeyData);

    // If Firestore collection is empty, automatically seed with core keys
    if (list.length === 0) {
      console.log(`[CloudKeySync] Auto-seeding core keys to newly created Firestore database...`);
      for (const item of CORE_SEEDS) {
        await syncKeyToCloud(item);
        list.push(item);
      }
    }
    return list;
  } catch (err: any) {
    console.warn(`[CloudKeySync] Fetch all keys failed: ${err.message}`);
    return [];
  }
}
