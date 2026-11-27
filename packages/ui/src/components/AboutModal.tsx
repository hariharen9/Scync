import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { FiShield, FiCloudOff, FiCheckSquare, FiX, FiLock, FiFolder, FiClock, FiGlobe, FiCode } from 'react-icons/fi';

export const AboutModal: React.FC = () => {
  const { isAboutModalOpen, closeAboutModal } = useUIStore();

  React.useEffect(() => {
    if (!isAboutModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAboutModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAboutModalOpen, closeAboutModal]);

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: 0,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
  };

  const comparisons = [
    {
      title: 'Password Managers',
      sub: 'Bitwarden / 1Password',
      desc: 'Built for website logins—lacking project/environment metadata and developer-first workflows.',
    },
    {
      title: 'Enterprise Tools',
      sub: 'HashiCorp Vault / Infisical',
      desc: 'Built for CI/CD pipelines and teams, requiring heavy infrastructure and setup overhead.',
    },
    {
      title: 'Note Apps',
      sub: 'Notion / Apple Notes',
      desc: 'Not zero-knowledge. Plaintext or server-readable notes leave your infrastructure exposed.',
    },
  ];

  const highlights = [
    {
      icon: FiFolder,
      title: 'Organized Context',
      desc: 'Secrets live in projects and environments, not a flat list. Search is instant and in-memory.',
    },
    {
      icon: FiGlobe,
      title: 'Web & PWA',
      desc: 'Installable Progressive Web App that runs smoothly in any modern browser across devices.',
    },
    {
      icon: FiClock,
      title: 'Lifecycle Tracking',
      desc: 'Track expiration dates, rotation history, and SSH/TOTP/certificate health at a glance.',
    },
    {
      icon: FiCode,
      title: 'Open & Auditable',
      desc: 'MIT Licensed with standard Web Crypto primitives. You own your encrypted data entirely.',
    },
  ];

  return (
    <AnimatePresence>
      {isAboutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeAboutModal}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 640,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-2)',
              boxShadow: '0 24px 64px rgba(0,0,0,.75)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 32px)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--color-bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" alt="Scync" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                  About Scync
                </h2>
              </div>
              <button
                onClick={closeAboutModal}
                aria-label="Close"
                style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'color 140ms, border-color 140ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.borderColor = 'var(--color-border-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-2)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Content */}
            <div data-lenis-prevent="true" style={{ padding: '24px 22px', overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Intro */}
              <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 15, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.65 }}>
                  <strong style={{ color: 'var(--color-text)', fontWeight: 700 }}>Scync</strong> is an open-source, zero-knowledge secrets manager built for solo developers tired of pasting API keys into Notion or losing `.pem` files across Slack DMs.
                </p>
              </div>

              {/* Why this exists */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <FiCloudOff size={14} style={{ color: 'var(--color-green)' }} />
                  <h3 style={sectionLabelStyle}>Why This Exists</h3>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  Developers juggle API keys, PATs, SSH keys, and recovery codes—yet existing tools miss the mark:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
                  {comparisons.map((item) => (
                    <div key={item.title} style={{ background: 'var(--color-surface-2)', padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{item.sub}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.55 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <FiShield size={14} style={{ color: 'var(--color-green)' }} />
                  <h3 style={sectionLabelStyle}>How It Works (Zero-Knowledge)</h3>
                </div>
                <div style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderLeft: '2px solid var(--color-green)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>
                    Scync separates your <strong style={{ color: 'var(--color-text)' }}>Identity</strong> (Google / Email Sign-In) from your <strong style={{ color: 'var(--color-text)' }}>Encryption</strong> (Vault Master Password).
                  </p>
                  <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>
                    Your master password derives a non-extractable <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-green)' }}>AES-256-GCM</code> key locally via PBKDF2 (310,000 iterations). Secrets are encrypted on your device before touching the network—Firebase only ever stores unreadable ciphertext blobs.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                    <FiLock size={13} color="var(--color-green)" />
                    <span>We cannot read your secrets. Architecturally impossible.</span>
                  </div>
                </div>
              </div>

              {/* Why it's better */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <FiCheckSquare size={14} style={{ color: 'var(--color-green)' }} />
                  <h3 style={sectionLabelStyle}>Why It&apos;s Better</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {highlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} style={{ background: 'var(--color-surface-2)', padding: '14px 15px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                          <Icon size={13} color="var(--color-green)" />
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.55 }}>{item.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
