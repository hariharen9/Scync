import { create } from 'zustand';
import { createShare, fetchUserShares, revokeShare, subscribeToUserShares, consumeShare } from '@scync/core';
import type { ShareDocument, ShareConfig, DecryptedShare } from '@scync/core';

interface ShareState {
  // State
  activeShares: ShareDocument[];
  isLoadingShares: boolean;
  
  // Sender Actions
  fetchActiveShares: (uid: string) => Promise<void>;
  createShare: (uid: string, config: ShareConfig) => Promise<string>;
  revokeShare: (shareId: string) => Promise<void>;
  subscribeToShares: (uid: string) => () => void;
  
  // Recipient Actions
  consumeShare: (shareId: string, keyFragment: string) => Promise<DecryptedShare>;
  
  // Internal
  setShares: (shares: ShareDocument[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useShareStore = create<ShareState>((set, get) => ({
  activeShares: [],
  isLoadingShares: false,
  
  fetchActiveShares: async (uid: string) => {
    set({ isLoadingShares: true });
    try {
      const shares = await fetchUserShares(uid);
      set({ activeShares: shares });
    } catch (error) {
      console.error('Failed to fetch shares:', error);
    } finally {
      set({ isLoadingShares: false });
    }
  },
  
  createShare: async (uid: string, config: ShareConfig) => {
    const url = await createShare(uid, config);
    // Refresh shares list
    await get().fetchActiveShares(uid);
    return url;
  },
  
  revokeShare: async (shareId: string) => {
    await revokeShare(shareId);
    // Remove from local state
    set(state => ({
      activeShares: state.activeShares.filter(s => s.id !== shareId)
    }));
  },
  
  subscribeToShares: (uid: string) => {
    return subscribeToUserShares(uid, (shares) => {
      set({ activeShares: shares });
    });
  },
  
  consumeShare: async (shareId: string, keyFragment: string) => {
    return await consumeShare(shareId, keyFragment);
  },
  
  setShares: (shares: ShareDocument[]) => set({ activeShares: shares }),
  setLoading: (loading: boolean) => set({ isLoadingShares: loading })
}));
