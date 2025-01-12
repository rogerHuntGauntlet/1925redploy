import { useEffect, useCallback } from 'react';
import { useOfflineStore } from '../stores/offlineStore';
import { useOnlineStatus } from './useOnlineStatus';
import { sendDirectMessage } from '../supabase';
import { toast } from 'react-hot-toast';

const MAX_SYNC_RETRIES = 3;

interface PendingAction {
  id: string;
  type: 'message';
  retryCount: number;
  data: {
    senderId: string;
    recipientId: string;
    content: string;
  };
}

export function useOfflineSync(userId: string) {
  const { isOnline } = useOnlineStatus();
  const {
    pendingActions,
    removePendingAction,
    incrementRetryCount,
    updateLastKnownState,
    clearSyncedActions
  } = useOfflineStore();

  const syncPendingMessages = useCallback(async () => {
    const messageActions = pendingActions.filter(
      (action: { id: string; type: 'message' | 'reaction' | 'typing'; data: any; timestamp: string; retryCount: number }) => 
        action.type === 'message' && action.retryCount < MAX_SYNC_RETRIES
    );

    if (messageActions.length === 0) return;

    console.log(`Syncing ${messageActions.length} pending messages...`);

    for (const action of messageActions) {
      try {
        await sendDirectMessage(
          action.data.senderId,
          action.data.recipientId,
          action.data.content
        );

        // Remove successfully synced action
        removePendingAction(action.id);
        console.log(`Successfully synced message ${action.id}`);
      } catch (error) {
        console.error(`Failed to sync message ${action.id}:`, error);
        incrementRetryCount(action.id);

        if (action.retryCount >= MAX_SYNC_RETRIES - 1) {
          toast.error('Some messages failed to send. Please try again later.');
        }
      }
    }
  }, [pendingActions, removePendingAction, incrementRetryCount]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingMessages();
    }
  }, [isOnline, syncPendingMessages]);

  // Periodically clean up synced actions
  useEffect(() => {
    const cleanup = setInterval(() => {
      clearSyncedActions();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanup);
  }, [clearSyncedActions]);

  // Update last known state before going offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isOnline) {
        updateLastKnownState('lastSyncTimestamp', new Date().toISOString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOnline, updateLastKnownState]);

  return {
    syncPendingMessages,
    pendingCount: pendingActions.length
  };
} 