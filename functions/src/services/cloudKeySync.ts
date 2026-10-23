import admin from 'firebase-admin';

// Initialize firebase-admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    // In local environments or if already initialized
  }
}

export interface CloudKeyData {
  key: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Save / Update an access key in Firestore cloud collection.
 * Gracefully ignores if Firestore is not yet activated on the GCP project.
 */
export async function syncKeyToCloud(keyData: CloudKeyData): Promise<boolean> {
  try {
    const db = admin.firestore();
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
    const db = admin.firestore();
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
    const db = admin.firestore();
    // Try exact key first
    const doc = await db.collection('access_keys').doc(key).get();
    if (doc.exists) {
      return doc.data() as CloudKeyData;
    }

    // Try case-insensitive lookup
    const snap = await db.collection('access_keys').get();
    for (const d of snap.docs) {
      const data = d.data() as CloudKeyData;
      if (data.key && data.key.toLowerCase() === key.toLowerCase()) {
        return data;
      }
    }
  } catch (err: any) {
    // Firestore not enabled or offline
  }
  return null;
}

/**
 * Fetch all access keys from Firestore cloud collection.
 */
export async function fetchAllKeysFromCloud(): Promise<CloudKeyData[]> {
  try {
    const db = admin.firestore();
    const snap = await db.collection('access_keys').get();
    return snap.docs.map(doc => doc.data() as CloudKeyData);
  } catch (err: any) {
    return [];
  }
}
