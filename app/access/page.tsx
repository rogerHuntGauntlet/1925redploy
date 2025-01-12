'use client';

import TokenVerification from '@/components/TokenVerification';
import PaymentButton from '@/components/PaymentButton';
import RiddleChallenge from '@/components/RiddleChallenge';

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Get Access
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Option */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Option 1: Purchase Lifetime Access</h2>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Get lifetime access to all features with a one-time payment.
              </p>
              <PaymentButton className="w-full">
                Get Lifetime Access
              </PaymentButton>
            </div>
          </div>

          {/* Token Verification */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Option 2: Verify Token Ownership</h2>
            <TokenVerification />
          </div>

          {/* Riddle Challenge */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Option 3: Solve the Riddle</h2>
            <RiddleChallenge />
          </div>
        </div>
      </div>
    </div>
  );
} 