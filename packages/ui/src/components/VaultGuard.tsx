import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { getVaultMeta } from '@scync/core';

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
      }).catch((error) => {
        console.error("Error reading vault meta", error);
        setHasMeta(false);
      });
    }
  }, [user, isLocked]);

  if (!user) return null;

  if (isLocked) {
    if (hasMeta === null) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-accent"></div>
        </div>
      );
    }
    
    if (!hasMeta) {
      return <>{setupFallback}</>;
    }
    
    return <>{unlockFallback}</>;
  }

  return <>{children}</>;
};
