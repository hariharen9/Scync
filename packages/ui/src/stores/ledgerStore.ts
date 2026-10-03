import { create } from 'zustand';
import type { LedgerEntry } from '@scync/core';
import { subscribeToLedger, logLedgerEvent } from '@scync/core';

interface LedgerState {
  entries: LedgerEntry[];
  isLoading: boolean;
  setEntries: (entries: LedgerEntry[]) => void;
  logEvent: (uid: string, entry: Omit<LedgerEntry, 'id' | 'timestamp'>) => Promise<void>;
  subscribeToLedger: (uid: string) => () => void;
  reset: () => void;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  entries: [],
  isLoading: true,

  setEntries: (entries) => set({ entries, isLoading: false }),

  logEvent: async (uid, entry) => {
    await logLedgerEvent(uid, entry);
  },

  subscribeToLedger: (uid: string) => {
    set({ isLoading: true });
    return subscribeToLedger(uid, (entries) => {
      set({ entries, isLoading: false });
    });
  },

  reset: () => set({ entries: [], isLoading: false })
}));
