import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown } from './Dropdown';
import type { ProjectColor } from '@scync/core';
import { FiFolderPlus, FiX } from 'react-icons/fi';

const PROJECT_COLORS: ProjectColor[] = ['violet', 'blue', 'green', 'orange', 'red', 'pink', 'yellow', 'gray'];
const PROJECT_COLOR_MAP: Record<ProjectColor, string> = { violet: '#7c6af7', blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', red: '#ef4444', pink: '#ec4899', yellow: '#eab308', gray: '#6b7280' };
const colorOptions = PROJECT_COLORS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1), icon: <div style={{ width: 10, height: 10, background: PROJECT_COLOR_MAP[c] }} /> }));

const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none', transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6 };

export const AddProjectModal: React.FC = () => {
  const { isAddProjectModalOpen, closeAddProjectModal } = useUIStore();
  const { createProject } = useProjectStore();
  const { user } = useAuthStore();
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [icon, setIcon] = useState('📁'); const [color, setColor] = useState<ProjectColor>('violet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetForm = () => { setName(''); setDescription(''); setIcon('📁'); setColor('violet'); };
  const handleClose = () => { closeAddProjectModal(); setTimeout(resetForm, 250); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!user || !name.trim()) return; setIsSubmitting(true); try { await createProject(user.uid, { name: name.trim(), description: description.trim(), icon: icon.trim() || '📁', color }); handleClose(); } catch (e) { console.error(e); } finally { setIsSubmitting(false); } };

  return (
    <AnimatePresence>
      {isAddProjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}><FiFolderPlus size={14} color="var(--color-green)" /></div>
                <div><h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Add New Project</h2><p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0' }}>Organize your vaults</p></div>
              </div>
              <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>
            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '75vh', overflowY: 'auto' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={labelStyle}>Project Name</label><input required maxLength={32} value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Scync V2" autoFocus onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                  <div><label style={labelStyle}>Icon</label><input required maxLength={2} value={icon} onChange={e => setIcon(e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontSize: 18, padding: '4px' }} /></div>
                  <Dropdown label="Color" options={colorOptions} value={color} onChange={v => setColor(v as ProjectColor)} />
                </div>
                <div><label style={labelStyle}>Description <span style={{ opacity: 0.4 }}>(Optional)</span></label><textarea maxLength={100} value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="A short description..." onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                  <button type="button" onClick={handleClose} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting || !name.trim()} style={{ padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: (isSubmitting || !name.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !name.trim()) ? 0.5 : 1, fontFamily: 'var(--font-sans)' }}>{isSubmitting ? '...' : 'Create Project'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
