import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecretForm } from './SecretForm';
import { useAuthStore } from '../stores/authStore';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { SecretFormData, DecryptedSecret } from '@scync/core';

export const AddEditModal: React.FC = () => {
  const { isAddModalOpen, isEditModalOpen, closeAddModal, closeEditModal, selectedSecretId } = useUIStore();
  const { createSecret, updateSecret, decryptValue, storedSecrets } = useVaultStore();
  const { user } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<any>(undefined);

  const isOpen = isAddModalOpen || isEditModalOpen;
  
  useEffect(() => {
    if (isEditModalOpen && selectedSecretId) {
      const secret = storedSecrets.find(s => s.id === selectedSecretId);
      if (secret) {
        decryptValue(selectedSecretId).then((dec) => {
          setInitialData({
            ...secret,
            value: dec?.value || '',
            notes: dec?.notes || '',
          });
        });
      }
    } else {
      setInitialData(undefined);
    }
  }, [isEditModalOpen, selectedSecretId, storedSecrets, decryptValue]);

  const handleClose = () => {
    closeAddModal();
    closeEditModal();
  };

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
      alert('Failed to save secret');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Render when adding new, or when editing and initialData is loaded
  if (isEditModalOpen && !initialData) {
    return null; // Loading state could be added here
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#111] shadow-2xl"
        >
          <div className="border-b border-zinc-800/50 p-5">
            <h2 className="text-lg font-bold text-white">
              {isEditModalOpen ? 'Edit Secret' : 'Add New Secret'}
            </h2>
          </div>
          
          <div className="p-5">
            <SecretForm 
              initialData={initialData} 
              onSubmit={handleSubmit} 
              onCancel={handleClose} 
              isSubmitting={isSubmitting} 
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
