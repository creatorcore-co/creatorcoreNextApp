---
name: authentication
description: |
  Use this skill when implementing authentication flows between Bubble.io
  and Next.js, handling JWT tokens, or securing API endpoints.
---

# Authentication

This skill covers the JWT token exchange flow between Bubble.io and Next.js, how to secure API endpoints, and how to manage authentication state in interfaces.

## Overview

The authentication flow ensures that:
1. Bubble users can securely access Next.js API endpoints
2. Interfaces know whether the current user is authenticated
3. Protected operations require valid tokens

## Token Exchange Flow

```
┌─────────────┐     1. Generate JWT      ┌─────────────┐
│   Bubble    │ ──────────────────────── │   Browser   │
│   (Server)  │    (short-lived, 5min)   │             │
└─────────────┘                          └──────┬──────┘
                                                │
                                         2. Exchange Token
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  Next.js    │
                                         │ /api/auth/  │
                                         │ bubble-     │
                                         │ exchange    │
                                         └──────┬──────┘
                                                │
                                         3. Return Access Token
                                            (1 hour)
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │   Browser   │
                                         │ (stores     │
                                         │  token)     │
                                         └──────┬──────┘
                                                │
                                         4. API Calls with Token
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  Next.js    │
                                         │  API Routes │
                                         └─────────────┘
```

### Token Lifetimes

| Token Type | Lifetime | Purpose |
|------------|----------|---------|
| Bubble JWT | 5 minutes | Short-lived token for exchange only |
| Next.js Access Token | 1 hour (configurable) | Long-lived token for API calls |

## The Exchange Endpoint

### POST `/api/auth/bubble-exchange`

Located at: `src/app/api/auth/bubble-exchange/route.ts`

**Request:**
```typescript
POST /api/auth/bubble-exchange
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success):**
```typescript
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "bubbleUserId": "1234567890"
    }
  }
}
```

**Response (Error):**
```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token has expired"
  }
}
```

### How Bubble Calls the Exchange

In Bubble, the plugin connector calls this endpoint:

```javascript
// Bubble's implementation (simplified)
async function exchangeToken(bubbleJwt) {
  const response = await fetch('https://creatorcore-next-app.vercel.app/api/auth/bubble-exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: bubbleJwt })
  });

  const data = await response.json();

  if (data.success) {
    // Store token for later use
    localStorage.setItem('nextAccessToken', data.data.accessToken);
    return data.data;
  } else {
    throw new Error(data.error.message);
  }
}
```

## Bubble JWT Structure

The JWT token from Bubble must contain:

```typescript
interface BubbleJWTPayload {
  /** Subject (user ID) - Required */
  sub: string;

  /** User email - Optional */
  email?: string;

  /** Issued at timestamp */
  iat: number;

  /** Expiration timestamp */
  exp: number;

  /** Bubble app name - Optional */
  app?: string;

  /** Additional claims */
  [key: string]: unknown;
}
```

### Creating the JWT in Bubble

In Bubble's backend workflow:

```
1. Create a JWT using the JWT plugin or custom action
2. Set the secret to match JWT_SECRET in Next.js
3. Set expiration to 5 minutes (300 seconds)
4. Include the user's ID as the "sub" claim
5. Include the user's email as the "email" claim
```

## Server-Side Authentication

### Auth Utilities

Located at: `src/lib/auth.ts`

#### `verifyBubbleToken(token: string)`

Verifies a JWT token from Bubble:

```typescript
import { verifyBubbleToken } from '@/lib/auth';

try {
  const payload = await verifyBubbleToken(token);
  // payload.sub = user ID
  // payload.email = user email
} catch (error) {
  // Token invalid, expired, or wrong signature
}
```

#### `createAccessToken(userId, email, bubbleUserId)`

Creates a new Next.js access token:

```typescript
import { createAccessToken } from '@/lib/auth';

const accessToken = await createAccessToken(
  'user-uuid',
  'user@example.com',
  'bubble-user-id'
);
```

#### `verifyAccessToken(token: string)`

Verifies a Next.js access token:

```typescript
import { verifyAccessToken } from '@/lib/auth';

try {
  const payload = await verifyAccessToken(token);
  // payload.sub = user ID
  // payload.type = 'access'
} catch (error) {
  // Token invalid or expired
}
```

#### `authenticateRequest(request: Request)`

Middleware helper for API routes:

```typescript
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated) {
    return Response.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: auth.error } },
      { status: 401 }
    );
  }

  // auth.payload contains the verified token data
  const userId = auth.payload.sub;

  // Continue with protected logic...
}
```

### Creating a Protected API Route

```typescript
// src/app/api/protected/route.ts
import { authenticateRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify authentication
  const auth = await authenticateRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: auth.error }
      },
      { status: 401 }
    );
  }

  // Access user info from token
  const userId = auth.payload.sub;
  const email = auth.payload.email;

  // Fetch user-specific data
  const userData = await fetchUserData(userId);

  return NextResponse.json({
    success: true,
    data: userData
  });
}

// CORS headers for Bubble access
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

## Client-Side Authentication

### Checking Auth Status in Interfaces

The interface receives authentication status via `config.isAuthenticated`:

```typescript
export function MyComponent({ config, onEmit }: MyComponentProps) {
  const { isAuthenticated, services } = config;

  // Check via config
  if (!isAuthenticated) {
    return <LoginPrompt onLoginClick={() => onEmit('login-required', {})} />;
  }

  // Or check via services
  const handleProtectedAction = async () => {
    if (!services.isAuthenticated()) {
      onEmit('auth-required', { action: 'save-data' });
      return;
    }

    // Proceed with protected action
    await services.callNextApi('/api/protected');
  };

  return (
    <div>
      <button onClick={handleProtectedAction}>Save</button>
    </div>
  );
}
```

### Updating Auth State

Bubble updates the interface when authentication changes:

```javascript
// After successful token exchange
widget.update({ isAuthenticated: true });

// After logout
widget.update({ isAuthenticated: false });
```

### Getting the Access Token

Usually not needed directly (services handle it), but available:

```typescript
const token = services.getNextToken();
// Returns the token string or null
```

## Environment Configuration

### Required Environment Variables

```env
# JWT Secret - MUST match between Bubble and Next.js
# Use a random string of at least 32 characters
JWT_SECRET=your-secret-key-minimum-32-characters

# Token expiry in seconds (default: 3600 = 1 hour)
ACCESS_TOKEN_EXPIRY=3600
```

### Generating a Secure Secret

```bash
# Generate a random 32-character hex string
openssl rand -hex 32
```

Or in Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

## Security Best Practices

### 1. Keep JWT_SECRET Secure

- Never commit the secret to version control
- Use environment variables in all environments
- Rotate the secret periodically
- Use different secrets for development and production

### 2. Short Bubble Token Expiry

The Bubble JWT should be short-lived (5 minutes) because:
- It's only used once for exchange
- Reduces risk if intercepted
- Forces fresh exchange for each session

### 3. HTTPS Only

- Always use HTTPS in production
- Bubble sends tokens over network - must be encrypted
- Configure CORS appropriately

### 4. Validate All Tokens

- Always verify tokens server-side
- Check expiration
- Verify signature matches secret
- Validate required claims

### 5. Handle Token Expiration

```typescript
// In your interface
const handleApiCall = async () => {
  try {
    await services.callNextApi('/api/data');
  } catch (err) {
    if (err.message?.includes('401') || err.message?.includes('expired')) {
      // Token expired - request re-authentication
      onEmit('auth-expired', { action: 'retry-after-auth' });
    } else {
      onEmit('error', { message: err.message });
    }
  }
};
```

## Common Patterns

### Login Flow Trigger

```typescript
const handleLoginRequired = () => {
  onEmit('login-required', {
    reason: 'This action requires authentication',
    returnAction: 'complete-purchase'
  });
};

// Bubble listens for this event and shows login
```

### Auth State Persistence

Bubble handles token storage:

```javascript
// In Bubble's plugin code
const TOKEN_KEY = 'nextAccessToken';

function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
```

### Refresh on Auth Change

```typescript
// When auth state changes, reload data
useEffect(() => {
  if (isAuthenticated) {
    loadProtectedData();
  } else {
    clearProtectedData();
  }
}, [isAuthenticated]);
```

## Troubleshooting

### "Token has expired"

- Bubble token older than 5 minutes
- Solution: Generate a fresh token and retry exchange

### "Invalid token signature"

- JWT_SECRET mismatch between Bubble and Next.js
- Solution: Ensure secrets match exactly

### "Token missing subject (sub) claim"

- Bubble JWT doesn't include user ID
- Solution: Add `sub` claim when creating JWT in Bubble

### "Missing authorization token"

- Request to protected endpoint lacks Authorization header
- Solution: Ensure services.callNextApi includes Bearer token

### CORS Errors

- Browser blocking cross-origin request
- Solution: Add OPTIONS handler with CORS headers to API route

## Example: Complete Auth Integration

```typescript
// src/app/api/auth/bubble-exchange/route.ts
import { exchangeToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_TOKEN', message: 'Token is required' } },
        { status: 400 }
      );
    }

    const result = await exchangeToken(token);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token exchange failed';

    return NextResponse.json(
      { success: false, error: { code: 'EXCHANGE_FAILED', message } },
      { status: 401 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```
