import React, { useState, useEffect, useMemo } from 'react';
import { FiLock, FiRefreshCw, FiCopy, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { useClipboard } from '../hooks/useClipboard';
import {
  ModalShell,
  modalInputStyle,
  modalMonoInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

function getPasswordStrength(pwd: string): { label: string; color: string; pct: number } {
  if (!pwd) return { label: 'Empty', color: 'var(--color-border-2)', pct: 0 };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 14) score += 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

  if (score <= 2) return { label: 'Weak', color: '#ef4444', pct: 30 };
  if (score === 3) return { label: 'Fair', color: '#f59e0b', pct: 55 };
  if (score === 4) return { label: 'Strong', color: '#60a5fa', pct: 80 };
  return { label: 'Very Strong', color: 'var(--color-green)', pct: 100 };
}

export const PasswordModal: React.FC = () => {
  const { isAddPasswordModalOpen, closeAddPasswordModal } = useUIStore();
  const { user } = useAuthStore();
  const { createPassword, updatePassword, storedPasswords, decryptPassword } = useVaultStore();
  const { copy, hasCopied } = useClipboard();

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

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
    setShowPassword(false);
    setUrl('');
    setNotes('');
    setCategory('');
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return;
    setIsOpen(false);
    closeAddPasswordModal();
    setTimeout(resetForm, 200);
  };

  const generatePassword = () => {
    const groups = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%^&*()_+~`|}{[]:;?><,./-=',
    ];
    const all = groups.join('');
    const randomIndex = (max: number) => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % max;
    };

    const picks = groups.map(g => g[randomIndex(g.length)]);
    while (picks.length < 20) picks.push(all[randomIndex(all.length)]);

    for (let i = picks.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [picks[i], picks[j]] = [picks[j], picks[i]];
    }
    setPassword(picks.join(''));
    setShowPassword(true);
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
      setIsLoading(false);
      setIsOpen(false);
      closeAddPasswordModal();
      setTimeout(resetForm, 200);
    } catch (err) {
      console.error('Failed to save password', err);
      setIsLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={editId ? 'Edit Password' : 'Add Password'}
      subtitle="Zero-knowledge login credential"
      icon={<FiLock size={15} />}
      maxWidth={540}
      busy={isLoading}
      zIndex={250}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={modalLabelStyle}>Site / Service Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={modalInputStyle}
              placeholder="e.g. GitHub, Stripe"
              autoFocus
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div>
            <label style={modalLabelStyle}>Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={modalInputStyle}
              placeholder="e.g. dev@scync.space"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...modalLabelStyle, marginBottom: 0 }}>Password *</label>
            {password && (
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: strength.color }}>
                {strength.label.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...modalMonoInputStyle, paddingRight: 36 }}
                placeholder="••••••••••••"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={generatePassword}
              title="Generate 20-char random password"
              style={{ ...modalBtnSecondary, padding: '0 12px', color: 'var(--color-green)', borderColor: 'var(--color-green-border)' }}
            >
              <FiRefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => password && copy(password)}
              title="Copy password"
              style={{ ...modalBtnSecondary, padding: '0 12px', color: hasCopied ? 'var(--color-green)' : 'var(--color-text-2)' }}
            >
              {hasCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
          </div>
          {/* Strength Meter Bar */}
          <div style={{ height: 3, background: 'var(--color-surface-3)', marginTop: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 180ms, background 180ms' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={modalLabelStyle}>Website URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              style={modalInputStyle}
              placeholder="https://..."
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div>
            <label style={modalLabelStyle}>Category</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={modalInputStyle}
              placeholder="e.g. Work, Finance, Dev"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={modalLabelStyle}>Notes <span style={{ opacity: 0.55, textTransform: 'none' }}>(Optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{ ...modalInputStyle, resize: 'vertical' }}
            placeholder="Security questions, recovery hints..."
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={handleClose} style={modalBtnSecondary}>Cancel</button>
          <button
            type="submit"
            disabled={isLoading || !name || !password}
            style={{
              ...modalBtnPrimary,
              opacity: (isLoading || !name || !password) ? 0.5 : 1,
              cursor: (isLoading || !name || !password) ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Saving...' : editId ? 'Update Password' : 'Save Password'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
