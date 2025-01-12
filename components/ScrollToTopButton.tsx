import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <ErrorBoundary fallback={
      <div className="fixed bottom-8 right-8">
        <p className="text-red-600">Scroll button is unavailable.</p>
      </div>
    }>
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </ErrorBoundary>
  );
}
