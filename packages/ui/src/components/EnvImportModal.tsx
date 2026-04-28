import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { Dropdown } from './Dropdown';
import { FiUploadCloud, FiCheck, FiAlertCircle, FiCode, FiX, FiAlertTriangle } from 'react-icons/fi';
import { ENVIRONMENTS, type Environment } from '@scync/core';

type ConflictResolution = 'overwrite' | 'keep' | 'skip';

interface ParsedRow {
  key: string;
  value: string;
  selected: boolean;
}

interface ConflictRow {
  key: string;
  value: string;
  existingId: string;
  resolution: ConflictResolution;
}

export const EnvImportModal: React.FC = () => {
  const { isEnvImportModalOpen, closeEnvImportModal, openAddProjectModal } = useUIStore();
  const { createSecret, storedSecrets, updateSecret } = useVaultStore();
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  const [step, setStep] = useState<'input' | 'paste' | 'review' | 'conflict' | 'importing' | 'success'>('input');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [targetEnv, setTargetEnv] = useState<Environment>('Development');
  const [targetProject, setTargetProject] = useState<string>('');
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0 });

  const resetState = () => {
    setStep('input'); setIsDragging(false); setPasteContent('');
    setParsedRows([]); setConflicts([]); setTargetEnv('Development'); setTargetProject('');
    setImportResult({ imported: 0, skipped: 0 });
  };
  const handleClose = () => { if (step === 'importing') return; closeEnvImportModal(); setTimeout(resetState, 300); };

  const parseContent = (content: string) => {
    const lines = content.split('\n');
    const rows: ParsedRow[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const idx = t.indexOf('=');
      if (idx > 0) {
        const k = t.substring(0, idx).trim();
        let v = t.substring(idx + 1).trim();
        // strip inline comment
        const commentIdx = v.search(/\s+#/);
        if (commentIdx > -1) v = v.substring(0, commentIdx).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        rows.push({ key: k, value: v, selected: true });
      }
    }
    if (rows.length > 0) { setParsedRows(rows); setStep('review'); }
  };

  const handleFile = (file: File) => {
    const r = new FileReader();
    r.onload = e => { const t = e.target?.result as string; if (t) parseContent(t); };
    r.readAsText(file);
  };

  // Called from review step — detect conflicts before importing
  const handleProceed = () => {
    if (!user) return;
    const selectedRows = parsedRows.filter(r => r.selected);
    if (selectedRows.length === 0) return;

    const targetProjectId = targetProject || null;
    const existingInProject = storedSecrets.filter(s =>
      targetProjectId ? s.projectId === targetProjectId : !s.projectId
    );

    const conflictRows: ConflictRow[] = [];
    for (const row of selectedRows) {
      const existing = existingInProject.find(s => s.name === row.key);
      if (existing) {
        conflictRows.push({ key: row.key, value: row.value, existingId: existing.id, resolution: 'keep' });
      }
    }

    if (conflictRows.length > 0) {
      setConflicts(conflictRows);
      setStep('conflict');
    } else {
      executeImport(selectedRows, []);
    }
  };

  const executeImport = async (rows: ParsedRow[], resolvedConflicts: ConflictRow[]) => {
    if (!user) return;
    setStep('importing');

    // Build a map of conflict decisions
    const conflictMap = new Map<string, ConflictRow>();
    for (const c of resolvedConflicts) conflictMap.set(c.key, c);

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.selected) continue;
      const conflict = conflictMap.get(row.key);

      if (conflict) {
        if (conflict.resolution === 'skip') { skipped++; continue; }
        if (conflict.resolution === 'overwrite') {
          await updateSecret(user.uid, conflict.existingId, {
            name: row.key, value: row.value, service: 'Other', type: 'Other',
            environment: targetEnv, status: 'Active', notes: 'Updated via .env import',
            lastRotated: null, expiresOn: null, projectId: targetProject || null,
          });
          imported++;
          continue;
        }
        // 'keep' = import as new (fall through)
      }

      await createSecret(user.uid, {
        name: row.key, value: row.value, service: 'Other', type: 'Other',
        environment: targetEnv, status: 'Active', notes: 'Imported from .env',
        lastRotated: null, expiresOn: null, projectId: targetProject || null,
      });
      imported++;
    }

    setImportResult({ imported, skipped });
    setStep('success');
    setTimeout(handleClose, 2500);
  };

  const handleImport = async () => {
    await executeImport(parsedRows, conflicts);
  };

  const updateConflictResolution = (key: string, resolution: ConflictResolution) => {
    setConflicts(prev => prev.map(c => c.key === key ? { ...c, resolution } : c));
  };

  const toggleRow = (idx: number) => {
    setParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const projectOptions = [{ value: '', label: 'Uncategorized' }, ...projects.map(p => ({ value: p.id, label: p.name }))];
  const envOptions = ENVIRONMENTS.map(e => ({ value: e, label: e }));
  const selectedCount = parsedRows.filter(r => r.selected).length;

  const resolutionBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '3px 8px', fontSize: 10, fontWeight: 700, border: `1px solid`,
    borderColor: active ? color : 'var(--color-border)',
    background: active ? `${color}22` : 'transparent',
    color: active ? color : 'var(--color-text-3)',
    cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 100ms',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  });

  return (
    <AnimatePresence>
      {isEnvImportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 460, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  {step === 'conflict' ? <FiAlertTriangle size={14} color="var(--color-amber)" /> : <FiUploadCloud size={14} color="var(--color-green)" />}
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                    {step === 'review' ? 'Review Secrets' : step === 'paste' ? 'Paste .env Content' : step === 'conflict' ? 'Resolve Conflicts' : 'Import .env File'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>
                    {step === 'review' ? `${parsedRows.length} keys detected — ${selectedCount} selected` : step === 'conflict' ? `${conflicts.length} key${conflicts.length !== 1 ? 's' : ''} already exist in this project` : 'Sync your config securely'}
                  </p>
                </div>
              </div>
              {step !== 'importing' && step !== 'success' && (
                <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
              )}
            </div>

            <div style={{ padding: 18, overflowY: 'auto', flex: 1 }} className="hide-scrollbar" data-lenis-prevent="true">

              {/* ── STEP: INPUT ── */}
              {step === 'input' && (
                <div>
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ height: 160, width: '100%', border: `2px dashed ${isDragging ? 'var(--color-green)' : 'var(--color-border)'}`, background: isDragging ? 'var(--color-green-bg)' : 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 140ms', marginBottom: 16 }}
                  >
                    <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" accept=".env,text/plain" />
                    <FiUploadCloud size={28} color={isDragging ? 'var(--color-green)' : 'var(--color-text-3)'} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Drop your .env file here</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-2)', marginTop: 4 }}>or click to browse</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  </div>
                  <button onClick={() => setStep('paste')} style={{ width: '100%', padding: 12, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    <FiCode size={14} /> Paste raw config text
                  </button>
                </div>
              )}

              {/* ── STEP: PASTE ── */}
              {step === 'paste' && (
                <div>
                  <textarea
                    value={pasteContent}
                    onChange={e => setPasteContent(e.target.value)}
                    placeholder={'# Paste contents here...\nAPI_KEY=sk-proj-abc123'}
                    autoFocus
                    style={{ width: '100%', height: 200, padding: 12, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', resize: 'none', marginBottom: 16, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setStep('input')} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Back</button>
                    <button onClick={() => parseContent(pasteContent)} disabled={!pasteContent.trim()} style={{ padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: !pasteContent.trim() ? 'not-allowed' : 'pointer', opacity: !pasteContent.trim() ? 0.5 : 1, fontFamily: 'var(--font-sans)' }}>
                      Parse Secrets
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: REVIEW ── */}
              {step === 'review' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <Dropdown label="Project" labelAction={{ label: '+ New', onClick: openAddProjectModal }} options={projectOptions} value={targetProject} onChange={v => setTargetProject(v)} />
                    <Dropdown label="Environment" options={envOptions} value={targetEnv} onChange={v => setTargetEnv(v as Environment)} />
                  </div>

                  {targetProject === '' && (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <FiAlertCircle size={14} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, color: 'var(--color-amber)', margin: 0, lineHeight: 1.5 }}>
                        <strong>Not Recommended:</strong> Importing without a project can lead to cluttered organization and key name clashes. We strongly recommend creating a dedicated project first.
                      </p>
                    </div>
                  )}

                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8, marginLeft: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Detected {parsedRows.length} Keys</span>
                    <button
                      onClick={() => setParsedRows(prev => {
                        const allSelected = prev.every(r => r.selected);
                        return prev.map(r => ({ ...r, selected: !allSelected }));
                      })}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', fontSize: 9.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: 0 }}
                    >
                      {parsedRows.every(r => r.selected) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', maxHeight: 200, overflowY: 'auto' }} className="hide-scrollbar">
                    {parsedRows.map((row, i) => (
                      <div
                        key={i}
                        onClick={() => toggleRow(i)}
                        style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: row.selected ? 1 : 0.4, transition: 'opacity 120ms', background: row.selected ? 'transparent' : 'var(--color-surface-2)' }}
                      >
                        <div style={{ width: 14, height: 14, border: `1.5px solid ${row.selected ? 'var(--color-green)' : 'var(--color-border-2)'}`, background: row.selected ? 'var(--color-green)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 120ms' }}>
                          {row.selected && <FiCheck size={9} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-green)', background: 'var(--color-green-bg)', padding: '1px 5px', flexShrink: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.key}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value.replace(/./g, '•')}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <FiAlertCircle size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.4 }}>Secrets will be encrypted with your master key before leaving this device.</p>
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => { setParsedRows([]); setStep('input'); }} style={{ background: 'none', border: 'none', color: 'var(--color-red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)' }}>
                      <FiX size={12} /> Discard
                    </button>
                    <button
                      onClick={handleProceed}
                      disabled={selectedCount === 0}
                      style={{ padding: '8px 18px', background: selectedCount === 0 ? 'var(--color-surface-2)' : 'white', color: selectedCount === 0 ? 'var(--color-text-3)' : '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: selectedCount === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
                    >
                      Import {selectedCount} Secret{selectedCount !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: CONFLICT ── */}
              {step === 'conflict' && (
                <div>
                  <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <FiAlertTriangle size={14} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: 'var(--color-amber)', margin: 0, lineHeight: 1.5 }}>
                      The following keys already exist in this project. Choose how to handle each one.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflowY: 'auto' }} className="hide-scrollbar">
                    {conflicts.map((c) => (
                      <div key={c.key} style={{ padding: '10px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiAlertTriangle size={11} color="var(--color-amber)" />
                          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>{c.key}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={resolutionBtnStyle(c.resolution === 'overwrite', 'var(--color-red)')}
                            onClick={() => updateConflictResolution(c.key, 'overwrite')}
                          >
                            Overwrite
                          </button>
                          <button
                            style={resolutionBtnStyle(c.resolution === 'keep', 'var(--color-green)')}
                            onClick={() => updateConflictResolution(c.key, 'keep')}
                          >
                            Keep Both
                          </button>
                          <button
                            style={resolutionBtnStyle(c.resolution === 'skip', 'var(--color-text-2)')}
                            onClick={() => updateConflictResolution(c.key, 'skip')}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => setStep('review')} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>← Back</button>
                    <button
                      onClick={handleImport}
                      style={{ padding: '8px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                    >
                      Confirm Import
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP: IMPORTING / SUCCESS ── */}
              {(step === 'importing' || step === 'success') && (
                <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {step === 'importing' ? (
                    <>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Encrypting & Syncing</h3>
                      <p style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>Processing secrets...</p>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 48, height: 48, background: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                        <FiCheck size={24} color="var(--color-green)" />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Import Complete</h3>
                      <p style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 6, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
                        {importResult.imported} secret{importResult.imported !== 1 ? 's' : ''} imported
                        {importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : ''}
                      </p>
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
