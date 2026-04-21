import React from 'react';
import { FiSearch, FiGrid, FiList, FiFolder, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useVaultStore } from '../stores/vaultStore';

export const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { activeView, setActiveView, filter, setFilter, closeMobileMenu } = useUIStore();
  const { projects, selectedProjectId, selectProject } = useProjectStore();
  const { storedSecrets } = useVaultStore();

  const handleNav = (view: any) => {
    setActiveView(view);
    closeMobileMenu();
  };

  const handleProjectNav = (id: string | null) => {
    setActiveView('project');
    selectProject(id);
    closeMobileMenu();
  };

  const getProjectCount = (id: string | null) =>
    storedSecrets.filter(s => s.projectId === id).length;

  const navItems = [
    { id: 'dashboard' as const, icon: FiGrid, label: 'Dashboard' },
    { id: 'all' as const, icon: FiList, label: 'All Secrets', count: storedSecrets.length },
  ];

  const sidebarStyle: React.CSSProperties = {
    width: 240,
    minWidth: 240,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(12,12,18,0.7)',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
    flexShrink: 0,
  };

  const navBtnStyle = (isActive: boolean): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.625rem',
    border: 'none',
    background: isActive ? 'rgba(124,106,247,0.12)' : 'transparent',
    color: isActive ? '#7c6af7' : '#8b8b9e',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  });

  const countBadgeStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: '0.375rem',
    background: isActive ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.06)',
    color: isActive ? '#7c6af7' : '#44445a',
  });

  return (
    <div style={sidebarStyle} className={className}>
      {/* Search */}
      <div style={{ padding: '1rem 0.875rem 0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch
            size={15}
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#44445a', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search secrets..."
            value={filter.search}
            onChange={e => setFilter({ search: e.target.value })}
            style={{
              width: '100%',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.04)',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              fontSize: '0.8125rem',
              color: '#ededed',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.875rem' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={navBtnStyle(isActive)}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.color = '#ededed'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#8b8b9e'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span style={countBadgeStyle(isActive)}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Projects section */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: '1rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem', padding: '0 0.25rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#44445a' }}>
            Projects
          </span>
          <button style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.375rem', border: 'none', background: 'transparent', color: '#44445a', cursor: 'pointer', transition: 'all 0.15s' }}>
            <FiPlus size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {projects.map(p => {
            const isActive = activeView === 'project' && selectedProjectId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProjectNav(p.id)}
                style={navBtnStyle(isActive)}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.color = '#ededed'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#8b8b9e'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                  <span>{p.icon || '📁'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <span style={countBadgeStyle(isActive)}>{getProjectCount(p.id)}</span>
              </button>
            );
          })}

          {/* Uncategorized */}
          {(() => {
            const isActive = activeView === 'project' && selectedProjectId === null;
            return (
              <button
                onClick={() => handleProjectNav(null)}
                style={navBtnStyle(isActive)}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.color = '#ededed'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#8b8b9e'; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <FiFolder size={15} style={{ opacity: 0.5 }} />
                  <span>Uncategorized</span>
                </div>
                <span style={countBadgeStyle(isActive)}>{getProjectCount(null)}</span>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
