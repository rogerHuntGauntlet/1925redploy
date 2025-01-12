import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const data = await req.json();

    // Store the event in Supabase
    const { error } = await supabase
      .from('wallet_events')
      .insert({
        event: data.event,
        wallet_type: data.walletType,
        wallet_address: data.walletAddress,
        token_balance: data.tokenBalance,
        error: data.error,
        timestamp: data.timestamp
      });

    if (error) {
      console.error('Error storing analytics:', error);
      return new NextResponse('Error storing analytics', { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return new NextResponse('Error processing analytics', { status: 500 });
  }
} 