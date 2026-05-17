import React, { useState } from 'react';
import { FiX, FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { parseGooglePasswordsCsv, parseBitwardenCsv, type ImportedPassword } from '@scync/core';

export const PasswordImportModal: React.FC = () => {
  const { isPasswordImportModalOpen, closePasswordImportModal } = useUIStore();
  const { user } = useAuthStore();
  const { createPassword } = useVaultStore();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select type, 2: Upload, 3: Confirm
  const [provider, setProvider] = useState<'google' | 'bitwarden' | null>(null);
  const [parsedData, setParsedData] = useState<ImportedPassword[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep(1);
    setProvider(null);
    setParsedData([]);
    setIsImporting(false);
    setError(null);
  };

  const handleClose = () => {
    closePasswordImportModal();
    setTimeout(resetState, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let data: ImportedPassword[] = [];
        if (provider === 'google') data = parseGooglePasswordsCsv(text);
        if (provider === 'bitwarden') data = parseBitwardenCsv(text);
        
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
    e.target.value = ''; // reset
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isImporting ? handleClose : undefined}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{ 
              position: 'relative', width: '100%', maxWidth: 400,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiDownload color="var(--color-green)" /> Import Passwords
              </h2>
              <button onClick={!isImporting ? handleClose : undefined} disabled={isImporting} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: isImporting ? 'default' : 'pointer', padding: 4 }}>
                <FiX size={18} />
              </button>
            </header>

            <div style={{ padding: 20 }}>
              {error && (
                <div style={{ padding: 12, background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', color: 'var(--color-red)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <FiAlertCircle size={14} /> {error}
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--color-text-2)' }}>Select your password manager to import from.</p>
                  
                  <button 
                    onClick={() => { setProvider('google'); setStep(2); }}
                    className="btn-ghost" 
                    style={{ padding: 16, justifyContent: 'flex-start', border: '1px solid var(--color-border)' }}
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16, marginRight: 4 }} />
                    Google Password Manager (CSV)
                  </button>
                  
                  <button 
                    onClick={() => { setProvider('bitwarden'); setStep(2); }}
                    className="btn-ghost" 
                    style={{ padding: 16, justifyContent: 'flex-start', border: '1px solid var(--color-border)' }}
                  >
                    <img src="https://bitwarden.com/images/icon_128x128.png" alt="Bitwarden" style={{ width: 16, height: 16, marginRight: 4 }} />
                    Bitwarden (CSV)
                  </button>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-2)' }}>
                    Export your passwords as a CSV file from {provider === 'google' ? 'Google' : 'Bitwarden'}, then select it below.
                  </p>
                  <label className="btn-primary" style={{ padding: '9px 24px', cursor: 'pointer' }}>
                    Select CSV File
                    <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => setStep(1)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', border: 'none' }}>Back</button>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-surface-2)', padding: 16, border: '1px solid var(--color-border)' }}>
                    <FiCheckCircle size={24} color="var(--color-green)" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Ready to Import</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-2)' }}>Found {parsedData.length} valid passwords.</p>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)', background: 'var(--color-green-bg)', padding: 12, border: '1px solid var(--color-green-border)' }}>
                    All imported passwords will be immediately encrypted with your vault key before saving.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, margin: '8px 0 0' }}>
                    <button onClick={() => setStep(1)} disabled={isImporting} className="btn-ghost">Cancel</button>
                    <button onClick={executeImport} disabled={isImporting} className="btn-primary">
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
