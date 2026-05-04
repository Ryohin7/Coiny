import * as admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Firebase Admin credentials missing in production!");
    }
    // Return a dummy app or handle missing credentials in a way that doesn't crash during build
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
    return null;
  }
}

export const getDb = () => {
  const app = getAdminApp();
  return app ? admin.firestore(app) : (null as unknown as admin.firestore.Firestore);
};

export const getAuth = () => {
  const app = getAdminApp();
  return app ? admin.auth(app) : (null as unknown as admin.auth.Auth);
};

// For backward compatibility with existing code
export const db = admin.apps.length > 0 ? admin.firestore() : (null as unknown as admin.firestore.Firestore);

