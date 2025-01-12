import { useState, useEffect } from 'react';
import { processQueue, getQueueCount } from '../messageQueue';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queueCount, setQueueCount] = useState<number>(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // If we just came online, process the queue
      if (online) {
        processQueue().catch(console.error);
      }
    };

    const updateQueueCount = () => {
      setQueueCount(getQueueCount());
    };

    // Set initial queue count
    updateQueueCount();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('storage', updateQueueCount);

    // Initial check
    updateOnlineStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('storage', updateQueueCount);
    };
  }, []);

  return { isOnline, queueCount };
} 