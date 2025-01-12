import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { answer } = await req.json();

    // Get the stored riddle answer from user metadata
    const { data: metadata } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!metadata) {
      return new NextResponse('No riddle found', { status: 404 });
    }

    if (metadata.attempts_remaining <= 0) {
      return new NextResponse('No attempts remaining', { status: 403 });
    }

    // Update attempts remaining
    await supabase
      .from('user_metadata')
      .update({ attempts_remaining: metadata.attempts_remaining - 1 })
      .eq('user_id', session.user.id);

    // Check if the answer is correct (case insensitive)
    if (answer.toLowerCase() !== metadata.riddle_answer.toLowerCase()) {
      return NextResponse.json({ 
        correct: false, 
        attemptsRemaining: metadata.attempts_remaining - 1 
      });
    }

    // Create a coupon for 100% off
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      name: `Riddle Solver - ${session.user.email}`,
    });

    // Create a promotion code that uses this coupon
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `RIDDLE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      max_redemptions: 1,
      metadata: {
        userId: session.user.id,
        email: session.user.email
      }
    });

    // Clear the riddle from metadata
    await supabase
      .from('user_metadata')
      .delete()
      .eq('user_id', session.user.id);

    return NextResponse.json({ 
      correct: true, 
      promotionCode: promotionCode.code 
    });
  } catch (error) {
    console.error('Error verifying riddle:', error);
    return new NextResponse('Error verifying riddle', { status: 500 });
  }
} 