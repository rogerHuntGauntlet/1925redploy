type WalletEvent = 
  | 'wallet_connect_attempt'
  | 'wallet_connect_success'
  | 'wallet_connect_error'
  | 'wallet_disconnect'
  | 'token_verify_attempt'
  | 'token_verify_success'
  | 'token_verify_error'
  | 'wallet_switch'
  | 'balance_check';

type WalletEventData = {
  walletType?: 'phantom' | 'solflare';
  walletAddress?: string;
  tokenBalance?: number;
  error?: string;
};

// Helper function to convert WalletType to event data type
function convertWalletType(type: 'phantom' | 'solflare' | null): WalletEventData['walletType'] {
  return type === null ? undefined : type;
}

export async function trackWalletEvent(
  event: WalletEvent,
  data?: Omit<WalletEventData, 'walletType'> & { walletType?: 'phantom' | 'solflare' | null }
) {
  try {
    // Convert the wallet type if present
    const eventData: WalletEventData = {
      ...data,
      walletType: data?.walletType ? convertWalletType(data.walletType) : undefined
    };

    // Send event to your analytics endpoint
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...eventData,
        // Remove sensitive parts of the address if present
        walletAddress: eventData.walletAddress 
          ? `${eventData.walletAddress.slice(0, 4)}...${eventData.walletAddress.slice(-4)}`
          : undefined,
      }),
    });
  } catch (error) {
    // Fail silently in production, log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics error:', error);
    }
  }
} 