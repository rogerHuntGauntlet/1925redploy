import { PublicKey } from '@solana/web3.js';

export const tokenConfig = {
  mintAddress: new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS!),
  requiredBalance: Number(process.env.NEXT_PUBLIC_TOKEN_REQUIRED_BALANCE || 1000),
  decimals: Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || 9),
  symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'SOL',
};

export function hasRequiredBalance(balance: number): boolean {
  return balance >= tokenConfig.requiredBalance;
}

export function formatTokenAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: tokenConfig.decimals,
  });
}

export function getRequiredBalanceFormatted(): string {
  return formatTokenAmount(tokenConfig.requiredBalance);
} 