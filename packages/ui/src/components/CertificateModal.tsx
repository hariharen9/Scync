import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAward, FiUpload, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { parseCertificatePem, detectPemType, validateCertKeyPair } from '@scync/core';
import type { CertificateInfo } from '@scync/core';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none',
  transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};
const monoInputStyle: React.CSSProperties = {
  ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, resize: 'none'
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'var(--color-text-3)', marginBottom: 6,
};

export const CertificateModal: React.FC = () => {
  const { isAddCertModalOpen, closeAddCertModal } = useUIStore();
  const { createCertificate } = useVaultStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [certPem, setCertPem] = useState('');
  const [keyPem, setKeyPem] = useState('');
  const [parsedInfo, setParsedInfo] = useState<CertificateInfo | null>(null);
  const [parseError, setParseError] = useState('');
  const [keyMatchStatus, setKeyMatchStatus] = useState<'none' | 'match' | 'mismatch'>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset on modal close
  useEffect(() => {
    if (!isAddCertModalOpen) {
      setName(''); setCertPem(''); setKeyPem('');
      setParsedInfo(null); setParseError('');
      setKeyMatchStatus('none'); setError('');
    }
  }, [isAddCertModalOpen]);

  // Auto-parse certificate when PEM changes
  useEffect(() => {
    if (!certPem.trim()) {
      setParsedInfo(null);
      setParseError('');
      return;
    }
    try {
      const info = parseCertificatePem(certPem);
      setParsedInfo(info);
      setParseError('');
      // Auto-fill name from subject if empty
      if (!name.trim() && info.subject) {
        setName(info.subject);
      }
    } catch (e: any) {
      setParsedInfo(null);
      setParseError(e.message || 'Failed to parse certificate');
    }
  }, [certPem]);

  // Validate cert-key pair when key changes
  useEffect(() => {
    if (!certPem.trim() || !keyPem.trim()) {
      setKeyMatchStatus('none');
      return;
    }
    try {
      const valid = validateCertKeyPair(certPem, keyPem);
      setKeyMatchStatus(valid ? 'match' : 'mismatch');
    } catch {
      setKeyMatchStatus('mismatch');
    }
  }, [certPem, keyPem]);

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const type = detectPemType(content);
      if (type === 'certificate') {
        setCertPem(content);
      } else if (type === 'private-key') {
        setKeyPem(content);
      } else {
        // Try as certificate first
        try {
          parseCertificatePem(content);
          setCertPem(content);
        } catch {
          // If not a cert, try as key field
          setKeyPem(content);
        }
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileRead);
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !parsedInfo) return;
    if (!name.trim()) { setError('Name is required'); return; }

    try {
      setIsSaving(true);
      setError('');

      await createCertificate(user.uid, {
        name: name.trim(),
        certPem,
        keyPem: keyPem.trim() || null,
        subject: parsedInfo.subject,
        issuer: parsedInfo.issuer,
        serialNumber: parsedInfo.serialNumber,
        validFrom: parsedInfo.validFrom,
        validTo: parsedInfo.validTo,
        isSelfSigned: parsedInfo.isSelfSigned,
        fingerprint: parsedInfo.fingerprint,
        hosts: parsedInfo.hosts,
      });

      closeAddCertModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save certificate');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isAddCertModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={closeAddCertModal}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative', width: '100%', maxWidth: 520, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiAward size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Import Certificate</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0' }}>PEM, CRT, or KEY files</p>
                </div>
              </div>
              <button onClick={closeAddCertModal} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>

            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--color-green)' : 'var(--color-border)'}`,
                  background: isDragOver ? 'rgba(16,185,129,.04)' : 'var(--color-surface-2)',
                  padding: '20px 16px', textAlign: 'center', marginBottom: 18,
                  transition: 'all 200ms ease', cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pem,.crt,.cer,.key,.der';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    files.forEach(handleFileRead);
                  };
                  input.click();
                }}
              >
                <FiUpload size={20} style={{ color: isDragOver ? 'var(--color-green)' : 'var(--color-text-3)', marginBottom: 6 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: isDragOver ? 'var(--color-green)' : 'var(--color-text-2)' }}>
                  Drop certificate files here or click to browse
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 4 }}>
                  Supports .pem, .crt, .cer, .key files
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: 11.5, marginBottom: 18 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Certificate Name / Alias</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. example.com wildcard" style={inputStyle} autoFocus
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                </div>

                <div>
                  <label style={labelStyle}>Certificate PEM <span style={{ color: 'var(--color-red)' }}>*</span></label>
                  <textarea
                    required value={certPem} onChange={e => setCertPem(e.target.value)}
                    rows={5} placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    style={{ ...monoInputStyle, height: 120 }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                  {parseError && (
                    <div style={{ fontSize: 10, color: 'var(--color-red)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiAlertCircle size={11} /> {parseError}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Private Key PEM <span style={{ opacity: 0.4 }}>(Optional)</span></label>
                  <textarea
                    value={keyPem} onChange={e => setKeyPem(e.target.value)}
                    rows={4} placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    style={{ ...monoInputStyle, height: 100 }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                  {keyMatchStatus === 'match' && (
                    <div style={{ fontSize: 10, color: 'var(--color-green)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCheck size={11} /> Private key matches certificate
                    </div>
                  )}
                  {keyMatchStatus === 'mismatch' && (
                    <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiAlertCircle size={11} /> Key may not match this certificate (or non-RSA key)
                    </div>
                  )}
                </div>

                {/* Parsed preview */}
                {parsedInfo && (
                  <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiCheck size={12} /> Certificate Parsed Successfully
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Subject</div>
                        <div style={{ color: 'var(--color-text)' }}>{parsedInfo.subject}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Issuer</div>
                        <div style={{ color: 'var(--color-text-2)' }}>{parsedInfo.issuer}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Valid From</div>
                        <div style={{ color: 'var(--color-text-2)' }}>{parsedInfo.validFrom.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Expires</div>
                        <div style={{ color: parsedInfo.validTo < new Date() ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 600 }}>{parsedInfo.validTo.toLocaleDateString()}</div>
                      </div>
                      {parsedInfo.hosts.length > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Hosts / SANs</div>
                          <div style={{ color: 'var(--color-text-2)' }}>{parsedInfo.hosts.join(', ')}</div>
                        </div>
                      )}
                      {parsedInfo.isSelfSigned && (
                        <div style={{ gridColumn: 'span 2', fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>⚠ Self-signed certificate</div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10 }}>
                  <button type="button" onClick={closeAddCertModal} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
                  >Cancel</button>
                  <button type="submit" disabled={isSaving || !parsedInfo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: isSaving || !parsedInfo ? 'not-allowed' : 'pointer', opacity: isSaving || !parsedInfo ? 0.5 : 1, fontFamily: 'var(--font-sans)', transition: 'opacity 140ms' }}>
                    {isSaving ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#080808', animation: 'spin 0.7s linear infinite' }} /> : 'Import Certificate'}
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
