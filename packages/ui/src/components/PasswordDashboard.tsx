import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiDownload, FiLock, FiSearch, FiCopy, FiCheck, FiMoreVertical, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
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
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiLock size={20} style={{ color: 'var(--color-green)' }} />
            Passwords
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '4px 0 0 0', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
            {visiblePasswords.length} password{visiblePasswords.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={openPasswordImportModal}
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
              width: '100%', padding: '9px 12px 9px 34px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
              color: 'var(--color-text)', fontSize: 13, outline: 'none',
              fontFamily: 'var(--font-sans)', transition: 'border-color 140ms',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
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
          <div style={{
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
              <PasswordListItem key={pwd.id} password={pwd} />
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
    </div>
  );
};

const PasswordListItem = React.memo(({ password }: { password: StoredPassword }) => {
  const { user } = useAuthStore();
  const { deletePassword, decryptPassword } = useVaultStore();
  const { openConfirmModal } = useUIStore();
  const { copy, hasCopied } = useClipboard();
  
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (menuOpen) {
      const handleScroll = () => setMenuOpen(false);
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [menuOpen]);

  React.useEffect(() => {
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
    if (password.username) copy(password.username);
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

  return (
    <div
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
            {hasCopied ? <FiCheck size={13} color="var(--color-green)" /> : <FiCopy size={13} />}
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
            ref={buttonRef}
            onClick={e => { 
              e.stopPropagation(); 
              if (!menuOpen && buttonRef.current) {
                setMenuRect(buttonRef.current.getBoundingClientRect());
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
        </div>
      </div>
    </div>
  );
});
