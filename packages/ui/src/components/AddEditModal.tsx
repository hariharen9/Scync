import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SecretForm } from './SecretForm';
import { useAuthStore } from '../stores/authStore';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import type { SecretFormData } from '@scync/core';
import { FiPlus, FiEdit2, FiX } from 'react-icons/fi';

export const AddEditModal: React.FC = () => {
  const { isAddModalOpen, isEditModalOpen, closeAddModal, closeEditModal, selectedSecretId } = useUIStore();
  const { createSecret, updateSecret, decryptValue, storedSecrets } = useVaultStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<any>(undefined);
  const isOpen = isAddModalOpen || isEditModalOpen;

  React.useEffect(() => {
    if (isEditModalOpen && selectedSecretId) {
      const secret = storedSecrets.find(s => s.id === selectedSecretId);
      if (secret) { decryptValue(selectedSecretId).then(dec => { setInitialData({ ...secret, value: dec?.value || '', notes: dec?.notes || '' }); }); }
    } else { setInitialData(undefined); }
  }, [isEditModalOpen, selectedSecretId, storedSecrets, decryptValue]);

  const handleClose = () => { closeAddModal(); closeEditModal(); };
  const handleSubmit = async (data: SecretFormData) => {
    if (!user) return; setIsSubmitting(true);
    try { if (isEditModalOpen && selectedSecretId) { await updateSecret(user.uid, selectedSecretId, data); } else { await createSecret(user.uid, data); } handleClose(); } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  if (isEditModalOpen && !initialData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  {isEditModalOpen ? <FiEdit2 size={14} color="var(--color-green)" /> : <FiPlus size={14} color="var(--color-green)" />}
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{isEditModalOpen ? 'Edit Secret' : 'Add New Secret'}</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0' }}>{isEditModalOpen ? 'Update this secret' : 'Encrypted locally before sync'}</p>
                </div>
              </div>
              <button onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}><FiX size={14} /></button>
            </div>
            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '75vh', overflowY: 'auto' }}>
              <SecretForm initialData={initialData} onSubmit={handleSubmit} onCancel={handleClose} isSubmitting={isSubmitting} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
