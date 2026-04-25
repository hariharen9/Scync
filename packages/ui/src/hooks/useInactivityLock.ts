import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';

export function useInactivityLock() {
  const { settings } = useUIStore();
  const { lock, isLocked } = useVaultStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isLocked && settings.inactivityLockMinutes !== null) {
      timeoutRef.current = setTimeout(() => {
        lock();
      }, settings.inactivityLockMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (isLocked) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    // Initial timer setup
    resetTimer();

    events.forEach(evt => document.addEventListener(evt, handleActivity));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(evt => document.removeEventListener(evt, handleActivity));
    };
  }, [isLocked, settings.inactivityLockMinutes]);

  useEffect(() => {
    if (isLocked) return;

    const handleVisibilityChange = () => {
      if (settings.windowBlurLock && document.visibilityState === 'hidden') {
        lock();
      }
    };

    const handleBlur = () => {
      if (settings.windowBlurLock) {
        lock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isLocked, settings.windowBlurLock]);
}
