import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { LIFETIME_PRICE_ID } from '@/lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: Request) {
  try {
    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY || !LIFETIME_PRICE_ID) {
      throw new Error('Payment system configuration is incomplete');
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const { priceId = LIFETIME_PRICE_ID } = await req.json();

    // Validate price ID
    try {
      await stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error('Invalid price ID:', error);
      return NextResponse.json(
        { error: 'Invalid product configuration' },
        { status: 400 }
      );
    }
    
    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/canceled`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        productId: 'prod_RZJxcseac5ORXI',
        productName: 'Lifetime Access'
      },
      allow_promotion_codes: true,
      payment_intent_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      const status = error.statusCode || 500;
      const message = error.message || 'Payment processing failed';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    );
  }
} 