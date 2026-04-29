// Import Progress - Step 4: Show progress during batch import

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useVaultStore } from '../../stores/vaultStore';
import { batchCreateSecrets } from '@scync/core';
import type { ImportCandidate, ImportResult } from '@scync/core';

interface ImportProgressProps {
  candidates: ImportCandidate[];
  onComplete: (result: ImportResult) => void;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ candidates, onComplete }) => {
  const { user } = useAuthStore();
  const { derivedKey } = useVaultStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing import...');

  useEffect(() => {
    const runImport = async () => {
      if (!user || !derivedKey) {
        onComplete({ imported: 0, failed: candidates.length, errors: ['Vault not unlocked'] });
        return;
      }

      try {
        setStatus(`Encrypting and importing ${candidates.length} secrets...`);
        
        const result = await batchCreateSecrets(user.uid, derivedKey, candidates, (p) => {
          setProgress(p);
          const current = Math.floor(p * candidates.length);
          setStatus(`Imported ${current} of ${candidates.length} secrets...`);
        });

        setProgress(1);
        setStatus('Import complete!');
        
        // Small delay to show 100% before transitioning
        setTimeout(() => {
          onComplete(result);
        }, 500);
      } catch (err) {
        onComplete({
          imported: 0,
          failed: candidates.length,
          errors: [err instanceof Error ? err.message : 'Unknown error during import'],
        });
      }
    };

    runImport();
  }, [user, derivedKey, candidates, onComplete]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 24,
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          border: '4px solid var(--color-border)',
          borderTopColor: 'var(--color-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />

      {/* Status text */}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            margin: 0,
          }}
        >
          {status}
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-3)',
            fontFamily: 'var(--font-mono)',
            margin: '8px 0 0 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {Math.round(progress * 100)}% Complete
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          height: 8,
          background: 'var(--color-surface-3)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'var(--color-green)',
            transition: 'width 200ms ease-out',
            width: `${progress * 100}%`,
          }}
        />
      </div>

      {/* Security note */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          maxWidth: 500,
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-2)',
            fontFamily: 'var(--font-mono)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          🔒 All secrets are being encrypted with your vault key before being written to Firestore.
          The server never sees plaintext values.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
