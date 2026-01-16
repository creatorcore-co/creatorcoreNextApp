import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { BubbleJWTPayload, TokenExchangeResponse } from '@/widget/types';

/**
 * Get the JWT secret as a Uint8Array for jose library
 */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify a JWT token from Bubble
 * @param token - The JWT token to verify
 * @returns The decoded payload
 */
export async function verifyBubbleToken(token: string): Promise<BubbleJWTPayload> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Validate required fields
    if (!payload.sub) {
      throw new Error('Token missing subject (sub) claim');
    }

    return payload as unknown as BubbleJWTPayload;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with more context
      if (error.message.includes('expired')) {
        throw new Error('Token has expired');
      }
      if (error.message.includes('signature')) {
        throw new Error('Invalid token signature');
      }
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Create an access token for the Next.js API
 * @param userId - The user ID to include in the token
 * @param email - The user's email (optional)
 * @param bubbleUserId - The original Bubble user ID
 * @returns The signed JWT token
 */
export async function createAccessToken(
  userId: string,
  email?: string,
  bubbleUserId?: string
): Promise<string> {
  const secret = getSecret();
  const expiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '3600', 10);

  const token = await new SignJWT({
    sub: userId,
    email,
    bubbleUserId,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  return token;
}

/**
 * Verify an access token from Next.js API requests
 * @param token - The access token to verify
 * @returns The decoded payload
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload & { type?: string }> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Verify this is an access token
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Access token verification failed: ${error.message}`);
    }
    throw new Error('Access token verification failed');
  }
}

/**
 * Exchange a Bubble token for a Next.js access token
 * This is the main function called by the API route
 */
export async function exchangeToken(bubbleToken: string): Promise<TokenExchangeResponse> {
  // Verify the Bubble token
  const bubblePayload = await verifyBubbleToken(bubbleToken);

  // Extract user information
  const bubbleUserId = bubblePayload.sub;
  const email = bubblePayload.email;

  // In a real application, you might want to:
  // 1. Look up or create a user in your database
  // 2. Store the mapping between Bubble user ID and your user ID
  // For now, we'll use the Bubble user ID directly
  const userId = bubbleUserId;

  // Create the access token
  const accessToken = await createAccessToken(userId, email, bubbleUserId);
  const expiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '3600', 10);

  return {
    accessToken,
    expiresIn,
    user: {
      id: userId,
      email: email || '',
      bubbleUserId,
    },
  };
}

/**
 * Extract the bearer token from an Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Middleware helper to verify authentication in API routes
 */
export async function authenticateRequest(
  request: Request
): Promise<{ authenticated: true; payload: JWTPayload } | { authenticated: false; error: string }> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return { authenticated: false, error: 'Missing authorization token' };
  }

  try {
    const payload = await verifyAccessToken(token);
    return { authenticated: true, payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return { authenticated: false, error: message };
  }
}
