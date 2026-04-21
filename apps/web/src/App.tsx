import React from 'react';
import { AuthGuard, VaultGuard } from '@scync/ui';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { UnlockPage } from './pages/UnlockPage';
import { VaultPage } from './pages/VaultPage';
import { ReactLenis } from 'lenis/react';

const App: React.FC = () => {
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
