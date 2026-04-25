import React, { useEffect } from 'react';
import { AuthGuard, VaultGuard, useUIStore } from '@scync/ui';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { UnlockPage } from './pages/UnlockPage';
import { VaultPage } from './pages/VaultPage';
import { ReactLenis } from 'lenis/react';

const App: React.FC = () => {
  const { settings } = useUIStore();

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
        </VaultGuard>
      </AuthGuard>
    </ReactLenis>
  );
};

export default App;
