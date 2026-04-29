import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiCopy, FiCheck, FiAlertTriangle, FiLink, FiClock, FiEye, FiShield, FiLock } from 'react-icons/fi';
import { useShareStore } from '../stores/shareStore';
import { useAuthStore } from '../stores/authStore';
import { useVaultStore } from '../stores/vaultStore';
import type { StoredSecret, ShareConfig } from '@scync/core';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  secret: StoredSecret;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, secret }) => {
  const { user } = useAuthStore();
  const { decryptValue } = useVaultStore();
  const { createShare } = useShareStore();
  
  const [expiryHours, setExpiryHours] = useState(24);
  const [viewsAllowed, setViewsAllowed] = useState<number | null>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const decrypted = await decryptValue(secret.id);
      if (!decrypted) throw new Error('Failed to decrypt secret');
      
      const config: ShareConfig = {
        secretId: secret.id,
        secretName: secret.name,
        service: secret.service,
        type: secret.type,
        value: decrypted.value,
        expiryHours,
        viewsAllowed,
        projectId: secret.projectId
      };
      
      const url = await createShare(user.uid, config);
      setGeneratedUrl(url);
    } catch (error) {
      console.error('Failed to create share:', error);
      alert('Failed to create share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setCopied(false);
    onClose();
  };

  const expiryOptions = [
    { label: '1 Hour', value: 1 },
    { label: '24 Hours', value: 24 },
    { label: '7 Days', value: 168 },
    { label: '30 Days', value: 720 }
  ];

  const viewOptions = [
    { label: 'One-Time', value: 1 },
    { label: '5 Views', value: 5 },
    { label: 'Unlimited', value: null }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.15 }} 
            onClick={handleClose} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 8 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.96, y: 8 }} 
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 520, 
              background: 'var(--color-surface)', 
              border: '1px solid var(--color-border-2)', 
              boxShadow: '0 24px 64px rgba(0,0,0,.7)', 
              overflow: 'hidden' 
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiLink size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Share Secret</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>{secret.name}</p>
                </div>
              </div>
              <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}><FiX size={14} /></button>
            </div>

            {/* Content */}
            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '75vh', overflowY: 'auto' }}>
              {!generatedUrl ? (
                <>
                  {/* How It Works Section */}
                  <div style={{ marginBottom: 18, padding: 14, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <FiShield size={14} style={{ color: 'var(--color-green)' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>How Zero-Knowledge Sharing Works</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                      <p style={{ margin: '0 0 8px 0' }}>
                        • <strong>Decryption key in URL fragment</strong> — The key is in the <code style={{ background: 'var(--color-surface-3)', padding: '1px 4px', fontFamily: 'var(--font-mono)', fontSize: 10 }}>#hash</code> part, which browsers never send to servers
                      </p>
                      <p style={{ margin: '0 0 8px 0' }}>
                        • <strong>Server never sees plaintext</strong> — Your secret is encrypted with a fresh key before upload
                      </p>
                      <p style={{ margin: '0 0 0 0' }}>
                        • <strong>No account required</strong> — Recipients can view without signing up
                      </p>
                    </div>
                  </div>

                  {/* Warning Banner */}
                  <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <FiAlertTriangle size={14} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 11, color: 'var(--color-text-2)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                        Anyone with the exact link can view this secret. Share it securely (Signal, encrypted email, etc.).
                      </div>
                    </div>
                  </div>

                  {/* Expiry Selection */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--color-text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>
                      <FiClock size={11} />
                      Link Expires After
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {expiryOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setExpiryHours(opt.value)}
                          style={{
                            padding: '9px 12px',
                            border: `1px solid ${expiryHours === opt.value ? 'var(--color-green)' : 'var(--color-border)'}`,
                            background: expiryHours === opt.value ? 'var(--color-green-dim)' : 'var(--color-surface-2)',
                            color: expiryHours === opt.value ? 'var(--color-green)' : 'var(--color-text)',
                            fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 140ms',
                            fontFamily: 'var(--font-sans)'
                          }}
                          onMouseEnter={e => {
                            if (expiryHours !== opt.value) {
                              e.currentTarget.style.borderColor = 'var(--color-border-2)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (expiryHours !== opt.value) {
                              e.currentTarget.style.borderColor = 'var(--color-border)';
                            }
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Limit Selection */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--color-text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>
                      <FiEye size={11} />
                      View Limit
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {viewOptions.map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => setViewsAllowed(opt.value)}
                          style={{
                            padding: '9px 12px',
                            border: `1px solid ${viewsAllowed === opt.value ? 'var(--color-green)' : 'var(--color-border)'}`,
                            background: viewsAllowed === opt.value ? 'var(--color-green-dim)' : 'var(--color-surface-2)',
                            color: viewsAllowed === opt.value ? 'var(--color-green)' : 'var(--color-text)',
                            fontSize: 12, fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 140ms',
                            fontFamily: 'var(--font-sans)'
                          }}
                          onMouseEnter={e => {
                            if (viewsAllowed !== opt.value) {
                              e.currentTarget.style.borderColor = 'var(--color-border-2)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (viewsAllowed !== opt.value) {
                              e.currentTarget.style.borderColor = 'var(--color-border)';
                            }
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: 'none',
                      background: isGenerating ? 'var(--color-surface-3)' : 'var(--color-green)',
                      color: isGenerating ? 'var(--color-text-3)' : '#000',
                      fontSize: 13, fontWeight: 700,
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      transition: 'all 140ms',
                      fontFamily: 'var(--font-sans)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                    onMouseEnter={e => {
                      if (!isGenerating) e.currentTarget.style.background = '#2dd45e';
                    }}
                    onMouseLeave={e => {
                      if (!isGenerating) e.currentTarget.style.background = 'var(--color-green)';
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <div style={{
                          width: 12, height: 12,
                          border: '2px solid var(--color-text-3)',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        Generating Link...
                      </>
                    ) : (
                      <>
                        <FiLink size={14} />
                        Generate Share Link
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div style={{ padding: 14, background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--color-green)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
                      <FiCheck size={14} />
                      Link Generated Successfully
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                      Expires in {expiryHours < 24 ? `${expiryHours} hour${expiryHours > 1 ? 's' : ''}` : `${Math.floor(expiryHours / 24)} day${Math.floor(expiryHours / 24) > 1 ? 's' : ''}`}
                      {viewsAllowed && ` • ${viewsAllowed} view${viewsAllowed > 1 ? 's' : ''} allowed`}
                    </div>
                  </div>

                  {/* Security Reminder */}
                  <div style={{ padding: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <FiLock size={12} style={{ color: 'var(--color-green)' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>Security Note</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-3)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                      The decryption key is in the URL fragment (<code style={{ background: 'var(--color-surface-3)', padding: '1px 3px', fontFamily: 'var(--font-mono)' }}>#...</code>). It never reaches our servers. Share via encrypted channels only.
                    </div>
                  </div>

                  {/* URL Display */}
                  <div style={{ padding: 12, background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12 }}>
                    {generatedUrl}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: `1px solid ${copied ? 'var(--color-green)' : 'var(--color-border)'}`,
                      background: copied ? 'var(--color-green-dim)' : 'var(--color-surface-2)',
                      color: copied ? 'var(--color-green)' : 'var(--color-text)',
                      fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 140ms',
                      fontFamily: 'var(--font-sans)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                    onMouseEnter={e => {
                      if (!copied) {
                        e.currentTarget.style.borderColor = 'var(--color-green)';
                        e.currentTarget.style.color = 'var(--color-green)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!copied) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text)';
                      }
                    }}
                  >
                    {copied ? (
                      <>
                        <FiCheck size={14} />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <FiCopy size={14} />
                        Copy Link
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
