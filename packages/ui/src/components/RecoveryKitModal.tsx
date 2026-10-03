import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShield, FiDownload, FiPrinter, FiCopy, FiCheck, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { generateRecoveryKitHtml, generateRecoveryQRCode } from '@scync/core';

export const RecoveryKitModal: React.FC<{ initialRecoveryKey?: string | null }> = ({ initialRecoveryKey = null }) => {
  const { isRecoveryKitModalOpen, closeRecoveryKitModal } = useUIStore();
  const { user } = useAuthStore();
  const { createRecoveryKit, verifyPassword } = useVaultStore();

  const [password, setPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recoveryKey, setRecoveryKey] = useState<string | null>(initialRecoveryKey);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmedSaved, setHasConfirmedSaved] = useState(false);

  useEffect(() => {
    if (initialRecoveryKey) {
      setRecoveryKey(initialRecoveryKey);
    }
  }, [initialRecoveryKey]);

  useEffect(() => {
    if (recoveryKey) {
      generateRecoveryQRCode(recoveryKey).then(setQrDataUrl).catch(console.error);
    }
  }, [recoveryKey]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setIsGenerating(true);

    try {
      const key = await verifyPassword(password, user.uid);
      if (!key) {
        setError('Incorrect master password');
        setIsGenerating(false);
        return;
      }

      const generated = await createRecoveryKit(user.uid, password);
      setRecoveryKey(generated);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate recovery kit');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = async () => {
    if (!recoveryKey) return;
    await navigator.clipboard.writeText(recoveryKey);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadHtml = async () => {
    if (!recoveryKey || !user) return;
    const html = await generateRecoveryKitHtml({
      email: user.email || 'developer',
      uid: user.uid,
      recoveryKey,
      qrDataUrl,
      createdAt: new Date()
    });

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scync-recovery-kit-${(user.email || 'vault').replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHasConfirmedSaved(true);
  };

  const handlePrint = async () => {
    if (!recoveryKey || !user) return;
    const html = await generateRecoveryKitHtml({
      email: user.email || 'developer',
      uid: user.uid,
      recoveryKey,
      qrDataUrl,
      createdAt: new Date()
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 250);
      setHasConfirmedSaved(true);
    }
  };

  const handleClose = () => {
    closeRecoveryKitModal();
    setTimeout(() => {
      setPassword('');
      setError('');
      setRecoveryKey(null);
      setHasConfirmedSaved(false);
    }, 200);
  };

  useEffect(() => {
    if (!isRecoveryKitModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecoveryKitModalOpen, isGenerating]);

  return (
    <AnimatePresence>
      {isRecoveryKitModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(5px)' }}
          />

          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 520,
              background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
              boxShadow: '0 24px 64px rgba(0,0,0,.8)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'rgba(16,185,129,0.1)', border: '1px solid var(--color-green-border)', display: 'grid', placeItems: 'center' }}>
                  <FiShield size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                    Emergency Recovery Kit
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0', fontFamily: 'var(--font-sans)' }}>
                    Zero-knowledge master password recovery
                  </p>
                </div>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer' }}><FiX size={16} /></button>
            </div>

            {/* Body */}
            <div data-lenis-prevent="true" style={{ padding: 18, overflowY: 'auto', overscrollBehavior: 'contain' }} className="hide-scrollbar">
              {!recoveryKey ? (
                // Form to authenticate before generating
                <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <FiAlertTriangle size={16} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                      Generating an Emergency Recovery Kit produces a 120-bit offline emergency token. If you ever forget your Master Password, this key will restore your vault data.
                    </p>
                  </div>

                  {error && (
                    <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-red)', color: 'var(--color-red)', fontSize: 12 }}>
                      {error}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
                      Enter Master Password to Authenticate
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiLock size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Current Master Password"
                        autoFocus
                        style={{
                          width: '100%',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          padding: '8px 10px 8px 30px',
                          fontSize: 12.5,
                          color: 'var(--color-text)',
                          fontFamily: 'var(--font-sans)',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                    <button type="button" onClick={handleClose} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isGenerating || !password} style={{ padding: '7px 16px', background: 'var(--color-green)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', opacity: isGenerating ? 0.6 : 1 }}>
                      {isGenerating ? 'Generating...' : 'Generate Recovery Kit'}
                    </button>
                  </div>
                </form>
              ) : (
                // Display Recovery Key & Download Kit
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <FiCheck size={16} color="var(--color-green)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                      Recovery Kit successfully created & encrypted with your vault.
                    </span>
                  </div>

                  {/* Key Box */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
                      Your Emergency Recovery Key
                    </label>
                    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.05em', wordBreak: 'break-all' }}>
                        {recoveryKey}
                      </span>
                      <button
                        onClick={handleCopyKey}
                        style={{ padding: '5px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: hasCopied ? 'var(--color-green)' : 'var(--color-text-2)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontFamily: 'var(--font-sans)' }}
                      >
                        {hasCopied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                        {hasCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* QR Code and Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--color-surface-2)', padding: 12, border: '1px solid var(--color-border)' }}>
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="Recovery QR Code" style={{ width: 84, height: 84, border: '1px solid var(--color-border)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>Save Offline Document</h4>
                      <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-text-2)', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>
                        Download the standalone recovery kit or print a physical sheet to keep in a secure location.
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={handleDownloadHtml}
                          style={{ padding: '6px 12px', background: 'white', color: '#080808', border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)' }}
                        >
                          <FiDownload size={12} /> Download HTML Kit
                        </button>
                        <button
                          onClick={handlePrint}
                          style={{ padding: '6px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)' }}
                        >
                          <FiPrinter size={12} /> Print
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 11.5, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                    <input
                      type="checkbox"
                      checked={hasConfirmedSaved}
                      onChange={e => setHasConfirmedSaved(e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <span>
                      I understand that without my Master Password or this Emergency Key, my vault cannot be recovered by Scync or anyone else.
                    </span>
                  </label>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                    <button
                      onClick={handleClose}
                      disabled={!hasConfirmedSaved}
                      style={{
                        padding: '7px 20px',
                        background: hasConfirmedSaved ? 'var(--color-green)' : 'var(--color-surface-2)',
                        border: '1px solid',
                        borderColor: hasConfirmedSaved ? 'var(--color-green-border)' : 'var(--color-border)',
                        color: hasConfirmedSaved ? '#fff' : 'var(--color-text-3)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: hasConfirmedSaved ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font-sans)',
                        transition: 'all 140ms'
                      }}
                    >
                      Done
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
