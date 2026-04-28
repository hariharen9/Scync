import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { FiX, FiCamera, FiImage, FiEdit2, FiCheck, FiShield, FiType, FiHash, FiClock, FiActivity, FiPlus } from 'react-icons/fi';
import { parseTOTPUri, validateBase32, generateTOTPCode, type TOTPConfig } from '@scync/core';
import jsQR from 'jsqr';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none',
  transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};
const monoInputStyle: React.CSSProperties = {
  ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em'
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'var(--color-text-3)', marginBottom: 6,
};

export const TOTPAddModal: React.FC = () => {
  const { isAddTOTPModalOpen, closeAddTOTPModal } = useUIStore();
  const { createTOTP } = useVaultStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'scan' | 'upload' | 'manual'>('manual');
  
  // Manual Entry State
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>('SHA1');
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState<30 | 60>(30);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isAddTOTPModalOpen) {
      stopCamera();
      setIssuer(''); setLabel(''); setSecret('');
      setAlgorithm('SHA1'); setDigits(6); setPeriod(30);
      setError(''); setSuccess(false); setPreviewCode(null);
      setActiveTab('manual');
    }
  }, [isAddTOTPModalOpen]);

  // Handle tab changes
  useEffect(() => {
    if (activeTab === 'scan' && isAddTOTPModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeTab, isAddTOTPModalOpen]);

  // Preview code generator for manual entry
  useEffect(() => {
    if (activeTab === 'manual' && validateBase32(secret)) {
      try {
        const config: TOTPConfig = { issuer, label, secret, algorithm, digits, period };
        setPreviewCode(generateTOTPCode(config));
      } catch {
        setPreviewCode(null);
      }
    } else {
      setPreviewCode(null);
    }
  }, [issuer, label, secret, algorithm, digits, period, activeTab]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraActive(true);
            animationFrameRef.current = requestAnimationFrame(scanQRCode);
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow permissions or use manual entry.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setCameraActive(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRDetected(code.data);
        return;
      }
    }
    
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleQRDetected(code.data);
          } else {
            setError('No QR code found in image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleQRDetected = (uri: string) => {
    const config = parseTOTPUri(uri);
    if (config) {
      setIssuer(config.issuer);
      setLabel(config.label);
      setSecret(config.secret);
      setAlgorithm(config.algorithm);
      setDigits(config.digits);
      setPeriod(config.period);
      setError('');
      setSuccess(true);
      stopCamera();
      setActiveTab('manual');
    } else {
      setError('Invalid TOTP QR Code format.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateBase32(secret)) { setError('Invalid Base32 secret.'); return; }

    setIsSaving(true);
    setError('');

    try {
      await createTOTP(user.uid, {
        issuer: issuer.trim() || 'Unknown',
        label: label.trim(),
        secret: secret.replace(/\s+/g, '').toUpperCase(),
        algorithm, digits, period,
        icon: issuer.trim().toLowerCase().replace(/\s+/g, '-')
      });
      closeAddTOTPModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add authenticator');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'manual', label: 'Manual', icon: <FiEdit2 size={13} /> },
    { id: 'upload', label: 'Upload', icon: <FiImage size={13} /> },
    { id: 'scan', label: 'Scan QR', icon: <FiCamera size={13} /> }
  ] as const;

  return (
    <AnimatePresence>
      {isAddTOTPModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={closeAddTOTPModal} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} 
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} 
            style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiShield size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Add Authenticator</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>Securely add a new 2FA token</p>
                </div>
              </div>
              <button onClick={closeAddTOTPModal} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>

            {/* Content area with Lenis prevention */}
            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* Tabs UI - Scync Style */}
              <div style={{ display: 'flex', gap: 1, background: 'var(--color-border)', padding: 1, marginBottom: 20, border: '1px solid var(--color-border)' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1, padding: '10px 0', border: 'none',
                      background: activeTab === tab.id ? 'var(--color-surface-3)' : 'var(--color-surface)',
                      color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'all 140ms', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: 11.5, marginBottom: 18, borderRadius: 2 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: 11.5, marginBottom: 18, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCheck /> QR Code Scanned Successfully!
                </div>
              )}

              {activeTab === 'scan' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: '100%', maxWidth: 280, aspectRatio: '1', 
                    background: '#000', border: '1px solid var(--color-border-2)', 
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <video ref={videoRef} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: cameraActive ? 1 : 0 }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {!cameraActive && !error && (
                       <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)', fontSize: 11 }}>
                         INITIALIZING CAMERA...
                       </div>
                    )}
                    {/* Brutalist view finder */}
                    <div style={{ position: 'absolute', inset: 40, border: '1px solid rgba(255,255,255,0.4)', pointerEvents: 'none' }}>
                       <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '2px solid #fff', borderLeft: '2px solid #fff' }} />
                       <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '2px solid #fff', borderRight: '2px solid #fff' }} />
                       <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '2px solid #fff', borderLeft: '2px solid #fff' }} />
                       <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '2px solid #fff', borderRight: '2px solid #fff' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-3)', textAlign: 'center', margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Align QR code within the frame
                  </p>
                </div>
              )}

              {activeTab === 'upload' && (
                <div style={{ padding: '20px 0' }}>
                  <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                      padding: '40px 20px', border: isDragging ? '1px solid var(--color-green)' : '1px dashed var(--color-border-2)', 
                      cursor: 'pointer', background: isDragging ? 'var(--color-surface-3)' : 'var(--color-surface-2)', width: '100%',
                      transition: 'all 140ms', boxSizing: 'border-box',
                      boxShadow: isDragging ? '0 0 20px rgba(34, 197, 94, 0.1)' : 'none'
                    }}
                    onMouseEnter={e => { if (!isDragging) { e.currentTarget.style.borderColor = 'var(--color-border-hover)'; e.currentTarget.style.background = 'var(--color-surface-3)'; } }}
                    onMouseLeave={e => { if (!isDragging) { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'var(--color-surface-2)'; } }}
                  >
                    <div style={{ width: 44, height: 44, background: 'var(--color-surface)', border: isDragging ? '1px solid var(--color-green)' : '1px solid var(--color-border)', display: 'grid', placeItems: 'center', transition: 'all 140ms' }}>
                      {isDragging ? <FiPlus size={18} color="var(--color-green)" /> : <FiImage size={18} color="var(--color-text-3)" />}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isDragging ? 'var(--color-green)' : 'var(--color-text)' }}>{isDragging ? 'DROP TO SCAN' : 'UPLOAD QR IMAGE'}</span>
                      <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '4px 0 0 0' }}>{isDragging ? 'RELEASE TO PROCESS' : 'PNG, JPG, OR WEBP SCREENSHOTS'}</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}

              {activeTab === 'manual' && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Issuer</label>
                      <div style={{ position: 'relative' }}>
                        <FiShield size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                        <input value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="e.g. GitHub" style={{ ...inputStyle, paddingLeft: 30 }} required
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Label</label>
                      <div style={{ position: 'relative' }}>
                        <FiType size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. user@email.com" style={{ ...inputStyle, paddingLeft: 30 }}
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Secret Key (Base32)</label>
                    <div style={{ position: 'relative' }}>
                      <FiActivity size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                      <input value={secret} onChange={e => setSecret(e.target.value.replace(/\s+/g, '').toUpperCase())} placeholder="JBSW Y3DP ..." style={{ ...monoInputStyle, paddingLeft: 30 }} required
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Algo</label>
                      <select value={algorithm} onChange={e => setAlgorithm(e.target.value as any)} style={inputStyle}>
                        <option value="SHA1">SHA1</option>
                        <option value="SHA256">SHA256</option>
                        <option value="SHA512">SHA512</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Digits</label>
                      <div style={{ position: 'relative' }}>
                        <FiHash size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                        <select value={digits} onChange={e => setDigits(parseInt(e.target.value) as any)} style={{ ...inputStyle, paddingLeft: 28 }}>
                          <option value={6}>6</option>
                          <option value={8}>8</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Period</label>
                      <div style={{ position: 'relative' }}>
                        <FiClock size={11} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                        <select value={period} onChange={e => setPeriod(parseInt(e.target.value) as any)} style={{ ...inputStyle, paddingLeft: 28 }}>
                          <option value={30}>30s</option>
                          <option value={60}>60s</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {previewCode && (
                    <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Preview</span>
                      <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--color-green)' }}>
                        {previewCode.slice(0, previewCode.length/2)} {previewCode.slice(previewCode.length/2)}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10 }}>
                    <button type="button" onClick={closeAddTOTPModal} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}>Cancel</button>
                    <button type="submit" disabled={isSaving || !validateBase32(secret)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: (isSaving || !validateBase32(secret)) ? 'not-allowed' : 'pointer', opacity: (isSaving || !validateBase32(secret)) ? 0.5 : 1, fontFamily: 'var(--font-sans)', transition: 'opacity 140ms' }}>
                      {isSaving ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#080808', animation: 'spin 0.7s linear infinite' }} /> : 'Add Authenticator'}
                    </button>
                  </div>
                </form>
              )}
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
