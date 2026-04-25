import React, { useEffect } from 'react'; // Re-evaluating imports
import { AuthGuard, VaultGuard, useUIStore, CommandBar } from '@scync/ui';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { UnlockPage } from './pages/UnlockPage';
import { VaultPage } from './pages/VaultPage';
import { ReactLenis } from 'lenis/react';

const App: React.FC = () => {
  const { settings, openCommandBar, isCommandBarOpen, closeCommandBar } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isCommandBarOpen) closeCommandBar();
        else openCommandBar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, openCommandBar, closeCommandBar]);

  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme(settings.theme);

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => document.documentElement.classList.toggle('dark', e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  return (
    <ReactLenis root>
      <AuthGuard fallback={<AuthPage />}>
        <VaultGuard 
          setupFallback={<SetupPage />} 
          unlockFallback={<UnlockPage />}
        >
          <VaultPage />
          <CommandBar />
        </VaultGuard>
      </AuthGuard>
    </ReactLenis>
  );
};

export default App;
