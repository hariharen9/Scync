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
    tick();
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
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
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
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiShield size={20} style={{ color: 'var(--color-green)' }} />
            Authenticator
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            {storedTOTPs.length} code{storedTOTPs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={openAddTOTPModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
          >
            <FiPlus size={13} />
            Add Authenticator
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
          <input
            type="text"
            placeholder="Search authenticators by issuer or label..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
              color: 'var(--color-text)', fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-sans)', transition: 'border-color 140ms',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>
      </div>

      {isDecrypting && liveCodes.length === 0 ? (
        <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-text)', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, fontFamily: 'var(--font-sans)' }}>Decrypting authenticators...</p>
        </div>
      ) : storedTOTPs.length === 0 ? (
        <div style={{
          border: '1px dashed var(--color-border-2)', background: 'var(--color-surface)',
          padding: '64px 32px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center',
            marginBottom: 16,
          }}>
            <FiShield size={20} color="var(--color-text-3)" />
          </div>
          {search ? (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
                No results for "{search}"
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>
                Try a different search term.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0', fontFamily: 'var(--font-sans)' }}>No authenticators yet</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 20px 0', maxWidth: 300, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                Add TOTP 2FA codes to sync them securely across all your devices.
              </p>
              <button
                onClick={openAddTOTPModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                  background: 'white', color: '#080808', border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <FiPlus size={14} /> Add Authenticator
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 1,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
        }}>
          {filtered.map(item => {
            const urgencyColor = getUrgencyColor(item.remaining, item.config.period);
            const isUrgent = item.remaining <= 5;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--color-surface)', display: 'flex', flexDirection: 'column',
                  transition: 'background 140ms', position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
              >
                <div style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 4, flexShrink: 0 }}>
                      <ServiceIcon service={item.issuer} size={12} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
                        {item.issuer || 'Unknown Service'}
                      </div>
                      {item.label && (
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-3)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                          {item.label}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(storedTOTPs.find(t => t.id === item.id)!)}
                    style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div
                  style={{
                    padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', flex: 1
                  }}
                  onClick={() => handleCopy(item.code, item.id)}
                  title="Click to copy"
                >
                  <span 
                    key={item.code}
                    style={{
                      fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.15em', color: urgencyColor,
                      transition: 'color 0.3s ease',
                      animation: isUrgent ? 'pulse 1s ease-in-out infinite' : 'none'
                    }}>
                    {formatCode(item.code)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          })}
        </div>
      )}

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
      `}</style>
    </div>
  );
};
