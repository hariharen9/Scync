import React, { useMemo } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { getAttentionSecrets } from '@scync/core';
import { SecretCard } from './SecretCard';

export const Dashboard: React.FC = () => {
  const { storedSecrets } = useVaultStore();
  const { projects } = useProjectStore();

  const attention = useMemo(() => getAttentionSecrets(storedSecrets), [storedSecrets]);

  const hasIssues = attention.expired.length > 0 || attention.expiringSoon.length > 0 || attention.rotationOverdue.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">Good morning. Your vault is unlocked.</h2>
        <p className="text-sm text-zinc-400">
          {storedSecrets.length} secrets across {projects.length} projects.
        </p>
      </div>

      {!hasIssues ? (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-[#111] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            ✅
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200">Everything looks good</h3>
            <p className="text-sm text-zinc-400">No expired keys, no rotation overdue. Nice.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(attention.expired.length > 0 || attention.expiringSoon.length > 0) && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-400">
                <span className="text-orange-500">⚠</span> NEEDS ATTENTION
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {attention.expired.map(s => <SecretCard key={s.id} secret={s} />)}
                {attention.expiringSoon.map(s => <SecretCard key={s.id} secret={s} />)}
              </div>
            </div>
          )}

          {attention.rotationOverdue.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-widest text-zinc-400">
                <span className="text-yellow-500">🔄</span> ROTATION OVERDUE
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {attention.rotationOverdue.map(s => <SecretCard key={s.id} secret={s} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
