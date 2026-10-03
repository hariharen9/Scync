import React, { useState, useMemo } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { SecretCard } from './SecretCard';
import { Dropdown, type DropdownOption } from './Dropdown';
import { AnimatePresence, motion } from 'framer-motion';
import { useServiceStore } from '../stores/serviceStore';
import { ServiceIcon } from './ServiceIcon';
import { CustomServiceIcon } from './CustomServiceIcons';
import { ProjectIcon, PROJECT_COLOR_MAP } from './ProjectIcons';
import { FiKey, FiPlus, FiFilter, FiX, FiSearch, FiDownload, FiEdit2, FiCheck, FiShield } from 'react-icons/fi';
import { SERVICES, SECRET_TYPES, ENVIRONMENTS, STATUSES, getAttentionSecrets } from '@scync/core';

const toOptions = (arr: readonly string[], placeholder: string): DropdownOption[] => [
  { value: '', label: placeholder },
  ...arr.map(v => ({ value: v, label: v })),
];

export const SecretList: React.FC = () => {
  const { storedSecrets, decryptValue, unlock } = useVaultStore();
  const { filter, setFilter, clearFilters, activeView, openAddModal, openEditProjectModal, sortBy, sortOrder } = useUIStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [exportResult, setExportResult] = useState<{ exported: number; failed: number } | null>(null);
  const { selectedProjectId, projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { user } = useAuthStore();
  const [hasCopied, setHasCopied] = useState(false);

  const getProject = (projectId: string | null) =>
    projectId ? (projects.find(p => p.id === projectId) || null) : null;

  let visibleSecrets = storedSecrets;

  if (activeView === 'project') {
    visibleSecrets = visibleSecrets.filter(s =>
      selectedProjectId ? s.projectId === selectedProjectId : !s.projectId
    );
  }

  visibleSecrets = visibleSecrets.filter(s => {
    if (filter.service && s.service !== filter.service) return false;
    if (filter.type && s.type !== filter.type) return false;
    if (filter.environment && s.environment !== filter.environment) return false;
    if (filter.status && s.status !== filter.status) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.service.toLowerCase().includes(q)) return false;
    }
    if (activeView === 'all' && filter.projectId) {
      if (filter.projectId === 'uncategorized') {
        if (s.projectId) return false;
      } else {
        if (s.projectId !== filter.projectId) return false;
      }
    }
    return true;
  });

  // Apply sorting
  visibleSecrets = [...visibleSecrets].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'name') diff = a.name.localeCompare(b.name);
    else if (sortBy === 'expiresOn') diff = (a.expiresOn?.getTime() || 0) - (b.expiresOn?.getTime() || 0);
    else if (sortBy === 'updatedAt') diff = a.updatedAt.getTime() - b.updatedAt.getTime();
    else diff = a.createdAt.getTime() - b.createdAt.getTime();
    return sortOrder === 'asc' ? diff : -diff;
  });

  const hasActiveFilters = !!(filter.service || filter.type || filter.environment || filter.status || (activeView === 'all' && filter.projectId));

  const title = activeView === 'project'
    ? (selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name || 'Project' : 'Uncategorized')
    : 'All Secrets';

  const serviceOptions: DropdownOption[] = [
    { value: '', label: 'Services' },
    ...SERVICES.map(s => ({ value: s, label: s, icon: <ServiceIcon service={s} size={13} className="text-current" /> })),
    ...customServices.map(s => ({ value: s.name, label: s.name, icon: <CustomServiceIcon iconKey={s.icon || 'FaAmazon'} size={13} color={PROJECT_COLOR_MAP[s.color] ?? 'var(--color-text-2)'} /> })),
  ];

  const projectOptions: DropdownOption[] = [
    { value: '', label: 'Projects' },
    { value: 'uncategorized', label: 'Uncategorized', icon: <span style={{ fontSize: 14 }}>📂</span> },
    ...projects.map(p => ({ value: p.id, label: p.name, icon: <ProjectIcon iconKey={p.icon || 'FiFolder'} size={13} color={PROJECT_COLOR_MAP[p.color] ?? 'var(--color-text-2)'} /> })),
  ];

  const currentProject = useMemo(() => {
    return selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;
  }, [projects, selectedProjectId]);

  const projectSecrets = useMemo(() => {
    return selectedProjectId ? storedSecrets.filter(s => s.projectId === selectedProjectId) : [];
  }, [storedSecrets, selectedProjectId]);

  const projectAttention = useMemo(() => {
    return getAttentionSecrets(projectSecrets);
  }, [projectSecrets]);

  const projectHealthScore = useMemo(() => {
    if (projectSecrets.length === 0) return 100;
    let score = 100;
    const total = projectSecrets.length;
    score -= Math.min(40, (projectAttention.expired.length / total) * 80);
    score -= Math.min(25, (projectAttention.expiringSoon.length / total) * 50);
    score -= Math.min(20, (projectAttention.rotationOverdue.length / total) * 40);
    score -= Math.min(25, (projectAttention.recoveryCodesLow.length / total) * 50);
    const revokedOrExpired = projectSecrets.filter(s => s.status === 'Expired' || s.status === 'Revoked').length;
    score -= Math.min(15, (revokedOrExpired / total) * 30);
    return Math.max(0, Math.round(score));
  }, [projectSecrets, projectAttention]);

  const handleExportClick = () => {
    if (!selectedProjectId) return;
    setExportPassword('');
    setExportError('');
    setExportProgress(null);
    setExportResult(null);
    setShowExportModal(true);
  };

  const confirmExportEnv = async (action: 'download' | 'copy') => {
    if (isExporting || !selectedProjectId || !user || !exportPassword) return;
    setIsExporting(true);
    setExportError('');
    setExportProgress(null);
    setExportResult(null);
    try {
      const isValid = await unlock(exportPassword, user.uid);
      if (!isValid) {
        setExportError('Incorrect vault password.');
        setIsExporting(false);
        return;
      }

      let envContent = `# Exported from Scync - ${title}\n# Date: ${new Date().toISOString()}\n\n`;
      let exported = 0;
      let failed = 0;

      for (let i = 0; i < projectSecrets.length; i++) {
        const s = projectSecrets[i];
        setExportProgress({ current: i + 1, total: projectSecrets.length });
        try {
          const dec = await decryptValue(s.id);
          if (dec && dec.value !== undefined) {
            const keyName = s.name.toUpperCase().replace(/[\s-]+/g, '_').replace(/[^A-Z0-9_]/g, '');
            const escapedValue = dec.value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
            envContent += `${keyName}="${escapedValue}"\n`;
            exported++;
          } else {
            failed++;
          }
        } catch (e) {
          console.error(`Failed to decrypt secret ${s.name}:`, e);
          failed++;
        }
      }

      setExportResult({ exported, failed });
      setExportPassword('');

      if (action === 'download') {
        const blob = new Blob([envContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.env`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setTimeout(() => setShowExportModal(false), 1600);
      } else {
        await navigator.clipboard.writeText(envContent);
        setHasCopied(true);
        setTimeout(() => {
          setHasCopied(false);
          navigator.clipboard.writeText("");
        }, 30000);
        setTimeout(() => setShowExportModal(false), 1600);
      }
    } catch (err) {
      console.error('Failed to export env:', err);
      setExportError('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            {visibleSecrets.length} secret{visibleSecrets.length !== 1 ? 's' : ''}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-3)', margin: '6px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            Reveal a secret to decrypt it — copy becomes available only after revealing.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeView === 'project' && selectedProjectId && (
            <button
              onClick={handleExportClick}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                background: 'none', border: '1px solid var(--color-border)',
                color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-green-border)'; e.currentTarget.style.color = 'var(--color-green)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
            >
              <FiDownload size={13} />
              Export .env
            </button>
          )}
          <button
            onClick={openAddModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
          >
            <FiPlus size={13} />
            Add Secret
          </button>
        </div>
      </div>

      {/* Project Detail Banner */}
      {activeView === 'project' && currentProject && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'fadeUp 200ms ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                background: `${PROJECT_COLOR_MAP[currentProject.color]}18`,
                border: `1px solid ${PROJECT_COLOR_MAP[currentProject.color]}40`,
                display: 'grid', placeItems: 'center'
              }}>
                <ProjectIcon iconKey={currentProject.icon || 'FiFolder'} size={20} color={PROJECT_COLOR_MAP[currentProject.color]} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                    {currentProject.name}
                  </h3>
                  <button
                    onClick={() => openEditProjectModal(currentProject.id)}
                    title="Edit project details"
                    style={{
                      background: 'none', border: 'none', color: 'var(--color-text-3)',
                      cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
                      transition: 'color 140ms'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-green)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
                  >
                    <FiEdit2 size={12} />
                    <span>Edit</span>
                  </button>
                </div>
                {currentProject.description && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-sans)' }}>
                    {currentProject.description}
                  </p>
                )}
              </div>
            </div>

            {/* Health Score Pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)', flexShrink: 0
            }}>
              <FiShield size={14} color={projectHealthScore >= 80 ? 'var(--color-green)' : projectHealthScore >= 50 ? 'var(--color-amber)' : 'var(--color-red)'} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                  Vault Health
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: projectHealthScore >= 80 ? 'var(--color-green)' : projectHealthScore >= 50 ? 'var(--color-amber)' : 'var(--color-red)'
                }}>
                  {projectHealthScore} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-text-2)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{projectSecrets.length}</strong> secret{projectSecrets.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: projectAttention.expiringSoon.length > 0 ? 'var(--color-amber)' : 'var(--color-text-3)' }}>
              <strong>{projectAttention.expiringSoon.length}</strong> expiring soon
            </span>
            <span style={{ color: projectAttention.rotationOverdue.length > 0 ? 'var(--color-red)' : 'var(--color-text-3)' }}>
              <strong>{projectAttention.rotationOverdue.length}</strong> rotation overdue
            </span>
            <span style={{ color: 'var(--color-text-3)', marginLeft: 'auto' }}>
              Created {new Date(currentProject.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
          <input
            type="text"
            placeholder="Search secrets by name, service, or type..."
            value={filter.search || ''}
            onChange={e => setFilter({ search: e.target.value })}
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
              color: 'var(--color-text)', fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-sans)', transition: 'border-color 140ms',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-3)', marginRight: 4 }}>
            <FiFilter size={13} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</span>
          </div>
          {activeView === 'all' && (
            <div style={{ flex: '1 1 120px' }}>
              <Dropdown size="sm" options={projectOptions} value={filter.projectId || ''} onChange={v => setFilter({ projectId: v as any })} />
            </div>
          )}
          <div style={{ flex: '1 1 120px' }}>
            <Dropdown size="sm" options={serviceOptions} value={filter.service || ''} onChange={v => setFilter({ service: v as any })} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <Dropdown size="sm" options={toOptions(SECRET_TYPES, 'Types')} value={filter.type || ''} onChange={v => setFilter({ type: v as any })} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <Dropdown size="sm" options={toOptions(ENVIRONMENTS, 'Envs')} value={filter.environment || ''} onChange={v => setFilter({ environment: v as any })} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <Dropdown size="sm" options={toOptions(STATUSES, 'Status')} value={filter.status || ''} onChange={v => setFilter({ status: v as any })} />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex', flexShrink: 0, alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, padding: '5px 10px',
                border: '1px solid rgba(239,68,68,0.2)', background: 'var(--color-red-bg)',
                color: 'var(--color-red)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              <FiX size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {visibleSecrets.length === 0 ? (
        <div style={{
          border: '1px dashed var(--color-border-2)', background: 'var(--color-surface)',
          padding: '64px 32px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center',
            marginBottom: 16,
          }}>
            <FiKey size={20} color="var(--color-text-3)" />
          </div>
          {filter.search ? (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
                No results for "{filter.search}"
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>
                Try a different search term or clear filters.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>No secrets yet</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 20px 0' }}>
                Add your first secret to get started.
              </p>
              <button
                onClick={openAddModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                  background: 'white', color: '#080808', border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <FiPlus size={14} /> Add Secret
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 1,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
        }}>
          {visibleSecrets.map(secret => (
            <SecretCard key={secret.id} secret={secret} project={getProject(secret.projectId)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showExportModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setShowExportModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
              
              <div style={{ padding: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Export .env</h3>
                <p style={{ margin: '8px 0 16px 0', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>
                  Verify your master vault password to temporarily decrypt and download these secrets as a plaintext `.env` file.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vault Password</label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Enter master password"
                    value={exportPassword}
                    onChange={e => { setExportPassword(e.target.value); setExportError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') confirmExportEnv('download'); }}
                    disabled={isExporting}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-mono)', transition: 'border-color 140ms'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                  {exportError && <span style={{ fontSize: 11, color: 'var(--color-red)', marginTop: 4 }}>{exportError}</span>}

                  {/* Export Progress */}
                  {isExporting && exportProgress && (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>
                        Decrypting {exportProgress.current} of {exportProgress.total}...
                      </span>
                    </div>
                  )}

                  {/* Export Result */}
                  {exportResult && (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiCheck size={14} color="var(--color-green)" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-green)', fontFamily: 'var(--font-sans)' }}>
                        {exportResult.exported} secret{exportResult.exported !== 1 ? 's' : ''} exported
                        {exportResult.failed > 0 ? ` (${exportResult.failed} failed)` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--color-surface-2)' }}>
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  style={{
                    padding: '7px 14px', border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: isExporting ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)', transition: 'all 140ms'
                  }}
                  onMouseEnter={e => { if (!isExporting) { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; } }}
                  onMouseLeave={e => { if (!isExporting) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; } }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmExportEnv('copy')}
                  disabled={isExporting || !exportPassword || hasCopied}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: hasCopied ? 'var(--color-green)' : 'var(--color-text)',
                    fontSize: 12, fontWeight: 700, cursor: (isExporting || !exportPassword || hasCopied) ? 'not-allowed' : 'pointer', opacity: (isExporting || !exportPassword) ? 0.5 : 1,
                    fontFamily: 'var(--font-sans)', transition: 'all 140ms'
                  }}
                >
                  {hasCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => confirmExportEnv('download')}
                  disabled={isExporting || !exportPassword || hasCopied}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', border: '1px solid var(--color-green-border)',
                    background: 'var(--color-green)',
                    color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: (isExporting || !exportPassword || hasCopied) ? 'not-allowed' : 'pointer', opacity: (isExporting || !exportPassword) ? 0.5 : 1,
                    fontFamily: 'var(--font-sans)', transition: 'opacity 140ms'
                  }}
                >
                  {isExporting ? (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  ) : 'Decrypt & Download'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
