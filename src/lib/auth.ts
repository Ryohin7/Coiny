import { getAuth } from "./firebase/admin";

/**
 * Verifies a token. Currently supports Firebase ID Tokens.
 * If you are using LINE ID Tokens directly, you should use LINE's verification API.
 * 
 * @param req The incoming request
 * @returns The decoded token or null if invalid
 */
export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  
  // NOTE: If you are using liff.getIDToken(), this is a LINE ID Token.
  // To verify it, you should either:
  // 1. Use Firebase Auth Custom Tokens to sign in to Firebase and get a Firebase ID Token.
  // 2. Or verify the LINE ID Token via LINE's API: https://api.line.me/oauth2/v2.1/verify
  
  try {
    const auth = getAuth();
    if (!auth) {
      // If Firebase Admin is not initialized or credentials missing, 
      // we might be in a dev environment without full auth.
      // For now, return a mock user in development if needed, or fail.
      if (process.env.NODE_ENV === "development") {
        console.warn("Auth verification skipped in development");
        return { uid: req.headers.get("x-mock-user") || "mock-user", sub: "mock-user" };
      }
      return null;
    }
    
    // Attempt Firebase verification
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    // If Firebase verification fails, it might be a LINE token or invalid.
    // In a real production app, you'd handle LINE token verification here.
    console.error("Auth verification failed:", error);
    
    // MOCK for demonstration: if in dev, allow
    if (process.env.NODE_ENV === "development") {
        return { uid: "mock-user", sub: "mock-user" };
    }
    
    return null;
  }
}

/**
 * Validates that the userId matches the authenticated user.
 */
export async function validateUser(req: Request, userIdToMatch: string) {
  const decodedToken = await verifyAuth(req);
  if (!decodedToken) return false;
  
  return decodedToken.uid === userIdToMatch || decodedToken.sub === userIdToMatch;
}
