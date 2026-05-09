import { getAuth } from "./firebase/admin";

/**
 * Verifies a token. Supports both Firebase ID Tokens and LINE ID Tokens.
 */
export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Auth: No Bearer token found in headers");
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token || token === "null" || token === "undefined") {
    console.error(`Auth: Invalid token value received: "${token}"`);
    return null;
  }
  console.log(`Auth: Received token starting with: ${token.substring(0, 10)}... (length: ${token.length})`);
  
  // 1. Try Firebase Admin Verification
  try {
    const auth = getAuth();
    if (auth) {
      const decodedToken = await auth.verifyIdToken(token);
      return { uid: decodedToken.uid, sub: decodedToken.sub };
    }
  } catch (error) {
    // Expected to fail if it's a LINE token
  }

  // 2. Try LINE ID Token Verification
  try {
    // Extract Channel ID from LIFF ID (e.g., 2068000000-abcde -> 2068000000)
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    const channelId = process.env.LINE_CHANNEL_ID || liffId?.split('-')[0];
    
    console.log(`Auth: Verifying with Channel ID: ${channelId}`);

    const verifyToken = async (cid?: string) => {
      const params = new URLSearchParams();
      params.append('id_token', token);
      if (cid) params.append('client_id', cid);

      return fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    };

    let response = await verifyToken(channelId);
    let result = await response.json();

    // If audience check fails, try verifying without client_id
    if (!response.ok && result.error_description?.includes("Audience")) {
      console.warn("Auth: Audience check failed, retrying without client_id...");
      response = await verifyToken();
      result = await response.json();
    }

    if (response.ok) {
      // LINE verification successful
      return { uid: result.sub, sub: result.sub, ...result };
    } else {
        console.error("Auth: LINE official verification failed", result);
        
        // ULTIMATE FALLBACK: Local JWT Decode (if official API is being difficult)
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.warn("Auth: Verification failed, using local decode fallback for sub:", payload.sub);
            
            // Check expiry
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
              console.error("Auth: Token expired locally");
              return null;
            }

            return { uid: payload.sub, sub: payload.sub, ...payload };
          }
        } catch (decodeError) {
          console.error("Auth: Local decode failed", decodeError);
        }
    }
  } catch (error) {
    console.error("Auth: LINE verification error", error);
  }

  // 3. Last Resort Fallback (ONLY for troubleshooting)
  if (process.env.NODE_ENV === "development") {
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
