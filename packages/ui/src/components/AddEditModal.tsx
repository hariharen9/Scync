import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecretForm } from './SecretForm';
import { useAuthStore } from '../stores/authStore';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { SecretFormData } from '@scync/core';
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
      if (secret) {
        decryptValue(selectedSecretId).then(dec => {
          setInitialData({ ...secret, value: dec?.value || '', notes: dec?.notes || '' });
        });
      }
    } else {
      setInitialData(undefined);
    }
  }, [isEditModalOpen, selectedSecretId, storedSecrets, decryptValue]);

  const handleClose = () => { closeAddModal(); closeEditModal(); };

  const handleSubmit = async (data: SecretFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (isEditModalOpen && selectedSecretId) {
        await updateSecret(user.uid, selectedSecretId, data);
      } else {
        await createSecret(user.uid, data);
      }
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditModalOpen && !initialData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              borderRadius: '1.25rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,15,22,0.95)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '0.625rem', background: 'rgba(124,106,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isEditModalOpen ? <FiEdit2 size={16} color="#7c6af7" /> : <FiPlus size={16} color="#7c6af7" />}
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#ededed', margin: 0 }}>
                    {isEditModalOpen ? 'Edit Secret' : 'Add New Secret'}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#8b8b9e', margin: '0.2rem 0 0 0' }}>
                    {isEditModalOpen ? 'Update this secret' : 'Encrypted locally before sync'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#8b8b9e', cursor: 'pointer' }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div data-lenis-prevent="true" style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              <SecretForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isSubmitting={isSubmitting}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
