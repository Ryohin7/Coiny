import { getAuth } from "./firebase/admin";

/**
 * Verifies a token. Supports both Firebase ID Tokens and LINE ID Tokens.
 * 
 * @param req The incoming request
 * @returns The decoded token (uid/sub) or null if invalid
 */
export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  
  // 1. Try Firebase Admin Verification first (in case they integrated Firebase Auth)
  try {
    const auth = getAuth();
    if (auth) {
      const decodedToken = await auth.verifyIdToken(token);
      return { uid: decodedToken.uid, sub: decodedToken.sub };
    }
  } catch (error) {
    // If Firebase fails, it might be a LINE ID Token
    console.log("Firebase verification failed, trying LINE verification...");
  }

  // 2. Try LINE ID Token Verification
  try {
    const channelId = process.env.LINE_CHANNEL_ID || process.env.NEXT_PUBLIC_LIFF_ID?.split('-')[0]; 
    // Usually LIFF ID format is channelId-suffix
    
    const params = new URLSearchParams();
    params.append('id_token', token);
    if (channelId) {
        params.append('client_id', channelId);
    }

    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (response.ok) {
      const result = await response.json();
      // LINE ID Token verification result contains 'sub' which is the userId
      return { uid: result.sub, sub: result.sub, ...result };
    } else {
        const errorData = await response.json();
        console.error("LINE verification failed:", errorData);
    }
  } catch (error) {
    console.error("LINE verification error:", error);
  }

  // 3. Development Fallback
  if (process.env.NODE_ENV === "development") {
    console.warn("Auth verification failed, using development fallback");
    return { uid: "mock-user", sub: "mock-user" };
  }

  return null;
}

/**
 * Validates that the userId matches the authenticated user.
 */
export async function validateUser(req: Request, userIdToMatch: string) {
  const decodedToken = await verifyAuth(req);
  if (!decodedToken) return false;
  
  return decodedToken.uid === userIdToMatch || decodedToken.sub === userIdToMatch;
}
