'use client';

import { useState } from 'react';
import { getStripe } from '@/lib/stripe';
import { toast } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';

interface PaymentButtonProps {
  children: React.ReactNode;
  className?: string;
}

export default function PaymentButton({ children, className }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to load payment system');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      toast.error(
        error.message === 'Failed to load payment system'
          ? 'Payment system is temporarily unavailable. Please try again later.'
          : error.message === 'Unauthorized'
          ? 'Please sign in to continue with the payment.'
          : 'Payment failed. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">Payment system is currently unavailable.</p>
      </div>
    }>
      <div className="space-y-4">
        <ErrorBoundary fallback={
          <div className="p-2">
            <p className="text-yellow-600">Payment amount display is unavailable.</p>
          </div>
        }>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total Amount:</span>
            <span className="text-xl font-bold">${children}</span>
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-2">
            <p className="text-yellow-600">Payment button is unavailable.</p>
          </div>
        }>
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`${className} relative`}
          >
            {isLoading ? (
              <>
                <span className="opacity-0">{children}</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                </div>
              </>
            ) : (
              children
            )}
          </button>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
} 