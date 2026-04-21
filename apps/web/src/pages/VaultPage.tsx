import React, { useEffect } from 'react';
import { useAuthStore, useVaultStore, useProjectStore, useUIStore } from '@scync/ui';
import { FiLogOut, FiLock, FiPlus } from 'react-icons/fi';
import { Sidebar, Dashboard, SecretList, SecretDetail, AddEditModal, EnvImportModal } from '@scync/ui';

export const VaultPage: React.FC = () => {
  const { user } = useAuthStore();
  const { subscribeToSecrets, lock } = useVaultStore();
  const { subscribeToProjects } = useProjectStore();
  const { activeView, selectedSecretId, openAddModal, openEnvImportModal } = useUIStore();

  useEffect(() => {
    if (!user) return;
    const unsubSecrets = subscribeToSecrets(user.uid);
    const unsubProjects = subscribeToProjects(user.uid);
    
    return () => {
      unsubSecrets();
      unsubProjects();
    };
  }, [user, subscribeToSecrets, subscribeToProjects]);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-[#0a0a0a] px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-xs font-bold text-white">S</div>
          <span className="font-semibold tracking-tight">Scync</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={openEnvImportModal}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <span className="hidden sm:inline-block">.env Import</span>
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
          >
            <FiPlus />
            <span className="hidden sm:inline-block">Add Secret</span>
          </button>
          
          <div className="h-4 w-px bg-zinc-800"></div>
          
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {user?.photoURL ? (
               <img src={user.photoURL} alt="Avatar" className="h-6 w-6 rounded-full" />
            ) : null}
            <span className="hidden sm:inline-block">{user?.email}</span>
          </div>
          
          <button 
            onClick={lock}
            className="flex items-center gap-2 rounded text-sm text-zinc-400 transition-colors hover:text-white ml-2"
            title="Lock Vault"
          >
            <FiLock />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
          {activeView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <SecretList />
          )}
        </div>

        {selectedSecretId && (
           <SecretDetail />
        )}
      </div>

      <AddEditModal />
      <EnvImportModal />
    </div>
  );
};
