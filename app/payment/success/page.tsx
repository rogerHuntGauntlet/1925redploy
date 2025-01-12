'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function verifyPayment() {
      try {
        if (!sessionId) {
          setError('Invalid payment session. Please contact support if you believe this is a mistake.');
          return;
        }

        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Unable to verify your payment. Please check your payment confirmation email or contact support if you need assistance.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setError(error.message || 'We encountered an issue verifying your payment. Please check your payment confirmation email or contact our support team for assistance.');
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Verifying your payment...</h2>
          <p className="mt-2 text-gray-600">Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Verification Failed</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6">
            <Link
              href="/support"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-green-500">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Payment Successful!</h2>
        <p className="mt-2 text-gray-600">Thank you for your purchase. You now have lifetime access to OHF Partners.</p>
        <div className="mt-6">
          <Link
            href="/platform"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Platform
          </Link>
        </div>
      </div>
    </div>
  );
} 