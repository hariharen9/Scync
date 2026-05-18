import React, { useState } from 'react';
import { FiPlus, FiDownload, FiLock, FiSearch, FiCopy, FiCheck, FiMoreVertical, FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useClipboard } from '../hooks/useClipboard';
import { MaskedValue } from './MaskedValue';
import type { StoredPassword } from '@scync/core';

export const PasswordDashboard: React.FC = () => {
  const { storedPasswords } = useVaultStore();
  const { openAddPasswordModal, openPasswordImportModal } = useUIStore();
  const [search, setSearch] = useState('');
  
  const visiblePasswords = storedPasswords.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.url && p.url.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 1,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border)',
        }}>
          {visiblePasswords.map(pwd => (
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
  
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        position: 'relative', cursor: 'default',
        background: hovered ? 'var(--color-surface-2)' : 'var(--color-surface)',
        padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'background 140ms',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
            fontSize: '9.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--color-text-3)', fontFamily: 'var(--font-sans)'
          }}>
            <FiLock size={10} />
            {password.category || 'Password'}
          </div>
          <h3 style={{
            fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)',
            margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em', fontFamily: 'var(--font-sans)'
          }} title={password.name}>
            {password.name}
          </h3>
        </div>

        {/* 3-dot menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 140ms' }}>
          {password.url && (
            <a
              href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
              target="_blank" rel="noreferrer"
              title="Open URL"
              style={{
                width: 26, height: 26, display: 'grid', placeItems: 'center',
                background: 'none', border: 'none',
                color: 'var(--color-text-3)', cursor: 'pointer',
                transition: 'color 140ms',
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
              onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{
                width: 26, height: 26, display: 'grid', placeItems: 'center',
                background: 'none', border: 'none',
                color: 'var(--color-text-3)', cursor: 'pointer',
                transition: 'color 140ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
            >
              <FiMoreVertical size={14} />
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 100, marginTop: 4,
                width: 120, background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-2)',
                boxShadow: '0 8px 32px rgba(0,0,0,.6)', overflow: 'hidden',
              }}>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 30px)'
        }}>
          {password.username || 'No username'}
        </span>
        {password.username && (
          <button
            onClick={handleCopyUsername}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 0,
              display: 'grid', placeItems: 'center', width: 18, height: 18, transition: 'color 140ms'
            }}
            title="Copy username"
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            {hasCopied ? <FiCheck size={11} color="var(--color-green)" /> : <FiCopy size={11} />}
          </button>
        )}
      </div>

      {/* Masked value */}
      <div style={{
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        padding: '6px 10px', marginTop: 4,
      }}>
        <MaskedValue
          value={decryptedValue || ''}
          onRevealToggled={handleRevealToggle}
          compact
        />
      </div>

    </div>
  );
};
