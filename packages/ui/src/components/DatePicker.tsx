import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  label,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // View state for the calendar (independent of selected value)
  const [viewDate, setViewDate] = useState<Date>(value || new Date());

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + rect.height + 6,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Check if click was inside trigger container OR inside the portal menu
      const isInsideTrigger = containerRef.current && containerRef.current.contains(e.target as Node);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target as Node);
      
      if (!isInsideTrigger && !isInsideMenu) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  // Calendar math
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const today = new Date();

  // Render grid
  const renderCalendarDays = () => {
    const cells = [];
    // Prev month padding
    for (let i = 0; i < firstDayOfMonth; i++) {
       const day = daysInPrevMonth - firstDayOfMonth + i + 1;
       cells.push(
         <div key={`prev-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, fontSize: '0.8rem', color: '#44445a', opacity: 0.5 }}>
           {day}
         </div>
       );
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
       const dateObj = new Date(viewYear, viewMonth, i);
       const isSelected = isSameDay(value, dateObj);
       const isToday = isSameDay(today, dateObj);

       cells.push(
         <button
           key={`curr-${i}`}
           type="button"
           onClick={(e) => { e.stopPropagation(); onChange(dateObj); setOpen(false); }}
           style={{
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             height: 32, borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
             fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 500, fontFamily: 'inherit',
             background: isSelected ? '#7c6af7' : (isToday ? 'rgba(255,255,255,0.08)' : 'transparent'),
             color: isSelected ? '#ffffff' : (isToday ? '#ededed' : '#8b8b9e'),
             transition: 'background 0.1s, color 0.1s'
           }}
           onMouseEnter={e => {
             if (!isSelected) { (e.currentTarget).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget).style.color = '#ededed'; }
           }}
           onMouseLeave={e => {
             if (!isSelected) { (e.currentTarget).style.background = isToday ? 'rgba(255,255,255,0.08)' : 'transparent'; (e.currentTarget).style.color = isToday ? '#ededed' : '#8b8b9e'; }
           }}
         >
           {i}
         </button>
       );
    }
    // Next month padding (to fill 42 cells = 6 rows)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
        cells.push(
          <div key={`next-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32, fontSize: '0.8rem', color: '#44445a', opacity: 0.5 }}>
            {i}
          </div>
        );
    }

    return cells;
  };

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.6rem 0.875rem',
    borderRadius: '0.625rem',
    border: `1px solid ${open ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
    background: open ? 'rgba(124,106,247,0.07)' : 'rgba(255,255,255,0.04)',
    color: value ? '#ededed' : '#44445a',
    fontSize: '0.875rem',
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
    position: 'fixed',
    top: coords.top,
    left: coords.left,
    minWidth: 260,
    zIndex: 9999,
    borderRadius: '0.75rem',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(18,18,28,0.97)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
    padding: '1rem',
    transformOrigin: 'top',
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      {label && (
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b8b9e', marginBottom: '0.5rem' }}>
          {label}
        </div>
      )}

      {/* Trigger */}
      <div style={{ position: 'relative' }}>
         <button
           ref={triggerRef}
           type="button"
           onClick={() => setOpen(!open)}
           style={triggerStyle}
         >
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
             <span style={{ color: value ? '#7c6af7' : '#44445a', flexShrink: 0, display: 'flex' }}><FiCalendar size={15} /></span>
             <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
               {value ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder}
             </span>
           </div>
         </button>

         {/* Clear button */}
         {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#8b8b9e', padding: '0.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '0.375rem' }}
              onMouseEnter={e => { (e.currentTarget).style.color = '#ededed'; (e.currentTarget).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { (e.currentTarget).style.color = '#8b8b9e'; (e.currentTarget).style.background = 'transparent' }}
            >
              <FiX size={14} />
            </button>
         )}
      </div>

      {/* Calendar Dropdown (via Portal) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
             <motion.div
               ref={menuRef}
               initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
               animate={{ opacity: 1, y: 0, scaleY: 1 }}
               exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
               transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
               style={menuStyle}
               onClick={e => e.stopPropagation()}
             >
               {/* Header */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ededed' }}>
                    {MONTHS[viewMonth]} {viewYear}
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button type="button" onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', color: '#8b8b9e', padding: '0.25rem', cursor: 'pointer', display: 'flex', borderRadius: '0.375rem' }} onMouseEnter={e => (e.currentTarget.style.color = '#ededed')} onMouseLeave={e => (e.currentTarget.style.color = '#8b8b9e')}><FiChevronLeft size={16} /></button>
                    <button type="button" onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', color: '#8b8b9e', padding: '0.25rem', cursor: 'pointer', display: 'flex', borderRadius: '0.375rem' }} onMouseEnter={e => (e.currentTarget.style.color = '#ededed')} onMouseLeave={e => (e.currentTarget.style.color = '#8b8b9e')}><FiChevronRight size={16} /></button>
                  </div>
               </div>

               {/* Days of week */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                 {DAYS.map(day => (
                   <div key={day} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#44445a' }}>
                     {day}
                   </div>
                 ))}
               </div>

               {/* Grid */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                 {renderCalendarDays()}
               </div>
             </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

