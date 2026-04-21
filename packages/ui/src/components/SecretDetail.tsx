import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { MaskedValue } from './MaskedValue';
import { FiX, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { DecryptedSecret } from '@scync/core';

export const SecretDetail: React.FC = () => {
  const { selectedSecretId, selectSecret, openEditModal } = useUIStore();
  const { storedSecrets, decryptValue, deleteSecret } = useVaultStore();
  const { projects } = useProjectStore();
  
  const [decrypted, setDecrypted] = useState<DecryptedSecret | null>(null);

  const secret = storedSecrets.find(s => s.id === selectedSecretId);

  useEffect(() => {
    if (selectedSecretId) {
      decryptValue(selectedSecretId).then(setDecrypted);
    } else {
      setDecrypted(null);
    }
  }, [selectedSecretId, decryptValue]);

  if (!secret) return null;

  const project = projects.find(p => p.id === secret.projectId);

  return (
    <div className="flex h-full w-80 flex-col border-l border-zinc-800 bg-[#111]">
      <div className="flex items-center justify-between border-b border-zinc-800/50 p-4">
        <h3 className="font-semibold text-zinc-200">Details</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => openEditModal(secret.id)}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            title="Edit"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => selectSecret(null)}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            title="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-1">{secret.name}</h2>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>{secret.service}</span>
            <span>&middot;</span>
            <span>{project?.name || 'Uncategorized'}</span>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Value</label>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
              <MaskedValue value={decrypted?.value || 'Loading...'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Type</label>
              <div className="text-sm text-zinc-300">{secret.type}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Environment</label>
              <div className="text-sm text-zinc-300">{secret.environment}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Status</label>
              <div className="text-sm font-medium text-green-400">{secret.status}</div>
            </div>
          </div>

          {secret.expiresOn && (
            <div>
              <label className="mb-1 block flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <FiClock /> Expires
              </label>
              <div className="text-sm text-zinc-300">{secret.expiresOn.toLocaleDateString()}</div>
            </div>
          )}

          {decrypted?.notes && (
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">Notes</label>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 whitespace-pre-wrap">
                {decrypted.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
