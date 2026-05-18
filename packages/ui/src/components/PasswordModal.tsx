import React, { useState, useEffect } from 'react';
import { FiX, FiLock, FiRefreshCw, FiCopy } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { useClipboard } from '../hooks/useClipboard';

export const PasswordModal: React.FC = () => {
  const { isAddPasswordModalOpen, closeAddPasswordModal } = useUIStore();
  const { user } = useAuthStore();
  const { createPassword, updatePassword, storedPasswords, decryptPassword } = useVaultStore();
  const { copy } = useClipboard();

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAddPasswordModalOpen) {
      setIsOpen(true);
      setEditId(null);
      resetForm();
    }
  }, [isAddPasswordModalOpen]);

  useEffect(() => {
    const handleOpenEdit = async (e: Event) => {
      const id = (e as CustomEvent).detail;
      setEditId(id);
      setIsOpen(true);
      
      const pwd = storedPasswords.find(p => p.id === id);
      if (pwd) {
        setName(pwd.name);
        setUsername(pwd.username);
        setUrl(pwd.url || '');
        setCategory(pwd.category || '');
        
        setIsLoading(true);
        const dec = await decryptPassword(id);
        if (dec) {
          setPassword(dec.password);
          setNotes(dec.notes || '');
        }
        setIsLoading(false);
      }
    };

    window.addEventListener('open-edit-password', handleOpenEdit);
    return () => window.removeEventListener('open-edit-password', handleOpenEdit);
  }, [storedPasswords, decryptPassword]);

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setUrl('');
    setNotes('');
    setCategory('');
    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    closeAddPasswordModal();
    setTimeout(resetForm, 200);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pwd = "";
    for (let i = 0; i < 20; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !password) return;
    setIsLoading(true);

    try {
      const data = { name, username, password, url, notes, category };
      if (editId) {
        await updatePassword(user.uid, editId, data);
      } else {
        await createPassword(user.uid, data);
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save password', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              position: 'relative', width: '100%', maxWidth: 460,
              background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
              boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiLock size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>
                    {editId ? 'Edit Password' : 'Add Password'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>
                    Store a secure credential in your vault
                  </p>
                </div>
              </div>
              <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'all 140ms' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiX size={14} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="hide-scrollbar">
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 140ms' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} placeholder="e.g. Google, GitHub" autoFocus />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username / Email</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 140ms' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} placeholder="e.g. user@example.com" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)} required style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-mono)', transition: 'border-color 140ms' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} placeholder="••••••••••••" />
                    <button type="button" onClick={generatePassword} title="Generate random password" style={{ width: 38, display: 'grid', placeItems: 'center', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'all 140ms' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}>
                      <FiRefreshCw size={14} />
                    </button>
                    <button type="button" onClick={() => copy(password)} title="Copy password" style={{ width: 38, display: 'grid', placeItems: 'center', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'all 140ms' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}>
                      <FiCopy size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website URL</label>
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 140ms' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} placeholder="https://..." />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 140ms' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} placeholder="e.g. Work, Personal" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 140ms' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} placeholder="Optional notes..." />
                </div>
              </div>

              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
                <button type="button" onClick={handleClose} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}>Cancel</button>
                <button type="submit" disabled={isLoading || !name || !password} style={{ padding: '7px 18px', background: 'var(--color-green)', border: '1px solid var(--color-green-border)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: (isLoading || !name || !password) ? 'not-allowed' : 'pointer', opacity: (isLoading || !name || !password) ? 0.5 : 1, fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}>
                  {isLoading ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
