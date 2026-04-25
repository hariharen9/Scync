import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { Dropdown } from './Dropdown';
import { FiUploadCloud, FiCheck, FiAlertCircle, FiFileText, FiCode, FiX, FiFolder } from 'react-icons/fi';
import { ENVIRONMENTS, Environment } from '@scync/core';

export const EnvImportModal: React.FC = () => {
  const { isEnvImportModalOpen, closeEnvImportModal } = useUIStore();
  const { createSecret } = useVaultStore();
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  const [step, setStep] = useState<'input' | 'paste' | 'review' | 'importing' | 'success'>('input');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [parsedSecrets, setParsedSecrets] = useState<{key: string, value: string}[]>([]);
  const [targetEnv, setTargetEnv] = useState<Environment>('Development');
  const [targetProject, setTargetProject] = useState<string>('');

  const resetState = () => {
    setStep('input');
    setIsDragging(false);
    setPasteContent('');
    setParsedSecrets([]);
    setTargetEnv('Development');
    setTargetProject('');
  };

  const handleClose = () => {
    if (step === 'importing') return;
    closeEnvImportModal();
    setTimeout(resetState, 300);
  };

  const parseContent = (content: string) => {
    const lines = content.split('\n');
    const secrets: {key: string, value: string}[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        secrets.push({ key: k, value: v });
      }
    }
    if (secrets.length > 0) {
      setParsedSecrets(secrets);
      setStep('review');
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) parseContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || parsedSecrets.length === 0) return;
    setStep('importing');
    const projId = targetProject === '' ? null : targetProject;
    for (const secret of parsedSecrets) {
      await createSecret(user.uid, {
        name: secret.key, value: secret.value, service: 'Other', type: 'Other',
        environment: targetEnv, status: 'Active', notes: 'Imported from .env',
        lastRotated: null, expiresOn: null, projectId: projId,
      });
    }
    setStep('success');
    setTimeout(handleClose, 2000);
  };

  const projectOptions = [{ value: '', label: 'Uncategorized' }, ...projects.map(p => ({ value: p.id, label: p.name }))];
  const envOptions = ENVIRONMENTS.map(e => ({ value: e, label: e }));

  // Shared styles matching AddEditModal
  const modalStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: 520,
    borderRadius: '1.25rem',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(15,15,22,0.95)',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  };

  const bodyStyles: React.CSSProperties = {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  };

  return (
    <AnimatePresence>
      {isEnvImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={modalStyles}
          >
            {/* Header */}
            <div style={headerStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'rgba(124,106,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step === 'review' ? <FiFileText size={18} color="#7c6af7" /> : <FiUploadCloud size={18} color="#7c6af7" />}
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#ededed', margin: 0 }}>
                    {step === 'review' ? 'Review Secrets' : step === 'paste' ? 'Paste .env Content' : 'Import .env File'}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#8b8b9e', margin: '0.2rem 0 0 0' }}>
                    {step === 'review' ? `${parsedSecrets.length} keys ready to encrypt` : 'Sync your local configuration securely'}
                  </p>
                </div>
              </div>
              {step !== 'importing' && step !== 'success' && (
                <button
                  onClick={handleClose}
                  style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#8b8b9e', cursor: 'pointer' }}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div style={bodyStyles} className="hide-scrollbar" data-lenis-prevent="true">
              <AnimatePresence mode="wait">
                {step === 'input' && (
                  <motion.div key="input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        height: 200,
                        width: '100%',
                        borderRadius: '1rem',
                        border: `2px dashed ${isDragging ? '#7c6af7' : 'rgba(255,255,255,0.1)'}`,
                        background: isDragging ? 'rgba(124,106,247,0.05)' : 'rgba(255,255,255,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '1.25rem'
                      }}
                    >
                      <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" accept=".env,text/plain" />
                      <FiUploadCloud size={32} color={isDragging ? '#7c6af7' : '#44445a'} style={{ marginBottom: '1rem' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#ededed', margin: 0 }}>Drop your .env file here</p>
                      <p style={{ fontSize: '0.75rem', color: '#8b8b9e', marginTop: '0.375rem' }}>or click to browse from files</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#44445a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                    <button
                      onClick={() => setStep('paste')}
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#8b8b9e', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                      <FiCode size={16} /> Paste raw config text
                    </button>
                  </motion.div>
                )}

                {step === 'paste' && (
                  <motion.div key="paste" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <textarea
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder="# Paste contents here...&#10;API_KEY=sk-proj-abc123&#10;DATABASE_URL=postgres://user:pass@host/db"
                      autoFocus
                      style={{
                        width: '100%',
                        height: 240,
                        padding: '1rem',
                        borderRadius: '0.875rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.2)',
                        color: '#ededed',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        resize: 'none',
                        marginBottom: '1.25rem'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => setStep('input')} className="btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem 0' }}>Back to upload</button>
                      <button onClick={() => parseContent(pasteContent)} disabled={!pasteContent.trim()} className="btn-primary" style={{ padding: '0.625rem 1.25rem' }}>Parse Secrets</button>
                    </div>
                  </motion.div>
                )}

                {step === 'review' && (
                  <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <Dropdown label="Project" options={projectOptions} value={targetProject} onChange={(v) => setTargetProject(v)} />
                      <Dropdown label="Environment" options={envOptions} value={targetEnv} onChange={(v) => setTargetEnv(v as Environment)} />
                    </div>
                    
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#44445a', marginBottom: '0.625rem', marginLeft: '0.25rem' }}>
                      Detected {parsedSecrets.length} Keys
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.875rem', maxHeight: 200, overflowY: 'auto' }} className="hide-scrollbar">
                      {parsedSecrets.map((s, i) => (
                        <div key={i} style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#7c6af7', background: 'rgba(124,106,247,0.1)', padding: '0.125rem 0.375rem', borderRadius: '0.375rem' }}>{s.key}</span>
                          <span style={{ fontSize: '0.75rem', color: '#44445a' }}>{s.value.replace(/./g, '•')}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '0.75rem' }}>
                      <FiAlertCircle size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: '0.75rem', color: '#8b8b9e', margin: 0, lineHeight: 1.4 }}>Secrets will be encrypted with your master key before leaving this device.</p>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => { setParsedSecrets([]); setStep('input'); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><FiX size={14} /> Discard</button>
                      <button onClick={handleImport} className="btn-primary" style={{ padding: '0.75rem 1.5rem', boxShadow: '0 8px 24px rgba(124,106,247,0.2)' }}>Import {parsedSecrets.length} Secrets</button>
                    </div>
                  </motion.div>
                )}

                {(step === 'importing' || step === 'success') && (
                  <motion.div key="status" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {step === 'importing' ? (
                      <>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: '#7c6af7', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ededed', margin: 0 }}>Encrypting & Syncing</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#8b8b9e', marginTop: '0.5rem', textAlign: 'center' }}>Creating {parsedSecrets.length} zero-knowledge entries...</p>
                      </>
                    ) : (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <FiCheck size={32} color="#22c55e" />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ededed', margin: 0 }}>Import Complete</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#8b8b9e', marginTop: '0.5rem' }}>Your secrets are now safely in the vault.</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
