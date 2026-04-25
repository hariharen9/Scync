import React from 'react';
import { useAuthStore } from '@scync/ui';
import { FiShield, FiLock, FiZap, FiMonitor } from 'react-icons/fi';

const features = [
  { icon: FiShield, label: 'Zero-Knowledge', desc: 'Server never sees your secrets' },
  { icon: FiLock, label: 'AES-256-GCM', desc: 'Military-grade encryption' },
  { icon: FiZap, label: 'Instant Sync', desc: 'Real-time across all devices' },
  { icon: FiMonitor, label: 'Cross-Platform', desc: 'Web, Desktop & Mobile' },
];

export const AuthPage: React.FC = () => {
  const { signIn } = useAuthStore();

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
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
        opacity: 0.4,
      }} />

      {/* Subtle glow */}
      <div style={{
        position: 'absolute', width: 520, height: 520, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(16,185,129,.05) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 48,
        animation: 'fadeUp .6s cubic-bezier(.16,1,.3,1) both',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logo.png" alt="Scync" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-text)', textAlign: 'center' }}>
              Scync
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-2)', letterSpacing: '0.02em', textAlign: 'center' }}>
              Your secrets. Synced. Encrypted. Everywhere.
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
          width: 380, padding: 28, display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {/* Google Sign-In Button */}
          <button
            onClick={signIn}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'white', color: '#111', border: 'none', padding: '11px 20px',
              fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600,
              cursor: 'pointer', width: '100%', letterSpacing: '-0.01em',
              transition: 'background 140ms, transform 140ms, box-shadow 140ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: 'var(--color-text-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            Zero-Knowledge Vault
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {features.map((f) => (
              <div key={f.label} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10,
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 26, height: 26, background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-2)', display: 'grid', placeItems: 'center',
                  flexShrink: 0, color: 'var(--color-text-2)',
                }}>
                  <f.icon size={12} />
                </div>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--color-text)', marginBottom: 1 }}>{f.label}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-2)', lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, color: 'var(--color-text-3)', display: 'flex', gap: 16, letterSpacing: '0.01em' }}>
          <span>Open source</span>
          <span>· Self-hostable</span>
          <span>· No tracking</span>
          <span>· MIT licensed</span>
        </div>
      </div>
    </div>
  );
};
