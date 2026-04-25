import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';
import { FiAlertTriangle } from 'react-icons/fi';

export const ConfirmModal: React.FC = () => {
  const { confirmConfig, closeConfirmModal } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!confirmConfig) return null;

  const { title, message, confirmText = 'Confirm', danger = false, onConfirm } = confirmConfig;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      closeConfirmModal();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={closeConfirmModal} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
          
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ 
                width: 36, height: 36, flexShrink: 0, display: 'grid', placeItems: 'center', 
                background: danger ? 'var(--color-red-bg)' : 'var(--color-surface-2)', 
                border: danger ? '1px solid var(--color-red)' : '1px solid var(--color-border)'
              }}>
                <FiAlertTriangle size={16} color={danger ? 'var(--color-red)' : 'var(--color-text)'} />
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>{message}</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--color-surface-2)' }}>
            <button
              onClick={closeConfirmModal}
              disabled={isSubmitting}
              style={{
                padding: '7px 14px', border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 140ms'
              }}
              onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; } }}
              onMouseLeave={e => { if (!isSubmitting) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; } }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', border: danger ? '1px solid var(--color-red)' : '1px solid var(--color-text)',
                background: danger ? 'var(--color-red)' : 'var(--color-text)',
                color: danger ? 'white' : 'var(--color-bg)',
                fontSize: 12, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1,
                fontFamily: 'var(--font-sans)', transition: 'opacity 140ms'
              }}
            >
              {isSubmitting ? (
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
              ) : confirmText}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
