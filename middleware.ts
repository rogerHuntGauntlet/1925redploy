import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PublicKey, Connection, ParsedAccountData } from '@solana/web3.js'
import { executeSolanaOperation } from '@/lib/solana'
import { tokenConfig } from '@/lib/token-config'
import { checkRateLimit, getRateLimitResponse, RateLimitConfig } from '@/lib/rate-limit'

// Pages that require payment/access
const PROTECTED_PAGES = [
  '/platform',
  '/chat',
  '/settings',
] as const

// Pages that are accessible without payment
const PUBLIC_PAGES = [
  '/',
  '/auth',
  '/legal',
  '/support',
  '/api/create-checkout-session',
  '/api/verify-riddle',
  '/payment/success',
  '/payment/canceled',
  '/access',
] as const

// Rate limit configurations for different endpoints
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'api/auth': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  'api/verify-riddle': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  'api/create-checkout-session': { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour
  'api/validate-token': { maxRequests: 20, windowMs: 60 * 1000 }, // 20 requests per minute
  'default': { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
}

interface TokenAccount {
  account: {
    data: ParsedAccountData & {
      parsed: {
        info: {
          tokenAmount: {
            uiAmount: number;
          };
        };
      };
    };
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check rate limits for API routes
  if (pathname.startsWith('/api/')) {
    // Find matching rate limit config
    const endpoint = Object.keys(RATE_LIMITS).find(key => pathname.includes(key))
    const rateLimitConfig = endpoint ? RATE_LIMITS[endpoint] : RATE_LIMITS.default

    // Check rate limit
    const { isLimited, info } = await checkRateLimit(request, rateLimitConfig)
    if (isLimited) {
      return getRateLimitResponse(info)
    }
  }

  // Allow public pages
  if (PUBLIC_PAGES.some(page => pathname.startsWith(page))) {
    return NextResponse.next()
  }

  // Check if page requires protection
  if (!PROTECTED_PAGES.some(page => pathname.startsWith(page))) {
    return NextResponse.next()
  }

  try {
    const walletAddress = request.headers.get('x-wallet-address')
    if (!walletAddress) {
      throw new Error('No wallet address provided')
    }

    const publicKey = new PublicKey(walletAddress)

    // Use the executeSolanaOperation helper
    const tokenAccounts = await executeSolanaOperation<{
      value: TokenAccount[];
    }>(async (connection: Connection) => {
      return await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: tokenConfig.mintAddress }
      )
    })

    // Check if user has required token balance
    const hasAccess = tokenAccounts.value.some(
      (account: TokenAccount) => {
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount
        return balance >= tokenConfig.requiredBalance
      }
    )

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/access', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.redirect(new URL('/access', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/public/).*)',
  ],
} 