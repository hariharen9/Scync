import React, { useState } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export const SetupPage: React.FC = () => {
  const { user } = useAuthStore();
  const { initializeVault } = useVaultStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 5);
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981', '#10b981'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      await initializeVault(password, user.uid);
    } catch (err) {
      setError('Failed to setup vault. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--color-bg)',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
        maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 100%)',
        opacity: 0.3,
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: 400,
        animation: 'fadeUp .5s cubic-bezier(.16,1,.3,1) both',
      }}>
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
          padding: 28,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.03em' }}>
              Create Vault Password
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
              This password encrypts your secrets locally.
              <span style={{ color: 'var(--color-amber)' }}> It cannot be recovered if lost.</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-red-bg)', border: '1px solid rgba(239,68,68,0.2)',
              padding: '10px 12px', marginBottom: 16, fontSize: 12, color: 'var(--color-red)',
            }}>
              <FiAlertCircle size={14} style={{ flexShrink: 0 }} />
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 6 }}>
                Vault Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)', color: 'var(--color-text)',
                    padding: '9px 36px 9px 12px', fontSize: 13,
                    fontFamily: 'var(--font-sans)', outline: 'none',
                    transition: 'border-color 140ms',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  placeholder="Min 8 characters"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-text-3)',
                    cursor: 'pointer', display: 'flex', padding: 0,
                  }}
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        style={{
                          height: 3, flex: 1,
                          background: i <= strength ? strengthColor : 'var(--color-border)',
                          transition: 'background 200ms',
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 10, marginTop: 4, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{
                  width: '100%', background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)', color: 'var(--color-text)',
                  padding: '9px 12px', fontSize: 13,
                  fontFamily: 'var(--font-sans)', outline: 'none',
                  transition: 'border-color 140ms',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', background: 'white', color: '#080808',
                border: 'none', padding: '10px 16px', marginTop: 4,
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 140ms',
              }}
            >
              {loading ? (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#080808', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <>
                  <FiLock size={13} />
                  Create Vault
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
