import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(0);
      }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); setFocusedIndex(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      onChange(options[focusedIndex].value);
      setOpen(false);
      setFocusedIndex(-1);
    }
  }, [open, focusedIndex, options, onChange]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const isSm = size === 'sm';

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: isSm ? '0.35rem 0.625rem' : '0.6rem 0.875rem',
    borderRadius: '0.625rem',
    border: `1px solid ${open ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
    background: open ? 'rgba(124,106,247,0.07)' : 'rgba(255,255,255,0.04)',
    color: selected ? '#ededed' : '#44445a',
    fontSize: isSm ? '0.8rem' : '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
    boxShadow: open ? '0 0 0 3px rgba(124,106,247,0.15)' : 'none',
    userSelect: 'none',
    fontFamily: 'inherit',
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    minWidth: '100%',
    zIndex: 999,
    borderRadius: '0.75rem',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(18,18,28,0.97)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    maxHeight: 240,
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: '#26263a transparent',
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={ref}>
      {label && (
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b8b9e', marginBottom: '0.5rem' }}>
          {label}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={() => { setOpen(!open); setFocusedIndex(-1); }}
        onKeyDown={handleKeyDown}
        style={triggerStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {selected?.icon && <span style={{ flexShrink: 0 }}>{selected.icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ flexShrink: 0, color: '#44445a', display: 'flex' }}
        >
          <FiChevronDown size={isSm ? 13 : 15} />
        </motion.span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...menuStyle, transformOrigin: 'top' }}
            ref={listRef}
          >
            <div style={{ padding: '0.375rem' }}>
              {options.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = idx === focusedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    data-option
                    onClick={() => { onChange(option.value); setOpen(false); setFocusedIndex(-1); }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      padding: isSm ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: isSelected
                        ? 'rgba(124,106,247,0.15)'
                        : isFocused
                          ? 'rgba(255,255,255,0.05)'
                          : 'transparent',
                      color: isSelected ? '#7c6af7' : isFocused ? '#ededed' : '#8b8b9e',
                      fontSize: isSm ? '0.8rem' : '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      {option.icon && <span style={{ flexShrink: 0 }}>{option.icon}</span>}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ whiteSpace: 'nowrap' }}>
                          {option.label}
                        </div>
                        {option.description && (
                          <div style={{ fontSize: '0.7rem', color: '#44445a', marginTop: '0.1rem' }}>
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ color: '#7c6af7', flexShrink: 0 }}
                      >
                        <FiCheck size={13} />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
