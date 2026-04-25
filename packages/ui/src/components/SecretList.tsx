import React from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { SecretCard } from './SecretCard';
import { Dropdown, type DropdownOption } from './Dropdown';
import { FiKey, FiPlus, FiFilter, FiX, FiSearch } from 'react-icons/fi';
import { SERVICES, SECRET_TYPES, ENVIRONMENTS, STATUSES } from '@scync/core';

const toOptions = (arr: readonly string[], placeholder: string): DropdownOption[] => [
  { value: '', label: placeholder },
  ...arr.map(v => ({ value: v, label: v })),
];

export const SecretList: React.FC = () => {
  const { storedSecrets } = useVaultStore();
  const { filter, setFilter, clearFilters, activeView, selectedSecretId, openAddModal } = useUIStore();
  const { selectedProjectId, projects } = useProjectStore();

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
    return true;
  });

  const hasActiveFilters = !!(filter.service || filter.type || filter.environment || filter.status);

  const title = activeView === 'project'
    ? (selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name || 'Project' : 'Uncategorized')
    : 'All Secrets';

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--color-text)', margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            {visibleSecrets.length} secret{visibleSecrets.length !== 1 ? 's' : ''}
          </p>
        </div>
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
          <div style={{ flex: '1 1 120px' }}>
            <Dropdown size="sm" options={toOptions(SERVICES, 'Services')} value={filter.service || ''} onChange={v => setFilter({ service: v as any })} />
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
    </div>
  );
};
