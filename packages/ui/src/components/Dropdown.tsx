import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

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
  labelAction?: { label: string; onClick: () => void };
  size?: 'sm' | 'md';
}

export const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, placeholder = 'Select...', label, labelAction, size = 'md' }) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find(o => o.value === value);

  const updateCoords = () => { if (triggerRef.current) { const r = triggerRef.current.getBoundingClientRect(); setCoords({ top: r.top + r.height + 4, left: r.left, width: r.width }); } };
  useEffect(() => { if (open) { updateCoords(); window.addEventListener('resize', updateCoords); window.addEventListener('scroll', updateCoords, true); } return () => { window.removeEventListener('resize', updateCoords); window.removeEventListener('scroll', updateCoords, true); }; }, [open]);
  useEffect(() => { const h = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) { setOpen(false); setFocusedIndex(-1); } }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setFocusedIndex(0); } return; }
    if (e.key === 'Escape') { setOpen(false); setFocusedIndex(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && focusedIndex >= 0) { e.preventDefault(); onChange(options[focusedIndex].value); setOpen(false); setFocusedIndex(-1); }
  }, [open, focusedIndex, options, onChange]);

  useEffect(() => { if (focusedIndex >= 0 && listRef.current) { const items = listRef.current.querySelectorAll('[data-option]'); (items[focusedIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest' }); } }, [focusedIndex]);

  const isSm = size === 'sm';

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>{label}</div>
          {labelAction && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); labelAction.onClick(); }} style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)' }}>{labelAction.label}</button>}
        </div>
      )}
      <button ref={triggerRef} type="button" role="combobox" aria-expanded={open} onClick={() => { setOpen(!open); setFocusedIndex(-1); }} onKeyDown={handleKeyDown}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
          padding: isSm ? '5px 9px' : '8px 11px',
          border: `1px solid ${open ? 'var(--color-border-focus)' : 'var(--color-border)'}`,
          background: 'var(--color-surface-2)', color: selected ? 'var(--color-text)' : 'var(--color-text-3)',
          fontSize: isSm ? 11.5 : 12.5, fontWeight: 500, cursor: 'pointer', outline: 'none',
          transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', userSelect: 'none', boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {selected?.icon && <span style={{ flexShrink: 0 }}>{selected.icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.label : placeholder}</span>
        </div>
        <FiChevronDown size={isSm ? 12 : 13} style={{ flexShrink: 0, color: 'var(--color-text-3)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 140ms' }} />
      </button>

      {typeof document !== 'undefined' && createPortal(
        open ? (
          <div ref={menuRef} data-lenis-prevent="true" style={{
            position: 'fixed', top: coords.top, left: coords.left, width: coords.width, minWidth: 140, zIndex: 9999,
            border: '1px solid var(--color-border-2)', background: 'var(--color-surface)',
            boxShadow: '0 16px 48px rgba(0,0,0,.7)', maxHeight: 220, overflowY: 'auto',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--color-border-2) transparent',
            animation: 'fadeIn .1s ease-out',
          }}>
            <div ref={listRef} style={{ padding: 3 }}>
              {options.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = idx === focusedIndex;
                return (
                  <button key={option.value} type="button" data-option onClick={() => { onChange(option.value); setOpen(false); setFocusedIndex(-1); }} onMouseEnter={() => setFocusedIndex(idx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                      padding: isSm ? '5px 8px' : '6px 10px', border: 'none',
                      background: isSelected ? 'var(--color-surface-3)' : isFocused ? 'var(--color-surface-2)' : 'transparent',
                      color: isSelected ? 'var(--color-green)' : isFocused ? 'var(--color-text)' : 'var(--color-text-2)',
                      fontSize: isSm ? 11.5 : 12.5, fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'background 80ms, color 80ms',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {option.icon && <span style={{ flexShrink: 0 }}>{option.icon}</span>}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ whiteSpace: 'nowrap' }}>{option.label}</div>
                        {option.description && <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 1 }}>{option.description}</div>}
                      </div>
                    </div>
                    {isSelected && <FiCheck size={12} style={{ color: 'var(--color-green)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
};
