import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { getVaultMeta } from '@scync/core';
import { FiShield } from 'react-icons/fi';

interface VaultGuardProps { children: React.ReactNode; setupFallback: React.ReactNode; unlockFallback: React.ReactNode; }

export const VaultGuard: React.FC<VaultGuardProps> = ({ children, setupFallback, unlockFallback }) => {
  const { user } = useAuthStore();
  const { isLocked, setVaultMeta } = useVaultStore();
  const [hasMeta, setHasMeta] = useState<boolean | null>(null);

  useEffect(() => { 
    if (user && isLocked) { 
      getVaultMeta(user.uid).then(meta => {
        setHasMeta(!!meta);
        setVaultMeta(meta);
      }).catch(() => setHasMeta(false)); 
    } 
  }, [user, isLocked, setVaultMeta]);
  if (!user) return null;

  if (isLocked) {
    if (hasMeta === null) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'var(--color-bg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn .4s ease-out' }}>
            <div style={{ width: 40, height: 40, background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <FiShield size={16} color="var(--color-green)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-2)' }}>
              <div style={{ width: 4, height: 4, background: 'var(--color-green)', animation: 'fadeIn 1s ease-in-out infinite alternate' }} />
              Checking vault...
            </div>
          </div>
        </div>
      );
    }
    if (!hasMeta) return <>{setupFallback}</>;
    return <>{unlockFallback}</>;
  }
  return <>{children}</>;
};
