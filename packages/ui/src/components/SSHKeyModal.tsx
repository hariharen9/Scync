import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTerminal, FiDatabase, FiPlus, FiDownload, FiUpload, FiCheckCircle, FiLock } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import {
  generateSSHKeyPair,
  parseSSHPrivateKey,
  computeOpenSSHFingerprint,
  detectSSHKeyType,
} from '@scync/core';

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
  const { isAddSSHModalOpen, sshImportPrefill, closeAddSSHModal } = useUIStore();
  const { createSSHKey } = useVaultStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [hosts, setHosts] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [keyType, setKeyType] = useState<'rsa' | 'ed25519'>('ed25519');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{
    type: string;
    fingerprint: string;
    derivedPublicKey: boolean;
    needsPassphrase: boolean;
    passphraseError?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes, or apply prefill when opened from SecretForm
  useEffect(() => {
    if (!isAddSSHModalOpen) {
      setName(''); setHosts(''); setPublicKey(''); setPrivateKey(''); setPassphrase('');
      setMode('generate'); setKeyType('ed25519'); setError('');
      setParsedInfo(null); setIsDragging(false);
    } else if (sshImportPrefill) {
      setMode('import');
      setPrivateKey(sshImportPrefill.privateKey);
      if (sshImportPrefill.name) setName(sshImportPrefill.name);
    }
  }, [isAddSSHModalOpen, sshImportPrefill]);

  // Auto-parse private key in import mode to derive public key, type, and fingerprint
  useEffect(() => {
    if (mode !== 'import' || !privateKey.trim()) {
      setParsedInfo(null);
      return;
    }

    let cancelled = false;
    const comment = name.trim() ? `scync-${name.trim().replace(/\s+/g, '-').toLowerCase()}` : undefined;

    parseSSHPrivateKey(privateKey, passphrase || undefined, comment).then((res) => {
      if (cancelled) return;
      if (res.publicKey) {
        setPublicKey((prev) => (prev.trim() === '' || parsedInfo?.derivedPublicKey ? res.publicKey : prev));
      }
      setParsedInfo({
        type: res.type,
        fingerprint: res.fingerprint,
        derivedPublicKey: Boolean(res.publicKey),
        needsPassphrase: res.needsPassphrase,
        passphraseError: res.passphraseError,
      });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateKey, passphrase, mode]);

  const handlePemFile = async (file: File) => {
    try {
      const content = await file.text();
      if (!content.trim()) {
        setError('Selected file is empty.');
        return;
      }
      setError('');
      setMode('import');
      setPrivateKey(content.trim());
      if (!name.trim()) {
        const baseName = file.name.replace(/\.(pem|key|ppk|txt)$/i, '');
        if (baseName) setName(baseName);
      }
    } catch {
      setError('Failed to read key file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { setError('Key name is required'); return; }

    try {
      setIsGenerating(true);
      setError('');

      let finalPublicKey = publicKey.trim();
      let finalPrivateKey = privateKey.trim();
      let finalType = 'ssh-rsa';
      let finalFingerprint = 'Unknown';

      if (mode === 'generate') {
        const keypair = await generateSSHKeyPair(`scync-${name.replace(/\s+/g, '-').toLowerCase()}`, keyType);
        finalPublicKey = keypair.publicKey;
        finalPrivateKey = keypair.privateKey;
        finalType = keypair.type;
        finalFingerprint = keypair.fingerprint;
      } else {
        if (!finalPrivateKey) {
          setError('Private key (.pem / OpenSSH) is required for import');
          return;
        }

        const comment = `scync-${name.trim().replace(/\s+/g, '-').toLowerCase()}`;
        const parsed = await parseSSHPrivateKey(finalPrivateKey, passphrase || undefined, comment);

        if (!finalPublicKey && parsed.publicKey) {
          finalPublicKey = parsed.publicKey;
        }

        if (finalPublicKey) {
          finalType = detectSSHKeyType(finalPublicKey);
          finalFingerprint = computeOpenSSHFingerprint(finalPublicKey);
        } else {
          finalType = parsed.type;
          finalFingerprint = parsed.fingerprint;
        }
      }

      const hostArray = hosts.split(',').map(h => h.trim()).filter(Boolean);

      await createSSHKey(user.uid, {
        name: name.trim(),
        type: finalType,
        publicKey: finalPublicKey,
        privateKey: finalPrivateKey,
        fingerprint: finalFingerprint,
        hosts: hostArray,
        rotationDate: null,
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
            style={{ position: 'relative', width: '100%', maxWidth: 460, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiTerminal size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{mode === 'generate' ? 'Generate SSH Key' : 'Import SSH / .pem Key'}</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0' }}>Securely manage your identity &amp; cloud VM keys</p>
                </div>
              </div>
              <button onClick={closeAddSSHModal} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>

            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '80vh', overflowY: 'auto' }}>

              {/* Tabs UI - Scync Style */}
              <div style={{ display: 'flex', gap: 1, background: 'var(--color-border)', padding: 1, marginBottom: 20, border: '1px solid var(--color-border)' }}>
                {[
                  { id: 'generate', label: 'Generate', icon: <FiPlus size={13} /> },
                  { id: 'import', label: 'Import .pem / Key', icon: <FiDownload size={13} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
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
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. azure-prod-vm" style={{ ...inputStyle, paddingLeft: 30 }} autoFocus
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Allowed Hosts / IP <span style={{ opacity: 0.4 }}>(Optional, comma separated)</span></label>
                  <div style={{ position: 'relative' }}>
                    <FiDatabase size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                    <input value={hosts} onChange={e => setHosts(e.target.value)} placeholder="e.g. 20.198.x.x, vm.example.com" style={{ ...inputStyle, paddingLeft: 30 }}
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
                    {/* .pem / key file dropzone */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pem,.key,.txt,text/plain"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePemFile(file);
                        e.target.value = '';
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePemFile(file);
                      }}
                      style={{
                        border: `1px dashed ${isDragging ? 'var(--color-green)' : 'var(--color-border-2)'}`,
                        background: isDragging ? 'rgba(16, 185, 129, 0.06)' : 'var(--color-surface-2)',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        cursor: 'pointer',
                        transition: 'border-color 140ms, background 140ms',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiUpload size={14} color="var(--color-green)" />
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)' }}>
                            Drop your <span style={{ fontFamily: 'var(--font-mono)' }}>.pem</span> / <span style={{ fontFamily: 'var(--font-mono)' }}>.key</span> file here
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 1 }}>
                            Works with Azure VM, AWS EC2, and OpenSSH private keys
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-green)' }}>
                        Browse
                      </span>
                    </div>

                    <div>
                      <label style={labelStyle}>Private Key (.pem / OpenSSH)</label>
                      <textarea required value={privateKey} onChange={e => setPrivateKey(e.target.value)} rows={5} placeholder={'-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'} style={{ ...monoInputStyle, height: 115 }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                      {parsedInfo && (
                        <div style={{ marginTop: 6, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: parsedInfo.derivedPublicKey ? 'var(--color-green)' : 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {parsedInfo.derivedPublicKey && <FiCheckCircle size={11} />}
                          <span>
                            {parsedInfo.type}
                            {parsedInfo.fingerprint !== 'Unknown' ? ` • ${parsedInfo.fingerprint}` : ''}
                            {parsedInfo.derivedPublicKey ? ' • Public key auto-derived' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {parsedInfo?.needsPassphrase && (
                      <div>
                        <label style={labelStyle}>
                          Key Passphrase <span style={{ opacity: 0.45 }}>(Optional — to derive public key)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <FiLock size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                          <input
                            type="password"
                            value={passphrase}
                            onChange={e => setPassphrase(e.target.value)}
                            placeholder="Enter PEM passphrase"
                            style={{ ...inputStyle, paddingLeft: 30 }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                          />
                        </div>
                        {parsedInfo.passphraseError && passphrase && (
                          <div style={{ fontSize: 10.5, color: '#ef4444', marginTop: 4 }}>{parsedInfo.passphraseError}</div>
                        )}
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>
                        Public Key <span style={{ opacity: 0.45 }}>(Optional — auto-derived when possible)</span>
                      </label>
                      <textarea value={publicKey} onChange={e => setPublicKey(e.target.value)} rows={3} placeholder="ssh-rsa AAAAB3Nza... (auto-filled from .pem if supported)" style={{ ...monoInputStyle, height: 74 }}
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
