import React, { useState, useRef } from 'react';
import { FiX, FiDownload, FiCheckCircle, FiAlertCircle, FiUploadCloud, FiCheck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { SiBitwarden, Si1Password, SiApple, SiLastpass } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { useLedgerStore } from '../stores/ledgerStore';
import { parseGooglePasswordsCsv, parseBitwardenCsv, parse1PasswordCsv, parseAppleKeychainCsv, parseLastPassCsv, type ImportedPassword } from '@scync/core';

type ImportStep = 'select' | 'upload' | 'confirm' | 'importing' | 'result';

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

  const isLocked = step === 'importing';

  return (
    <AnimatePresence>
      {isPasswordImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={!isLocked ? handleClose : undefined}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              position: 'relative', width: '100%', maxWidth: 460,
              background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
              boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiDownload size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                    Import Passwords
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>
                    Securely migrate from other managers
                  </p>
                </div>
              </div>
              {!isLocked && (
                <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'all 140ms' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiX size={14} /></button>
              )}
            </div>

            <div data-lenis-prevent="true" style={{ padding: 18, overflowY: 'auto', overscrollBehavior: 'contain', flex: 1 }} className="hide-scrollbar">
              {error && (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-red)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <FiAlertCircle size={14} style={{ flexShrink: 0 }} /> 
                  <span style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>{error}</span>
                </div>
              )}

              {step === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)' }}>Select your current password manager to import from.</p>
                  
                  <button 
                    onClick={() => { setProvider('google'); setStep('upload'); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <FcGoogle size={18} />
                    Google Password Manager
                  </button>
                  
                  <button 
                    onClick={() => { setProvider('bitwarden'); setStep('upload'); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <SiBitwarden size={18} color="#175DDC" />
                    Bitwarden
                  </button>

                  <button 
                    onClick={() => { setProvider('1password'); setStep('upload'); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <Si1Password size={18} color="#0052C4" />
                    1Password
                  </button>

                  <button 
                    onClick={() => { setProvider('apple'); setStep('upload'); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <SiApple size={18} color="var(--color-text)" />
                    Apple Keychain / Safari
                  </button>

                  <button 
                    onClick={() => { setProvider('lastpass'); setStep('upload'); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <SiLastpass size={18} color="#D32D27" />
                    LastPass
                  </button>
                </div>
              )}

              {step === 'upload' && (
                <div>
                  <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                    Export your passwords as a CSV file from {
                      provider === 'google' ? 'Google' : 
                      provider === 'bitwarden' ? 'Bitwarden' :
                      provider === '1password' ? '1Password' :
                      provider === 'apple' ? 'Apple' : 'LastPass'
                    }, then select it below.
                  </p>
                  
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ height: 160, width: '100%', border: `2px dashed ${isDragging ? 'var(--color-green)' : 'var(--color-border)'}`, background: isDragging ? 'var(--color-green-bg)' : 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 140ms', marginBottom: 16 }}
                  >
                    <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }} className="hidden" accept=".csv" />
                    <FiUploadCloud size={28} color={isDragging ? 'var(--color-green)' : 'var(--color-text-3)'} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Drop your CSV file here</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-2)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>or click to browse</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>← Back</button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-surface-2)', padding: 14, border: '1px solid var(--color-border)' }}>
                    <FiCheckCircle size={22} color="var(--color-green)" style={{ flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Ready to Import</h4>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)' }}>Found {parsedData.length} valid credentials to import.</p>
                    </div>
                  </div>

                  {/* Preview of first items */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6 }}>
                      Preview Entries
                    </label>
                    <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', maxHeight: 150, overflowY: 'auto' }}>
                      {parsedData.slice(0, 5).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderBottom: idx < 4 && idx < parsedData.length - 1 ? '1px solid var(--color-border)' : 'none', fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {item.name}
                          </span>
                          <span style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {item.username || '(no username)'}
                          </span>
                        </div>
                      ))}
                      {parsedData.length > 5 && (
                        <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--color-text-3)', fontStyle: 'italic', background: 'var(--color-surface-3)', textAlign: 'center' }}>
                          + {parsedData.length - 5} more credentials
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', background: 'rgba(59,130,246,0.03)', padding: 10, border: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiAlertCircle size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>Each credential is individually encrypted with AES-256-GCM using your vault key before saving.</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <button onClick={() => setStep('upload')} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>← Choose another file</button>
                    <button onClick={executeImport} style={{ padding: '8px 18px', background: 'var(--color-green)', border: '1px solid var(--color-green-border)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}>
                      Import {parsedData.length} Passwords
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: IMPORTING / RESULT SUMMARY ── */}
              {(step === 'importing' || step === 'result') && (
                <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {step === 'importing' ? (
                    <>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Encrypting & Importing</h3>
                      <p style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
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
                      <div style={{
                        width: 48, height: 48,
                        background: importResult.failed > 0 && importResult.imported === 0 ? 'var(--color-red-bg)' : 'var(--color-green-bg)',
                        border: `1px solid ${importResult.failed > 0 && importResult.imported === 0 ? 'var(--color-red-border)' : 'var(--color-green-border)'}`,
                        display: 'grid', placeItems: 'center', marginBottom: 16
                      }}>
                        {importResult.failed > 0 && importResult.imported === 0 ? (
                          <FiAlertCircle size={24} color="var(--color-red)" />
                        ) : (
                          <FiCheck size={24} color="var(--color-green)" />
                        )}
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                        {importResult.failed > 0 && importResult.imported === 0 ? 'Import Failed' : importResult.failed > 0 ? 'Import Partially Complete' : 'Import Complete'}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
                        {importResult.imported} password{importResult.imported !== 1 ? 's' : ''} imported successfully
                        {importResult.failed > 0 ? `, ${importResult.failed} failed` : ''}
                      </p>

                      <button
                        onClick={handleClose}
                        style={{ marginTop: 20, padding: '7px 20px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
