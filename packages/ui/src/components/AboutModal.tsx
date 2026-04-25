import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { FiShield, FiCloudOff, FiCheckSquare, FiX } from 'react-icons/fi';

export const AboutModal: React.FC = () => {
  const { isAboutModalOpen, closeAboutModal } = useUIStore();

  return (
    <AnimatePresence>
      {isAboutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeAboutModal}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ position: 'relative', width: '100%', maxWidth: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 32px)' }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" alt="Scync" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: 'var(--color-text)' }}>ABOUT SCYNC</h2>
              </div>
              <button
                onClick={closeAboutModal}
                style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: 'none', background: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Intro */}
              <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 15, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--color-text)' }}>Scync</strong> is the open-source, zero-knowledge secrets manager built for developers who are tired of pasting API keys into Notion or losing them in Slack DMs.
                </p>
              </div>

              {/* Why it exists */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FiCloudOff style={{ color: 'var(--color-green)' }} />
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, color: 'var(--color-text)' }}>Why This Exists</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
                  Modern developers have dozens of API keys, PATs, and recovery codes. Existing tools fail to manage them effectively:
                  <br /><br />
                  &bull; <strong>Password Managers (Bitwarden/1Password):</strong> Built for website logins, lacking metadata or developer UX.<br />
                  &bull; <strong>Enterprise Tools (Vault/Infisical):</strong> Designed for CI/CD pipelines and teams, requiring heavy infrastructure overhead.<br />
                  &bull; <strong>Note Apps (Notion/Notes):</strong> Zero encryption. Staff can read your secrets, leaving your entire infrastructure vulnerable to a single breach.
                </p>
              </div>

              {/* How it works */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FiShield style={{ color: 'var(--color-green)' }} />
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, color: 'var(--color-text)' }}>How It Works (Zero-Knowledge)</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
                  Scync separates your <strong>Identity</strong> (Google Sign-In) from your <strong>Encryption</strong> (Vault Password). 
                  <br /><br />
                  Your vault password is used locally to derive an <strong>AES-256-GCM</strong> key via the Web Crypto API. Your secrets are encrypted <em>on your device</em> before ever touching the network. 
                  The server (Firebase) only receives unreadable ciphertext blobs and syncs them across your devices. 
                  <strong style={{ color: 'var(--color-text)' }}> We cannot read your secrets. Architecturally impossible.</strong>
                </p>
              </div>

              {/* Better than others */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FiCheckSquare style={{ color: 'var(--color-green)' }} />
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, color: 'var(--color-text)' }}>Why It's Better</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'var(--color-surface-2)', padding: 12, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Organized Context</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.4 }}>Secrets live in projects and environments, not a flat list. Search is instant and in-memory.</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-2)', padding: 12, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>One Codebase</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.4 }}>Built as a PWA that runs perfectly across Web, Windows (Electron), and Mobile (Capacitor).</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-2)', padding: 12, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Lifecycle Tracking</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.4 }}>Know exactly when a key expires or when it was last rotated at a glance.</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-2)', padding: 12, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Open & Auditable</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.4 }}>MIT Licensed. No proprietary crypto. You own your data entirely.</div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
