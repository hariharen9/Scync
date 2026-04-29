import React, { useState } from 'react';
import { useUIStore, type UIState } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { useAuthStore } from '../stores/authStore';
import { useVaultStore } from '../stores/vaultStore';
import { FiSearch, FiGrid, FiList, FiFolder, FiPlus, FiGithub, FiGlobe, FiEdit2, FiTrash2, FiKey, FiShield, FiLink } from 'react-icons/fi';
import { ServiceIcon } from './ServiceIcon';
import { ProjectIcon, PROJECT_COLOR_MAP } from './ProjectIcons';
import { CustomServiceIcon } from './CustomServiceIcons';
import { ActiveSharesModal } from './ActiveSharesModal';

const SystemClock: React.FC = () => {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="desktop-only" style={{ 
      marginTop: 4, padding: '8px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)'
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-green)', letterSpacing: '0.05em' }}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>
        {time.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
};

export const Sidebar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { activeView, setActiveView, filter, setFilter, clearFilters, closeMobileMenu, openAddProjectModal, openAddServiceModal, openConfirmModal } = useUIStore();
  const { projects, selectedProjectId, selectProject, deleteProject, updateProject } = useProjectStore();
  const { customServices, deleteService } = useServiceStore();
  const { storedSecrets, storedSSHKeys, storedTOTPs } = useVaultStore();
  const { user } = useAuthStore();

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isActiveSharesOpen, setIsActiveSharesOpen] = useState(false);

  const handleNav = (view: UIState['activeView']) => {
    setActiveView(view);
    clearFilters();
    closeMobileMenu();
  };

  const handleProjectNav = (id: string | null) => {
    setActiveView('project');
    selectProject(id);
    clearFilters();
    closeMobileMenu();
  };

  const handleServiceNav = (name: string) => {
    setActiveView('all');
    clearFilters();
    setFilter({ service: name });
    closeMobileMenu();
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!user) return;
    openConfirmModal({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${name}"? Secrets inside will become uncategorized.`,
      confirmText: 'Delete Project',
      danger: true,
      onConfirm: async () => {
        await deleteProject(user.uid, id, null);
      }
    });
  };

  const handleStartEditProject = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingProjectId(id);
    setEditingProjectName(name);
  };

  const handleSaveProjectName = async (id: string) => {
    if (!user || !editingProjectName.trim()) { setEditingProjectId(null); return; }
    await updateProject(user.uid, id, { name: editingProjectName.trim() });
    setEditingProjectId(null);
  };

  const handleDeleteService = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!user) return;
    openConfirmModal({
      title: 'Delete Custom Service',
      message: `Are you sure you want to delete "${name}"?`,
      confirmText: 'Delete Service',
      danger: true,
      onConfirm: async () => {
        await deleteService(user.uid, id);
      }
    });
  };

  const getProjectCount = (id: string | null) =>
    storedSecrets.filter(s => s.projectId === id).length;

  const getServiceCount = (name: string) =>
    storedSecrets.filter(s => s.service === name).length;

  const navItems = [
    { id: 'dashboard' as const, icon: FiGrid, label: 'Dashboard' },
    { id: 'all' as const, icon: FiList, label: 'All Secrets', count: storedSecrets.length },
    { id: 'ssh' as const, icon: FiKey, label: 'SSH Manager', count: storedSSHKeys.length },
    { id: 'totp' as const, icon: FiShield, label: 'Authenticator', count: storedTOTPs.length },
  ];

  const utilityItems = [
    { id: 'shares' as const, icon: FiLink, label: 'Active Shares', action: () => setIsActiveSharesOpen(true) }
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

  const iconBtn = (danger = false): React.CSSProperties => ({
    width: 18, height: 18, display: 'grid', placeItems: 'center',
    border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
    color: danger ? 'var(--color-red)' : 'var(--color-text-3)',
    opacity: 0.8, transition: 'opacity 100ms',
    padding: 0,
  });

  return (
    <>
    <div style={sidebarStyle} className={className}>
      {/* Logo */}
      <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Scync" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>Scync</span>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 10px 8px' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search secrets..."
            value={filter.search}
            onChange={e => { setFilter({ search: e.target.value }); if (e.target.value) setActiveView('all'); }}
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

        {/* Utility Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 16 }}>
          {utilityItems.map(item => (
            <button
              key={item.id}
              onClick={item.action}
              style={navBtnStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <item.icon size={14} />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Projects ── */}
        <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...sectionLabel, marginBottom: 8 }}>
          <span>Projects</span>
          <button
            onClick={openAddProjectModal}
            style={iconBtn()}
            title="Add project"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-green)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            <FiPlus size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {projects.map(p => {
            const isActive = activeView === 'project' && selectedProjectId === p.id;
            const isHovered = hoveredProject === p.id;
            const accentColor = PROJECT_COLOR_MAP[p.color] ?? 'var(--color-text-2)';
            const isEditing = editingProjectId === p.id;
            return (
              <div
                key={p.id}
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={() => setHoveredProject(p.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <button
                  onClick={() => !isEditing && handleProjectNav(p.id)}
                  style={{ ...navBtnStyle(isActive), flex: 1, minWidth: 0 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <ProjectIcon iconKey={p.icon || 'FiFolder'} size={13} color={accentColor} />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingProjectName}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setEditingProjectName(e.target.value)}
                        onBlur={() => handleSaveProjectName(p.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveProjectName(p.id); if (e.key === 'Escape') setEditingProjectId(null); }}
                        style={{
                          flex: 1, background: 'var(--color-surface-3)', border: '1px solid var(--color-green)',
                          color: 'var(--color-text)', fontSize: 12, padding: '1px 4px',
                          fontFamily: 'var(--font-sans)', outline: 'none', minWidth: 0,
                        }}
                      />
                    ) : (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    )}
                  </div>
                  {!isHovered && <span style={countBadgeStyle}>{getProjectCount(p.id)}</span>}
                </button>
                {/* Hover actions */}
                {isHovered && !isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 6, flexShrink: 0 }}>
                    <button
                      style={iconBtn()}
                      title="Rename"
                      onClick={e => handleStartEditProject(e, p.id, p.name)}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
                    >
                      <FiEdit2 size={11} />
                    </button>
                    <button
                      style={iconBtn(true)}
                      title="Delete"
                      onClick={e => handleDeleteProject(e, p.id, p.name)}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
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

        {/* ── Services ── */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 0 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...sectionLabel, marginBottom: 8 }}>
          <span>Services</span>
          <button
            onClick={openAddServiceModal}
            style={iconBtn()}
            title="Add service"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-green)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            <FiPlus size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingBottom: 16 }}>
          {[...new Set([...storedSecrets.map(s => s.service), ...customServices.map(s => s.name)])].sort().map(svc => {
            const isActive = activeView === 'all' && filter.service === svc;
            const isHovered = hoveredService === svc;
            const custom = customServices.find(cs => cs.name === svc);
            return (
              <div
                key={svc}
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                onMouseEnter={() => setHoveredService(svc)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <button
                  onClick={() => handleServiceNav(svc)}
                  style={{ ...navBtnStyle(isActive), flex: 1, minWidth: 0 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {custom
                      ? <CustomServiceIcon iconKey={custom.icon || 'FaAmazon'} size={13} color={PROJECT_COLOR_MAP[custom.color] ?? 'var(--color-text-2)'} />
                      : <ServiceIcon service={svc} size={13} style={{ opacity: 0.75 }} />
                    }
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc}</span>
                  </div>
                  {!isHovered && <span style={countBadgeStyle}>{getServiceCount(svc)}</span>}
                </button>
                {/* Hover actions — only for custom services (can't delete built-in ones) */}
                {isHovered && custom && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 6, flexShrink: 0 }}>
                    <button
                      style={iconBtn(true)}
                      title="Delete"
                      onClick={e => handleDeleteService(e, custom.id, custom.name)}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px', borderTop: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-2)', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>
          {__APP_VERSION__ && `Scync ${__APP_VERSION__}`}
        </div>

        <SystemClock />

        <div style={{ 
          fontSize: '8.5px', fontWeight: 800, textTransform: 'uppercase', 
          letterSpacing: '0.12em', color: 'var(--color-text-3)',
          display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0'
        }}>
          <span style={{ fontFamily: 'var(--font-sans)' }}>Created by <span style={{ color: 'var(--color-green)' }}>Hariharen</span></span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <a href="https://hariharen.site" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}>
            <FiGlobe size={11} /> <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Portfolio</span>
          </a>
          <a href="https://github.com/hariharen9/Scync" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-2)', textDecoration: 'none', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}>
            <FiGithub size={11} /> <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>GitHub</span>
          </a>
        </div>
      </div>
    </div>
    
    {/* Active Shares Modal */}
    <ActiveSharesModal isOpen={isActiveSharesOpen} onClose={() => setIsActiveSharesOpen(false)} />
    </>
  );
};
