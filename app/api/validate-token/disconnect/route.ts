import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Remove the wallet_address cookie
    cookies().delete('wallet_address');

    return NextResponse.json({ 
      success: true,
      message: 'Wallet disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return new NextResponse('Error disconnecting wallet', { status: 500 });
  }
} 