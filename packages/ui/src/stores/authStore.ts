import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, deleteUser as firebaseDeleteUser, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, deleteUserAccountData } from '@scync/core';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Failed to sign in with Google", error);
      throw error;
    }
  },
  signInWithEmail: async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error) {
      console.error("Failed to sign in with email/password", error);
      throw error;
    }
  },
  registerWithEmail: async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error) {
      console.error("Failed to create email/password account", error);
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

// Map Firebase Auth error codes to honest, human-friendly messages.
export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Switch to "Sign in", or create the account with a different (possibly made-up) email.';
    case 'auth/user-not-found':
      return 'No account exists for that email. Use "Create account" instead — or check you typed it exactly as before.';
    case 'auth/wrong-password':
      return 'Incorrect password. Remember: nobody can reset this for you — it is the password you chose at sign-up.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. If you made these up, they are unrecoverable — try the exact values you chose.';
    case 'auth/invalid-email':
      return 'That email address is not valid — it just needs to look like name@domain (a made-up address is fine).';
    case 'auth/weak-password':
      return 'Password is too weak — use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts — wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with that email but a different sign-in method. Sign in with the original method instead.';
    default:
      return (error as { message?: string })?.message || 'Something went wrong. Please try again.';
  }
}
