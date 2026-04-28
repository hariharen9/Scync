import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiKey, FiTerminal, FiDatabase, FiPlus, FiDownload } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { generateSSHKeyPair } from '@scync/core';
import forge from 'node-forge';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none',
  transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};
const monoInputStyle: React.CSSProperties = {
  ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.6, resize: 'none'
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'var(--color-text-3)', marginBottom: 6,
};

export const SSHKeyModal: React.FC = () => {
  const { isAddSSHModalOpen, closeAddSSHModal } = useUIStore();
  const { createSSHKey } = useVaultStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [hosts, setHosts] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [keyType, setKeyType] = useState<'rsa' | 'ed25519'>('ed25519');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isAddSSHModalOpen) {
      setName(''); setHosts(''); setPublicKey(''); setPrivateKey('');
      setMode('generate'); setKeyType('ed25519'); setError('');
    }
  }, [isAddSSHModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { setError('Key name is required'); return; }

    try {
      setIsGenerating(true);
      setError('');
      
      let finalPublicKey = publicKey;
      let finalPrivateKey = privateKey;
      let finalType = 'ssh-rsa';
      let finalFingerprint = 'Unknown';

      if (mode === 'generate') {
        const keypair = await generateSSHKeyPair(`scync-${name.replace(/\s+/g, '-').toLowerCase()}`, keyType);
        finalPublicKey = keypair.publicKey;
        finalPrivateKey = keypair.privateKey;
        finalType = keypair.type;
        finalFingerprint = keypair.fingerprint;
      } else {
        if (!publicKey.trim() || !privateKey.trim()) {
          setError('Both public and private keys are required for import');
          return;
        }

        if (publicKey.includes('ssh-ed25519')) {
          finalType = 'ssh-ed25519';
          try {
            const parts = publicKey.trim().split(/\s+/);
            const b64 = parts[1];
            if (b64) {
              const bin = forge.util.decode64(b64);
              const md5 = forge.md.md5.create();
              md5.update(bin);
              finalFingerprint = `MD5:${md5.digest().toHex().match(/.{2}/g)?.join(':')}`;
            }
          } catch (e) { console.warn('Failed to calculate Ed25519 fingerprint', e); }
        } else if (publicKey.includes('ssh-rsa')) {
          finalType = 'ssh-rsa';
          try {
            const parts = publicKey.trim().split(/\s+/);
            const b64 = parts[1];
            if (b64) {
              const bin = forge.util.decode64(b64);
              const md5 = forge.md.md5.create();
              md5.update(bin);
              finalFingerprint = `MD5:${md5.digest().toHex().match(/.{2}/g)?.join(':')}`;
            }
          } catch (e) { console.warn('Failed to calculate RSA fingerprint', e); }
        }
      }
      
      const hostArray = hosts.split(',').map(h => h.trim()).filter(Boolean);

      await createSSHKey(user.uid, {
        name, type: finalType, publicKey: finalPublicKey, privateKey: finalPrivateKey,
        fingerprint: finalFingerprint, hosts: hostArray, rotationDate: null
      });

      closeAddSSHModal();
    } catch (err: any) {
      setError(err.message || 'Failed to process key');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isAddSSHModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={closeAddSSHModal} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} 
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} 
            style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiTerminal size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{mode === 'generate' ? 'Generate SSH Key' : 'Import SSH Key'}</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0' }}>Securely manage your identity keys</p>
                </div>
              </div>
              <button onClick={closeAddSSHModal} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>

            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* Tabs UI - Scync Style */}
              <div style={{ display: 'flex', gap: 1, background: 'var(--color-border)', padding: 1, marginBottom: 20, border: '1px solid var(--color-border)' }}>
                {[
                  { id: 'generate', label: 'Generate', icon: <FiPlus size={13} /> },
                  { id: 'import', label: 'Import', icon: <FiDownload size={13} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as any)}
                    style={{
                      flex: 1, padding: '10px 0', border: 'none',
                      background: mode === tab.id ? 'var(--color-surface-3)' : 'var(--color-surface)',
                      color: mode === tab.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 140ms', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: 11.5, marginBottom: 18, borderRadius: 2 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Key Name / Alias</label>
                  <div style={{ position: 'relative' }}>
                    <FiTerminal size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My MacBook Pro" style={{ ...inputStyle, paddingLeft: 30 }} autoFocus
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Allowed Hosts / IP <span style={{ opacity: 0.4 }}>(Optional, comma separated)</span></label>
                  <div style={{ position: 'relative' }}>
                    <FiDatabase size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                    <input value={hosts} onChange={e => setHosts(e.target.value)} placeholder="e.g. 192.168.1.1, server.com" style={{ ...inputStyle, paddingLeft: 30 }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                  </div>
                </div>

                {mode === 'generate' ? (
                  <div>
                    <label style={labelStyle}>Algorithm</label>
                    <div style={{ display: 'flex', gap: 1, background: 'var(--color-border)', padding: 1, border: '1px solid var(--color-border)' }}>
                      {[
                        { id: 'ed25519', label: 'Ed25519 (Recommended)', sub: 'Fast & Secure' },
                        { id: 'rsa', label: 'RSA 4096', sub: 'Maximum Compatibility' }
                      ].map(type => (
                        <button
                          key={type.id} type="button"
                          onClick={() => setKeyType(type.id as any)}
                          style={{
                            flex: 1, padding: '12px 10px', border: 'none',
                            background: keyType === type.id ? 'var(--color-surface-3)' : 'var(--color-surface)',
                            color: keyType === type.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                            cursor: 'pointer', textAlign: 'center', transition: 'all 140ms'
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type.label}</div>
                          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{type.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={labelStyle}>Public Key</label>
                      <textarea required value={publicKey} onChange={e => setPublicKey(e.target.value)} rows={3} placeholder="ssh-rsa AAAAB3Nza..." style={{ ...monoInputStyle, height: 80 }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Private Key</label>
                      <textarea required value={privateKey} onChange={e => setPrivateKey(e.target.value)} rows={5} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" style={{ ...monoInputStyle, height: 120 }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10 }}>
                  <button type="button" onClick={closeAddSSHModal} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}>Cancel</button>
                  <button type="submit" disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.5 : 1, fontFamily: 'var(--font-sans)', transition: 'opacity 140ms' }}>
                    {isGenerating ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#080808', animation: 'spin 0.7s linear infinite' }} /> : mode === 'generate' ? 'Generate & Save' : 'Import Key'}
                  </button>
                </div>
              </form>
            </div>
            
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
