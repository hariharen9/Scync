import React, { useState, useRef } from 'react';
import { FiX, FiDownload, FiCheckCircle, FiAlertCircle, FiUploadCloud } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { SiBitwarden, Si1Password, SiApple, SiLastpass } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { parseGooglePasswordsCsv, parseBitwardenCsv, parse1PasswordCsv, parseAppleKeychainCsv, parseLastPassCsv, type ImportedPassword } from '@scync/core';

export const PasswordImportModal: React.FC = () => {
  const { isPasswordImportModalOpen, closePasswordImportModal } = useUIStore();
  const { user } = useAuthStore();
  const { createPassword } = useVaultStore();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select type, 2: Upload, 3: Confirm
  const [provider, setProvider] = useState<'google' | 'bitwarden' | '1password' | 'apple' | 'lastpass' | null>(null);
  const [parsedData, setParsedData] = useState<ImportedPassword[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep(1);
    setProvider(null);
    setParsedData([]);
    setIsImporting(false);
    setError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (isImporting) return;
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
          setStep(3);
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
    setIsImporting(true);
    setError(null);

    try {
      for (const item of parsedData) {
        await createPassword(user.uid, {
          name: item.name,
          username: item.username,
          password: item.password,
          url: item.url,
          notes: item.notes,
          category: item.category || ''
        });
      }
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import some passwords.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isPasswordImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={!isImporting ? handleClose : undefined}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
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
              {!isImporting && (
                <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'all 140ms' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiX size={14} /></button>
              )}
            </div>

            <div style={{ padding: 18, overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
              {error && (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-red)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <FiAlertCircle size={14} style={{ flexShrink: 0 }} /> 
                  <span style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>{error}</span>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)' }}>Select your current password manager to import from.</p>
                  
                  <button 
                    onClick={() => { setProvider('google'); setStep(2); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <FcGoogle size={18} />
                    Google Password Manager
                  </button>
                  
                  <button 
                    onClick={() => { setProvider('bitwarden'); setStep(2); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <SiBitwarden size={18} color="#175DDC" />
                    Bitwarden
                  </button>

                  <button 
                    onClick={() => { setProvider('1password'); setStep(2); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <Si1Password size={18} color="#0052C4" />
                    1Password
                  </button>

                  <button 
                    onClick={() => { setProvider('apple'); setStep(2); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <SiApple size={18} color="var(--color-text)" />
                    Apple Keychain / Safari
                  </button>

                  <button 
                    onClick={() => { setProvider('lastpass'); setStep(2); }}
                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >
                    <SiLastpass size={18} color="#D32D27" />
                    LastPass
                  </button>
                </div>
              )}

              {step === 2 && (
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
                    <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>← Back</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-surface-2)', padding: 16, border: '1px solid var(--color-border)' }}>
                    <FiCheckCircle size={24} color="var(--color-green)" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Ready to Import</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)' }}>Found {parsedData.length} valid passwords.</p>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', background: 'rgba(59,130,246,0.03)', padding: 12, border: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiAlertCircle size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>All imported passwords will be immediately encrypted with your vault key before leaving this device.</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, margin: '8px 0 0' }}>
                    <button onClick={() => setStep(1)} disabled={isImporting} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: isImporting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }} onMouseEnter={e => { if (!isImporting) { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; } }} onMouseLeave={e => { if (!isImporting) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; } }}>Cancel</button>
                    <button onClick={executeImport} disabled={isImporting} style={{ padding: '7px 18px', background: 'var(--color-green)', border: '1px solid var(--color-green-border)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: isImporting ? 'not-allowed' : 'pointer', opacity: isImporting ? 0.5 : 1, fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}>
                      {isImporting ? 'Importing...' : `Import ${parsedData.length} Passwords`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
