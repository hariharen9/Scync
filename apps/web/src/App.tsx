import React, { useEffect } from 'react';
import { AuthGuard, VaultGuard, useUIStore, CommandBar, ErrorBoundary, ShareConsumePage, ConfirmModal } from '@scync/ui';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { UnlockPage } from './pages/UnlockPage';
import { VaultPage } from './pages/VaultPage';
import { ReactLenis } from 'lenis/react';

const App: React.FC = () => {
  const { settings, openCommandBar, isCommandBarOpen, closeCommandBar } = useUIStore();

  // Check if this is a share consumption page
  const isSharePage = window.location.pathname.startsWith('/share/');
  
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

  // Handle share consumption page (public, no auth required)
  if (isSharePage) {
    const pathParts = window.location.pathname.split('/');
    const shareId = pathParts[2];
    const keyFragment = window.location.hash.slice(1); // Remove the # prefix
    
    if (!shareId || !keyFragment) {
      return (
        <ErrorBoundary>
          <div style={{
            minHeight: '100vh',
            background: 'var(--color-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}>
            <div style={{
              maxWidth: 400,
              textAlign: 'center',
              color: 'var(--color-text-2)'
            }}>
              <h1 style={{ fontSize: 20, marginBottom: 12 }}>Invalid Share Link</h1>
              <p style={{ fontSize: 14 }}>This link appears to be malformed or incomplete.</p>
            </div>
          </div>
        </ErrorBoundary>
      );
    }
    
    return (
      <ErrorBoundary>
        <ShareConsumePage shareId={shareId} keyFragment={keyFragment} />
      </ErrorBoundary>
    );
  }

  // Normal authenticated app flow
  return (
    <ErrorBoundary>
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
        {/* Global ConfirmModal - available everywhere */}
        <ConfirmModal />
      </ReactLenis>
    </ErrorBoundary>
  );
};

export default App;
