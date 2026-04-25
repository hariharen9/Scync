import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@scync/core';
import { useAuthStore } from '../stores/authStore';
import { FiLock } from 'react-icons/fi';

interface AuthGuardProps { children: React.ReactNode; fallback: React.ReactNode; }

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, isLoading, setUser } = useAuthStore();
  useEffect(() => { const u = onAuthStateChanged(auth, (fu) => { setUser(fu); }); return () => u(); }, [setUser]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn .4s ease-out' }}>
          <div style={{ width: 40, height: 40, background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
            <FiLock size={16} color="var(--color-green)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-2)' }}>
            <div style={{ width: 4, height: 4, background: 'var(--color-green)', animation: 'fadeIn 1s ease-in-out infinite alternate' }} />
            Loading Scync...
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <>{fallback}</>;
  return <>{children}</>;
};
