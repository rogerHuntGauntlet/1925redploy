import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineState {
  // Pending actions that need to be synced
  pendingActions: {
    id: string;
    type: 'message' | 'reaction' | 'typing';
    data: any;
    timestamp: string;
    retryCount: number;
  }[];
  
  // Last known state before going offline
  lastKnownState: {
    messages: Record<string, any[]>;
    typingStatus: Record<string, boolean>;
    userStatuses: Record<string, string>;
    lastSyncTimestamp: string | null;
  };

  // Methods to manage offline state
  addPendingAction: (type: 'message' | 'reaction' | 'typing', data: any) => string;
  removePendingAction: (id: string) => void;
  updateLastKnownState: (key: keyof OfflineState['lastKnownState'], data: any) => void;
  clearSyncedActions: () => void;
  getPendingActionsForType: (type: 'message' | 'reaction' | 'typing') => any[];
  getLastKnownState: () => OfflineState['lastKnownState'];
  incrementRetryCount: (id: string) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      pendingActions: [],
      lastKnownState: {
        messages: {},
        typingStatus: {},
        userStatuses: {},
        lastSyncTimestamp: null,
      },

      addPendingAction: (type, data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          pendingActions: [
            ...state.pendingActions,
            {
              id,
              type,
              data,
              timestamp: new Date().toISOString(),
              retryCount: 0,
            },
          ],
        }));
        return id;
      },

      removePendingAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((action) => action.id !== id),
        }));
      },

      updateLastKnownState: (key, data) => {
        set((state) => ({
          lastKnownState: {
            ...state.lastKnownState,
            [key]: data,
            lastSyncTimestamp: new Date().toISOString(),
          },
        }));
      },

      clearSyncedActions: () => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((action) => action.retryCount === 0),
        }));
      },

      getPendingActionsForType: (type) => {
        return get().pendingActions.filter((action) => action.type === type);
      },

      getLastKnownState: () => {
        return get().lastKnownState;
      },

      incrementRetryCount: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.map((action) =>
            action.id === id
              ? { ...action, retryCount: action.retryCount + 1 }
              : action
          ),
        }));
      },
    }),
    {
      name: 'offline-store',
      version: 1,
    }
  )
); 