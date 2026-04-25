import React, { useState } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { FiUnlock, FiLogOut } from 'react-icons/fi';

export const UnlockPage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { unlock } = useVaultStore();

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !user) return;

    try {
      setLoading(true);
      setError(false);
      const success = await unlock(password, user.uid);
      if (!success) {
        setError(true);
        setShake(true);
        setPassword('');
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
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
        position: 'relative', zIndex: 1, width: 340,
        animation: shake ? 'none' : 'fadeUp .5s cubic-bezier(.16,1,.3,1) both',
        transform: shake ? undefined : undefined,
      }}>
        <div
          style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
            padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            animation: shake ? 'shake 0.4s ease-in-out' : undefined,
          }}
        >
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--color-border-2)' }}
              />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-surface-3)', border: '2px solid var(--color-border-2)',
                display: 'grid', placeItems: 'center',
                fontSize: 18, fontWeight: 700, color: 'var(--color-text)',
              }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--color-amber)', border: '2px solid var(--color-surface)',
              display: 'grid', placeItems: 'center',
            }}>
              <FiUnlock size={10} color="#080808" />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {user?.displayName || user?.email}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Vault is locked
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                style={{
                  width: '100%', background: 'var(--color-surface-2)',
                  border: `1px solid ${error ? 'var(--color-red)' : 'var(--color-border)'}`,
                  color: 'var(--color-text)', padding: '10px 14px',
                  fontFamily: 'var(--font-mono)', fontSize: 14,
                  textAlign: 'center', letterSpacing: '0.08em',
                  outline: 'none', transition: 'border-color 140ms',
                }}
                placeholder="●●●●●●●●"
                autoFocus
              />
              {error && (
                <p style={{ color: 'var(--color-red)', fontSize: 11, textAlign: 'center', marginTop: 8, fontWeight: 500 }}>
                  Wrong password. Try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', background: 'white', color: '#080808',
                border: 'none', padding: '10px 16px',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
                cursor: (loading || !password) ? 'not-allowed' : 'pointer',
                opacity: (loading || !password) ? 0.5 : 1,
                transition: 'opacity 140ms',
              }}
            >
              {loading ? (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#080808', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <>
                  <FiUnlock size={13} />
                  Unlock Vault
                </>
              )}
            </button>
          </form>

          {/* Sign out */}
          <button
            onClick={signOut}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-3)',
              fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              transition: 'color 140ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            <FiLogOut size={11} />
            Sign out
          </button>
        </div>
      </div>

      {/* Inline keyframe for shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          50% { transform: translateX(-4px); }
          70% { transform: translateX(4px); }
          90% { transform: translateX(-2px); }
        }
      `}</style>
    </div>
  );
};
