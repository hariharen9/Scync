import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@scync/core';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { FiLock } from 'react-icons/fi';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [setUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-base">
        {/* Animated loader */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-5">
            <div className="h-12 w-12 rounded-xl gradient-bg accent-glow-sm flex items-center justify-center">
              <FiLock className="h-5 w-5 text-white" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-2xl border border-accent/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            Loading Scync...
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) return <>{fallback}</>;
  return <>{children}</>;
};
