import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiKey, FiTerminal } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { generateSSHKeyPair } from '@scync/core';
import forge from 'node-forge';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError('Key name is required');
      return;
    }

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
        // Import mode
        if (!publicKey.trim() || !privateKey.trim()) {
          setError('Both public and private keys are required for import');
          return;
        }

        if (publicKey.includes('ssh-ed25519')) {
          finalType = 'ssh-ed25519';
          try {
            // Extract the base64 part
            const parts = publicKey.trim().split(/\s+/);
            const b64 = parts[1];
            if (b64) {
              const bin = forge.util.decode64(b64);
              const md5 = forge.md.md5.create();
              md5.update(bin);
              finalFingerprint = `MD5:${md5.digest().toHex().match(/.{2}/g)?.join(':')}`;
            }
          } catch (e) {
             console.warn('Failed to calculate Ed25519 fingerprint', e);
          }
        } else if (publicKey.includes('ssh-rsa')) {
          finalType = 'ssh-rsa';
          try {
             const forgeKey = forge.ssh.publicKeyToForge(publicKey);
             const fp = forge.ssh.getPublicKeyFingerprint(forgeKey, { encoding: 'hex', delimiter: ':' });
             finalFingerprint = `MD5:${fp}`;
          } catch (e) {
             console.warn('Failed to calculate RSA fingerprint', e);
          }
        }
      }
      
      const hostArray = hosts.split(',').map(h => h.trim()).filter(Boolean);

      await createSSHKey(user.uid, {
        name,
        type: finalType,
        publicKey: finalPublicKey,
        privateKey: finalPrivateKey,
        fingerprint: finalFingerprint,
        hosts: hostArray,
        rotationDate: null
      });

      closeAddSSHModal();
      setName('');
      setHosts('');
      setPublicKey('');
      setPrivateKey('');
      setMode('generate');
    } catch (err: any) {
      setError(err.message || 'Failed to process key');
    } finally {
      setIsGenerating(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px'
  };

  const modalStyle: React.CSSProperties = {
    width: '100%', maxWidth: 440,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 8, overflow: 'hidden',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
    display: 'flex', flexDirection: 'column'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    padding: '8px 12px', fontSize: 13,
    color: 'var(--color-text)', borderRadius: 4,
    outline: 'none', fontFamily: 'var(--font-sans)',
    transition: 'border-color 140ms'
  };

  return (
    <AnimatePresence>
      {isAddSSHModalOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={overlayStyle}
          onClick={closeAddSSHModal}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={modalStyle}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTerminal style={{ color: 'var(--color-text)' }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  {mode === 'generate' ? 'Generate SSH Key' : 'Import SSH Key'}
                </h2>
              </div>
              <button onClick={closeAddSSHModal} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
                <FiX size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setMode('generate')}
                style={{
                  flex: 1, padding: '10px', border: 'none', background: 'none',
                  fontSize: 12, fontWeight: 600, color: mode === 'generate' ? 'var(--color-text)' : 'var(--color-text-muted)',
                  borderBottom: mode === 'generate' ? '2px solid var(--color-green)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Generate
              </button>
              <button
                onClick={() => setMode('import')}
                style={{
                  flex: 1, padding: '10px', border: 'none', background: 'none',
                  fontSize: 12, fontWeight: 600, color: mode === 'import' ? 'var(--color-text)' : 'var(--color-text-muted)',
                  borderBottom: mode === 'import' ? '2px solid var(--color-green)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                Import
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, borderRadius: 4 }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 6 }}>Key Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. GitHub Production Key"
                  style={inputStyle} autoFocus required
                />
              </div>

              {mode === 'generate' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 6 }}>Key Type</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setKeyType('ed25519')}
                      style={{
                        flex: 1, padding: '8px', border: '1px solid var(--color-border)',
                        background: keyType === 'ed25519' ? 'var(--color-surface-3)' : 'var(--color-bg)',
                        color: keyType === 'ed25519' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: 'pointer', transition: 'all 140ms'
                      }}
                    >
                      Ed25519 (Modern)
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeyType('rsa')}
                      style={{
                        flex: 1, padding: '8px', border: '1px solid var(--color-border)',
                        background: keyType === 'rsa' ? 'var(--color-surface-3)' : 'var(--color-bg)',
                        color: keyType === 'rsa' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: 'pointer', transition: 'all 140ms'
                      }}
                    >
                      RSA 4096 (Legacy)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 6 }}>Hosts (Comma separated)</label>
                <input
                  value={hosts} onChange={e => setHosts(e.target.value)}
                  placeholder="github.com, gitlab.com"
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>Used to automatically generate your ~/.ssh/config file.</p>
              </div>

              {mode === 'import' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 6 }}>Public Key</label>
                    <textarea
                      value={publicKey} onChange={e => setPublicKey(e.target.value)}
                      placeholder="ssh-rsa AAAAB3Nza..."
                      style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      required={mode === 'import'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 6 }}>Private Key (PEM format)</label>
                    <textarea
                      value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----"
                      style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      required={mode === 'import'}
                    />
                  </div>
                </>
              )}

              <div style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 4, border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--color-text)' }}>Security Note:</strong> {mode === 'generate' 
                    ? `A ${keyType.toUpperCase()} key pair will be securely generated directly in your browser.` 
                    : 'Your imported keys will be securely encrypted locally.'} The private key will be AES-GCM encrypted with your Master Password before saving to the cloud.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button" onClick={closeAddSSHModal}
                  style={{ padding: '8px 14px', background: 'none', border: 'none', color: 'var(--color-text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isGenerating}
                  style={{
                    padding: '8px 14px', background: 'var(--color-green)', color: 'black',
                    border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, opacity: isGenerating ? 0.7 : 1
                  }}
                >
                  {isGenerating ? (mode === 'generate' ? 'Generating...' : 'Saving...') : <><FiKey /> {mode === 'generate' ? 'Generate Key' : 'Import Key'}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
