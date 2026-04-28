import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, deleteUser as firebaseDeleteUser } from 'firebase/auth';
import { auth, deleteUserAccountData } from '@scync/core';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  signIn: async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Failed to sign in", error);
      throw error;
    }
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null });
      // clear other stores manually from where signOut is called
    } catch (error) {
      console.error("Failed to sign out", error);
      throw error;
    }
  },
  deleteUserAccount: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    try {
      // 1. Delete all Firestore data
      await deleteUserAccountData(user.uid);

      // 2. Delete Auth profile
      await firebaseDeleteUser(user);
      
      set({ user: null });
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        // Re-authenticate and try again
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // User is re-authenticated, try deleting Auth profile again
        await firebaseDeleteUser(auth.currentUser!);
        set({ user: null });
      } else {
        console.error("Failed to delete account", error);
        throw error;
      }
    }
  }
}));
