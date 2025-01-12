'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, CircleCheck, AlertCircle, LogOut, RefreshCw, SwitchCamera } from 'lucide-react';
import { trackWalletEvent } from '@/lib/analytics';
import ErrorBoundary from './ErrorBoundary';

type WalletType = 'phantom' | 'solflare' | null;

type WalletEvent = 'wallet_connect' | 'wallet_disconnect' | 'wallet_switch' | 'token_verify_attempt' | 'token_verify_success' | 'token_verify_error';

export default function TokenVerification() {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletType[]>([]);
  const router = useRouter();

  // Effect to check available wallets and auto-connect
  useEffect(() => {
    checkAvailableWallets();
    autoConnectWallet();
  }, []);

  // Function to check available wallets
  const checkAvailableWallets = () => {
    const wallets: WalletType[] = [];
    const { solana } = window as any;
    
    if (solana?.isPhantom) wallets.push('phantom');
    if (solana?.isSolflare) wallets.push('solflare');
    
    setAvailableWallets(wallets);
  };

  // Function to auto-connect wallet
  const autoConnectWallet = async () => {
    const provider = getWalletProvider();
    if (provider?.isConnected) {
      try {
        const response = await provider.connect({ onlyIfTrusted: true });
        setWalletAddress(response.publicKey.toString());
        setWalletType(provider.isPhantom ? 'phantom' : 'solflare');
        await checkTokenBalance(response.publicKey.toString());
      } catch (error) {
        console.error('Auto-connect error:', error);
      }
    }
  };

  // Function to get the appropriate wallet provider
  const getWalletProvider = () => {
    const { solana } = window as any;
    return solana;
  };

  // Function to check token balance
  const checkTokenBalance = async (address: string) => {
    try {
      await trackWalletEvent('balance_check', { walletAddress: address });
      
      const response = await fetch('/api/validate-token/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();
      if (response.ok) {
        setTokenBalance(data.balance);
        await trackWalletEvent('balance_check', { 
          walletAddress: address,
          tokenBalance: data.balance 
        });
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = async () => {
    try {
      const provider = getWalletProvider();
      if (provider) {
        await provider.disconnect();
        await trackWalletEvent('wallet_disconnect', {
          walletType,
          walletAddress
        });
        setWalletAddress('');
        setWalletType(null);
        setSuccess(false);
        setTokenBalance(null);
        // Remove the wallet cookie
        await fetch('/api/validate-token/disconnect', { method: 'POST' });
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Function to switch wallet
  const switchWallet = async (newType: WalletType) => {
    if (walletType === newType) return;
    await trackWalletEvent('wallet_switch', {
      walletType,
      walletAddress,
      tokenBalance: tokenBalance ?? undefined
    });
    await disconnectWallet();
    await connectWallet(newType);
  };

  // Function to connect wallet
  const connectWallet = async (type: WalletType) => {
    try {
      setIsLoading(true);
      setError('');

      await trackWalletEvent('wallet_connect_attempt', { walletType: type });

      const provider = getWalletProvider();
      
      if (!provider) {
        const walletUrl = type === 'phantom' 
          ? 'https://phantom.app/' 
          : 'https://solflare.com/';
        
        const errorMsg = `Please install ${type === 'phantom' ? 'Phantom' : 'Solflare'} wallet to continue`;
        setError(errorMsg);
        await trackWalletEvent('wallet_connect_error', { 
          walletType: type,
          error: errorMsg 
        });
        window.open(walletUrl, '_blank');
        return;
      }

      // Connect to wallet
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      setWalletType(type);
      
      await trackWalletEvent('wallet_connect_success', { 
        walletType: type,
        walletAddress: address 
      });
      
      // Check balance and verify
      await checkTokenBalance(address);
      await verifyToken(address);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      const errorMsg = error.message || 'Failed to connect wallet. Please try again.';
      setError(errorMsg);
      await trackWalletEvent('wallet_connect_error', { 
        walletType: type,
        error: errorMsg 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify token ownership
  const verifyToken = async (address: string) => {
    try {
      setIsLoading(true);
      setError('');

      await trackWalletEvent('token_verify_attempt', {
        walletType,
        walletAddress: address
      });

      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || 'Token verification failed. Please ensure you have the required token balance and try again.';
        throw new Error(errorMsg);
      }

      if (data.success) {
        setSuccess(true);
        await trackWalletEvent('token_verify_success', {
          walletType,
          walletAddress: address,
          tokenBalance: tokenBalance ?? undefined
        });
        // Refresh and redirect after a short delay
        setTimeout(() => {
          router.refresh();
          router.push('/platform');
        }, 1500);
      } else {
        const errorMsg = data.message || 'Insufficient token balance. Please ensure you have the required amount of tokens in your wallet.';
        setError(errorMsg);
        await trackWalletEvent('token_verify_error', {
          walletType,
          walletAddress: address,
          error: errorMsg
        });
      }
    } catch (error: any) {
      console.error('Error verifying token:', error);
      const errorMsg = error.message || 'Unable to verify token. Please check your wallet connection and try again. If the problem persists, ensure you have the correct token in your wallet.';
      setError(errorMsg);
      await trackWalletEvent('token_verify_error', {
        walletType,
        walletAddress: address,
        error: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-red-600">Token verification system is currently unavailable.</p>
      </div>
    }>
      <div className="max-w-md mx-auto">
        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Verification status display is unavailable.</p>
          </div>
        }>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Token Verification</h2>
            <div className="bg-gray-100 p-4 rounded">
              {/* Verification status */}
            </div>
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Verification form is unavailable.</p>
          </div>
        }>
          <div className="space-y-4">
            {/* Verification actions */}
            {!walletAddress && (
              <div className="flex flex-col gap-2">
                {availableWallets.map((type) => (
                  <button
                    key={type}
                    onClick={() => connectWallet(type)}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    Connect {type === 'phantom' ? 'Phantom' : 'Solflare'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
} 