import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown } from './Dropdown';
import { FiPlus, FiX } from 'react-icons/fi';

const SERVICE_COLORS = [
  { value: '#10b981', label: 'Emerald' }, { value: '#3b82f6', label: 'Blue' }, { value: '#7c6af7', label: 'Violet' },
  { value: '#f59e0b', label: 'Amber' }, { value: '#ef4444', label: 'Rose' }, { value: '#ec4899', label: 'Pink' },
  { value: '#8b5cf6', label: 'Purple' }, { value: '#64748b', label: 'Slate' },
];
const colorOptions = SERVICE_COLORS.map(c => ({ value: c.value, label: c.label, icon: <div style={{ width: 10, height: 10, background: c.value }} /> }));
const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none', transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6 };

export const AddServiceModal: React.FC = () => {
  const { isAddServiceModalOpen, closeAddServiceModal } = useUIStore();
  const { createService } = useServiceStore();
  const { user } = useAuthStore();
  const [name, setName] = useState(''); const [icon, setIcon] = useState('🌐'); const [color, setColor] = useState(SERVICE_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetForm = () => { setName(''); setIcon('🌐'); setColor(SERVICE_COLORS[0].value); };
  const handleClose = () => { closeAddServiceModal(); setTimeout(resetForm, 250); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!user || !name.trim()) return; setIsSubmitting(true); try { await createService(user.uid, { name: name.trim(), icon: icon.trim() || '🌐', color }); handleClose(); } catch (e) { console.error(e); } finally { setIsSubmitting(false); } };

  return (
    <AnimatePresence>
      {isAddServiceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 380, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}><FiPlus size={14} color="var(--color-green)" /></div>
                <div><h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Add Custom Service</h2><p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0' }}>For providers not listed</p></div>
              </div>
              <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>
            <div style={{ padding: 18 }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={labelStyle}>Service Name</label><input required maxLength={24} value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. MyLocalDB" autoFocus onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                  <div><label style={labelStyle}>Icon</label><input required maxLength={2} value={icon} onChange={e => setIcon(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: 18, padding: '4px' }} /></div>
                  <Dropdown label="Theme Color" options={colorOptions} value={color} onChange={v => setColor(v)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                  <button type="button" onClick={handleClose} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting || !name.trim()} style={{ padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: (isSubmitting || !name.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !name.trim()) ? 0.5 : 1, fontFamily: 'var(--font-sans)' }}>{isSubmitting ? '...' : 'Add Service'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
