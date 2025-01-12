import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_ATTEMPTS = 5
const WINDOW_TIME = 15 * 60 * 1000 // 15 minutes in milliseconds

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get current timestamp
    const now = new Date().getTime()
    const windowStart = now - WINDOW_TIME

    // Check existing attempts
    const { data: attempts, error } = await supabase
      .from('auth_attempts')
      .select('created_at')
      .eq('email', email)
      .gte('created_at', new Date(windowStart).toISOString())

    if (error) {
      console.error('Error checking rate limit:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // If too many attempts, block the request
    if (attempts && attempts.length >= MAX_ATTEMPTS) {
      return NextResponse.json({
        error: 'Too many attempts. Please try again later.',
        remainingTime: WINDOW_TIME - (now - new Date(attempts[0].created_at).getTime())
      }, { status: 429 })
    }

    // Record this attempt
    const { error: insertError } = await supabase
      .from('auth_attempts')
      .insert([{ email, created_at: new Date().toISOString() }])

    if (insertError) {
      console.error('Error recording attempt:', insertError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      attemptsRemaining: MAX_ATTEMPTS - (attempts?.length || 0) - 1
    })
  } catch (error) {
    console.error('Rate limit check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 