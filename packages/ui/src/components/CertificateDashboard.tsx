import React, { useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { FiAward, FiCopy, FiEye, FiEyeOff, FiTrash2, FiDownload, FiCheck, FiPlus, FiAlertTriangle, FiShield } from 'react-icons/fi';
import type { StoredCertificate } from '@scync/core';

const getExpiryStatus = (validTo: Date): { label: string; color: string; bg: string } => {
  const now = new Date();
  const diff = validTo.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: 'var(--color-red)', bg: 'rgba(239,68,68,.08)' };
  if (days <= 30) return { label: `Expires in ${days}d`, color: 'var(--color-amber, #f59e0b)', bg: 'rgba(245,158,11,.08)' };
  if (days <= 90) return { label: `Expires in ${days}d`, color: 'var(--color-text-2)', bg: 'var(--color-surface-2)' };
  return { label: `Valid for ${days}d`, color: 'var(--color-green)', bg: 'rgba(16,185,129,.08)' };
};

export const CertificateDashboard: React.FC = () => {
  const { storedCertificates, decryptCertificate, deleteCertificate } = useVaultStore();
  const { openAddCertModal, openConfirmModal } = useUIStore();
  const { user } = useAuthStore();

  const [revealedCerts, setRevealedCerts] = useState<Record<string, { certPem: string; keyPem: string | null }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReveal = async (cert: StoredCertificate) => {
    if (revealedCerts[cert.id]) {
      const newCerts = { ...revealedCerts };
      delete newCerts[cert.id];
      setRevealedCerts(newCerts);
    } else {
      const decrypted = await decryptCertificate(cert.id);
      if (decrypted) {
        setRevealedCerts({ ...revealedCerts, [cert.id]: { certPem: decrypted.certPem, keyPem: decrypted.keyPem } });
      }
    }
  };

  const handleDelete = (cert: StoredCertificate) => {
    if (!user) return;
    openConfirmModal({
      title: 'Delete Certificate',
      message: `Are you sure you want to delete "${cert.name}"? This will permanently remove it from your vault.`,
      confirmText: 'Delete Certificate',
      danger: true,
      onConfirm: async () => {
        await deleteCertificate(user.uid, cert.id);
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
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAward size={20} style={{ color: 'var(--color-green)' }} />
            Certificates
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            {storedCertificates.length} certificate{storedCertificates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={openAddCertModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
          >
            <FiPlus size={13} />
            Add Certificate
          </button>
        </div>
      </div>

      {storedCertificates.length === 0 ? (
        <div style={{
          border: '1px dashed var(--color-border-2)', background: 'var(--color-surface)',
          padding: '64px 32px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center',
            marginBottom: 16,
          }}>
            <FiAward size={20} color="var(--color-text-3)" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0', fontFamily: 'var(--font-sans)' }}>No certificates yet</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 20px 0', maxWidth: 300, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
            Import your PEM, CRT, or KEY files to manage them with zero-knowledge encryption.
          </p>
          <button
            onClick={openAddCertModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
              background: 'white', color: '#080808', border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            <FiPlus size={14} /> Add First Certificate
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 1,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
        }}>
          {storedCertificates.map(cert => {
            const expiry = getExpiryStatus(cert.validTo);
            const revealed = revealedCerts[cert.id];
            return (
              <div key={cert.id} style={{
                background: 'var(--color-surface)', display: 'flex', flexDirection: 'column',
                transition: 'background 140ms', position: 'relative'
              }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}>
                
                {/* Header */}
                <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>{cert.name}</h3>
                      {cert.isSelfSigned && (
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 6px', background: 'rgba(245,158,11,.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.2)', fontFamily: 'var(--font-sans)' }}>Self-Signed</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
                      <span title="Subject">{cert.subject}</span>
                      {cert.issuer !== cert.subject && (
                        <>
                          <span>•</span>
                          <span title="Issuer" style={{ color: 'var(--color-text-3)' }}>by {cert.issuer}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cert)}
                    style={{
                      width: 26, height: 26, display: 'grid', placeItems: 'center',
                      background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer',
                      transition: 'color 140ms', flexShrink: 0
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
                    title="Delete Certificate"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                {/* Metadata Tags */}
                <div style={{ padding: '16px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, padding: '3px 8px',
                    background: expiry.bg, color: expiry.color,
                    border: `1px solid ${expiry.color}22`, fontFamily: 'var(--font-sans)',
                    display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {expiry.color === 'var(--color-red)' ? <FiAlertTriangle size={10} /> : <FiShield size={10} />}
                    {expiry.label}
                  </span>
                  {cert.hosts.map(host => (
                    <span key={host} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px',
                      background: 'var(--color-surface-3)', color: 'var(--color-text-2)',
                      border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)'
                    }}>
                      {host}
                    </span>
                  ))}
                </div>

                {/* Details grid */}
                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Valid From</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>{cert.validFrom.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Valid To</div>
                    <div style={{ fontSize: 11, color: expiry.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{cert.validTo.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Serial</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cert.serialNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Fingerprint (SHA-256)</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cert.fingerprint}>{cert.fingerprint.substring(0, 30)}...</div>
                  </div>
                </div>

                {/* PEM reveal area */}
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-sans)' }}>
                      Certificate PEM {cert.encKeyPem && '+ Private Key'}
                    </span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {revealed && (
                        <>
                          <button
                            onClick={() => handleCopy(revealed.certPem, `${cert.id}-pem`)}
                            style={{ background: 'none', border: 'none', color: copiedId === `${cert.id}-pem` ? 'var(--color-green)' : 'var(--color-text-muted)', fontSize: 9.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', transition: 'color 140ms' }}
                          >
                            {copiedId === `${cert.id}-pem` ? <><FiCheck size={11} /> Copied</> : <><FiCopy size={11} /> Copy</>}
                          </button>
                          <button
                            onClick={() => handleDownload(`${cert.name.toLowerCase().replace(/\s+/g, '-')}.pem`, revealed.certPem)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 9.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', transition: 'color 140ms' }}
                          >
                            <FiDownload size={11} /> Export
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleReveal(cert)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 9.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', transition: 'color 140ms' }}
                      >
                        {revealed ? <><FiEyeOff size={11} /> Hide</> : <><FiEye size={11} /> Reveal</>}
                      </button>
                    </div>
                  </div>
                  {revealed ? (
                    <pre
                      data-lenis-prevent
                      style={{
                        margin: 0, padding: 12, background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)', fontSize: 10,
                        color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)',
                        overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 140
                      }}
                    >
                      {revealed.certPem}
                      {revealed.keyPem && `\n\n${revealed.keyPem}`}
                    </pre>
                  ) : (
                    <div style={{ padding: '6px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}>••••••••••••••••••••</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
