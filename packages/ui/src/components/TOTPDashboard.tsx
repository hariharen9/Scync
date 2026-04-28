import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { FiShield, FiPlus, FiTrash2, FiCopy, FiCheck, FiSearch } from 'react-icons/fi';
import { generateTOTPCode, getRemainingSeconds, type TOTPConfig, type StoredTOTP, type DecryptedTOTP } from '@scync/core';
import { ServiceIcon } from './ServiceIcon';

interface LiveCode {
  id: string;
  code: string;
  remaining: number;
  config: TOTPConfig;
  issuer: string;
  label: string;
}

export const TOTPDashboard: React.FC = () => {
  const { storedTOTPs, decryptTOTP, deleteTOTP } = useVaultStore();
  const { openAddTOTPModal, openConfirmModal } = useUIStore();
  const { user } = useAuthStore();
  const [liveCodes, setLiveCodes] = useState<LiveCode[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const decryptedCache = useRef<Map<string, DecryptedTOTP>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(storedTOTPs.length > 0);

  // Tick every second to update codes + countdown
  const tick = useCallback(() => {
    const codes: LiveCode[] = [];
    decryptedCache.current.forEach((decrypted) => {
      const config: TOTPConfig = {
        issuer: decrypted.issuer,
        label: decrypted.label,
        secret: decrypted.secret,
        algorithm: decrypted.algorithm,
        digits: decrypted.digits,
        period: decrypted.period
      };
      try {
        const code = generateTOTPCode(config);
        const remaining = getRemainingSeconds(config.period);
        codes.push({
          id: decrypted.id,
          code,
          remaining,
          config,
          issuer: decrypted.issuer,
          label: decrypted.label
        });
      } catch (e) {
        console.warn('Failed to generate TOTP for', decrypted.issuer, e);
      }
    });
    setLiveCodes(codes);
  }, []);

  // Decrypt all TOTP tokens on mount / when storedTOTPs change
  useEffect(() => {
    const decryptAll = async () => {
      if (storedTOTPs.length === 0) {
        setIsDecrypting(false);
        setLiveCodes([]);
        return;
      }
      setIsDecrypting(true);
      const cache = new Map<string, DecryptedTOTP>();
      for (const token of storedTOTPs) {
        // Reuse cached decryption if token hasn't changed
        const existing = decryptedCache.current.get(token.id);
        if (existing && existing.updatedAt.getTime() === token.updatedAt.getTime()) {
          cache.set(token.id, existing);
          continue;
        }
        const decrypted = await decryptTOTP(token.id);
        if (decrypted) cache.set(token.id, decrypted);
      }
      decryptedCache.current = cache;
      tick();
      setIsDecrypting(false);
    };
    decryptAll();
  }, [storedTOTPs, decryptTOTP, tick]);

  useEffect(() => {
    tick(); // immediate
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tick]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (token: StoredTOTP) => {
    if (!user) return;
    openConfirmModal({
      title: 'Delete Authenticator',
      message: `Remove "${token.issuer}" from your vault? You will lose access to this 2FA code permanently.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        await deleteTOTP(user.uid, token.id);
        decryptedCache.current.delete(token.id);
      }
    });
  };

  const formatCode = (code: string): string => {
    const mid = Math.floor(code.length / 2);
    return `${code.slice(0, mid)} ${code.slice(mid)}`;
  };

  const filtered = search
    ? liveCodes.filter(c =>
        c.issuer.toLowerCase().includes(search.toLowerCase()) ||
        c.label.toLowerCase().includes(search.toLowerCase())
      )
    : liveCodes;

  const getUrgencyColor = (remaining: number, period: number) => {
    const ratio = remaining / period;
    if (ratio > 0.33) return 'var(--color-text)';
    if (ratio > 0.17) return '#f59e0b';
    return '#ef4444';
  };

  const renderCountdownArc = (remaining: number, period: number) => {
    const size = 28;
    const stroke = 2.5;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = remaining / period;
    const offset = circumference * (1 - progress);
    const color = getUrgencyColor(remaining, period);

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s ease' }}
        />
        <text
          x={size/2} y={size/2}
          textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 8, fontWeight: 700, fill: color, transform: 'rotate(90deg)', transformOrigin: 'center', fontFamily: 'var(--font-mono)' }}
        >
          {remaining}
        </text>
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', fontFamily: 'var(--font-sans)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiShield /> Authenticator
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Encrypted 2FA codes synced across your devices.</p>
        </div>
        <button
          onClick={openAddTOTPModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'opacity 140ms'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <FiPlus size={14} />
          <span className="hidden sm:inline">Add Authenticator</span>
        </button>
      </div>

      {/* Search */}
      {liveCodes.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search authenticators..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', maxWidth: 320, border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)', padding: '8px 10px 8px 30px',
              fontSize: 12, color: 'var(--color-text)', outline: 'none',
              fontFamily: 'var(--font-sans)', transition: 'border-color 140ms'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
        gap: 16, flex: 1, overflowY: 'auto', alignContent: 'start'
      }}>
        {isDecrypting && liveCodes.length === 0 ? (
           <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
             <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-text)', borderRadius: '50%', marginBottom: 12 }} />
             <p style={{ fontSize: 12 }}>Decrypting authenticators...</p>
           </div>
        ) : storedTOTPs.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '100px 0', color: 'var(--color-text-muted)', textAlign: 'center'
          }}>
            <FiShield size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 14, margin: '0 0 6px 0', fontWeight: 600, color: 'var(--color-text)' }}>No authenticators in your vault.</p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>Add your first 2FA code to get started.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: 13 }}>No results for "{search}"</p>
          </div>
        ) : (
          filtered.map(item => {
            const urgencyColor = getUrgencyColor(item.remaining, item.config.period);
            const isUrgent = item.remaining <= 5;
            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  overflow: 'hidden',
                  transition: 'border-color 200ms',
                  borderRadius: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                {/* Service info bar */}
                <div style={{
                  padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 4, flexShrink: 0 }}>
                      <ServiceIcon service={item.issuer} size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.issuer || 'Unknown Service'}
                      </div>
                      {item.label && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                          {item.label}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(storedTOTPs.find(t => t.id === item.id)!)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, opacity: 0.5, transition: 'opacity 140ms, color 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-red)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                {/* Code display */}
                <div
                  style={{
                    padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', transition: 'background 100ms',
                    background: 'var(--color-surface)',
                  }}
                  onClick={() => handleCopy(item.code, item.id)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                  title="Click to copy"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span 
                      key={item.code}
                      style={{
                        fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.12em', color: urgencyColor,
                        transition: 'color 0.3s ease',
                        animation: isUrgent ? 'pulse 1s ease-in-out infinite, slideUp 0.2s ease-out' : 'slideUp 0.2s ease-out'
                      }}>
                      {formatCode(item.code)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {copiedId === item.id ? (
                      <FiCheck size={14} style={{ color: 'var(--color-green)' }} />
                    ) : (
                      <FiCopy size={14} style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
                    )}
                    {renderCountdownArc(item.remaining, item.config.period)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes slideUp {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
