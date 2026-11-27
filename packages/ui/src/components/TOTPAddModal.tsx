import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { FiCamera, FiImage, FiEdit2, FiCheck, FiShield, FiType, FiActivity, FiPlus } from 'react-icons/fi';
import { parseTOTPUri, validateBase32, generateTOTPCode, type TOTPConfig } from '@scync/core';
import jsQR from 'jsqr';
import {
  ModalShell,
  modalInputStyle,
  modalMonoInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

export const TOTPAddModal: React.FC = () => {
  const { isAddTOTPModalOpen, closeAddTOTPModal } = useUIStore();
  const { createTOTP } = useVaultStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'scan' | 'upload' | 'manual'>('manual');
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>('SHA1');
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState<30 | 60>(30);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    if (!isAddTOTPModalOpen) {
      stopCamera();
      setIssuer(''); setLabel(''); setSecret('');
      setAlgorithm('SHA1'); setDigits(6); setPeriod(30);
      setError(''); setSuccess(false); setPreviewCode(null);
      setActiveTab('manual');
    }
  }, [isAddTOTPModalOpen]);

  useEffect(() => {
    if (activeTab === 'scan' && isAddTOTPModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAddTOTPModalOpen]);

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
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow permissions or use manual entry.');
      setCameraActive(false);
    }
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
      setIsSaving(false);
      closeAddTOTPModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add authenticator');
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'manual', label: 'Manual', icon: <FiEdit2 size={13} /> },
    { id: 'upload', label: 'Upload QR', icon: <FiImage size={13} /> },
    { id: 'scan', label: 'Camera', icon: <FiCamera size={13} /> }
  ] as const;

  return (
    <ModalShell
      isOpen={isAddTOTPModalOpen}
      onClose={() => { if (!isSaving) closeAddTOTPModal(); }}
      title="Add Authenticator"
      subtitle="Zero-knowledge TOTP 2FA seed"
      icon={<FiShield size={15} />}
      maxWidth={500}
      busy={isSaving}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 1, background: 'var(--color-border)', padding: 1, marginBottom: 18, border: '1px solid var(--color-border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              background: activeTab === tab.id ? 'var(--color-surface-3)' : 'var(--color-surface)',
              color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-2)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--color-green)', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCheck /> QR Code scanned and fields populated!
        </div>
      )}

      {activeTab === 'scan' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
          <div style={{ width: '100%', maxWidth: 280, aspectRatio: '1', background: '#000', border: '1px solid var(--color-border-2)', position: 'relative', overflow: 'hidden' }}>
            <video ref={videoRef} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: cameraActive ? 1 : 0 }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!cameraActive && !error && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                INITIALIZING CAMERA...
              </div>
            )}
            <div style={{ position: 'absolute', inset: 36, border: '1px solid rgba(255,255,255,0.35)', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '2px solid var(--color-green)', borderLeft: '2px solid var(--color-green)' }} />
              <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '2px solid var(--color-green)', borderRight: '2px solid var(--color-green)' }} />
              <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '2px solid var(--color-green)', borderLeft: '2px solid var(--color-green)' }} />
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '2px solid var(--color-green)', borderRight: '2px solid var(--color-green)' }} />
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--color-text-2)', textAlign: 'center', margin: 0, fontFamily: 'var(--font-mono)' }}>
            Align QR code within the frame
          </p>
        </div>
      )}

      {activeTab === 'upload' && (
        <div style={{ padding: '6px 0' }}>
          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processImageFile(file);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              padding: '42px 20px',
              border: isDragging ? '1px solid var(--color-green)' : '1px dashed var(--color-border-2)',
              cursor: 'pointer',
              background: isDragging ? 'rgba(16, 185, 129, 0.06)' : 'var(--color-surface-2)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ width: 44, height: 44, background: 'var(--color-surface)', border: `1px solid ${isDragging ? 'var(--color-green)' : 'var(--color-border)'}`, display: 'grid', placeItems: 'center' }}>
              {isDragging ? <FiPlus size={18} color="var(--color-green)" /> : <FiImage size={18} color="var(--color-green)" />}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isDragging ? 'var(--color-green)' : 'var(--color-text)' }}>
                {isDragging ? 'Drop to scan QR code' : 'Drop QR image or click to browse'}
              </span>
              <p style={{ fontSize: 11.5, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                PNG, JPG, or WEBP screenshots
              </p>
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {activeTab === 'manual' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={modalLabelStyle}>Issuer</label>
              <div style={{ position: 'relative' }}>
                <FiShield size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                <input value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="e.g. GitHub" style={{ ...modalInputStyle, paddingLeft: 30 }} required
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
              </div>
            </div>
            <div>
              <label style={modalLabelStyle}>Account Label</label>
              <div style={{ position: 'relative' }}>
                <FiType size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. dev@scync.space" style={{ ...modalInputStyle, paddingLeft: 30 }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
              </div>
            </div>
          </div>

          <div>
            <label style={modalLabelStyle}>Secret Key (Base32)</label>
            <div style={{ position: 'relative' }}>
              <FiActivity size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
              <input value={secret} onChange={e => setSecret(e.target.value.replace(/\s+/g, '').toUpperCase())} placeholder="JBSW Y3DP EHPK 3PXP" style={{ ...modalMonoInputStyle, paddingLeft: 30 }} required
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
            </div>
          </div>

          {/* Segmented Config Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={modalLabelStyle}>Algorithm</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {(['SHA1', 'SHA256', 'SHA512'] as const).map(alg => (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => setAlgorithm(alg)}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                      background: algorithm === alg ? 'var(--color-surface-3)' : 'transparent',
                      color: algorithm === alg ? 'var(--color-green)' : 'var(--color-text-2)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    {alg}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={modalLabelStyle}>Digits</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {([6, 8] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDigits(d)}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                      background: digits === d ? 'var(--color-surface-3)' : 'transparent',
                      color: digits === d ? 'var(--color-green)' : 'var(--color-text-2)',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={modalLabelStyle}>Period</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {([30, 60] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    style={{
                      padding: '8px 0',
                      border: 'none',
                      background: period === p ? 'var(--color-surface-3)' : 'transparent',
                      color: period === p ? 'var(--color-green)' : 'var(--color-text-2)',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    {p}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {previewCode && (
            <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                Live Preview
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', color: 'var(--color-green)' }}>
                {previewCode.slice(0, previewCode.length / 2)} {previewCode.slice(previewCode.length / 2)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={closeAddTOTPModal} style={modalBtnSecondary}>Cancel</button>
            <button
              type="submit"
              disabled={isSaving || !validateBase32(secret)}
              style={{
                ...modalBtnPrimary,
                opacity: (isSaving || !validateBase32(secret)) ? 0.5 : 1,
                cursor: (isSaving || !validateBase32(secret)) ? 'not-allowed' : 'pointer',
              }}
            >
              {isSaving ? 'Adding...' : 'Add Authenticator'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
};
