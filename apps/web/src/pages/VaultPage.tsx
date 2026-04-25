import React, { useEffect } from 'react';
import { useAuthStore, useVaultStore, useProjectStore, useUIStore,
         Sidebar, Dashboard, SecretList, SecretDetail, AddEditModal, EnvImportModal, AddProjectModal } from '@scync/ui';
import { FiLock, FiPlus, FiUpload, FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export const VaultPage: React.FC = () => {
  const { user } = useAuthStore();
  const { subscribeToSecrets, lock } = useVaultStore();
  const { subscribeToProjects } = useProjectStore();
  const { activeView, selectedSecretId, openAddModal, openEnvImportModal, toggleMobileMenu, isMobileMenuOpen, selectSecret } = useUIStore();

  useEffect(() => {
    if (!user) return;
    const unsubSecrets = subscribeToSecrets(user.uid);
    const unsubProjects = subscribeToProjects(user.uid);
    return () => { unsubSecrets(); unsubProjects(); };
  }, [user, subscribeToSecrets, subscribeToProjects]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-base text-text-primary">
      {/* ─── Header ─── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 60,
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(12,12,18,0.95)',
        backdropFilter: 'blur(20px)',
        padding: '0 1rem',
        flexShrink: 0,
      }}>
        {/* Left: Mobile Menu & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={toggleMobileMenu}
            className="flex md:hidden items-center justify-center rounded-lg transition-colors"
            style={{ 
              width: 40, 
              height: 40, 
              border: 'none', 
              background: isMobileMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent', 
              color: '#ededed', 
              cursor: 'pointer' 
            }}
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, oklch(0.55 0.25 280) 0%, oklch(0.50 0.20 300) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px oklch(0.55 0.25 280 / 0.35)',
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>S</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ededed' }} className="hidden sm:inline">Scync</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: '0.375rem', background: 'rgba(124,106,247,0.15)', color: '#7c6af7', border: '1px solid rgba(124,106,247,0.25)' }} className="hidden sm:inline">BETA</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            onClick={openEnvImportModal}
            className="hidden sm:flex"
            style={{ alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: 'transparent', color: '#8b8b9e', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}
          >
            <FiUpload size={14} />
            <span>.env</span>
          </button>

          <button
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: 'none', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.20 300))' }}
          >
            <FiPlus size={16} />
            <span className="hidden sm:inline">Add Secret</span>
          </button>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)', margin: '0 0.375rem' }} className="hidden sm:block" />

          {/* User avatar */}
          <div className="hidden sm:flex items-center gap-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.20 300))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <button
            onClick={lock}
            title="Lock Vault"
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: 'none', background: 'transparent', color: '#8b8b9e', cursor: 'pointer' }}
          >
            <FiLock size={18} />
          </button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 relative">
        <div className="hidden md:flex flex-col sticky top-[60px] h-[calc(100vh-60px)]">
          <Sidebar />
        </div>

        {/* Main content - allow expanding globally */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 px-4 py-6 sm:px-6 md:p-10 lg:p-12 xl:p-16 w-full"
          style={{ width: '100%', maxWidth: '100vw' }}
        >
          {activeView === 'dashboard' ? <Dashboard /> : <SecretList />}
        </motion.div>

        {/* Detail panel with animation - Mobile Bottom Sheet or Desktop Side Panel */}
        <AnimatePresence>
          {selectedSecretId && (
            <>
              {/* Mobile overlay backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => selectSecret(null)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed lg:sticky right-0 top-[60px] h-[calc(100vh-60px)] z-50 lg:z-auto bg-base border-l border-white/5"
                style={{ width: '100%', maxWidth: '420px', height: '100%' }}
              >
                <SecretDetail />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
              className="md:hidden fixed inset-0 top-[60px] bg-black/70 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-[60px] bottom-0 z-50"
              style={{ width: '280px' }}
            >
              <Sidebar className="flex flex-col w-full border-r-0 shadow-2xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddEditModal />
      <EnvImportModal />
      <AddProjectModal />
    </div>
  );
};
