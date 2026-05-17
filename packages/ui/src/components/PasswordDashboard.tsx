import React, { useState } from 'react';
import { FiPlus, FiDownload, FiLock, FiSearch, FiCopy, FiCheck, FiMoreVertical, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useClipboard } from '../hooks/useClipboard';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoredPassword, DecryptedPassword } from '@scync/core';

export const PasswordDashboard: React.FC = () => {
  const { storedPasswords } = useVaultStore();
  const { openAddPasswordModal, openPasswordImportModal } = useUIStore();
  const [search, setSearch] = useState('');
  
  const filtered = storedPasswords.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.url && p.url.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLock style={{ color: 'var(--color-green)' }} /> Passwords
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-2)', fontSize: 13 }}>
            Manage and securely store your website and application passwords.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={openPasswordImportModal} className="btn-ghost" style={{ padding: '7px 12px' }}>
            <FiDownload size={14} /> Import
          </button>
          <button onClick={openAddPasswordModal} className="btn-primary" style={{ padding: '7px 12px' }}>
            <FiPlus size={14} /> Add Password
          </button>
        </div>
      </header>

      <div style={{ position: 'relative', maxWidth: 400 }}>
        <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
        <input 
          type="text" 
          placeholder="Search passwords..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ paddingLeft: 34, borderRadius: 0 }}
        />
      </div>

      {storedPasswords.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <FiLock size={32} style={{ color: 'var(--color-border-2)', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>No Passwords Yet</h3>
          <p style={{ margin: '0 0 24px', color: 'var(--color-text-2)', fontSize: 13 }}>Import from Google or Bitwarden, or add one manually.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={openPasswordImportModal} className="btn-ghost"><FiDownload size={14} /> Import CSV</button>
            <button onClick={openAddPasswordModal} className="btn-primary"><FiPlus size={14} /> Add Manual</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(pwd => (
            <PasswordCard key={pwd.id} password={pwd} />
          ))}
        </div>
      )}
    </div>
  );
};

const PasswordCard: React.FC<{ password: StoredPassword }> = ({ password }) => {
  const { user } = useAuthStore();
  const { deletePassword, decryptPassword } = useVaultStore();
  const { openConfirmModal } = useUIStore();
  const { copy, hasCopied } = useClipboard();
  
  const [decrypted, setDecrypted] = useState<DecryptedPassword | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopy = async () => {
    if (!decrypted) {
      const p = await decryptPassword(password.id);
      if (p) {
        setDecrypted(p);
        copy(p.password);
      }
    } else {
      copy(decrypted.password);
    }
  };

  const handleReveal = async () => {
    if (isRevealed) {
      setIsRevealed(false);
    } else {
      if (!decrypted) {
        const p = await decryptPassword(password.id);
        if (p) setDecrypted(p);
      }
      setIsRevealed(true);
      // Auto hide after 15 seconds
      setTimeout(() => setIsRevealed(false), 15000);
    }
  };

  const handleDelete = () => {
    if (!user) return;
    openConfirmModal({
      title: 'Delete Password',
      message: `Are you sure you want to delete the password for "${password.name}"?`,
      danger: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        await deletePassword(user.uid, password.id);
      }
    });
  };

  const handleEdit = () => {
    window.dispatchEvent(new CustomEvent('open-edit-password', { detail: password.id }));
  };

  return (
    <div style={{ 
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {password.name}
          </h3>
          <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {password.username || 'No username'}
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="btn-ghost"
            style={{ width: 28, height: 28, padding: 0, display: 'grid', placeItems: 'center', border: 'none' }}
          >
            <FiMoreVertical size={14} />
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 20,
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 120, padding: 4
                  }}
                >
                  {password.url && (
                    <a href={password.url.startsWith('http') ? password.url : `https://${password.url}`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: 'var(--color-text)', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiExternalLink size={12} /> Open URL
                    </a>
                  )}
                  <button onClick={() => { setIsMenuOpen(false); handleEdit(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiEdit2 size={12} /> Edit
                  </button>
                  <button onClick={() => { setIsMenuOpen(false); handleDelete(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-red-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiTrash2 size={12} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            type={isRevealed ? 'text' : 'password'}
            value={isRevealed && decrypted ? decrypted.password : '••••••••••••'}
            readOnly
            className="input-field"
            style={{ fontFamily: 'var(--font-mono)', paddingRight: 32 }}
          />
          <button
            onClick={handleReveal}
            style={{ 
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase'
            }}
          >
            {isRevealed ? 'HIDE' : 'SHOW'}
          </button>
        </div>
        <button 
          onClick={handleCopy}
          className={hasCopied ? 'btn-primary' : 'btn-ghost'}
          style={{ width: 36, height: 38, padding: 0 }}
          title="Copy password"
        >
          {hasCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
        </button>
      </div>
    </div>
  );
};
