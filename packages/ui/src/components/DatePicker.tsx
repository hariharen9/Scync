import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

interface DatePickerProps { value: Date | null; onChange: (date: Date | null) => void; placeholder?: string; label?: string; }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = 'Select date', label }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [viewDate, setViewDate] = useState<Date>(value || new Date());

  const updateCoords = () => { if (triggerRef.current) { const r = triggerRef.current.getBoundingClientRect(); setCoords({ top: r.top + r.height + 4, left: r.left, width: r.width }); } };
  useEffect(() => { if (value) setViewDate(new Date(value)); }, [value]);
  useEffect(() => { if (open) { updateCoords(); window.addEventListener('resize', updateCoords); window.addEventListener('scroll', updateCoords, true); } return () => { window.removeEventListener('resize', updateCoords); window.removeEventListener('scroll', updateCoords, true); }; }, [open]);
  useEffect(() => { const h = (e: MouseEvent) => { if (!containerRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const vM = viewDate.getMonth(); const vY = viewDate.getFullYear();
  const firstDay = new Date(vY, vM, 1).getDay();
  const daysInMonth = new Date(vY, vM + 1, 0).getDate();
  const daysInPrev = new Date(vY, vM, 0).getDate();
  const isSameDay = (d1: Date | null, d2: Date) => d1 ? d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() : false;
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`p${i}`} style={{ display: 'grid', placeItems: 'center', height: 28, fontSize: 11, color: 'var(--color-text-3)', opacity: 0.4 }}>{daysInPrev - firstDay + i + 1}</div>);
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(vY, vM, i); const sel = isSameDay(value, d); const td = isSameDay(today, d);
    cells.push(<button key={`c${i}`} type="button" onClick={e => { e.stopPropagation(); onChange(d); setOpen(false); }} style={{ display: 'grid', placeItems: 'center', height: 28, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: sel ? 700 : 500, fontFamily: 'var(--font-sans)', background: sel ? 'white' : td ? 'var(--color-surface-3)' : 'transparent', color: sel ? '#080808' : td ? 'var(--color-text)' : 'var(--color-text-2)', transition: 'background 100ms, color 100ms' }} onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)'; } }} onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = td ? 'var(--color-surface-3)' : 'transparent'; e.currentTarget.style.color = td ? 'var(--color-text)' : 'var(--color-text-2)'; } }}>{i}</button>);
  }
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) cells.push(<div key={`n${i}`} style={{ display: 'grid', placeItems: 'center', height: 28, fontSize: 11, color: 'var(--color-text-3)', opacity: 0.4 }}>{i}</div>);

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      {label && <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6 }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        <button ref={triggerRef} type="button" onClick={() => setOpen(!open)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
          padding: '8px 11px', border: `1px solid ${open ? 'var(--color-border-focus)' : 'var(--color-border)'}`,
          background: 'var(--color-surface-2)', color: value ? 'var(--color-text)' : 'var(--color-text-3)',
          fontSize: 12.5, fontWeight: 500, cursor: 'pointer', outline: 'none', transition: 'border-color 140ms',
          fontFamily: 'var(--font-sans)', userSelect: 'none', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiCalendar size={13} style={{ color: value ? 'var(--color-green)' : 'var(--color-text-3)' }} />
            <span>{value ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}</span>
          </div>
        </button>
        {value && <button type="button" onClick={e => { e.stopPropagation(); onChange(null); setOpen(false); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 2, display: 'flex' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}><FiX size={12} /></button>}
      </div>

      {typeof document !== 'undefined' && createPortal(
        open ? (
          <div ref={menuRef} data-lenis-prevent="true" onClick={e => e.stopPropagation()} style={{
            position: 'fixed', top: coords.top, left: coords.left, minWidth: 240, zIndex: 9999,
            border: '1px solid var(--color-border-2)', background: 'var(--color-surface)',
            boxShadow: '0 16px 48px rgba(0,0,0,.7)', padding: 12, animation: 'fadeIn .1s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{MONTHS[vM]} {vY}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button type="button" onClick={e => { e.stopPropagation(); setViewDate(new Date(vY, vM - 1, 1)); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', padding: 3, cursor: 'pointer', display: 'flex' }}><FiChevronLeft size={14} /></button>
                <button type="button" onClick={e => { e.stopPropagation(); setViewDate(new Date(vY, vM + 1, 1)); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', padding: 3, cursor: 'pointer', display: 'flex' }}><FiChevronRight size={14} /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 600, color: 'var(--color-text-3)' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>{cells}</div>
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
};
