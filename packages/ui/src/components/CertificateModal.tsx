import React, { useState, useEffect, useCallback } from 'react';
import { FiAward, FiUpload, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { parseCertificatePem, detectPemType, validateCertKeyPair } from '@scync/core';
import type { CertificateInfo } from '@scync/core';
import {
  ModalShell,
  modalInputStyle,
  modalMonoInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

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

  useEffect(() => {
    if (!isAddCertModalOpen) {
      setName(''); setCertPem(''); setKeyPem('');
      setParsedInfo(null); setParseError('');
      setKeyMatchStatus('none'); setError('');
    }
  }, [isAddCertModalOpen]);

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
      if (!name.trim() && info.subject) {
        setName(info.subject);
      }
    } catch (e: any) {
      setParsedInfo(null);
      setParseError(e.message || 'Failed to parse certificate');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certPem]);

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
        try {
          parseCertificatePem(content);
          setCertPem(content);
        } catch {
          setKeyPem(content);
        }
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    Array.from(e.dataTransfer.files).forEach(handleFileRead);
  }, [handleFileRead]);

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

      setIsSaving(false);
      closeAddCertModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save certificate');
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isAddCertModalOpen}
      onClose={() => { if (!isSaving) closeAddCertModal(); }}
      title="Import Certificate"
      subtitle="X.509 SSL/TLS PEM, CRT, CER, or matching KEY"
      icon={<FiAward size={15} />}
      maxWidth={560}
      busy={isSaving}
    >
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        style={{
          border: `1px dashed ${isDragOver ? 'var(--color-green)' : 'var(--color-border-2)'}`,
          background: isDragOver ? 'rgba(16,185,129,.06)' : 'var(--color-surface-2)',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
          cursor: 'pointer',
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pem,.crt,.cer,.key,.der';
          input.multiple = true;
          input.onchange = (e) => {
            Array.from((e.target as HTMLInputElement).files || []).forEach(handleFileRead);
          };
          input.click();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiUpload size={16} style={{ color: 'var(--color-green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>
              Drop certificate or key files here
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              Supports .pem, .crt, .cer, .key (multi-file supported)
            </div>
          </div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green)', textTransform: 'uppercase' }}>
          Browse
        </span>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={modalLabelStyle}>Certificate Name / Alias</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. *.scync.space wildcard"
            style={modalInputStyle}
            autoFocus
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>

        <div>
          <label style={modalLabelStyle}>
            Certificate PEM <span style={{ color: 'var(--color-red)' }}>*</span>
          </label>
          <textarea
            required
            value={certPem}
            onChange={e => setCertPem(e.target.value)}
            rows={5}
            placeholder={'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
            style={{ ...modalMonoInputStyle, height: 115, resize: 'none' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {parseError && (
            <div style={{ fontSize: 11, color: 'var(--color-red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiAlertCircle size={12} /> {parseError}
            </div>
          )}
        </div>

        <div>
          <label style={modalLabelStyle}>
            Private Key PEM <span style={{ opacity: 0.55, textTransform: 'none' }}>(Optional)</span>
          </label>
          <textarea
            value={keyPem}
            onChange={e => setKeyPem(e.target.value)}
            rows={4}
            placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
            style={{ ...modalMonoInputStyle, height: 95, resize: 'none' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {keyMatchStatus === 'match' && (
            <div style={{ fontSize: 11, color: 'var(--color-green)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiCheck size={12} /> Private key matches certificate
            </div>
          )}
          {keyMatchStatus === 'mismatch' && (
            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiAlertCircle size={12} /> Key may not match this certificate (or non-RSA key)
            </div>
          )}
        </div>

        {parsedInfo && (
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderLeft: '2px solid var(--color-green)', padding: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)' }}>
              <FiCheck size={12} /> Certificate Parsed
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Subject</div>
                <div style={{ color: 'var(--color-text)' }}>{parsedInfo.subject}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Issuer</div>
                <div style={{ color: 'var(--color-text-2)' }}>{parsedInfo.issuer}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Valid From</div>
                <div style={{ color: 'var(--color-text-2)' }}>{parsedInfo.validFrom.toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Expires</div>
                <div style={{ color: parsedInfo.validTo < new Date() ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 700 }}>
                  {parsedInfo.validTo.toLocaleDateString()}
                </div>
              </div>
              {parsedInfo.hosts.length > 0 && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Hosts / SANs</div>
                  <div style={{ color: 'var(--color-text-2)' }}>{parsedInfo.hosts.join(', ')}</div>
                </div>
              )}
              {parsedInfo.isSelfSigned && (
                <div style={{ gridColumn: 'span 2', fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⚠ Self-signed certificate</div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={closeAddCertModal} style={modalBtnSecondary}>Cancel</button>
          <button
            type="submit"
            disabled={isSaving || !parsedInfo}
            style={{
              ...modalBtnPrimary,
              opacity: isSaving || !parsedInfo ? 0.5 : 1,
              cursor: isSaving || !parsedInfo ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? 'Importing...' : 'Import Certificate'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
