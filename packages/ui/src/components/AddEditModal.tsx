import React, { useState, useEffect, useRef } from 'react';
import { SecretForm } from './SecretForm';
import { useAuthStore } from '../stores/authStore';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import type { SecretFormData } from '@scync/core';
import { FiPlus, FiEdit2, FiAlertTriangle } from 'react-icons/fi';
import { ModalShell } from './ModalShell';

export const AddEditModal: React.FC = () => {
  const { isAddModalOpen, isEditModalOpen, closeAddModal, closeEditModal, selectedSecretId } = useUIStore();
  const { createSecret, updateSecret, decryptValue, storedSecrets } = useVaultStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<any>(undefined);
  const [isLoadingSecret, setIsLoadingSecret] = useState(false);
  const [error, setError] = useState('');
  const loadedSecretIdRef = useRef<string | null>(null);
  const isOpen = isAddModalOpen || isEditModalOpen;

  useEffect(() => {
    if (isEditModalOpen && selectedSecretId) {
      if (loadedSecretIdRef.current === selectedSecretId && initialData) {
        return;
      }
      const secret = storedSecrets.find(s => s.id === selectedSecretId);
      if (secret) {
        setIsLoadingSecret(true);
        setError('');
        decryptValue(selectedSecretId)
          .then(dec => {
            loadedSecretIdRef.current = selectedSecretId;
            setInitialData({ ...secret, value: dec?.value || '', notes: dec?.notes || '' });
          })
          .catch(err => {
            console.error('Failed to decrypt secret for editing:', err);
            setError('Failed to decrypt secret value');
          })
          .finally(() => {
            setIsLoadingSecret(false);
          });
      }
    } else {
      loadedSecretIdRef.current = null;
      setInitialData(undefined);
      setIsLoadingSecret(false);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditModalOpen, selectedSecretId, storedSecrets, decryptValue]);

  const handleClose = () => {
    if (isSubmitting) return;
    setError('');
    closeAddModal();
    closeEditModal();
  };

  const handleSubmit = async (data: SecretFormData) => {
    if (!user) return;
    setError('');
    setIsSubmitting(true);
    try {
      if (isEditModalOpen && selectedSecretId) {
        await updateSecret(user.uid, selectedSecretId, data);
      } else {
        await createSecret(user.uid, data);
      }
      setIsSubmitting(false);
      setError('');
      closeAddModal();
      closeEditModal();
    } catch (e: any) {
      console.error('Failed to save secret:', e);
      setError(e?.message || 'Failed to save secret. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isEditModalOpen && (!initialData || isLoadingSecret)) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditModalOpen ? 'Edit Secret' : 'Add New Secret'}
      subtitle={isEditModalOpen ? 'Update metadata or rotate encrypted value' : 'Encrypted locally with AES-256-GCM before sync'}
      icon={isEditModalOpen ? <FiEdit2 size={15} /> : <FiPlus size={15} />}
      maxWidth={560}
      busy={isSubmitting}
    >
      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--color-red)',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <SecretForm
        key={isEditModalOpen ? (selectedSecretId || 'edit') : 'new'}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
      />
    </ModalShell>
  );
};
