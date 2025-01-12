import Link from 'next/link';

export default function PaymentCanceled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-gray-400">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Payment Canceled</h2>
        <p className="mt-2 text-gray-600">
          Your payment was not completed. If you experienced any issues, our support team is here to help.
        </p>
        <div className="mt-6 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </Link>
          <div>
            <Link
              href="/support"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 