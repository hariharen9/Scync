import React, { useState, useMemo } from 'react';
import { useLedgerStore } from '../stores/ledgerStore';
import { useUIStore } from '../stores/uiStore';
import type { LedgerEntry, LedgerAction } from '@scync/core';
import {
  FiActivity, FiSearch, FiRefreshCw, FiRotateCcw, FiPlus,
  FiTrash2, FiEye, FiCopy, FiShare2, FiUploadCloud, FiDownloadCloud, FiEdit3
} from 'react-icons/fi';

const ACTION_CONFIG: Record<LedgerAction, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  secret_rotated: { label: 'Rotated', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: <FiRefreshCw size={11} /> },
  secret_restored: { label: 'Restored', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: <FiRotateCcw size={11} /> },
  secret_created: { label: 'Created', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <FiPlus size={11} /> },
  secret_updated: { label: 'Updated', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: <FiEdit3 size={11} /> },
  secret_deleted: { label: 'Deleted', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <FiTrash2 size={11} /> },
  secret_revealed: { label: 'Revealed', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: <FiEye size={11} /> },
  secret_copied: { label: 'Copied', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: <FiCopy size={11} /> },
  secret_shared: { label: 'Shared', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: <FiShare2 size={11} /> },
  env_exported: { label: 'Env Export', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <FiDownloadCloud size={11} /> },
  env_imported: { label: 'Env Import', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <FiUploadCloud size={11} /> },
  password_created: { label: 'Password +', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <FiPlus size={11} /> },
  password_imported: { label: 'Pass Import', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <FiUploadCloud size={11} /> },
};

type FilterCategory = 'all' | 'rotations' | 'changes' | 'audit' | 'sync';

export const VaultLedger: React.FC<{ limit?: number }> = ({ limit = 25 }) => {
  const { entries, isLoading } = useLedgerStore();
  const { selectSecret, setActiveView } = useUIStore();

  const [filter, setFilter] = useState<FilterCategory>('all');
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Category filter
      if (filter === 'rotations' && !['secret_rotated', 'secret_restored'].includes(e.action)) return false;
      if (filter === 'changes' && !['secret_created', 'secret_updated', 'secret_deleted', 'password_created'].includes(e.action)) return false;
      if (filter === 'audit' && !['secret_revealed', 'secret_copied'].includes(e.action)) return false;
      if (filter === 'sync' && !['env_exported', 'env_imported', 'secret_shared', 'password_imported'].includes(e.action)) return false;

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchName = e.entityName?.toLowerCase().includes(q);
        const matchSvc = e.service?.toLowerCase().includes(q);
        const matchDetails = e.details?.toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchSvc && !matchDetails) return false;
      }
      return true;
    }).slice(0, limit);
  }, [entries, filter, search, limit]);

  const formatRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleRowClick = (entry: LedgerEntry) => {
    if (entry.entityId) {
      selectSecret(entry.entityId);
      setActiveView('all');
    }
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 9px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: '1px solid',
    borderColor: active ? 'var(--color-green)' : 'var(--color-border)',
    background: active ? 'var(--color-green-bg)' : 'transparent',
    color: active ? 'var(--color-green)' : 'var(--color-text-3)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all 120ms',
  });

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
            <FiActivity size={12} color="var(--color-green)" />
          </div>
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
              Vault Activity Ledger
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            Immutable Audit Trail
          </span>
        </div>
      </div>

      {/* Controls: Search + Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 200, maxWidth: '100%' }}>
          <FiSearch size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter ledger..."
            style={{
              width: '100%',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              padding: '5px 8px 5px 28px',
              fontSize: 11,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={filterBtnStyle(filter === 'all')}>All</button>
          <button onClick={() => setFilter('rotations')} style={filterBtnStyle(filter === 'rotations')}>Rotations & Rollbacks</button>
          <button onClick={() => setFilter('changes')} style={filterBtnStyle(filter === 'changes')}>Changes</button>
          <button onClick={() => setFilter('sync')} style={filterBtnStyle(filter === 'sync')}>Sync & Shares</button>
          <button onClick={() => setFilter('audit')} style={filterBtnStyle(filter === 'audit')}>Audits</button>
        </div>
      </div>

      {/* Ledger Stream */}
      {filteredEntries.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
          {filteredEntries.map((item) => {
            const cfg = ACTION_CONFIG[item.action] || { label: item.action, color: 'var(--color-text-2)', bg: 'transparent', icon: <FiActivity size={11} /> };
            const isClickable = Boolean(item.entityId);

            return (
              <div
                key={item.id}
                onClick={isClickable ? () => handleRowClick(item) : undefined}
                style={{
                  background: 'var(--color-surface)',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={e => { if (isClickable) e.currentTarget.style.background = 'var(--color-surface)'; }}
              >
                {/* Left: Action Pill + Entity Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 7px',
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.color}33`,
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-sans)',
                      flexShrink: 0,
                    }}
                  >
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </div>

                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
                      {item.title}
                    </span>
                    {item.version && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
                        v{item.version}
                      </span>
                    )}
                    {item.details && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:inline">
                        · {item.details}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Timestamp */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }} title={item.timestamp.toLocaleString()}>
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: '1px dashed var(--color-border)', background: 'var(--color-surface-2)' }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-sans)' }}>
            {entries.length === 0 
              ? (isLoading ? 'Syncing vault ledger...' : 'No ledger events recorded yet. Rotations, rollbacks, and secret updates will appear here in real time.')
              : 'No events match your current filter.'}
          </p>
        </div>
      )}
    </div>
  );
};
