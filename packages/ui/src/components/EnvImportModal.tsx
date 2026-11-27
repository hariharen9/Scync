import React, { useState, useRef } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useLedgerStore } from '../stores/ledgerStore';
import { Dropdown } from './Dropdown';
import { FiUploadCloud, FiCheck, FiAlertCircle, FiCode, FiX, FiAlertTriangle } from 'react-icons/fi';
import { ENVIRONMENTS, type Environment } from '@scync/core';
import {
  ModalShell,
  modalMonoInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

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
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0, failed: 0 });

  const resetState = () => {
    setStep('input'); setIsDragging(false); setPasteContent('');
    setParsedRows([]); setConflicts([]); setTargetEnv('Development'); setTargetProject('');
    setImportResult({ imported: 0, skipped: 0, failed: 0 });
    setImportProgress(null);
  };

  const handleClose = () => {
    if (step === 'importing') return;
    closeEnvImportModal();
    setTimeout(resetState, 300);
  };

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

    const conflictMap = new Map<string, ConflictRow>();
    for (const c of resolvedConflicts) conflictMap.set(c.key, c);

    const selectedRows = rows.filter(r => r.selected);
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];
      setImportProgress({ current: i + 1, total: selectedRows.length });

      const conflict = conflictMap.get(row.key);
      if (conflict) {
        if (conflict.resolution === 'skip') { skipped++; continue; }
        if (conflict.resolution === 'overwrite') {
          try {
            await updateSecret(user.uid, conflict.existingId, {
              name: row.key, value: row.value, service: 'Other', type: 'Other',
              environment: targetEnv, status: 'Active', notes: 'Updated via .env import',
              lastRotated: null, expiresOn: null, projectId: targetProject || null,
            });
            imported++;
          } catch (err) {
            console.error(`Failed to overwrite secret ${row.key}:`, err);
            failed++;
          }
          continue;
        }
      }

      try {
        await createSecret(user.uid, {
          name: row.key, value: row.value, service: 'Other', type: 'Other',
          environment: targetEnv, status: 'Active', notes: 'Imported from .env',
          lastRotated: null, expiresOn: null, projectId: targetProject || null,
        });
        imported++;
      } catch (err) {
        console.error(`Failed to create secret ${row.key}:`, err);
        failed++;
      }
    }

    setImportResult({ imported, skipped, failed });
    if (imported > 0) {
      useLedgerStore.getState().logEvent(user.uid, {
        action: 'env_imported',
        title: `Imported ${imported} secrets (.env)`,
        details: `${targetEnv} · ${targetProject ? 'Project' : 'Uncategorized'}`,
      });
    }
    setStep('success');
    setTimeout(handleClose, 2500);
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
    padding: '4px 10px', fontSize: 10.5, fontWeight: 700, border: '1px solid',
    borderColor: active ? color : 'var(--color-border)',
    background: active ? `${color}22` : 'transparent',
    color: active ? color : 'var(--color-text-2)',
    cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
  });

  return (
    <ModalShell
      isOpen={isEnvImportModalOpen}
      onClose={handleClose}
      title={step === 'review' ? 'Review Secrets' : step === 'paste' ? 'Paste .env Content' : step === 'conflict' ? 'Resolve Conflicts' : 'Import .env File'}
      subtitle={step === 'review' ? `${parsedRows.length} keys detected — ${selectedCount} selected` : step === 'conflict' ? `${conflicts.length} key${conflicts.length !== 1 ? 's' : ''} already exist` : 'Batch-encrypt environment variables'}
      icon={step === 'conflict' ? <FiAlertTriangle size={15} /> : <FiUploadCloud size={15} />}
      accentColor={step === 'conflict' ? '#f59e0b' : 'var(--color-green)'}
      maxWidth={540}
      busy={step === 'importing'}
      zIndex={250}
    >
      {/* Step 1: Input */}
      {step === 'input' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 168,
              width: '100%',
              border: `1px dashed ${isDragging ? 'var(--color-green)' : 'var(--color-border-2)'}`,
              background: isDragging ? 'rgba(16, 185, 129, 0.06)' : 'var(--color-surface-2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" accept=".env,text/plain" />
            <FiUploadCloud size={28} color="var(--color-green)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Drop your .env file here</p>
            <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>or click to browse local files</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <button type="button" onClick={() => setStep('paste')} style={{ ...modalBtnSecondary, width: '100%' }}>
            <FiCode size={14} /> Paste raw .env text
          </button>
        </div>
      )}

      {/* Step 2: Paste */}
      {step === 'paste' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={modalLabelStyle}>Raw .env Contents</label>
            <textarea
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              placeholder={'# Paste contents here...\nAPI_KEY=sk-proj-abc123\nDATABASE_URL=postgres://...'}
              autoFocus
              style={{ ...modalMonoInputStyle, height: 210, resize: 'none', background: 'var(--color-bg)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setStep('input')} style={modalBtnSecondary}>Back</button>
            <button
              type="button"
              onClick={() => parseContent(pasteContent)}
              disabled={!pasteContent.trim()}
              style={{ ...modalBtnPrimary, opacity: !pasteContent.trim() ? 0.5 : 1, cursor: !pasteContent.trim() ? 'not-allowed' : 'pointer' }}
            >
              Parse Secrets
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Dropdown label="Project" labelAction={{ label: '+ New', onClick: openAddProjectModal }} options={projectOptions} value={targetProject} onChange={v => setTargetProject(v)} />
            <Dropdown label="Environment" options={envOptions} value={targetEnv} onChange={v => setTargetEnv(v as Environment)} />
          </div>

          {targetProject === '' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <FiAlertCircle size={14} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11.5, color: 'var(--color-amber)', margin: 0, lineHeight: 1.5 }}>
                <strong>Tip:</strong> Assign a project to keep keys organized and avoid name collisions.
              </p>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={modalLabelStyle}>Detected {parsedRows.length} Keys</span>
              <button
                type="button"
                onClick={() => setParsedRows(prev => {
                  const allSelected = prev.every(r => r.selected);
                  return prev.map(r => ({ ...r, selected: !allSelected }));
                })}
                style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
              >
                {parsedRows.every(r => r.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div data-lenis-prevent="true" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', maxHeight: 210, overflowY: 'auto' }}>
              {parsedRows.map((row, i) => (
                <div
                  key={i}
                  onClick={() => toggleRow(i)}
                  style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: row.selected ? 1 : 0.45, background: row.selected ? 'transparent' : 'var(--color-surface-2)' }}
                >
                  <div style={{ width: 15, height: 15, border: `1.5px solid ${row.selected ? 'var(--color-green)' : 'var(--color-border-2)'}`, background: row.selected ? 'var(--color-green)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {row.selected && <FiCheck size={10} color="#080808" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--color-green)', background: 'var(--color-green-bg)', padding: '2px 6px', flexShrink: 0, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.key}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value.replace(/./g, '•')}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => { setParsedRows([]); setStep('input'); }} style={{ ...modalBtnSecondary, color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <FiX size={13} /> Discard
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={selectedCount === 0}
              style={{ ...modalBtnPrimary, opacity: selectedCount === 0 ? 0.5 : 1, cursor: selectedCount === 0 ? 'not-allowed' : 'pointer' }}
            >
              Import {selectedCount} Secret{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Conflict */}
      {step === 'conflict' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <FiAlertTriangle size={14} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: 'var(--color-amber)', margin: 0, lineHeight: 1.5 }}>
              These keys already exist in this project. Choose how to handle each one.
            </p>
          </div>

          <div data-lenis-prevent="true" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
            {conflicts.map((c) => (
              <div key={c.key} style={{ padding: '10px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 700 }}>{c.key}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" style={resolutionBtnStyle(c.resolution === 'overwrite', 'var(--color-red)')} onClick={() => updateConflictResolution(c.key, 'overwrite')}>Overwrite</button>
                  <button type="button" style={resolutionBtnStyle(c.resolution === 'keep', 'var(--color-green)')} onClick={() => updateConflictResolution(c.key, 'keep')}>Keep Both</button>
                  <button type="button" style={resolutionBtnStyle(c.resolution === 'skip', 'var(--color-text-2)')} onClick={() => updateConflictResolution(c.key, 'skip')}>Skip</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setStep('review')} style={modalBtnSecondary}>Back</button>
            <button type="button" onClick={() => executeImport(parsedRows, conflicts)} style={modalBtnPrimary}>Confirm Import</button>
          </div>
        </div>
      )}

      {/* Step 5: Importing / Success */}
      {(step === 'importing' || step === 'success') && (
        <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {step === 'importing' ? (
            <>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Encrypting &amp; Syncing</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                {importProgress ? `Processing ${importProgress.current} of ${importProgress.total} secrets...` : 'Processing secrets...'}
              </p>
              {importProgress && (
                <div style={{ width: '80%', height: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', marginTop: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-green)', width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`, transition: 'width 120ms' }} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, background: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
                <FiCheck size={24} color="var(--color-green)" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Import Complete</h3>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', marginTop: 6 }}>
                {importResult.imported} secret{importResult.imported !== 1 ? 's' : ''} imported
                {importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : ''}
                {importResult.failed > 0 ? `, ${importResult.failed} failed` : ''}
              </p>
            </>
          )}
        </div>
      )}
    </ModalShell>
  );
};
