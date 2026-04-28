import React, { useEffect, useState } from 'react';
import { useAuthStore, useVaultStore, useProjectStore, useServiceStore, useUIStore,
         Sidebar, Dashboard, SecretList, SecretDetail, AddEditModal, EnvImportModal, AddProjectModal, AddServiceModal, AboutModal, ConfirmModal, SettingsModal, useInactivityLock, SSHManagerDashboard, SSHKeyModal, TOTPDashboard, TOTPAddModal } from '@scync/ui';
import { FiLock, FiPlus, FiUpload, FiMenu, FiX, FiInfo, FiSettings } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

export const VaultPage: React.FC = () => {
  const { user } = useAuthStore();
  const { subscribeToSecrets, subscribeToSSHKeys, lock } = useVaultStore();
  const { subscribeToProjects } = useProjectStore();
  const { activeView, selectedSecretId, openAddModal, openEnvImportModal, toggleMobileMenu, isMobileMenuOpen, selectSecret, openAboutModal, openSettingsModal } = useUIStore();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useInactivityLock();

  useEffect(() => {
    if (!user) return;
    const unsubSecrets = subscribeToSecrets(user.uid);
    const unsubSSHKeys = subscribeToSSHKeys(user.uid);
    const unsubTOTPs = useVaultStore.getState().subscribeToTOTPs(user.uid);
    const unsubProjects = subscribeToProjects(user.uid);
    const unsubServices = useServiceStore.getState().subscribeToServices(user.uid);
    return () => { unsubSecrets(); unsubSSHKeys(); unsubTOTPs(); unsubProjects(); unsubServices(); };
  }, [user, subscribeToSecrets, subscribeToSSHKeys, subscribeToProjects]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* ─── Sidebar (Desktop) ─── */}
      <div className="hidden md:flex flex-col" style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <Sidebar />
      </div>

      {/* ─── Main Area ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid var(--color-border)' }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 52, minHeight: 52, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)', padding: '0 16px', flexShrink: 0,
        }}>
          {/* Left: Mobile Toggle + Logo (mobile only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggleMobileMenu}
              className="flex md:hidden"
              style={{
                width: 36, height: 36, border: 'none', background: 'none',
                color: 'var(--color-text-2)', cursor: 'pointer',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isMobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
            <div className="flex md:hidden items-center" style={{ gap: 8 }}>
              <img src="/logo.png" alt="Scync" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>Scync</span>
            </div>
            <button
              onClick={openAboutModal}
              className="hidden md:flex"
              style={{
                alignItems: 'center', gap: 6,
                padding: '7px 12px', border: '1px solid var(--color-border)',
                background: 'none', color: 'var(--color-text-2)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'border-color 140ms, color 140ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-green-border)'; e.currentTarget.style.color = 'var(--color-green)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
            >
              <FiInfo size={12} />
              Why Scync?
            </button>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <button
              onClick={openEnvImportModal}
              className="hidden sm:flex"
              style={{
                alignItems: 'center', gap: 6,
                padding: '7px 12px', border: '1px solid var(--color-border)',
                background: 'none', color: 'var(--color-text-2)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'border-color 140ms, color 140ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
            >
              <FiUpload size={12} />
              .env
            </button>



            <button
              onClick={openAddModal}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', background: 'white', color: '#080808',
                border: 'none', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer',
                transition: 'background 140ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <FiPlus size={14} />
              <span className="hidden sm:inline">Add Secret</span>
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} className="hidden sm:block" />

            {/* User avatar */}
            <div className="hidden sm:flex items-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border-2)' }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--color-surface-3)', border: '1px solid var(--color-border-2)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--color-text)',
                  fontFamily: 'var(--font-sans)'
                }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={openSettingsModal}
              title="Settings"
              style={{
                width: 36, height: 36, display: 'grid', placeItems: 'center',
                border: 'none', background: 'none', color: 'var(--color-text-3)',
                cursor: 'pointer', transition: 'color 140ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
            >
              <FiSettings size={15} />
            </button>

            <button
              onClick={lock}
              title="Lock Vault"
              style={{
                width: 36, height: 36, display: 'grid', placeItems: 'center',
                border: 'none', background: 'none', color: 'var(--color-text-3)',
                cursor: 'pointer', transition: 'color 140ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
            >
              <FiLock size={15} />
            </button>
          </div>
        </header>

        {/* ─── Content ─── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          {/* Main content */}
          <div
            key={activeView}
            style={{
              flex: 1, padding: '36px 28px', width: '100%', minWidth: 0,
              animation: 'fadeUp .35s cubic-bezier(.16,1,.3,1) both',
              overflowY: 'auto',
            }}
          >
            {activeView === 'dashboard' ? <Dashboard /> : activeView === 'ssh' ? <SSHManagerDashboard /> : activeView === 'totp' ? <TOTPDashboard /> : <SecretList />}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selectedSecretId && (
              <>
                {/* Mobile overlay backdrop */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => selectSecret(null)}
                  style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
                  className="lg:hidden"
                />

                {/* Panel — sticky on desktop, bottom sheet on mobile */}
                <motion.div
                  key="detail"
                  initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, x: 40 }}
                  animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
                  exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, x: 40 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                  drag={isMobile ? "y" : false}
                  dragConstraints={{ top: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_e, info) => {
                    if (isMobile && (info.offset.y > 100 || info.velocity.y > 500)) {
                      selectSecret(null);
                    }
                  }}
                  style={{
                    borderLeft: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}
                  className={
                    isMobile
                      ? "fixed bottom-0 left-0 right-0 w-full max-h-[85vh] z-50 flex flex-col rounded-t-2xl shadow-2xl border-t border-[var(--color-border)]"
                      : "fixed right-0 top-0 h-screen w-full max-w-[400px] z-50 lg:sticky lg:top-0 lg:h-[calc(100vh-52px)] lg:w-[380px] lg:max-w-[380px] lg:z-auto flex flex-col"
                  }
                >
                  {isMobile && (
                    <div style={{ width: '100%', height: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, cursor: 'grab' }} className="active:cursor-grabbing">
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border-2)' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, overflowY: 'auto' }} onPointerDownCapture={e => isMobile && e.stopPropagation()}>
                    <SecretDetail />
                  </div>
                </motion.div>

              </>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Footer ─── */}
        <footer style={{
          padding: '14px 28px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          fontSize: '10px',
          color: 'var(--color-text-3)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--color-bg)',
          flexShrink: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 12 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20, flexWrap: 'wrap' }}>
            <span>&copy; {new Date().getFullYear()} SCYNC VAULT</span>
            {!isMobile && <span style={{ color: 'var(--color-border)' }}>/</span>}
            <span style={{ opacity: 0.8, fontSize: isMobile ? '9px' : '10px' }}>"YOUR VAULT. YOUR KEYS. YOUR RULES."</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: isMobile ? '0' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
            <span>DISTRIBUTED UNDER MIT LICENSE</span>
          </div>
        </footer>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
              className="md:hidden fixed inset-0 top-[52px] z-40"
              style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-[52px] bottom-0 z-50"
              style={{ width: 240 }}
            >
              <Sidebar className="flex flex-col w-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddEditModal />
      <EnvImportModal />
      <AddProjectModal />
      <AddServiceModal />
      <AboutModal />
      <SettingsModal />
      <ConfirmModal />
      <SSHKeyModal />
      <TOTPAddModal />
    </div>
  );
};
