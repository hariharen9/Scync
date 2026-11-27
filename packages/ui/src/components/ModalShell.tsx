import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export const modalInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--color-text)',
  outline: 'none',
  transition: 'border-color 140ms, background 140ms',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

export const modalMonoInputStyle: React.CSSProperties = {
  ...modalInputStyle,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  lineHeight: 1.6,
};

export const modalLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--color-text-2)',
  marginBottom: 6,
  fontFamily: 'var(--font-mono)',
};

export const modalBtnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '9px 18px',
  background: 'white',
  color: '#080808',
  border: 'none',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'background 140ms, opacity 140ms',
};

export const modalBtnSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '9px 16px',
  background: 'transparent',
  border: '1px solid var(--color-border-2)',
  color: 'var(--color-text-2)',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color 140ms, color 140ms, background 140ms',
};

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  maxWidth?: number;
  accentColor?: string;
  busy?: boolean;
  zIndex?: number;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 520,
  accentColor = 'var(--color-green)',
  busy = false,
  zIndex = 200,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, busy, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => { if (!busy) onClose(); }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,.82)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-2)',
              borderTop: `2px solid ${accentColor}`,
              boxShadow: '0 24px 64px rgba(0,0,0,.75)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 32px)',
              overflow: 'hidden',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px 22px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: accentColor,
                  }}
                >
                  {icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      margin: 0,
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      style={{
                        fontSize: 11.5,
                        color: 'var(--color-text-3)',
                        margin: '2px 0 0 0',
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span
                  className="hidden sm:inline-block"
                  style={{
                    fontSize: 9.5,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-3)',
                    border: '1px solid var(--color-border)',
                    padding: '2px 6px',
                    letterSpacing: '0.06em',
                  }}
                >
                  ESC
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  aria-label="Close modal"
                  style={{
                    width: 30,
                    height: 30,
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid var(--color-border)',
                    background: 'none',
                    color: 'var(--color-text-2)',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.5 : 1,
                    transition: 'border-color 140ms, color 140ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!busy) {
                      e.currentTarget.style.borderColor = 'var(--color-border-2)';
                      e.currentTarget.style.color = 'var(--color-text)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-2)';
                  }}
                >
                  <FiX size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div
              data-lenis-prevent="true"
              style={{
                padding: '22px',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
