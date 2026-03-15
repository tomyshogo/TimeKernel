import * as admin from 'firebase-admin';

// Initialize with service account or default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const db = admin.firestore();
export { admin };
