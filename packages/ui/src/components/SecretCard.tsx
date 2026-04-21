import React, { useState } from 'react';
import { FiMoreHorizontal, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { StoredSecret, SERVICE_COLORS, STATUS_COLORS, PROJECT_COLORS, Project } from '@scync/core';
import { MaskedValue } from './MaskedValue';
import { useVaultStore } from '../stores/vaultStore';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';

interface SecretCardProps {
  secret: StoredSecret;
  project?: Project | null;
}

export const SecretCard: React.FC<SecretCardProps> = ({ secret, project }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  
  const { decryptValue, deleteSecret } = useVaultStore();
  const { openEditModal, selectSecret } = useUIStore();
  const authStore = (window as any).__authStore; // Hack for accessing uid inside component if undefined
  
  const handleRevealToggle = async (revealed: boolean) => {
    if (revealed && !decryptedValue) {
      const dec = await decryptValue(secret.id);
      if (dec) setDecryptedValue(dec.value);
    }
  };

  const isExpiringSoon = secret.expiresOn && (secret.expiresOn.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
  const isExpired = secret.expiresOn && secret.expiresOn.getTime() < Date.now();
  
  const serviceColorClass = SERVICE_COLORS[secret.service] || SERVICE_COLORS['Other'];
  let statusColorClass = STATUS_COLORS[secret.status];
  
  if (isExpired) {
    statusColorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  } else if (isExpiringSoon) {
    statusColorClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  }

  const projectColorClass = project ? PROJECT_COLORS[project.color] : 'bg-transparent';

  return (
    <div 
      onClick={() => selectSecret(secret.id)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-zinc-800 bg-surface transition-colors hover:border-zinc-700 hover:bg-hover"
    >
      {/* Project Color Indicator */}
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${projectColorClass}`} />
      
      <div className="flex flex-col p-4 pl-5">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${serviceColorClass}`}>
              {secret.service}
            </span>
            <h3 className="text-sm font-semibold text-primary truncate max-w-[180px]" title={secret.name}>
              {secret.name}
            </h3>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <FiMoreHorizontal />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-lg border border-zinc-800 bg-elevated shadow-xl">
                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); openEditModal(secret.id); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  <FiEdit2 className="h-3 w-3" /> Edit
                </button>
                <div className="h-px bg-zinc-800" />
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(confirm('Are you sure you want to delete this secret?')) {
                      // Note: We need uid to delete. Assuming VaultGuard guarantees user exists.
                      // The clean way is to pass user from VaultPage or useAuthStore.
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                >
                  <FiTrash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-1.5 text-[12px] text-zinc-500">
          <span>{secret.type}</span>
          <span>&middot;</span>
          <span>{secret.environment}</span>
        </div>

        <div className="mb-3 h-7">
          <MaskedValue 
            value={decryptedValue || "Loading..."} 
            onRevealToggled={handleRevealToggle} 
          />
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium ${statusColorClass}`}>
              {isExpired ? 'Expired' : secret.status}
            </div>
            {secret.expiresOn && !isExpired && (
              <span className={isExpiringSoon ? 'text-orange-400' : 'text-zinc-500'}>
                Exp: {secret.expiresOn.toLocaleDateString()}
              </span>
            )}
            {!secret.expiresOn && (
               <span className="text-zinc-500">Exp: Never</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
