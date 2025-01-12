import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import { executeSolanaOperation } from '@/lib/solana';
import { 
  tokenConfig, 
  hasRequiredBalance, 
  formatTokenAmount, 
  getRequiredBalanceFormatted 
} from '@/lib/token-config';

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const publicKey = new PublicKey(walletAddress);

    // Use the new executeSolanaOperation helper for automatic fallback
    const tokenAccounts = await executeSolanaOperation(async (connection) => {
      return connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint: tokenConfig.mintAddress }
      );
    });

    const rawBalance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
    const formattedBalance = formatTokenAmount(rawBalance);
    const hasAccess = hasRequiredBalance(rawBalance);

    return NextResponse.json({
      balance: formattedBalance,
      requiredBalance: getRequiredBalanceFormatted(),
      hasAccess,
      symbol: tokenConfig.symbol
    });
  } catch (error: any) {
    console.error('Token balance check error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check token balance',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
} 