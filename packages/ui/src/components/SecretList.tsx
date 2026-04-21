import React from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { SecretCard } from './SecretCard';
import { Dropdown, DropdownOption } from './Dropdown';
import { motion } from 'framer-motion';
import { FiKey, FiPlus, FiFilter, FiX } from 'react-icons/fi';
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
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ededed', margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#8b8b9e', margin: '0.375rem 0 0 0' }}>
            {visibleSecrets.length} secret{visibleSecrets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none', background: 'rgba(124,106,247,0.15)', color: '#7c6af7', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(124,106,247,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(124,106,247,0.15)'; }}
        >
          <FiPlus size={15} />
          Add Secret
        </button>
      </div>

      {/* Filters */}
      <div 
        style={{ 
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem'
        }}>
        <FiFilter size={14} style={{ color: '#44445a', flexShrink: 0 }} />
        <div style={{ minWidth: 160 }}>
          <Dropdown
            size="sm"
            options={toOptions(SERVICES, 'All Services')}
            value={filter.service || ''}
            onChange={v => setFilter({ service: v as any })}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <Dropdown
            size="sm"
            options={toOptions(SECRET_TYPES, 'All Types')}
            value={filter.type || ''}
            onChange={v => setFilter({ type: v as any })}
          />
        </div>
        <div style={{ minWidth: 150 }}>
          <Dropdown
            size="sm"
            options={toOptions(ENVIRONMENTS, 'All Envs')}
            value={filter.environment || ''}
            onChange={v => setFilter({ environment: v as any })}
          />
        </div>
        <div style={{ minWidth: 150 }}>
          <Dropdown
            size="sm"
            options={toOptions(STATUSES, 'All Status')}
            value={filter.status || ''}
            onChange={v => setFilter({ status: v as any })}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.625rem', borderRadius: '0.5rem', border: 'none', background: 'rgba(248,113,113,0.12)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <FiX size={12} /> Clear
          </button>
        )}
      </div>

      {/* Empty state */}
      {visibleSecrets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: '1rem',
            border: '1px dashed rgba(255,255,255,0.07)',
            background: 'rgba(18,18,28,0.4)',
            padding: '5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <FiKey size={22} style={{ color: '#44445a' }} />
          </div>
          {filter.search ? (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ededed', margin: '0 0 0.5rem 0' }}>
                No results for "{filter.search}"
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#8b8b9e', margin: 0 }}>
                Try a different search term or clear filters.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ededed', margin: '0 0 0.5rem 0' }}>No secrets yet</h3>
              <p style={{ fontSize: '0.875rem', color: '#8b8b9e', margin: '0 0 1.5rem 0' }}>
                Add your first secret to get started.
              </p>
              <button
                onClick={openAddModal}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.20 300))', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <FiPlus size={15} /> Add Secret
              </button>
            </>
          )}
        </motion.div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedSecretId
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {visibleSecrets.map(secret => (
            <motion.div
              key={secret.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SecretCard secret={secret} project={getProject(secret.projectId)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
