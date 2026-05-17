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
        setUrl(pwd.url);
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{ 
              position: 'relative', width: '100%', maxWidth: 440,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
          >
            <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiLock color="var(--color-green)" /> {editId ? 'Edit Password' : 'Add Password'}
              </h2>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 4 }}>
                <FiX size={18} />
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="scync-label" style={{ display: 'block', marginBottom: 6 }}>Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input-field" placeholder="e.g. Google, GitHub" autoFocus />
                </div>
                
                <div>
                  <label className="scync-label" style={{ display: 'block', marginBottom: 6 }}>Username / Email</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" placeholder="e.g. user@example.com" />
                </div>

                <div>
                  <label className="scync-label" style={{ display: 'block', marginBottom: 6 }}>Password *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" style={{ flex: 1, fontFamily: 'var(--font-mono)' }} placeholder="••••••••••••" />
                    <button type="button" onClick={generatePassword} className="btn-ghost" title="Generate random password" style={{ width: 38, padding: 0 }}>
                      <FiRefreshCw size={14} />
                    </button>
                    <button type="button" onClick={() => copy(password)} className="btn-ghost" title="Copy password" style={{ width: 38, padding: 0 }}>
                      <FiCopy size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="scync-label" style={{ display: 'block', marginBottom: 6 }}>Website URL</label>
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} className="input-field" placeholder="https://..." />
                </div>

                <div>
                  <label className="scync-label" style={{ display: 'block', marginBottom: 6 }}>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={3} style={{ resize: 'vertical' }} placeholder="Optional notes..." />
                </div>
              </div>

              <footer style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={handleClose} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={isLoading || !name || !password} className="btn-primary">
                  {isLoading ? 'Saving...' : 'Save Password'}
                </button>
              </footer>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
