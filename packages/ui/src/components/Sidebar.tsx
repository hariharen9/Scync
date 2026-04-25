import React from 'react';
import { useUIStore, type UIState } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { FiSearch, FiGrid, FiList, FiFolder, FiPlus, FiLock } from 'react-icons/fi';
import { ServiceIcon } from './ServiceIcon';

export const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { activeView, setActiveView, filter, setFilter, closeMobileMenu, openAddProjectModal } = useUIStore();
  const { projects, selectedProjectId, selectProject } = useProjectStore();
  const { storedSecrets } = useVaultStore();
  const { user } = useAuthStore();
  const { lock } = useVaultStore();

  const handleNav = (view: UIState['activeView']) => {
    setActiveView(view);
    if (view === 'all') {
      setFilter({ service: '', search: '', type: '', environment: '', status: '' });
    }
    closeMobileMenu();
  };

  const handleProjectNav = (id: string | null) => {
    setActiveView('project');
    selectProject(id);
    closeMobileMenu();
  };

  const handleServiceNav = (name: string) => {
    setActiveView('all');
    setFilter({ service: name });
    closeMobileMenu();
  };

  const getProjectCount = (id: string | null) =>
    storedSecrets.filter(s => s.projectId === id).length;

  const getServiceCount = (name: string) =>
    storedSecrets.filter(s => s.service === name).length;

  const { customServices } = useServiceStore();

  const navItems = [
    { id: 'dashboard' as const, icon: FiGrid, label: 'Dashboard' },
    { id: 'all' as const, icon: FiList, label: 'All Secrets', count: storedSecrets.length },
  ];

  const sidebarStyle: React.CSSProperties = {
    width: 216, minWidth: 216, height: '100%',
    borderRight: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    display: 'flex', flexDirection: 'column',
    flexShrink: 0, overflow: 'hidden',
  };

  const navBtnStyle = (isActive: boolean): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '7px 10px', border: 'none',
    background: isActive ? 'var(--color-surface-3)' : 'transparent',
    color: isActive ? 'var(--color-text)' : 'var(--color-text-2)',
    fontSize: '12.5px', fontWeight: isActive ? 600 : 500,
    cursor: 'pointer', textAlign: 'left',
    transition: 'all 140ms', fontFamily: 'var(--font-sans)',
    borderLeft: isActive ? '2px solid var(--color-green)' : '2px solid transparent',
  });

  const countBadgeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500,
    color: 'var(--color-text-3)', padding: '1px 5px',
    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '9.5px', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: 'var(--color-text-3)',
    padding: '0 10px', marginBottom: 6,
  };

  return (
    <div style={sidebarStyle} className={className}>
      {/* Logo */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Scync" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)' }}>Scync</span>
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '2px 5px', background: 'var(--color-green-bg)',
          border: '1px solid var(--color-green-border)', color: 'var(--color-green)',
          marginLeft: 'auto',
        }}>BETA</span>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 10px 8px' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search secrets..."
            value={filter.search}
            onChange={e => setFilter({ search: e.target.value })}
            style={{
              width: '100%', border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)', padding: '7px 9px 7px 28px',
              fontSize: '12px', color: 'var(--color-text)', outline: 'none',
              fontFamily: 'var(--font-sans)', transition: 'border-color 140ms',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 16 }}>
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={navBtnStyle(isActive)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <item.icon size={14} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span style={countBadgeStyle}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Projects */}
        <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...sectionLabel, marginBottom: 8 }}>
          <span>Projects</span>
          <button
            onClick={openAddProjectModal}
            style={{
              width: 18, height: 18, display: 'grid', placeItems: 'center',
              border: 'none', background: 'none', color: 'var(--color-text-3)',
              cursor: 'pointer', transition: 'color 140ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            <FiPlus size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {projects.map(p => {
            const isActive = activeView === 'project' && selectedProjectId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProjectNav(p.id)}
                style={navBtnStyle(isActive)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14 }}>{p.icon || '📁'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <span style={countBadgeStyle}>{getProjectCount(p.id)}</span>
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
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiFolder size={13} style={{ opacity: 0.5 }} />
                  <span>Uncategorized</span>
                </div>
                <span style={countBadgeStyle}>{getProjectCount(null)}</span>
              </button>
            );
          })()}
        </div>

        {/* Services */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 0 12px' }} />
        <div style={sectionLabel}>Services</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 16 }}>
          {[...new Set([...storedSecrets.map(s => s.service), ...customServices.map(s => s.name)])].sort().map(svc => {
            const isActive = activeView === 'all' && filter.service === svc;
            const custom = customServices.find(cs => cs.name === svc);
            return (
              <button
                key={svc}
                onClick={() => handleServiceNav(svc)}
                style={navBtnStyle(isActive)}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {custom
                    ? <span style={{ fontSize: 14, lineHeight: 1 }}>{custom.icon || '🌐'}</span>
                    : <ServiceIcon service={svc} size={13} style={{ opacity: 0.75 }} />
                  }
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc}</span>
                </div>
                <span style={countBadgeStyle}>{getServiceCount(svc)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--color-border-2)' }} />
          ) : (
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--color-surface-3)', border: '1px solid var(--color-border-2)',
              display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: 'var(--color-text)',
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
            {user?.displayName || user?.email?.split('@')[0]}
          </span>
        </div>
        <button
          onClick={lock}
          title="Lock Vault"
          style={{
            width: 28, height: 28, display: 'grid', placeItems: 'center',
            border: 'none', background: 'none', color: 'var(--color-text-3)',
            cursor: 'pointer', transition: 'color 140ms',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
        >
          <FiLock size={13} />
        </button>
      </div>
    </div>
  );
};
