import React, { useState, useEffect, useMemo } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import {
  FiCopy,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiTerminal,
  FiDownload,
  FiCheck,
  FiPlus,
  FiSearch,
  FiServer,
  FiLock,
  FiKey,
  FiRefreshCw,
  FiShield,
} from 'react-icons/fi';
import type { StoredSSHKey } from '@scync/core';
import { useClipboard } from '../hooks/useClipboard';

const REVEAL_TTL_SECONDS = 15;

const getSlug = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-|-$/g, '') || 'ssh-key';

const formatShortDate = (d?: Date | null) => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getAlgoBadge = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('ed25519')) {
    return { label: 'ED25519', color: 'var(--color-green)', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.28)' };
  }
  if (lower.includes('rsa')) {
    return { label: 'RSA', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.28)' };
  }
  if (lower.includes('ecdsa')) {
    return { label: 'ECDSA', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.28)' };
  }
  return { label: type.toUpperCase(), color: 'var(--color-text-2)', bg: 'var(--color-surface-2)', border: 'var(--color-border)' };
};

export const SSHManagerDashboard: React.FC = () => {
  const { storedSSHKeys, decryptSSHKey, deleteSSHKey } = useVaultStore();
  const { openAddSSHModal, openConfirmModal } = useUIStore();
  const { user } = useAuthStore();
  const { copy } = useClipboard();

  const [revealedKeys, setRevealedKeys] = useState<Record<string, { value: string; remaining: number }>>({});
  const [activeTab, setActiveTab] = useState<'keys' | 'config'>('keys');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customConfig, setCustomConfig] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [algoFilter, setAlgoFilter] = useState<'all' | 'ed25519' | 'rsa' | 'hosts'>('all');

  // Auto-hide countdown for revealed private keys (15s)
  useEffect(() => {
    const hasRevealed = Object.keys(revealedKeys).length > 0;
    if (!hasRevealed) return;

    const timer = setInterval(() => {
      setRevealedKeys((prev) => {
        const next: Record<string, { value: string; remaining: number }> = {};
        let changed = false;
        for (const [id, entry] of Object.entries(prev)) {
          if (entry.remaining > 1) {
            next[id] = { ...entry, remaining: entry.remaining - 1 };
            changed = true;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [revealedKeys]);

  const stats = useMemo(() => {
    const total = storedSSHKeys.length;
    const ed25519 = storedSSHKeys.filter((k) => k.type.toLowerCase().includes('ed25519')).length;
    const rsa = storedSSHKeys.filter((k) => k.type.toLowerCase().includes('rsa')).length;
    const hostsCount = storedSSHKeys.reduce((acc, k) => acc + (k.hosts?.length || 0), 0);
    return { total, ed25519, rsa, hostsCount };
  }, [storedSSHKeys]);

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    return storedSSHKeys.filter((k) => {
      if (algoFilter === 'ed25519' && !k.type.toLowerCase().includes('ed25519')) return false;
      if (algoFilter === 'rsa' && !k.type.toLowerCase().includes('rsa')) return false;
      if (algoFilter === 'hosts' && (!k.hosts || k.hosts.length === 0)) return false;
      if (!q) return true;
      return (
        k.name.toLowerCase().includes(q) ||
        k.fingerprint.toLowerCase().includes(q) ||
        k.type.toLowerCase().includes(q) ||
        (k.hosts || []).some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [storedSSHKeys, search, algoFilter]);

  const renderConfig = () => {
    if (storedSSHKeys.length === 0) {
      return '# SCYNC SSH CONFIG\n# No keys available in vault.';
    }
    const keysWithHosts = storedSSHKeys.filter((k) => k.hosts && k.hosts.length > 0);
    if (keysWithHosts.length === 0) {
      return '# ── SCYNC SSH CONFIG ─────────────────────────────────\n# No mapped hosts yet. Add Allowed Hosts / IPs to your keys to generate entries.\n';
    }

    let config = '# ── SCYNC SSH CONFIG ─────────────────────────────────\n# Add this to your ~/.ssh/config (and run: chmod 400 ~/.ssh/*.pem)\n\n';
    keysWithHosts.forEach((key) => {
      const fileName = getSlug(key.name);
      key.hosts.forEach((host) => {
        config += `Host ${host}\n`;
        config += `  HostName ${host}\n`;
        config += `  IdentityFile ~/.ssh/${fileName}.pem\n`;
        config += `  IdentitiesOnly yes\n\n`;
      });
    });
    return config;
  };

  const configText = customConfig !== null ? customConfig : renderConfig();

  const handleCopy = (text: string, id: string) => {
    copy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
  };

  const handleReveal = async (key: StoredSSHKey) => {
    if (revealedKeys[key.id]) {
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[key.id];
        return next;
      });
      return;
    }

    const decrypted = await decryptSSHKey(key.id);
    if (decrypted) {
      setRevealedKeys((prev) => ({
        ...prev,
        [key.id]: { value: decrypted.privateKey, remaining: REVEAL_TTL_SECONDS },
      }));
    }
  };

  const handleDelete = (key: StoredSSHKey) => {
    if (!user) return;
    openConfirmModal({
      title: 'Delete SSH Key',
      message: `Are you sure you want to delete "${key.name}"? This will permanently destroy the private key from your vault.`,
      confirmText: 'Delete Key',
      danger: true,
      onConfirm: async () => {
        await deleteSSHKey(user.uid, key.id);
      },
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
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}>
              <FiTerminal size={17} style={{ color: 'var(--color-green)' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--color-text)',
                margin: 0,
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.1,
              }}>
                SSH Keys
              </h2>
              <p style={{
                fontSize: 12,
                color: 'var(--color-text-3)',
                margin: '4px 0 0 0',
                fontFamily: 'var(--font-mono)',
              }}>
                Zero-knowledge identity &amp; cloud VM <span style={{ color: 'var(--color-text-2)' }}>.pem</span> vault
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => openAddSSHModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 16px',
              background: 'white',
              color: '#080808',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background 140ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#ebebeb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          >
            <FiPlus size={14} />
            Add / Import .pem
          </button>
        </div>
      </div>

      {/* ─── Telemetry Strip ─── */}
      {storedSSHKeys.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 1,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
        }}>
          {[
            { label: 'VAULTED KEYS', value: stats.total, sub: 'AES-256-GCM', accent: 'var(--color-text)' },
            { label: 'ED25519 / RSA', value: `${stats.ed25519} / ${stats.rsa}`, sub: 'Key Algorithms', accent: 'var(--color-green)' },
            { label: 'MAPPED HOSTS', value: stats.hostsCount, sub: 'SSH Config Targets', accent: 'var(--color-text)' },
            { label: 'CLIPBOARD HYGIENE', value: '30s', sub: 'Auto-clear enabled', accent: 'var(--color-green)' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--color-surface)', padding: '14px 16px' }}>
              <div style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--color-text-3)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 6,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 20,
                fontWeight: 800,
                color: stat.accent,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--color-text-3)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tabs & Toolbar ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { id: 'keys' as const, label: `VAULTED KEYS (${storedSSHKeys.length})` },
            { id: 'config' as const, label: 'SSH CONFIG' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 0 12px 0',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-3)',
                  borderBottom: isActive ? '2px solid var(--color-green)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 140ms',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'keys' && storedSSHKeys.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name, host, fingerprint..."
                style={{
                  width: 230,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '6px 10px 6px 28px',
                  fontSize: 11.5,
                  color: 'var(--color-text)',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-focus)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
            </div>

            <div style={{ display: 'flex', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              {[
                { id: 'all' as const, label: 'ALL' },
                { id: 'ed25519' as const, label: 'ED25519' },
                { id: 'rsa' as const, label: 'RSA' },
                { id: 'hosts' as const, label: 'HOSTS' },
              ].map((f) => {
                const active = algoFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setAlgoFilter(f.id)}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      background: active ? 'var(--color-surface-3)' : 'transparent',
                      color: active ? 'var(--color-green)' : 'var(--color-text-3)',
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      {activeTab === 'keys' ? (
        <>
          {storedSSHKeys.length === 0 ? (
            <div style={{
              border: '1px dashed var(--color-border-2)',
              background: 'var(--color-surface)',
              padding: '64px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}>
              <div style={{
                width: 52,
                height: 52,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}>
                <FiKey size={22} color="var(--color-green)" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0', fontFamily: 'var(--font-sans)' }}>
                No SSH keys in your vault
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 22px 0', maxWidth: 380, lineHeight: 1.55, fontFamily: 'var(--font-sans)' }}>
                Import an existing Azure VM / AWS EC2 <span style={{ fontFamily: 'var(--font-mono)' }}>.pem</span> key or generate a fresh Ed25519 / RSA-4096 keypair with zero-knowledge encryption.
              </p>
              <button
                onClick={() => openAddSSHModal()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  background: 'white',
                  color: '#080808',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <FiPlus size={14} /> Add or Import .pem Key
              </button>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              padding: '44px 24px',
              textAlign: 'center',
              color: 'var(--color-text-3)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
            }}>
              No SSH keys match your current filter.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))',
              gap: 16,
              alignItems: 'start',
            }}>
              {filteredKeys.map((key) => {
                const badge = getAlgoBadge(key.type);
                const revealed = revealedKeys[key.id];
                const slug = getSlug(key.name);
                const primaryHost = key.hosts?.[0];
                const sshCmd = primaryHost ? `ssh -i ~/.ssh/${slug}.pem ${primaryHost}` : null;

                return (
                  <div
                    key={key.id}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderTop: `2px solid ${badge.color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'border-color 140ms, background 140ms',
                    }}
                  >
                    {/* Card Header */}
                    <div style={{
                      padding: '16px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            padding: '2px 7px',
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                            Added {formatShortDate(key.createdAt)}
                          </span>
                        </div>

                        <h3 style={{
                          margin: '0 0 6px 0',
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--color-text)',
                          fontFamily: 'var(--font-sans)',
                          letterSpacing: '-0.02em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {key.name}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            title="MD5 Fingerprint"
                            style={{
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                              fontFamily: 'var(--font-mono)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {key.fingerprint}
                          </span>
                          {key.fingerprint && key.fingerprint !== 'Unknown' && (
                            <button
                              onClick={() => handleCopy(key.fingerprint, `${key.id}-fp`)}
                              title="Copy fingerprint"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 2,
                                color: copiedId === `${key.id}-fp` ? 'var(--color-green)' : 'var(--color-text-3)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              {copiedId === `${key.id}-fp` ? <FiCheck size={11} /> : <FiCopy size={11} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(key)}
                        style={{
                          width: 28,
                          height: 28,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-3)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 140ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-red)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-3)';
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                        title="Delete Key"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>

                    {/* Hosts & Quick Connect */}
                    {(key.hosts && key.hosts.length > 0) && (
                      <div style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface-2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <FiServer size={11} color="var(--color-text-3)" />
                          {key.hosts.map((host) => (
                            <span
                              key={host}
                              style={{
                                fontSize: 10.5,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-text-2)',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                padding: '2px 7px',
                              }}
                            >
                              {host}
                            </span>
                          ))}
                        </div>
                        {sshCmd && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            padding: '6px 9px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                          }}>
                            <code style={{
                              fontSize: 10.5,
                              color: 'var(--color-green)',
                              fontFamily: 'var(--font-mono)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              $ {sshCmd}
                            </code>
                            <button
                              onClick={() => handleCopy(sshCmd, `${key.id}-cmd`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedId === `${key.id}-cmd` ? 'var(--color-green)' : 'var(--color-text-3)',
                                fontSize: 9.5,
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0,
                              }}
                            >
                              {copiedId === `${key.id}-cmd` ? <><FiCheck size={10} /> COPIED</> : <><FiCopy size={10} /> COPY</>}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Key Payloads */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {key.publicKey && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>
                              Public Key
                            </span>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button
                                onClick={() => handleCopy(key.publicKey, `${key.id}-pub`)}
                                style={{
                                  background: 'none', border: 'none',
                                  color: copiedId === `${key.id}-pub` ? 'var(--color-green)' : 'var(--color-text-muted)',
                                  fontSize: 9.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
                                }}
                              >
                                {copiedId === `${key.id}-pub` ? <><FiCheck size={11} /> Copied</> : <><FiCopy size={11} /> Copy</>}
                              </button>
                              <button
                                onClick={() => handleDownload(`${slug}.pub`, key.publicKey)}
                                style={{
                                  background: 'none', border: 'none', color: 'var(--color-text-muted)',
                                  fontSize: 9.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
                                }}
                              >
                                <FiDownload size={11} /> .pub
                              </button>
                            </div>
                          </div>
                          <div style={{
                            padding: '7px 10px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {key.publicKey}
                          </div>
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>
                              Private Key (.pem)
                            </span>
                            {revealed && (
                              <span style={{
                                fontSize: 9.5,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-green)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '1px 6px',
                              }}>
                                AUTO-HIDE {revealed.remaining}s
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            {revealed && (
                              <>
                                <button
                                  onClick={() => handleCopy(revealed.value, `${key.id}-priv`)}
                                  style={{
                                    background: 'none', border: 'none',
                                    color: copiedId === `${key.id}-priv` ? 'var(--color-green)' : 'var(--color-text-muted)',
                                    fontSize: 9.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
                                  }}
                                >
                                  {copiedId === `${key.id}-priv` ? <><FiCheck size={11} /> Copied</> : <><FiCopy size={11} /> Copy</>}
                                </button>
                                <button
                                  onClick={() => handleDownload(`${slug}.pem`, revealed.value)}
                                  style={{
                                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                                    fontSize: 9.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
                                  }}
                                >
                                  <FiDownload size={11} /> .pem
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleReveal(key)}
                              style={{
                                background: 'none', border: 'none',
                                color: revealed ? 'var(--color-text)' : 'var(--color-green)',
                                fontSize: 9.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
                              }}
                            >
                              {revealed ? <><FiEyeOff size={11} /> Hide</> : <><FiEye size={11} /> Reveal</>}
                            </button>
                          </div>
                        </div>

                        {revealed ? (
                          <pre
                            data-lenis-prevent
                            style={{
                              margin: 0,
                              padding: 12,
                              background: 'var(--color-bg)',
                              border: '1px solid var(--color-green-border, rgba(16, 185, 129, 0.3))',
                              fontSize: 10.5,
                              color: 'var(--color-text-2)',
                              fontFamily: 'var(--font-mono)',
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              maxHeight: 140,
                              lineHeight: 1.5,
                            }}
                          >
                            {revealed.value}
                          </pre>
                        ) : (
                          <div
                            onClick={() => handleReveal(key)}
                            style={{
                              padding: '8px 12px',
                              background: 'var(--color-bg)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>
                              ••••••••••••••••••••
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
                              <FiLock size={10} /> ENCRYPTED
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ─── SSH Config Manifest Tab ─── */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#0a0a0a', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333' }} />
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#888', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                ~/.ssh/config
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {customConfig !== null && (
                <button
                  onClick={() => setCustomConfig(null)}
                  style={{
                    background: 'none', border: '1px solid #2b2b2b', padding: '5px 10px', color: '#999',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase',
                  }}
                >
                  <FiRefreshCw size={10} /> Reset
                </button>
              )}
              <button
                onClick={() => handleCopy(configText, 'ssh-config')}
                style={{
                  background: 'none', border: '1px solid #333', padding: '5px 10px',
                  color: copiedId === 'ssh-config' ? 'var(--color-green)' : '#aaa',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase',
                }}
              >
                {copiedId === 'ssh-config' ? <><FiCheck size={10} /> Copied</> : <><FiCopy size={10} /> Copy</>}
              </button>
              <button
                onClick={() => handleDownload('ssh_config', configText)}
                style={{
                  background: 'white', border: 'none', padding: '5px 12px', color: '#080808',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase',
                }}
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
              flex: 1,
              minHeight: 320,
              margin: 0,
              padding: 20,
              background: 'transparent',
              border: 'none',
              color: '#d4d4d4',
              fontSize: 12.5,
              fontFamily: 'var(--font-mono)',
              overflowY: 'auto',
              lineHeight: 1.65,
              resize: 'vertical',
              outline: 'none',
            }}
            spellCheck={false}
          />

          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid #1a1a1a',
            background: '#0d0d0d',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: '#888',
            fontFamily: 'var(--font-mono)',
          }}>
            <FiShield size={12} color="var(--color-green)" />
            <span>Tip: After exporting a <code style={{ color: '#ccc' }}>.pem</code> key, lock down permissions with <code style={{ color: 'var(--color-green)' }}>chmod 400 ~/.ssh/*.pem</code></span>
          </div>
        </div>
      )}
    </div>
  );
};
