import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiPlus, FiDownload, FiLock, FiSearch, FiCopy, FiCheck, 
  FiMoreVertical, FiEdit2, FiTrash2, FiExternalLink, 
  FiEye, FiEyeOff, FiX 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useClipboard } from '../hooks/useClipboard';
import { MaskedValue } from './MaskedValue';
import type { StoredPassword } from '@scync/core';

const PAGE_SIZE = 50;

export const PasswordDashboard: React.FC = () => {
  const { storedPasswords } = useVaultStore();
  const { openAddPasswordModal, openPasswordImportModal } = useUIStore();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMobilePwd, setSelectedMobilePwd] = useState<StoredPassword | null>(null);

  // Search works across all entries
  const visiblePasswords = useMemo(() => {
    const s = search.toLowerCase();
    return storedPasswords.filter(p => 
      p.name.toLowerCase().includes(s) || 
      (p.username && p.username.toLowerCase().includes(s)) ||
      (p.url && p.url.toLowerCase().includes(s))
    );
  }, [storedPasswords, search]);

  // Reset page to 1 on new search query
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(visiblePasswords.length / PAGE_SIZE) || 1;

  // Paginated items
  const paginatedPasswords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visiblePasswords.slice(start, start + PAGE_SIZE);
  }, [visiblePasswords, currentPage]);

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <style>{`
        .pwd-header {
          display: grid !important;
        }
        .pwd-desktop-row {
          display: grid !important;
        }
        .pwd-mobile-card {
          display: none !important;
        }
        .pwd-header-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .pwd-actions-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pwd-mobile-fab {
          display: none;
        }
        @media (max-width: 768px) {
          .pwd-header {
            display: none !important;
          }
          .pwd-desktop-row {
            display: none !important;
          }
          .pwd-mobile-card {
            display: flex !important;
          }
          .pwd-header-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 16px;
            width: 100%;
          }
          .pwd-actions-container {
            width: 100%;
            display: flex;
          }
          .pwd-import-btn {
            flex: 1;
            justify-content: center;
          }
          .pwd-add-btn {
            display: none !important;
          }
          .pwd-mobile-fab {
            display: block;
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 100;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="pwd-header-container">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiLock size={20} style={{ color: 'var(--color-green)' }} />
            Passwords
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            {visiblePasswords.length} password{visiblePasswords.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="pwd-actions-container">
          <button
            onClick={openPasswordImportModal}
            className="pwd-import-btn"
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
            Import CSV
          </button>
          <button
            onClick={openAddPasswordModal}
            className="pwd-add-btn"
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
            Add Password
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
          <input
            type="text"
            placeholder="Search passwords by name, username, or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '11px 36px 11px 34px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
              color: 'var(--color-text)', fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-sans)', transition: 'border-color 140ms',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer',
                padding: 0, display: 'grid', placeItems: 'center', width: 20, height: 20
              }}
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {visiblePasswords.length === 0 ? (
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
            <FiLock size={20} color="var(--color-text-3)" />
          </div>
          {search ? (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
                No results for "{search}"
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0 }}>
                Try a different search term.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>No passwords yet</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 20px 0' }}>
                Import from Google or Bitwarden, or add one manually.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  onClick={openPasswordImportModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                    background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-2)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
                >
                  <FiDownload size={14} /> Import CSV
                </button>
                <button
                  onClick={openAddPasswordModal}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                    background: 'white', color: '#080808', border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <FiPlus size={14} /> Add Password
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 1,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
        }}>
          {/* Header */}
          <div className="pwd-header" style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 80px', gap: 16,
            padding: '10px 16px', background: 'var(--color-surface-2)',
            fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)',
            fontFamily: 'var(--font-sans)', borderBottom: '1px solid var(--color-border)'
          }}>
            <div>Name</div>
            <div>Username</div>
            <div>Password</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>
          
          {/* Paginated Password List Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-border)' }}>
            {paginatedPasswords.map((pwd) => (
              <PasswordListItem 
                key={pwd.id} 
                password={pwd} 
                onSelectMobile={() => setSelectedMobilePwd(pwd)} 
              />
            ))}
          </div>

          {/* Brutalist Pagination Bar */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--color-surface-2)',
              borderTop: '1px solid var(--color-border)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, visiblePasswords.length)} - {Math.min(currentPage * PAGE_SIZE, visiblePasswords.length)} of {visiblePasswords.length} entries
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    color: currentPage === 1 ? 'var(--color-text-3)' : 'var(--color-text)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    transition: 'all 100ms'
                  }}
                  onMouseEnter={e => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.borderColor = 'var(--color-text-2)';
                      e.currentTarget.style.background = 'var(--color-surface-3)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  Previous
                </button>
                
                <span style={{ color: 'var(--color-text-2)', fontWeight: 600 }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    color: currentPage === totalPages ? 'var(--color-text-3)' : 'var(--color-text)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    transition: 'all 100ms'
                  }}
                  onMouseEnter={e => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.borderColor = 'var(--color-text-2)';
                      e.currentTarget.style.background = 'var(--color-surface-3)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <div className="pwd-mobile-fab">
        <motion.button
          onClick={openAddPasswordModal}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-green)',
            border: '2px solid var(--color-text)',
            boxShadow: '4px 4px 0px var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#080808',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <FiPlus size={24} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Slide-Up Bottom Sheet Detail Drawer */}
      <PasswordBottomSheet 
        password={selectedMobilePwd} 
        onClose={() => setSelectedMobilePwd(null)} 
      />
    </div>
  );
};

interface PasswordListItemProps {
  password: StoredPassword;
  onSelectMobile: () => void;
}

const PasswordListItem = React.memo(({ password, onSelectMobile }: PasswordListItemProps) => {
  const { user } = useAuthStore();
  const { deletePassword, decryptPassword } = useVaultStore();
  const { openConfirmModal } = useUIStore();
  
  // Independent clipboard copy tracking states for Username vs. Password
  const { copy: copyUsername, hasCopied: hasCopiedUsername } = useClipboard();
  const { copy: copyPassword, hasCopied: hasCopiedPassword } = useClipboard();
  
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (menuOpen) {
      const handleScroll = () => setMenuOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (decryptedValue !== null) {
      decryptPassword(password.id).then(p => {
        if (p) setDecryptedValue(p.password);
      });
    }
  }, [password.updatedAt.getTime()]);

  const handleRevealToggle = async (revealed: boolean) => {
    if (revealed && !decryptedValue) {
      const p = await decryptPassword(password.id);
      if (p) setDecryptedValue(p.password);
    }
  };

  const handleCopyUsername = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (password.username) copyUsername(password.username);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!user) return;
    
    openConfirmModal({
      title: 'Delete Password',
      message: `Are you sure you want to delete the password for "${password.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        await deletePassword(user.uid, password.id);
      }
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent('open-edit-password', { detail: password.id }));
  };

  // Generate deterministic retro brutalist background color for fallback site icon badge
  const initial = password.name ? password.name.charAt(0).toUpperCase() : '?';
  const colors = [
    'var(--color-green)',
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#8b5cf6', // Purple
    '#ec4899', // Pink
  ];
  const colorIndex = password.name ? password.name.charCodeAt(0) % colors.length : 0;
  const badgeBg = colors[colorIndex];

  return (
    <>
      {/* Desktop Layout Row */}
      <div
        className="pwd-desktop-row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 80px', gap: 16, alignItems: 'center',
          padding: '12px 16px', background: hovered ? 'var(--color-surface-2)' : 'var(--color-surface)',
          transition: 'background 140ms', cursor: 'default',
          height: '100%'
        }}
      >
        {/* Name and Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{ width: 32, height: 32, background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <FiLock size={14} color="var(--color-text-3)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
              {password.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {password.category || 'Password'}
            </div>
          </div>
        </div>

        {/* Username */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {password.username || '—'}
          </span>
          {password.username && (
            <button
              onClick={handleCopyUsername}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 0,
                display: hovered ? 'grid' : 'none', placeItems: 'center', width: 24, height: 24, transition: 'color 140ms'
              }}
              title="Copy username"
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
            >
              {hasCopiedUsername ? <FiCheck size={13} color="var(--color-green)" /> : <FiCopy size={13} />}
            </button>
          )}
        </div>

        {/* Password Mask */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <div style={{ flex: 1, maxWidth: 220, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '4px 8px' }}>
            <MaskedValue
              value={decryptedValue || ''}
              onRevealToggled={handleRevealToggle}
              onCopy={async () => {
                const p = await decryptPassword(password.id);
                return p ? p.password : '';
              }}
              compact
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {password.url && (
            <a
              href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
              target="_blank" rel="noreferrer"
              title="Open URL"
              style={{
                width: 28, height: 28, display: 'grid', placeItems: 'center',
                background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer',
                transition: 'color 140ms', opacity: hovered ? 1 : 0
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
              onClick={e => e.stopPropagation()}
            >
              <FiExternalLink size={14} />
            </a>
          )}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { 
                e.stopPropagation(); 
                if (!menuOpen) {
                  setMenuRect(e.currentTarget.getBoundingClientRect());
                }
                setMenuOpen(!menuOpen); 
              }}
              style={{
                width: 28, height: 28, display: 'grid', placeItems: 'center',
                background: 'none', border: 'none', color: hovered || menuOpen ? 'var(--color-text)' : 'var(--color-text-3)', cursor: 'pointer',
                transition: 'color 140ms'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
            >
              <FiMoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout Card (Touch-Optimized, Tap opens Bottom Sheet) */}
      <div
        className="pwd-mobile-card"
        onClick={onSelectMobile}
        style={{
          display: 'none',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          cursor: 'pointer',
          userSelect: 'none',
          gap: 12,
        }}
      >
        {/* Left Side: Avatar/Icon & Title/Subtitle Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          {/* Logo Badge */}
          <div 
            style={{ 
              width: 38, 
              height: 38, 
              background: badgeBg, 
              border: '1.5px solid var(--color-text)', 
              boxShadow: '2px 2px 0px var(--color-text)',
              display: 'grid', 
              placeItems: 'center', 
              flexShrink: 0,
              color: '#080808',
              fontWeight: 800,
              fontSize: 15,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {initial}
          </div>
          
          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
                {password.name}
              </span>
              {password.category && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}>
                  {password.category}
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
              {password.username || 'NO USERNAME'}
            </span>
          </div>
        </div>

        {/* Right Side: Quick Copy Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          {password.username && (
            <button
              onClick={handleCopyUsername}
              style={{
                width: 36,
                height: 36,
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--color-text-2)',
                cursor: 'pointer',
                transition: 'all 100ms'
              }}
              title="Copy Username"
            >
              {hasCopiedUsername ? <FiCheck size={14} color="var(--color-green)" /> : <FiCopy size={14} />}
            </button>
          )}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const p = await decryptPassword(password.id);
              if (p) {
                copyPassword(p.password);
              }
            }}
            style={{
              width: 36,
              height: 36,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-text-2)',
              cursor: 'pointer',
              transition: 'all 100ms'
            }}
            title="Copy Password"
          >
            {hasCopiedPassword ? <FiCheck size={14} color="var(--color-green)" /> : <FiLock size={14} />}
          </button>
        </div>
      </div>

      {/* Desktop Portal Context Menu */}
      {menuOpen && menuRect && createPortal(
        <div 
          style={{
            position: 'fixed', right: window.innerWidth - menuRect.right, top: menuRect.bottom + 4,
            zIndex: 99999, width: 120, background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-2)',
            boxShadow: '0 8px 32px rgba(0,0,0,.6)', overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={handleEdit}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 12px', fontSize: 12, color: 'var(--color-text-2)',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-sans)', transition: 'background 100ms, color 100ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-3)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
          >
            <FiEdit2 size={12} /> Edit
          </button>
          <div style={{ height: 1, background: 'var(--color-border)' }} />
          <button
            onClick={handleDelete}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 12px', fontSize: 12, color: 'var(--color-red)',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-sans)', transition: 'background 100ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <FiTrash2 size={12} /> Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
});

interface PasswordBottomSheetProps {
  password: StoredPassword | null;
  onClose: () => void;
}

const PasswordBottomSheet: React.FC<PasswordBottomSheetProps> = ({ password, onClose }) => {
  const { deletePassword, decryptPassword } = useVaultStore();
  const { user } = useAuthStore();
  const { openConfirmModal } = useUIStore();
  
  const { copy: copyUsername, hasCopied: hasCopiedUsername } = useClipboard();
  const { copy: copyPassword, hasCopied: hasCopiedPassword } = useClipboard();

  const [decryptedData, setDecryptedData] = useState<{ password: string; notes?: string } | null>(null);
  const [revealPassword, setRevealPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (password) {
      setDecryptedData(null);
      setRevealPassword(false);
      setIsLoading(true);
      decryptPassword(password.id)
        .then(p => {
          if (p) setDecryptedData(p);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [password]);

  if (!password) return null;

  const handleRevealToggle = () => {
    setRevealPassword(!revealPassword);
  };

  const handleCopyPassword = () => {
    if (decryptedData?.password) {
      copyPassword(decryptedData.password);
    }
  };

  const handleEdit = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-edit-password', { detail: password.id }));
  };

  const handleDelete = () => {
    if (!user) return;
    onClose();
    openConfirmModal({
      title: 'Delete Password',
      message: `Are you sure you want to delete the password for "${password.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        await deletePassword(user.uid, password.id);
      }
    });
  };

  return createPortal(
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
        />

        {/* Slide-Up Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 500,
            background: 'var(--color-surface)',
            borderTop: '2px solid var(--color-text)',
            boxShadow: '0 -16px 48px rgba(0,0,0,.6)',
            padding: '16px 20px 32px 20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
        >
          {/* Top Swipe Indicator Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border-2)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div 
                style={{ 
                  width: 32, 
                  height: 32, 
                  background: 'var(--color-surface-3)', 
                  border: '1px solid var(--color-border)', 
                  display: 'grid', 
                  placeItems: 'center' 
                }}
              >
                <FiLock size={14} color="var(--color-green)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 850, margin: 0, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
                  {password.name}
                </h3>
                {password.category && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', background: 'var(--color-green-bg)', border: '1px solid var(--color-green-border)', color: 'var(--color-green)', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em', display: 'inline-block', marginTop: 4 }}>
                    {password.category}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                width: 28, 
                height: 28, 
                display: 'grid', 
                placeItems: 'center', 
                border: '1px solid var(--color-border)', 
                background: 'none', 
                color: 'var(--color-text-2)', 
                cursor: 'pointer' 
              }}
            >
              <FiX size={14} />
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Username / Email
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div 
                style={{ 
                  flex: 1, 
                  background: 'var(--color-surface-2)', 
                  border: '1px solid var(--color-border)', 
                  padding: '10px 12px', 
                  fontSize: 13.5, 
                  fontFamily: 'var(--font-mono)', 
                  color: password.username ? 'var(--color-text)' : 'var(--color-text-3)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}
              >
                {password.username || 'No Username'}
              </div>
              {password.username && (
                <button
                  onClick={() => copyUsername(password.username || '')}
                  style={{
                    height: 38,
                    width: 38,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-text-2)'
                  }}
                >
                  {hasCopiedUsername ? <FiCheck size={14} color="var(--color-green)" /> : <FiCopy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div 
                style={{ 
                  flex: 1, 
                  background: 'var(--color-surface-2)', 
                  border: '1px solid var(--color-border)', 
                  padding: '10px 12px', 
                  fontSize: 13.5, 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--color-text)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  letterSpacing: !revealPassword && !decryptedData ? '0.25em' : 'normal'
                }}
              >
                {isLoading ? 'Decrypting...' : (revealPassword && decryptedData ? decryptedData.password : '••••••••••••')}
              </div>
              <button
                onClick={handleRevealToggle}
                disabled={isLoading}
                style={{
                  height: 38,
                  width: 38,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-2)'
                }}
              >
                {revealPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
              <button
                onClick={handleCopyPassword}
                style={{
                  height: 38,
                  width: 38,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-2)'
                }}
              >
                {hasCopiedPassword ? <FiCheck size={14} color="var(--color-green)" /> : <FiCopy size={14} />}
              </button>
            </div>
          </div>

          {/* URL & Open Web Link */}
          {password.url && (
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Website URL
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div 
                  style={{ 
                    background: 'var(--color-surface-2)', 
                    border: '1px solid var(--color-border)', 
                    padding: '10px 12px', 
                    fontSize: 13, 
                    fontFamily: 'var(--font-mono)', 
                    color: 'var(--color-text)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {password.url}
                </div>
                <a
                  href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px',
                    background: 'var(--color-green-bg)',
                    border: '1.5px solid var(--color-green-border)',
                    color: 'var(--color-green)',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'center'
                  }}
                >
                  <FiExternalLink size={13} />
                  Open Website
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {decryptedData?.notes && (
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Notes
              </label>
              <div 
                style={{ 
                  background: 'var(--color-surface-2)', 
                  border: '1px solid var(--color-border)', 
                  padding: '10px 12px', 
                  fontSize: 13, 
                  fontFamily: 'var(--font-sans)', 
                  color: 'var(--color-text-2)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 120,
                  overflowY: 'auto'
                }}
              >
                {decryptedData.notes}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'var(--color-border)', marginTop: 8 }} />

          {/* Edit / Delete Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleEdit}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all 120ms'
              }}
            >
              <FiEdit2 size={13} />
              Edit Password
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--color-red)',
                color: 'var(--color-red)',
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all 120ms'
              }}
            >
              <FiTrash2 size={13} />
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
