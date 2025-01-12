import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 30000; // 30 seconds
const MAX_RETRIES = 10; // Maximum number of retry attempts
const BACKOFF_FACTOR = 1.5;

interface SubscriptionConfig {
  channel: string;
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
  callback: (payload: any) => void;
}

interface RealtimeError extends Error {
  code?: 'CHANNEL_ERROR' | 'SUBSCRIPTION_ERROR' | 'TIMEOUT_ERROR';
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'retrying';

export function useRealtimeSubscription(
  supabase: any,
  config: SubscriptionConfig,
  enabled: boolean = true
) {
  const channelRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const backoffTimeRef = useRef(INITIAL_BACKOFF);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastError, setLastError] = useState<Error | null>(null);

  const handleError = useCallback((error: RealtimeError, context: string) => {
    console.error(`Realtime error (${context}):`, error);
    setLastError(error);

    // Handle specific error types
    if ('code' in error) {
      switch (error.code) {
        case 'CHANNEL_ERROR':
          toast.error('Channel error: Please check your connection', {
            id: `channel-error-${config.channel}`
          });
          break;
        case 'SUBSCRIPTION_ERROR':
          toast.error('Subscription error: Unable to subscribe to updates', {
            id: `subscription-error-${config.channel}`
          });
          break;
        case 'TIMEOUT_ERROR':
          toast.error('Connection timeout: Attempting to reconnect...', {
            id: `timeout-error-${config.channel}`
          });
          break;
        default:
          toast.error(`Connection error: ${error.message}`, {
            id: `error-${config.channel}`
          });
      }
    } else {
      toast.error(`Connection error: ${error.message}`, {
        id: `error-${config.channel}`
      });
    }
  }, [config.channel]);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      setConnectionState('connecting');

      // Clean up existing channel if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create new channel
      channelRef.current = supabase
        .channel(config.channel)
        .on(
          'postgres_changes',
          {
            event: config.event,
            schema: config.schema,
            table: config.table,
            filter: config.filter
          },
          (payload: any) => {
            try {
              config.callback(payload);
            } catch (error) {
              handleError(error as RealtimeError, 'callback');
            }
          }
        )
        .subscribe((status: string, err?: Error) => {
          switch (status) {
            case 'SUBSCRIBED':
              console.log(`✅ Subscribed to ${config.channel}`);
              setConnectionState('connected');
              // Reset retry count and backoff on successful connection
              retryCountRef.current = 0;
              backoffTimeRef.current = INITIAL_BACKOFF;
              setLastError(null);
              break;
            case 'CLOSED':
              console.log(`❌ Disconnected from ${config.channel}`);
              setConnectionState('disconnected');
              handleReconnect();
              break;
            case 'CHANNEL_ERROR':
              console.error(`Error in channel ${config.channel}:`, err);
              setConnectionState('error');
              if (err) handleError(err, 'channel');
              handleReconnect();
              break;
            case 'TIMED_OUT':
              console.error(`Connection timeout for ${config.channel}`);
              setConnectionState('error');
              handleError(new Error('Connection timeout'), 'timeout');
              handleReconnect();
              break;
            default:
              console.log(`Channel status: ${status}`);
          }
        });
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setConnectionState('error');
      handleError(error as RealtimeError, 'setup');
      handleReconnect();
    }
  }, [supabase, config, enabled, handleError]);

  const handleReconnect = useCallback(() => {
    if (!enabled) return;

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Check if we've exceeded max retries
    if (retryCountRef.current >= MAX_RETRIES) {
      console.error(`Exceeded maximum retry attempts (${MAX_RETRIES}) for ${config.channel}`);
      setConnectionState('error');
      toast.error(
        'Unable to establish connection after multiple attempts. Please refresh the page.',
        { id: `max-retries-${config.channel}`, duration: 5000 }
      );
      return;
    }

    retryCountRef.current += 1;
    const delay = Math.min(
      backoffTimeRef.current * Math.pow(BACKOFF_FACTOR, retryCountRef.current - 1),
      MAX_BACKOFF
    );

    setConnectionState('retrying');
    console.log(`Attempting reconnection in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);

    if (retryCountRef.current === 1) {
      toast.error('Connection lost. Attempting to reconnect...', {
        duration: 3000,
        id: 'connection-lost'
      });
    }

    retryTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, enabled, config.channel]);

  // Initial connection
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Cleanup on unmount or when disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [supabase, connect, enabled]);

  // Handle browser visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, checking connection...');
        if (connectionState !== 'connected') {
          // Only reconnect if we're not already connected
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, enabled, connectionState]);

  // Handle online/offline events
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log('Browser went online, reconnecting...');
      connect();
      toast.success('Connection restored!', {
        duration: 3000,
        id: 'connection-restored'
      });
    };

    const handleOffline = () => {
      console.log('Browser went offline');
      setConnectionState('disconnected');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      toast.error('Connection lost. Waiting for network...', {
        duration: 3000,
        id: 'connection-lost'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [supabase, connect, enabled]);

  return {
    connectionState,
    lastError,
    retryCount: retryCountRef.current,
    channel: channelRef.current
  };
} 