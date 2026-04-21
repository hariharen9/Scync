import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { getVaultMeta } from '@scync/core';
import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';

interface VaultGuardProps {
  children: React.ReactNode;
  setupFallback: React.ReactNode;
  unlockFallback: React.ReactNode;
}

export const VaultGuard: React.FC<VaultGuardProps> = ({
  children,
  setupFallback,
  unlockFallback
}) => {
  const { user } = useAuthStore();
  const { isLocked } = useVaultStore();
  const [hasMeta, setHasMeta] = useState<boolean | null>(null);

  useEffect(() => {
    if (user && isLocked) {
      getVaultMeta(user.uid).then(meta => {
        setHasMeta(!!meta);
      }).catch(() => setHasMeta(false));
    }
  }, [user, isLocked]);

  if (!user) return null;

  if (isLocked) {
    if (hasMeta === null) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-base">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-5">
              <div className="h-12 w-12 rounded-xl gradient-bg accent-glow-sm flex items-center justify-center">
                <FiShield className="h-5 w-5 text-white" />
              </div>
              <motion.div
                className="absolute -inset-2 rounded-2xl border border-accent/20"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="h-1 w-1 rounded-full bg-accent animate-pulse" />
              Checking vault...
            </div>
          </motion.div>
        </div>
      );
    }

    if (!hasMeta) return <>{setupFallback}</>;
    return <>{unlockFallback}</>;
  }

  return <>{children}</>;
};
