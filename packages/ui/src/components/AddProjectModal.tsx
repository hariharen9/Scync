import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown } from './Dropdown';
import type { ProjectColor } from '@scync/core';
import { FiFolderPlus, FiX } from 'react-icons/fi';

const PROJECT_COLORS: ProjectColor[] = [
  'violet', 'blue', 'green', 'orange', 'red', 'pink', 'yellow', 'gray'
];

const colorOptions = PROJECT_COLORS.map(c => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
  icon: <div style={{ width: 12, height: 12, borderRadius: '50%', background: `var(--color-${c}, #888)` }} />
}));

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '0.625rem',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  padding: '0.6rem 0.875rem',
  fontSize: '0.875rem',
  color: '#ededed',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#8b8b9e',
  marginBottom: '0.5rem',
};

export const AddProjectModal: React.FC = () => {
  const { isAddProjectModalOpen, closeAddProjectModal } = useUIStore();
  const { createProject } = useProjectStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState<ProjectColor>('violet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('📁');
    setColor('violet');
  };

  const handleClose = () => {
    closeAddProjectModal();
    setTimeout(resetForm, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await createProject(user.uid, {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || '📁',
        color,
      });
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusedBorder = (field: string) => focused === field
    ? { borderColor: 'rgba(124,106,247,0.5)', boxShadow: '0 0 0 3px rgba(124,106,247,0.15)' }
    : {};

  return (
    <AnimatePresence>
      {isAddProjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              borderRadius: '1.25rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,15,22,0.95)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'rgba(124,106,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFolderPlus size={16} color="#7c6af7" />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#ededed', margin: 0 }}>Add New Project</h2>
                  <p style={{ fontSize: '0.75rem', color: '#8b8b9e', margin: '0.2rem 0 0 0' }}>Organize your vaults better</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#8b8b9e', cursor: 'pointer' }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div data-lenis-prevent="true" style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div>
                  <label style={labelStyle}>Project Name</label>
                  <input
                    required
                    maxLength={32}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    style={{ ...inputStyle, ...focusedBorder('name') }}
                    placeholder="e.g. Scync V2, Personal"
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.875rem' }}>
                  <div>
                    <label style={labelStyle}>Icon</label>
                    <input
                      required
                      maxLength={2}
                      value={icon}
                      onChange={e => setIcon(e.target.value)}
                      onFocus={() => setFocused('icon')}
                      onBlur={() => setFocused(null)}
                      style={{ ...inputStyle, textAlign: 'center', fontSize: '1.2rem', padding: '0.4rem', ...focusedBorder('icon') }}
                    />
                  </div>
                  <div>
                    <Dropdown
                      label="Color"
                      options={colorOptions}
                      value={color}
                      onChange={v => setColor(v as ProjectColor)}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description <span style={{ opacity: 0.4 }}>(Optional)</span></label>
                  <textarea
                    maxLength={100}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    onFocus={() => setFocused('description')}
                    onBlur={() => setFocused(null)}
                    rows={2}
                    style={{ ...inputStyle, resize: 'none', ...focusedBorder('description') }}
                    placeholder="A short description..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9e', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.color = '#ededed'; }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#8b8b9e'; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.20 300))', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: (isSubmitting || !name.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !name.trim()) ? 0.5 : 1, transition: 'opacity 0.2s', fontFamily: 'inherit' }}
                  >
                    {isSubmitting ? (
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                    ) : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
