import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment has not been completed' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session: userSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !userSession) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify the user matches the payment
    if (session.customer_email !== userSession.user.email) {
      return NextResponse.json(
        { error: 'Payment session does not match current user' },
        { status: 403 }
      );
    }

    // Update user's access in database
    const { error: updateError } = await supabase
      .from('user_access')
      .upsert({
        user_id: userSession.user.id,
        access_type: 'lifetime',
        payment_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating user access:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user access' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Payment verification error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      const status = error.statusCode || 500;
      const message = error.message || 'Payment verification failed';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 