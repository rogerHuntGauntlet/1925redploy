import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { toast } from 'react-hot-toast';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import EmailVerificationStatus from './EmailVerificationStatus';
import ErrorBoundary from './ErrorBoundary';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const { supabase } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check password strength first
      const requirements = [
        password.length >= 8,
        /\d/.test(password),
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password),
      ];

      const strengthPercentage = (requirements.filter(Boolean).length / requirements.length) * 100;
      if (strengthPercentage < 60) {
        throw new Error('Password must include at least 3 of the following: lowercase letters, uppercase letters, numbers, and special characters (!@#$%^&*(),.?":{}|<>)');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setShowVerification(true);
      toast.success('Sign up successful! Please check your email to verify your account. If you don\'t see it, check your spam folder.');
    } catch (error: any) {
      toast.error(error.message || 'Unable to complete sign up. Please ensure your email is valid and try again. If the problem persists, try a different email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerified = () => {
    toast.success('Email verified! You can now sign in.');
    // Optionally redirect to sign in page
  };

  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-red-600">Unable to load sign up form. Please refresh the page.</p>
      </div>
    }>
      <div className="w-full max-w-md mx-auto">
        <ErrorBoundary fallback={
          <div className="p-4">
            <p className="text-yellow-600">Authentication form is currently unavailable.</p>
          </div>
        }>
          <form onSubmit={handleSubmit} className="space-y-6">
            {showVerification ? (
              <EmailVerificationStatus 
                email={email} 
                onVerified={handleVerified}
              />
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <PasswordStrengthIndicator 
                    password={password} 
                    className="mt-2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </button>
              </>
            )}
          </form>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="mt-4 p-4">
            <p className="text-yellow-600">Social sign-in options are currently unavailable.</p>
          </div>
        }>
          <div className="mt-6">
            {/* Social sign-in buttons */}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
} 