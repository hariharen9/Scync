import React, { useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { FiKey, FiCopy, FiEye, FiEyeOff, FiTrash2, FiTerminal, FiDownload, FiCheck, FiPlus } from 'react-icons/fi';
import type { StoredSSHKey } from '@scync/core';

export const SSHManagerDashboard: React.FC = () => {
  const { storedSSHKeys, decryptSSHKey, deleteSSHKey } = useVaultStore();
  const { openAddSSHModal, openConfirmModal } = useUIStore();
  const { user } = useAuthStore(); // Need auth store for uid. Will import it.
  
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'keys' | 'config'>('keys');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customConfig, setCustomConfig] = useState<string | null>(null);

  const renderConfig = () => {
    if (storedSSHKeys.length === 0) return '# SCYNC SSH CONFIG\n# No keys available.';
    let config = '# ── SCYNC SSH CONFIG ─────────────────────────────────\n# Add this to your ~/.ssh/config\n\n';
    storedSSHKeys.forEach(key => {
      if (key.hosts && key.hosts.length > 0) {
        key.hosts.forEach(host => {
          const fileName = key.name.replace(/\s+/g, '-').toLowerCase();
          config += `Host ${host}\n`;
          config += `  IdentityFile ~/.ssh/${fileName}\n`;
          config += `  IdentitiesOnly yes\n\n`;
        });
      }
    });
    return config;
  };

  const configText = customConfig !== null ? customConfig : renderConfig();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReveal = async (key: StoredSSHKey) => {
    if (revealedKeys[key.id]) {
      const newKeys = { ...revealedKeys };
      delete newKeys[key.id];
      setRevealedKeys(newKeys);
    } else {
      const decrypted = await decryptSSHKey(key.id);
      if (decrypted) {
        setRevealedKeys({ ...revealedKeys, [key.id]: decrypted.privateKey });
      }
    }
  };

  const handleDelete = (key: StoredSSHKey) => {
    if (!user) return;
    openConfirmModal({
      title: 'Delete SSH Key',
      message: `Are you sure you want to delete ${key.name}? This will permanently destroy the private key from your vault.`,
      confirmText: 'Delete Key',
      danger: true,
      onConfirm: async () => {
        await deleteSSHKey(user.uid, key.id);
      }
    });
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', fontFamily: 'var(--font-sans)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiTerminal /> SSH Manager
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, fontFamily: 'var(--font-sans)' }}>Zero-knowledge storage and generation for your SSH keys.</p>
        </div>
        <button
          onClick={openAddSSHModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'opacity 140ms'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <FiPlus size={14} />
          <span className="hidden sm:inline">Add / Generate Keys</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveTab('keys')}
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: activeTab === 'keys' ? 'var(--color-text)' : 'var(--color-text-3)',
            borderBottom: activeTab === 'keys' ? '2px solid var(--color-text)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 140ms'
          }}
        >
          VAULTED KEYS
        </button>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: activeTab === 'config' ? 'var(--color-text)' : 'var(--color-text-3)',
            borderBottom: activeTab === 'config' ? '2px solid var(--color-text)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 140ms'
          }}
        >
          SSH CONFIG
        </button>
      </div>

      {activeTab === 'keys' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))', 
          gap: 20, 
          flex: 1, 
          overflowY: 'auto',
          alignContent: 'start'
        }}>
          {storedSSHKeys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <FiKey size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No SSH keys found in your vault.</p>
            </div>
          ) : (
            storedSSHKeys.map(key => (
              <div key={key.id} style={{ border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>{key.name}</h3>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>{key.type}</span>
                      <span>•</span>
                      <span title="MD5 Fingerprint">{key.fingerprint}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleDelete(key)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', opacity: 0.7 }}
                      title="Delete Key"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '20px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Public Key</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button 
                          onClick={() => handleCopy(key.publicKey, `${key.id}-pub`)} 
                          style={{ background: 'none', border: 'none', color: copiedId === `${key.id}-pub` ? 'var(--color-green)' : 'var(--color-text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', transition: 'color 140ms' }}
                        >
                          {copiedId === `${key.id}-pub` ? <><FiCheck size={12} /> Copied</> : <><FiCopy size={12} /> Copy</>}
                        </button>
                        <button onClick={() => handleDownload(`${key.name.toLowerCase().replace(/\s+/g, '-')}.pub`, key.publicKey)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                          <FiDownload size={12} /> Export .pub
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {key.publicKey}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Private Key</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {revealedKeys[key.id] && (
                          <>
                            <button 
                              onClick={() => handleCopy(revealedKeys[key.id], `${key.id}-priv`)} 
                              style={{ background: 'none', border: 'none', color: copiedId === `${key.id}-priv` ? 'var(--color-green)' : 'var(--color-text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', transition: 'color 140ms' }}
                            >
                              {copiedId === `${key.id}-priv` ? <><FiCheck size={12} /> Copied</> : <><FiCopy size={12} /> Copy</>}
                            </button>
                            <button onClick={() => handleDownload(`${key.name.toLowerCase().replace(/\s+/g, '-')}.pem`, revealedKeys[key.id])} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                              <FiDownload size={12} /> Export .pem
                            </button>
                          </>
                        )}
                        <button onClick={() => handleReveal(key)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                          {revealedKeys[key.id] ? <><FiEyeOff size={12} /> Hide</> : <><FiEye size={12} /> Reveal</>}
                        </button>
                      </div>
                    </div>
                    {revealedKeys[key.id] ? (
                       <pre 
                         data-lenis-prevent
                         style={{ margin: 0, padding: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 2, fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 120 }}
                       >
                        {revealedKeys[key.id]}
                      </pre>
                    ) : (
                      <div style={{ padding: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>********************</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#0a0a0a', border: '1px solid var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#666', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>SSH_CONFIG_MANIFEST</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => handleCopy(configText, 'ssh-config')} 
                style={{ background: 'none', border: '1px solid #333', padding: '4px 10px', borderRadius: 2, color: copiedId === 'ssh-config' ? 'var(--color-green)' : '#888', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', transition: 'color 140ms' }}
              >
                {copiedId === 'ssh-config' ? <><FiCheck size={10} /> Copied</> : <><FiCopy size={10} /> Copy</>}
              </button>
              <button 
                onClick={() => handleDownload('ssh_config', configText)} 
                style={{ background: 'none', border: '1px solid #333', padding: '4px 10px', borderRadius: 2, color: '#888', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase' }}
              >
                <FiDownload size={10} /> Export
              </button>
            </div>
          </div>
          <textarea
            data-lenis-prevent
            value={configText}
            onChange={(e) => setCustomConfig(e.target.value)}
            style={{ 
              flex: 1, margin: 0, padding: 20, 
              background: 'transparent', border: 'none', 
              color: '#d4d4d4', fontSize: 13, 
              fontFamily: 'var(--font-mono)', overflowY: 'auto', 
              lineHeight: 1.6, resize: 'none', outline: 'none' 
            }}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
};
