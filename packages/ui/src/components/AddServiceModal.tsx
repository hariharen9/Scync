import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown } from './Dropdown';
import { PROJECT_COLOR_MAP } from './ProjectIcons';
import {
  CustomServiceIcon,
  SERVICE_ICON_DEFINITIONS,
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from './CustomServiceIcons';
import type { ProjectColor } from '@scync/core';
import { FiPlus, FiX, FiSearch, FiType, FiGrid } from 'react-icons/fi';

const PROJECT_COLORS: ProjectColor[] = ['violet', 'blue', 'green', 'orange', 'red', 'pink', 'yellow', 'gray'];
const colorOptions = PROJECT_COLORS.map(c => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
  icon: <div style={{ width: 10, height: 10, background: PROJECT_COLOR_MAP[c] }} />,
}));

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  padding: '8px 11px',
  fontSize: 12.5,
  color: 'var(--color-text)',
  outline: 'none',
  transition: 'border-color 140ms',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-3)',
  marginBottom: 6,
};

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

  // Derive suggested monogram from name
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

  // Filtered icons
  const filteredIcons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SERVICE_ICON_DEFINITIONS.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
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
    closeAddServiceModal();
    setTimeout(resetForm, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setIsSubmitting(true);

    const finalIcon = pickerMode === 'monogram'
      ? `mono:${activeMonogram}`
      : selectedIcon;

    try {
      await createService(user.uid, {
        name: name.trim(),
        icon: finalIcon,
        color,
      });
      handleClose();
    } catch (e) {
      console.error('Failed to create service:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accentColor = PROJECT_COLOR_MAP[color];

  return (
    <AnimatePresence>
      {isAddServiceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 520, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiPlus size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Add Custom Service</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>
                    Add providers, internal APIs, databases or custom microservices
                  </p>
                </div>
              </div>
              <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>
            
            <div style={{ padding: 18, maxHeight: '80vh', overflowY: 'auto' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Service Name */}
                <div>
                  <label style={labelStyle}>Service Name</label>
                  <input
                    required
                    maxLength={32}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. Internal Auth, Payment Gateway, Kafka Broker"
                    autoFocus
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                {/* Theme Color */}
                <div>
                  <label style={labelStyle}>Theme Color</label>
                  <Dropdown options={colorOptions} value={color} onChange={v => setColor(v as ProjectColor)} />
                </div>

                {/* Icon or Monogram Mode Selector */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Visual Identifier</label>
                    {/* Toggle Pills */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--color-surface-2)', padding: 2, border: '1px solid var(--color-border)' }}>
                      <button
                        type="button"
                        onClick={() => setPickerMode('icon')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', fontSize: 10.5, fontWeight: 600,
                          border: 'none',
                          background: pickerMode === 'icon' ? 'var(--color-surface-3)' : 'transparent',
                          color: pickerMode === 'icon' ? 'var(--color-text)' : 'var(--color-text-3)',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 120ms'
                        }}
                      >
                        <FiGrid size={11} />
                        Icon Library
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerMode('monogram')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', fontSize: 10.5, fontWeight: 600,
                          border: 'none',
                          background: pickerMode === 'monogram' ? 'var(--color-surface-3)' : 'transparent',
                          color: pickerMode === 'monogram' ? 'var(--color-text)' : 'var(--color-text-3)',
                          cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 120ms'
                        }}
                      >
                        <FiType size={11} />
                        Monogram Badge
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Searchable Icon Library */}
                  {pickerMode === 'icon' && (
                    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 10 }}>
                      {/* Search Bar */}
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <FiSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search 80+ icons (e.g. redis, auth, database, cloud, k8s)..."
                          style={{
                            ...inputStyle,
                            paddingLeft: 28,
                            paddingRight: searchQuery ? 26 : 8,
                            background: 'var(--color-bg)',
                            fontSize: 11.5,
                          }}
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

                      {/* Category Filter Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                        {SERVICE_CATEGORIES.map(cat => {
                          const isActive = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedCategory(cat.id)}
                              style={{
                                padding: '2px 7px',
                                fontSize: 10,
                                fontWeight: 600,
                                border: `1px solid ${isActive ? accentColor : 'var(--color-border)'}`,
                                background: isActive ? `${accentColor}18` : 'transparent',
                                color: isActive ? accentColor : 'var(--color-text-3)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                transition: 'all 120ms',
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Icons Grid */}
                      <div
                        data-lenis-prevent="true"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                          gap: 4,
                          maxHeight: 180,
                          overflowY: 'auto',
                          padding: '4px',
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
                                width: 36,
                                height: 36,
                                display: 'grid',
                                placeItems: 'center',
                                border: isSelected ? `1px solid ${accentColor}` : '1px solid transparent',
                                background: isSelected ? `${accentColor}22` : 'none',
                                color: isSelected ? accentColor : 'var(--color-text-3)',
                                cursor: 'pointer',
                                transition: 'all 100ms',
                              }}
                              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)'; } }}
                              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-3)'; } }}
                            >
                              <IconComponent size={16} />
                            </button>
                          );
                        })}

                        {filteredIcons.length === 0 && (
                          <div style={{ gridColumn: '1 / -1', padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 11 }}>
                            No icons matching "{searchQuery}".
                            <button
                              type="button"
                              onClick={() => setPickerMode('monogram')}
                              style={{ display: 'block', margin: '6px auto 0', background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Use Monogram Badge instead →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Icon Selected Preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--color-text-3)', fontSize: 11 }}>
                        <div style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', background: `${accentColor}18`, border: `1px solid ${accentColor}40` }}>
                          <CustomServiceIcon iconKey={selectedIcon} size={14} color={accentColor} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {SERVICE_ICON_DEFINITIONS.find(i => i.key === selectedIcon)?.name || selectedIcon} selected
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Monogram Badge */}
                  {pickerMode === 'monogram' && (
                    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 14 }}>
                      <p style={{ fontSize: 12, color: 'var(--color-text-2)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                        Ideal for private microservices, local tooling, or internal APIs with no official logo. Creates a brutalist initials badge.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' }}>
                            Initials (1–3 chars)
                          </label>
                          <input
                            type="text"
                            maxLength={3}
                            value={monogram}
                            onChange={e => setMonogram(e.target.value.toUpperCase())}
                            placeholder={suggestedMonogram}
                            style={{
                              ...inputStyle,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              letterSpacing: '0.1em',
                              fontSize: 14,
                              background: 'var(--color-bg)',
                            }}
                          />
                        </div>

                        {/* Live Monogram Badge Preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</span>
                          <CustomServiceIcon
                            iconKey={`mono:${activeMonogram}`}
                            size={24}
                            color={accentColor}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
                  <button type="button" onClick={handleClose} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    style={{
                      padding: '7px 18px', background: 'white', color: '#080808', border: 'none',
                      fontSize: 12, fontWeight: 700, cursor: (isSubmitting || !name.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (isSubmitting || !name.trim()) ? 0.5 : 1, fontFamily: 'var(--font-sans)'
                    }}
                  >
                    {isSubmitting ? '...' : 'Add Service'}
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
