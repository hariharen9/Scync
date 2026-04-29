import React, { useEffect, useState } from 'react';
import { FiCopy, FiCheck, FiAlertCircle, FiLock, FiEye, FiEyeOff, FiClock } from 'react-icons/fi';
import { useShareStore } from '../stores/shareStore';
import { ServiceIcon } from './ServiceIcon';
import { useClipboard } from '../hooks/useClipboard';
import type { DecryptedShare } from '@scync/core';

interface ShareConsumePageProps {
  shareId: string;
  keyFragment: string;
}

export const ShareConsumePage: React.FC<ShareConsumePageProps> = ({ shareId, keyFragment }) => {
  const { consumeShare } = useShareStore();
  const { copy, hasCopied } = useClipboard();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<DecryptedShare | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const loadShare = async () => {
      console.log('[ShareConsumePage] Loading share:', { shareId, keyFragment: keyFragment.substring(0, 10) + '...' });
      
      try {
        const result = await consumeShare(shareId, keyFragment);
        console.log('[ShareConsumePage] Share loaded successfully');
        setShare(result);
      } catch (err: any) {
        console.error('[ShareConsumePage] Error loading share:', err);
        
        if (err.message === 'SHARE_NOT_FOUND') {
          setError('This share link does not exist or has been revoked.');
        } else if (err.message === 'SHARE_EXPIRED') {
          setError('This share link has expired.');
        } else if (err.message === 'SHARE_CONSUMED') {
          setError('This share link has already been viewed and cannot be accessed again.');
        } else {
          setError('Failed to load the shared secret. The link may be invalid.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadShare();
  }, [shareId, keyFragment, consumeShare]);

  useEffect(() => {
    if (revealed && countdown === null) {
      setCountdown(15);
    }
  }, [revealed, countdown]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        setRevealed(false);
        setCountdown(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCopy = () => {
    if (!share) return;
    copy(share.value);
  };

  const handleReveal = () => {
    setRevealed(!revealed);
    if (!revealed) {
      setCountdown(15);
    } else {
      setCountdown(null);
    }
  };

  const formatExpiry = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid var(--color-border)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16
          }}>
            <img src="/logo.png" alt="Scync" style={{ width: 32, height: 32 }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
            Scync
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
            Zero-Knowledge Secret Sharing
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 32 }}>
          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '40px 0'
            }}>
              <div style={{
                width: 32, height: 32,
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-green)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 16
              }} />
              <div style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
                Decrypting secret...
              </div>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '20px 0', textAlign: 'center'
            }}>
              <div style={{
                width: 64, height: 64,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20
              }}>
                <FiAlertCircle size={32} style={{ color: 'var(--color-red)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
                Unable to Access Secret
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)', maxWidth: 360, lineHeight: 1.6 }}>
                {error}
              </div>
            </div>
          ) : share ? (
            <>
              {/* Secret Info */}
              <div style={{
                padding: 16,
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                marginBottom: 20
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 12
                }}>
                  <ServiceIcon service={share.service} size={24} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
                      {share.secretName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>
                      {share.type}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  fontSize: 11, color: 'var(--color-text-3)',
                  paddingTop: 12,
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiClock size={11} />
                    Expires {formatExpiry(share.expiresAt)}
                  </div>
                  {share.viewsRemaining !== null && (
                    <>
                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiLock size={11} />
                        {share.viewsRemaining === 0 ? 'Last view' : `${share.viewsRemaining} view${share.viewsRemaining > 1 ? 's' : ''} remaining`}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Warning for one-time links */}
              {share.viewsRemaining === 0 && (
                <div style={{
                  padding: 12,
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex', gap: 10,
                  marginBottom: 20
                }}>
                  <FiAlertCircle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.5 }}>
                    <strong>Self-Destructing Link:</strong> This was the final view. Refreshing this page will not work.
                  </div>
                </div>
              )}

              {/* Secret Value */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Secret Value
                </label>
                <div style={{
                  padding: 14,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: revealed ? 'var(--color-green)' : 'var(--color-text-3)',
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                  minHeight: 48,
                  display: 'flex', alignItems: 'center'
                }}>
                  {revealed ? share.value : '●'.repeat(Math.min(share.value.length, 40))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleReveal}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-3)',
                    color: 'var(--color-text)',
                    fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 140ms',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border-focus)';
                    e.currentTarget.style.background = 'var(--color-surface-2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'var(--color-surface-3)';
                  }}
                >
                  {revealed ? (
                    <>
                      <FiEyeOff size={16} />
                      Hide {countdown !== null && `(${countdown}s)`}
                    </>
                  ) : (
                    <>
                      <FiEye size={16} />
                      Reveal
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: 'none',
                    background: hasCopied ? 'var(--color-green-dim)' : 'var(--color-green)',
                    color: hasCopied ? 'var(--color-green)' : '#000',
                    fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 140ms',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                  onMouseEnter={e => {
                    if (!hasCopied) e.currentTarget.style.background = '#2dd45e';
                  }}
                  onMouseLeave={e => {
                    if (!hasCopied) e.currentTarget.style.background = 'var(--color-green)';
                  }}
                >
                  {hasCopied ? (
                    <>
                      <FiCheck size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
<div style={{
  padding: '16px 24px',
  borderTop: '1px solid var(--color-border)',
  textAlign: 'center',
  fontSize: 11,
  color: 'var(--color-text-3)'
}}>
  Powered by{' '}
  <a
    href="https://scync.netlify.app/"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: 'var(--color-green)',
      fontWeight: 600,
      textDecoration: 'none'
    }}
  >
    Scync
  </a>{' '}
  — Zero-Knowledge Secrets Manager
</div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
