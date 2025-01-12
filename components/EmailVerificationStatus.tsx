import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { toast } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';

interface EmailVerificationStatusProps {
  email: string;
  onVerified?: () => void;
}

export default function EmailVerificationStatus({ email, onVerified }: EmailVerificationStatusProps) {
  const [isResending, setIsResending] = useState(false);
  const { supabase, session } = useSupabase();
  const isVerified = session?.user?.email_confirmed_at;

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      toast.success('Verification email resent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  // Poll for verification status
  useState(() => {
    if (isVerified || !email) return;

    const checkVerification = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        onVerified?.();
      }
    };

    const interval = setInterval(checkVerification, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  });

  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-red-600">Email verification system is currently unavailable.</p>
      </div>
    }>
      <div className="space-y-4">
        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Verification status display is unavailable.</p>
          </div>
        }>
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Verify Your Email</h3>
            <p className="text-gray-600">
              We've sent a verification link to <strong>{email}</strong>
            </p>
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Verification actions are unavailable.</p>
          </div>
        }>
          <div className="flex flex-col items-center space-y-4">
            {/* Verification status and actions */}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
} 