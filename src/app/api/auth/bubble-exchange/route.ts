import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken } from '@/lib/auth';
import type { TokenExchangeRequest, TokenExchangeResponse, ApiResponse } from '@/widget/types';

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
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<TokenExchangeResponse>>> {
  try {
    // Parse request body
    let body: TokenExchangeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON body',
          },
        },
        { status: 400 }
      );
    }

    // Validate token is provided
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Token is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate token format (basic JWT structure check)
    const parts = body.token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Token must be a valid JWT',
          },
        },
        { status: 400 }
      );
    }

    // Exchange the token
    try {
      const result = await exchangeToken(body.token);

      return NextResponse.json(
        {
          success: true,
          data: result,
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
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
          success: false,
          error: {
            code,
            message,
          },
        },
        { status }
      );
    }
  } catch (error) {
    console.error('Token exchange error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
