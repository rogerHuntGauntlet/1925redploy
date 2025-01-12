import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
  errorMessage?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  errorMessage: 'Too many requests, please try again later.',
};

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  total: number;
}

export async function checkRateLimit(
  req: Request | NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ isLimited: boolean; info: RateLimitInfo }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const supabase = createRouteHandlerClient({ cookies });

  // Get identifier (IP address, user ID, or custom identifier)
  let identifier = config.identifier;
  if (!identifier) {
    if (req instanceof Request) {
      identifier = req.headers.get('x-forwarded-for') || 'unknown';
    } else {
      // NextRequest
      identifier = (req as NextRequest).headers.get('x-forwarded-for') || (req as NextRequest).ip || 'unknown';
    }
  }

  const now = Date.now();
  const windowStart = now - finalConfig.windowMs;

  // Check existing requests
  const { data: attempts, error } = await supabase
    .from('rate_limits')
    .select('created_at')
    .eq('identifier', identifier)
    .gte('created_at', new Date(windowStart).toISOString());

  if (error) {
    console.error('Error checking rate limit:', error);
    return { isLimited: false, info: { remaining: 1, reset: now + finalConfig.windowMs, total: finalConfig.maxRequests } };
  }

  const requestCount = attempts?.length || 0;

  // Record this attempt
  if (requestCount < finalConfig.maxRequests) {
    await supabase
      .from('rate_limits')
      .insert([{
        identifier,
        created_at: new Date().toISOString(),
        endpoint: req instanceof Request ? new URL(req.url).pathname : (req as NextRequest).nextUrl.pathname
      }]);
  }

  return {
    isLimited: requestCount >= finalConfig.maxRequests,
    info: {
      remaining: Math.max(0, finalConfig.maxRequests - requestCount - 1),
      reset: attempts?.[0] ? new Date(attempts[0].created_at).getTime() + finalConfig.windowMs : now + finalConfig.windowMs,
      total: finalConfig.maxRequests
    }
  };
}

export function getRateLimitResponse(info: RateLimitInfo, message?: string): NextResponse {
  return NextResponse.json(
    {
      error: message || DEFAULT_CONFIG.errorMessage,
      retryAfter: Math.ceil((info.reset - Date.now()) / 1000)
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': info.total.toString(),
        'X-RateLimit-Remaining': info.remaining.toString(),
        'X-RateLimit-Reset': info.reset.toString(),
        'Retry-After': Math.ceil((info.reset - Date.now()) / 1000).toString()
      }
    }
  );
} 