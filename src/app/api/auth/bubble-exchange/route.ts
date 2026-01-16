import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken } from '@/lib/auth';
import type { TokenExchangeRequest, TokenExchangeResponse } from '@/widget/types';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bubble-App-Name',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Exchange a Bubble JWT for a Next.js access token
 *
 * POST /api/auth/bubble-exchange
 * Body: { token: string }
 *
 * Returns: { accessToken: string, expiresIn: number, user?: {...} }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<TokenExchangeResponse | { error: string; code: string }>> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bubble-App-Name',
  };

  try {
    // Parse request body
    let body: TokenExchangeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON body',
          code: 'INVALID_REQUEST',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate token is provided
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json(
        {
          error: 'Token is required',
          code: 'MISSING_TOKEN',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate token format (basic JWT structure check)
    const parts = body.token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        {
          error: 'Token must be a valid JWT',
          code: 'INVALID_TOKEN_FORMAT',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Exchange the token
    try {
      const result = await exchangeToken(body.token);

      return NextResponse.json(result, { status: 200, headers: corsHeaders });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token exchange failed';

      // Determine appropriate error code
      let code = 'TOKEN_EXCHANGE_FAILED';
      let status = 401;

      if (message.includes('expired')) {
        code = 'TOKEN_EXPIRED';
      } else if (message.includes('signature')) {
        code = 'INVALID_SIGNATURE';
      } else if (message.includes('JWT_SECRET')) {
        code = 'SERVER_CONFIG_ERROR';
        status = 500;
      }

      return NextResponse.json(
        {
          error: message,
          code,
        },
        { status, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Token exchange error:', error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
