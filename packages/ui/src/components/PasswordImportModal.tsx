import React, { useState, useRef } from 'react';
import { FiDownload, FiCheckCircle, FiAlertCircle, FiUploadCloud, FiCheck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { SiBitwarden, Si1Password, SiApple, SiLastpass } from 'react-icons/si';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { useLedgerStore } from '../stores/ledgerStore';
import {
  parseGooglePasswordsCsv,
  parseBitwardenCsv,
  parse1PasswordCsv,
  parseAppleKeychainCsv,
  parseLastPassCsv,
  type ImportedPassword,
} from '@scync/core';
import {
  ModalShell,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

type ImportStep = 'select' | 'upload' | 'confirm' | 'importing' | 'result';

const PROVIDERS = [
  { id: 'google' as const, name: 'Google Password Manager', sub: 'Chrome CSV export', icon: <FcGoogle size={20} /> },
  { id: 'bitwarden' as const, name: 'Bitwarden', sub: 'Vault CSV export', icon: <SiBitwarden size={18} color="#175DDC" /> },
  { id: '1password' as const, name: '1Password', sub: 'CSV export', icon: <Si1Password size={18} color="#3b82f6" /> },
  { id: 'apple' as const, name: 'Apple Keychain', sub: 'Safari / macOS CSV', icon: <SiApple size={18} color="var(--color-text)" /> },
  { id: 'lastpass' as const, name: 'LastPass', sub: 'Vault CSV export', icon: <SiLastpass size={18} color="#D32D27" /> },
];

export const PasswordImportModal: React.FC = () => {
  const { isPasswordImportModalOpen, closePasswordImportModal } = useUIStore();
  const { user } = useAuthStore();
  const { createPassword } = useVaultStore();

  const [step, setStep] = useState<ImportStep>('select');
  const [provider, setProvider] = useState<'google' | 'bitwarden' | '1password' | 'apple' | 'lastpass' | null>(null);
  const [parsedData, setParsedData] = useState<ImportedPassword[]>([]);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number }>({ imported: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('select');
    setProvider(null);
    setParsedData([]);
    setImportProgress(null);
    setImportResult({ imported: 0, failed: 0 });
    setError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (step === 'importing') return;
    closePasswordImportModal();
    setTimeout(resetState, 300);
  };

  const handleFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let data: ImportedPassword[] = [];
        if (provider === 'google') data = parseGooglePasswordsCsv(text);
        if (provider === 'bitwarden') data = parseBitwardenCsv(text);
        if (provider === '1password') data = parse1PasswordCsv(text);
        if (provider === 'apple') data = parseAppleKeychainCsv(text);
        if (provider === 'lastpass') data = parseLastPassCsv(text);

        if (data.length === 0) {
          setError('No passwords found or invalid file format.');
        } else {
          setParsedData(data);
          setStep('confirm');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to parse file.');
      }
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!user || parsedData.length === 0) return;
    setStep('importing');
    setError(null);
    setImportProgress({ current: 0, total: parsedData.length });

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i];
      setImportProgress({ current: i + 1, total: parsedData.length });

      try {
        await createPassword(user.uid, {
          name: item.name,
          username: item.username,
          password: item.password,
          url: item.url,
          notes: item.notes,
          category: item.category || ''
        });
        imported++;
      } catch (err) {
        console.error(`Failed to import password "${item.name}":`, err);
        failed++;
      }
    }

    setImportResult({ imported, failed });
    if (imported > 0) {
      useLedgerStore.getState().logEvent(user.uid, {
        action: 'password_imported',
        title: `Imported ${imported} passwords`,
        details: `Migrated from ${provider ? provider.toUpperCase() : 'CSV'}`,
      });
    }
    setStep('result');

    if (failed === 0) {
      setTimeout(handleClose, 2400);
    }
  };

  return (
    <ModalShell
      isOpen={isPasswordImportModalOpen}
      onClose={handleClose}
      title="Import Passwords"
      subtitle="Zero-knowledge CSV migration"
      icon={<FiDownload size={15} />}
      maxWidth={540}
      busy={step === 'importing'}
      zIndex={250}
    >
      {error && (
        <div style={{ padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-red)', fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <FiAlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ lineHeight: 1.4 }}>{error}</span>
        </div>
      )}

      {step === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-2)' }}>
            Choose your current password manager to import from:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setProvider(p.id); setStep('upload'); }}
                style={{
                  padding: '14px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 140ms, background 140ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-green-border)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
              >
                <div style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{p.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>
            Export your passwords as a <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green)' }}>.csv</code> file from {PROVIDERS.find(p => p.id === provider)?.name}, then drop it below.
          </p>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 168,
              width: '100%',
              border: `1px dashed ${isDragging ? 'var(--color-green)' : 'var(--color-border-2)'}`,
              background: isDragging ? 'var(--color-green-bg)' : 'var(--color-surface-2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }} className="hidden" accept=".csv" />
            <FiUploadCloud size={28} color="var(--color-green)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Drop your CSV file here</p>
            <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>or click to browse</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setStep('select')} style={modalBtnSecondary}>Back</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-surface-2)', padding: 14, border: '1px solid var(--color-border)', borderLeft: '2px solid var(--color-green)' }}>
            <FiCheckCircle size={20} color="var(--color-green)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Ready to Import</h4>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-2)' }}>Found {parsedData.length} valid credentials to encrypt and save.</p>
            </div>
          </div>

          <div>
            <label style={modalLabelStyle}>Preview Entries</label>
            <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', maxHeight: 160, overflowY: 'auto' }}>
              {parsedData.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: idx < 4 && idx < parsedData.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {item.name}
                  </span>
                  <span style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {item.username || '(no username)'}
                  </span>
                </div>
              ))}
              {parsedData.length > 5 && (
                <div style={{ padding: '7px 12px', fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', background: 'var(--color-surface-2)', textAlign: 'center' }}>
                  + {parsedData.length - 5} more credentials
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setStep('upload')} style={modalBtnSecondary}>Back</button>
            <button type="button" onClick={executeImport} style={modalBtnPrimary}>
              Import {parsedData.length} Passwords
            </button>
          </div>
        </div>
      )}

      {(step === 'importing' || step === 'result') && (
        <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {step === 'importing' ? (
            <>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Encrypting &amp; Importing</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                {importProgress ? `Processing ${importProgress.current} of ${importProgress.total} passwords...` : 'Encrypting passwords...'}
              </p>
              {importProgress && (
                <div style={{ width: '80%', height: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-green)', width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`, transition: 'width 100ms ease' }} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, background: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                {importResult.failed > 0 && importResult.imported === 0 ? <FiAlertCircle size={24} color="var(--color-red)" /> : <FiCheck size={24} color="var(--color-green)" />}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {importResult.failed > 0 && importResult.imported === 0 ? 'Import Failed' : importResult.failed > 0 ? 'Import Partially Complete' : 'Import Complete'}
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', marginTop: 6 }}>
                {importResult.imported} password{importResult.imported !== 1 ? 's' : ''} imported
                {importResult.failed > 0 ? `, ${importResult.failed} failed` : ''}
              </p>
              <button type="button" onClick={handleClose} style={{ ...modalBtnSecondary, marginTop: 18 }}>Close</button>
            </>
          )}
        </div>
      )}
    </ModalShell>
  );
};
