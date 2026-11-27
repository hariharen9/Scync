import React, { useState, useEffect, useRef } from 'react';
import { FiTerminal, FiDatabase, FiPlus, FiDownload, FiUpload, FiCheckCircle, FiLock } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import {
  generateSSHKeyPair,
  parseSSHPrivateKey,
  computeOpenSSHFingerprint,
  detectSSHKeyType,
} from '@scync/core';
import {
  ModalShell,
  modalInputStyle,
  modalMonoInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

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

      setIsGenerating(false);
      closeAddSSHModal();
    } catch (err: any) {
      setError(err.message || 'Failed to process key');
      setIsGenerating(false);
    }
  };

  return (
    <ModalShell
      isOpen={isAddSSHModalOpen}
      onClose={() => { if (!isGenerating) closeAddSSHModal(); }}
      title={mode === 'generate' ? 'Generate SSH Key' : 'Import SSH / .pem Key'}
      subtitle="Zero-knowledge identity & cloud VM keypair"
      icon={<FiTerminal size={15} />}
      maxWidth={540}
      busy={isGenerating}
    >
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: 1, background: 'var(--color-border)', padding: 1, marginBottom: 18, border: '1px solid var(--color-border)' }}>
        {[
          { id: 'generate', label: 'Generate Keypair', icon: <FiPlus size={13} /> },
          { id: 'import', label: 'Import .pem / Key', icon: <FiDownload size={13} /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id as any)}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              background: mode === tab.id ? 'var(--color-surface-3)' : 'var(--color-surface)',
              color: mode === tab.id ? 'var(--color-text)' : 'var(--color-text-2)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={modalLabelStyle}>Key Name / Alias</label>
            <div style={{ position: 'relative' }}>
              <FiTerminal size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. azure-prod-vm" style={{ ...modalInputStyle, paddingLeft: 30 }} autoFocus
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
            </div>
          </div>

          <div>
            <label style={modalLabelStyle}>Allowed Hosts / IP</label>
            <div style={{ position: 'relative' }}>
              <FiDatabase size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
              <input value={hosts} onChange={e => setHosts(e.target.value)} placeholder="20.198.x.x, vm.dev" style={{ ...modalInputStyle, paddingLeft: 30 }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
            </div>
          </div>
        </div>

        {mode === 'generate' ? (
          <div>
            <label style={modalLabelStyle}>Algorithm</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'ed25519', label: 'Ed25519 (Recommended)', sub: 'Fast, modern & compact' },
                { id: 'rsa', label: 'RSA 4096', sub: 'Legacy / maximum compatibility' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setKeyType(type.id as any)}
                  style={{
                    padding: '13px 12px',
                    border: `1px solid ${keyType === type.id ? 'var(--color-green)' : 'var(--color-border)'}`,
                    background: keyType === type.id ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-2)',
                    color: keyType === type.id ? 'var(--color-text)' : 'var(--color-text-2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{type.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3 }}>{type.sub}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
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
                padding: '13px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiUpload size={15} color="var(--color-green)" />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>
                    Drop your <span style={{ fontFamily: 'var(--font-mono)' }}>.pem</span> / <span style={{ fontFamily: 'var(--font-mono)' }}>.key</span> file here
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    Azure VM, AWS EC2 &amp; OpenSSH supported
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-green)' }}>
                Browse
              </span>
            </div>

            <div>
              <label style={modalLabelStyle}>Private Key (.pem / OpenSSH)</label>
              <textarea required value={privateKey} onChange={e => setPrivateKey(e.target.value)} rows={5} placeholder={'-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'} style={{ ...modalMonoInputStyle, height: 115, resize: 'none' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
              {parsedInfo && (
                <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: parsedInfo.derivedPublicKey ? 'var(--color-green)' : 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {parsedInfo.derivedPublicKey && <FiCheckCircle size={12} />}
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
                <label style={modalLabelStyle}>
                  Key Passphrase <span style={{ opacity: 0.55, textTransform: 'none' }}>(Optional — to derive public key)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FiLock size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Enter PEM passphrase"
                    style={{ ...modalInputStyle, paddingLeft: 30 }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                </div>
                {parsedInfo.passphraseError && passphrase && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{parsedInfo.passphraseError}</div>
                )}
              </div>
            )}

            <div>
              <label style={modalLabelStyle}>
                Public Key <span style={{ opacity: 0.55, textTransform: 'none' }}>(Optional — auto-derived when possible)</span>
              </label>
              <textarea value={publicKey} onChange={e => setPublicKey(e.target.value)} rows={3} placeholder="ssh-rsa AAAAB3Nza... (auto-filled from .pem if supported)" style={{ ...modalMonoInputStyle, height: 74, resize: 'none' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={closeAddSSHModal} style={modalBtnSecondary}>Cancel</button>
          <button type="submit" disabled={isGenerating} style={{ ...modalBtnPrimary, opacity: isGenerating ? 0.5 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}>
            {isGenerating ? 'Processing...' : mode === 'generate' ? 'Generate & Save' : 'Import Key'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
