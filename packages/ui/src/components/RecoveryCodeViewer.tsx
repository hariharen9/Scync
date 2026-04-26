import React, { useState, useEffect } from 'react';
import type { RecoveryCodeSet, StoredSecret, DecryptedSecret } from '@scync/core';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { FiCopy, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { useClipboard } from '../hooks/useClipboard';

interface RecoveryCodeViewerProps {
  secret: DecryptedSecret;
}

export const RecoveryCodeViewer: React.FC<RecoveryCodeViewerProps> = ({ secret }) => {
  const { user } = useAuthStore();
  const { updateSecret } = useVaultStore();
  const { copy, hasCopied } = useClipboard();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [revealAll, setRevealAll] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [codeSet, setCodeSet] = useState<RecoveryCodeSet | null>(null);

  useEffect(() => {
    try {
      if (secret.type === 'Recovery Codes') {
        const parsed = JSON.parse(secret.value) as RecoveryCodeSet;
        setCodeSet(parsed);
      }
    } catch (e) {
      console.error("Failed to parse Recovery Codes:", e);
      setCodeSet(null);
    }
  }, [secret.value, secret.type]);

  useEffect(() => {
    if (revealAll) {
      setCountdown(15);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) return prev - 1;
          setRevealAll(false);
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [revealAll]);

  const handleCopy = (code: string) => {
    copy(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleMarkUsed = async (codeStr: string) => {
    if (!user || !codeSet) return;

    const newCodes = codeSet.codes.map(c =>
      c.code === codeStr ? { ...c, used: true, usedAt: new Date() } : c
    );

    const newSet: RecoveryCodeSet = { codes: newCodes };

    const unusedCount = newCodes.filter(c => !c.used).length;

    // Convert DecryptedSecret back to SecretFormData shape for updateSecret
    const formData = {
      name: secret.name,
      service: secret.service,
      type: secret.type,
      environment: secret.environment,
      status: secret.status,
      value: JSON.stringify(newSet),
      notes: secret.notes,
      lastRotated: secret.lastRotated,
      expiresOn: secret.expiresOn,
      projectId: secret.projectId,
      remainingCodes: unusedCount
    };

    try {
      await updateSecret(user.uid, secret.id, formData);
      // The local state will update via Firestore listener, but we can also optimistically update
      setCodeSet(newSet);
    } catch (e) {
      console.error("Failed to mark code as used", e);
    }
  };

  if (!codeSet) {
    return (
      <div style={{ padding: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', fontSize: 12, color: 'var(--color-text-3)' }}>
        Invalid or unparseable recovery codes. Please edit the secret to fix the format.
      </div>
    );
  }

  const unusedCodes = codeSet.codes.filter(c => !c.used);
  const usedCodes = codeSet.codes.filter(c => c.used).sort((a, b) => {
    if (a.usedAt && b.usedAt) return new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime();
    return 0;
  });

  const total = codeSet.codes.length;
  const remaining = unusedCodes.length;

  const barColor = remaining <= 2 ? 'var(--color-red)' : remaining <= 4 ? 'var(--color-amber)' : 'var(--color-green)';
  const barBg = remaining <= 2 ? 'var(--color-red-bg)' : remaining <= 4 ? 'var(--color-amber-bg)' : 'var(--color-green-bg)';

  const btnStyle: React.CSSProperties = {
    background: 'none', border: '1px solid var(--color-border)', padding: '3px 8px',
    fontSize: 10, fontWeight: 600, color: 'var(--color-text-2)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', transition: 'all 140ms', display: 'flex', alignItems: 'center', gap: 4
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress Bar Header */}
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            {remaining} of {total} remaining
          </span>
          {remaining <= 2 && remaining > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-red)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Warning: Low Codes
            </span>
          )}
          {remaining === 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-red)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Depleted
            </span>
          )}
        </div>
        <div style={{ height: 6, background: barBg, overflow: 'hidden', display: 'flex', gap: 2 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '100%', background: i < remaining ? barColor : 'transparent', opacity: i < remaining ? 1 : 0.2 }} />
          ))}
        </div>
      </div>

      {/* Unused Codes */}
      {unusedCodes.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Available Codes</span>
            <button
              onClick={() => setRevealAll(!revealAll)}
              style={{ background: 'none', border: 'none', color: revealAll ? 'var(--color-green)' : 'var(--color-text-2)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {revealAll ? <FiEyeOff size={12} /> : <FiEye size={12} />}
              {revealAll ? `HIDE (${countdown}s)` : 'REVEAL ALL'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unusedCodes.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', gap: 12 }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: revealAll ? 'var(--color-text)' : 'var(--color-text-3)', letterSpacing: revealAll ? '0.05em' : '0.2em' }}>
                  {revealAll ? c.code : '••••-••••-••••'}
                </code>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleCopy(c.code)} style={btnStyle} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}>
                    {copiedCode === c.code ? <FiCheck size={11} color="var(--color-green)" /> : <FiCopy size={11} />} Copy
                  </button>
                  <button onClick={() => handleMarkUsed(c.code)} style={{ ...btnStyle, color: 'var(--color-amber)', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)'}>
                    Mark Used
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used Codes */}
      {usedCodes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Used Codes</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
            {usedCodes.map((c, i) => {
              const usedDate = c.usedAt ? new Date(c.usedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
              return (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--color-bg)', border: '1px dashed var(--color-border-2)', gap: '4px 12px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-3)', textDecoration: 'line-through', flex: '1 1 auto', minWidth: 120 }}>
                    {c.code.replace(/./g, '~')}
                  </code>
                  <span style={{ fontSize: 10, color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <FiCheck size={10} /> Used {usedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
