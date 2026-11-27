import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { ProjectIcon, PROJECT_ICON_KEYS, PROJECT_ICON_MAP, PROJECT_COLOR_MAP } from './ProjectIcons';
import type { ProjectColor } from '@scync/core';
import { FiFolderPlus } from 'react-icons/fi';
import {
  ModalShell,
  modalInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

const PROJECT_COLORS: ProjectColor[] = ['violet', 'blue', 'green', 'orange', 'red', 'pink', 'yellow', 'gray'];

export const AddProjectModal: React.FC = () => {
  const { isAddProjectModalOpen, closeAddProjectModal } = useUIStore();
  const { createProject } = useProjectStore();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FiFolder');
  const [color, setColor] = useState<ProjectColor>('violet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => { setName(''); setDescription(''); setIcon('FiFolder'); setColor('violet'); };
  const handleClose = () => {
    if (isSubmitting) return;
    closeAddProjectModal();
    setTimeout(resetForm, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject(user.uid, { name: name.trim(), description: description.trim(), icon: icon || 'FiFolder', color });
      setIsSubmitting(false);
      closeAddProjectModal();
      setTimeout(resetForm, 250);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const accentColor = PROJECT_COLOR_MAP[color];

  return (
    <ModalShell
      isOpen={isAddProjectModalOpen}
      onClose={handleClose}
      title="New Project"
      subtitle="Group secrets by repository, app, or environment"
      icon={<FiFolderPlus size={15} />}
      maxWidth={520}
      accentColor={accentColor}
      busy={isSubmitting}
      zIndex={300}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Live Preview Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderLeft: `3px solid ${accentColor}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', background: `${accentColor}1c`, border: `1px solid ${accentColor}44`, flexShrink: 0 }}>
              <ProjectIcon iconKey={icon} size={14} color={accentColor} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name.trim() || 'Untitled Project'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                {description.trim() || 'Sidebar preview'}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {color}
          </span>
        </div>

        {/* Name */}
        <div>
          <label style={modalLabelStyle}>Project Name</label>
          <input
            required
            maxLength={32}
            value={name}
            onChange={e => setName(e.target.value)}
            style={modalInputStyle}
            placeholder="e.g. Scync Production, Payments API"
            autoFocus
            onFocus={e => e.currentTarget.style.borderColor = accentColor}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Color Swatches */}
        <div>
          <label style={modalLabelStyle}>Accent Color</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
            {PROJECT_COLORS.map((c) => {
              const hex = PROJECT_COLOR_MAP[c];
              const active = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setColor(c)}
                  style={{
                    height: 32,
                    border: active ? `2px solid var(--color-text)` : '1px solid var(--color-border)',
                    background: `${hex}22`,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    transition: 'transform 120ms, border-color 120ms',
                  }}
                >
                  <span style={{ width: 12, height: 12, background: hex, display: 'block' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...modalLabelStyle, marginBottom: 0 }}>Icon</label>
            <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
              {icon.replace('Fi', '')}
            </span>
          </div>
          <div
            data-lenis-prevent="true"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
              gap: 4,
              maxHeight: 164,
              overflowY: 'auto',
              padding: 8,
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
            }}
          >
            {PROJECT_ICON_KEYS.map(key => {
              const isSelected = icon === key;
              const Icon = PROJECT_ICON_MAP[key];
              return (
                <button
                  key={key}
                  type="button"
                  title={key.replace('Fi', '')}
                  onClick={() => setIcon(key)}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'grid',
                    placeItems: 'center',
                    border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
                    background: isSelected ? `${accentColor}20` : 'none',
                    color: isSelected ? accentColor : 'var(--color-text-2)',
                    cursor: 'pointer',
                    transition: 'all 100ms',
                  }}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={modalLabelStyle}>
            Description <span style={{ opacity: 0.55, textTransform: 'none' }}>(Optional)</span>
          </label>
          <textarea
            maxLength={100}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            style={{ ...modalInputStyle, resize: 'none' }}
            placeholder="Short summary of what lives in this project..."
            onFocus={e => e.currentTarget.style.borderColor = accentColor}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
          <button type="button" onClick={handleClose} style={modalBtnSecondary}>Cancel</button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            style={{
              ...modalBtnPrimary,
              opacity: (isSubmitting || !name.trim()) ? 0.5 : 1,
              cursor: (isSubmitting || !name.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
