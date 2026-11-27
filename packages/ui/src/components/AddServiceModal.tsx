import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { PROJECT_COLOR_MAP } from './ProjectIcons';
import {
  CustomServiceIcon,
  SERVICE_ICON_DEFINITIONS,
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from './CustomServiceIcons';
import type { ProjectColor } from '@scync/core';
import { FiPlus, FiX, FiSearch, FiType, FiGrid } from 'react-icons/fi';
import {
  ModalShell,
  modalInputStyle,
  modalLabelStyle,
  modalBtnPrimary,
  modalBtnSecondary,
} from './ModalShell';

const PROJECT_COLORS: ProjectColor[] = ['violet', 'blue', 'green', 'orange', 'red', 'pink', 'yellow', 'gray'];

export const AddServiceModal: React.FC = () => {
  const { isAddServiceModalOpen, closeAddServiceModal } = useUIStore();
  const { createService } = useServiceStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [color, setColor] = useState<ProjectColor>('green');
  const [pickerMode, setPickerMode] = useState<'icon' | 'monogram'>('icon');
  const [selectedIcon, setSelectedIcon] = useState('FiServer');
  const [monogram, setMonogram] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestedMonogram = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'SV';
    const words = trimmed.split(/[\s-_]+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }, [name]);

  const activeMonogram = (monogram.trim() || suggestedMonogram).slice(0, 3).toUpperCase();

  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SERVICE_ICON_DEFINITIONS.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.key.toLowerCase().includes(q)) return true;
      return item.keywords.some(k => k.toLowerCase().includes(q));
    });
  }, [searchQuery, selectedCategory]);

  const resetForm = () => {
    setName('');
    setSelectedIcon('FiServer');
    setColor('green');
    setPickerMode('icon');
    setMonogram('');
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    closeAddServiceModal();
    setTimeout(resetForm, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setIsSubmitting(true);

    const finalIcon = pickerMode === 'monogram' ? `mono:${activeMonogram}` : selectedIcon;

    try {
      await createService(user.uid, {
        name: name.trim(),
        icon: finalIcon,
        color,
      });
      setIsSubmitting(false);
      closeAddServiceModal();
      setTimeout(resetForm, 250);
    } catch (err) {
      console.error('Failed to create service:', err);
      setIsSubmitting(false);
    }
  };

  const accentColor = PROJECT_COLOR_MAP[color];
  const previewIconKey = pickerMode === 'monogram' ? `mono:${activeMonogram}` : selectedIcon;

  return (
    <ModalShell
      isOpen={isAddServiceModalOpen}
      onClose={handleClose}
      title="Add Custom Service"
      subtitle="Register internal APIs, databases, or cloud providers"
      icon={<FiPlus size={15} />}
      maxWidth={580}
      accentColor={accentColor}
      busy={isSubmitting}
      zIndex={350}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Live Preview */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', background: `${accentColor}1c`, border: `1px solid ${accentColor}44` }}>
              <CustomServiceIcon iconKey={previewIconKey} size={15} color={accentColor} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>
                {name.trim() || 'Custom Service'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                {pickerMode === 'monogram'
                  ? `Monogram • ${activeMonogram}`
                  : SERVICE_ICON_DEFINITIONS.find(i => i.key === selectedIcon)?.name || selectedIcon}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {color}
          </span>
        </div>

        {/* Service Name */}
        <div>
          <label style={modalLabelStyle}>Service Name</label>
          <input
            required
            maxLength={32}
            value={name}
            onChange={e => setName(e.target.value)}
            style={modalInputStyle}
            placeholder="e.g. Internal Auth, Payment Gateway, Kafka Broker"
            autoFocus
            onFocus={e => e.currentTarget.style.borderColor = accentColor}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Accent Color Swatches */}
        <div>
          <label style={modalLabelStyle}>Theme Color</label>
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
                    border: active ? '2px solid var(--color-text)' : '1px solid var(--color-border)',
                    background: `${hex}22`,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 12, height: 12, background: hex, display: 'block' }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon or Monogram Mode Selector */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...modalLabelStyle, marginBottom: 0 }}>Visual Identifier</label>
            <div style={{ display: 'flex', gap: 2, background: 'var(--color-surface-2)', padding: 2, border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setPickerMode('icon')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none',
                  background: pickerMode === 'icon' ? 'var(--color-surface-3)' : 'transparent',
                  color: pickerMode === 'icon' ? 'var(--color-text)' : 'var(--color-text-3)',
                  cursor: 'pointer',
                }}
              >
                <FiGrid size={11} /> Icon Library
              </button>
              <button
                type="button"
                onClick={() => setPickerMode('monogram')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none',
                  background: pickerMode === 'monogram' ? 'var(--color-surface-3)' : 'transparent',
                  color: pickerMode === 'monogram' ? 'var(--color-text)' : 'var(--color-text-3)',
                  cursor: 'pointer',
                }}
              >
                <FiType size={11} /> Monogram
              </button>
            </div>
          </div>

          {pickerMode === 'icon' && (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 12 }}>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search 80+ icons (e.g. redis, auth, database, cloud, k8s)..."
                  style={{ ...modalInputStyle, paddingLeft: 30, paddingRight: searchQuery ? 28 : 10, background: 'var(--color-bg)', fontSize: 12 }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 0 }}
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {SERVICE_CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '3px 8px', fontSize: 10.5, fontWeight: 600,
                        border: `1px solid ${isActive ? accentColor : 'var(--color-border)'}`,
                        background: isActive ? `${accentColor}1c` : 'transparent',
                        color: isActive ? accentColor : 'var(--color-text-2)',
                        cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <div
                data-lenis-prevent="true"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))',
                  gap: 4,
                  maxHeight: 170,
                  overflowY: 'auto',
                  padding: 6,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {filteredIcons.map(item => {
                  const isSelected = selectedIcon === item.key;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      title={`${item.name} (${item.key})`}
                      onClick={() => setSelectedIcon(item.key)}
                      style={{
                        width: 38, height: 38, display: 'grid', placeItems: 'center',
                        border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
                        background: isSelected ? `${accentColor}22` : 'none',
                        color: isSelected ? accentColor : 'var(--color-text-2)',
                        cursor: 'pointer',
                      }}
                    >
                      <IconComponent size={16} />
                    </button>
                  );
                })}

                {filteredIcons.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-2)', fontSize: 12 }}>
                    No icons matching &quot;{searchQuery}&quot;.
                    <button
                      type="button"
                      onClick={() => setPickerMode('monogram')}
                      style={{ display: 'block', margin: '6px auto 0', background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Use Monogram Badge instead →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {pickerMode === 'monogram' && (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 14 }}>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                Ideal for private microservices or internal APIs with no official logo.
              </p>
              <label style={modalLabelStyle}>Initials (1–3 chars)</label>
              <input
                type="text"
                maxLength={3}
                value={monogram}
                onChange={e => setMonogram(e.target.value.toUpperCase())}
                placeholder={suggestedMonogram}
                style={{
                  ...modalInputStyle,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  fontSize: 14,
                  background: 'var(--color-bg)',
                }}
              />
            </div>
          )}
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
            {isSubmitting ? 'Adding...' : 'Add Service'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
