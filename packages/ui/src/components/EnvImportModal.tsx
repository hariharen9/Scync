import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { FiUpload, FiFileText, FiCheck, FiAlertCircle } from 'react-icons/fi';

export const EnvImportModal: React.FC = () => {
  const { isEnvImportModalOpen, closeEnvImportModal } = useUIStore();
  const { createSecret } = useVaultStore();
  const { user } = useAuthStore();

  const [envContent, setEnvContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const parsedCount = envContent.split('\n').filter(l => {
    const t = l.trim();
    return t && !t.startsWith('#') && t.includes('=');
  }).length;

  const handleImport = async () => {
    if (!user || !envContent.trim()) return;
    setIsSubmitting(true);

    const lines = envContent.split('\n');
    let imported = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        await createSecret(user.uid, {
          name: k, value: v, service: 'Other', type: 'Other',
          environment: 'Development', status: 'Active',
          notes: 'Imported from .env', lastRotated: null, expiresOn: null, projectId: null,
        });
        imported++;
      }
    }

    setResult({ count: imported });
    setIsSubmitting(false);

    setTimeout(() => {
      setEnvContent('');
      setResult(null);
      closeEnvImportModal();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isEnvImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => { if (!isSubmitting) { closeEnvImportModal(); setEnvContent(''); setResult(null); } }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border-default bg-elevated shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <FiUpload className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary">Import .env File</h2>
                <p className="text-[11px] text-text-muted">Paste your .env contents — each KEY=VALUE becomes a secret</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <FiCheck className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Imported {result.count} secret{result.count !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">All values encrypted with your vault key.</p>
                </motion.div>
              ) : (
                <>
                  <div className="relative">
                    <textarea
                      data-lenis-prevent="true"
                      rows={10}
                      value={envContent}
                      onChange={(e) => setEnvContent(e.target.value)}
                      className="input-field font-mono text-xs leading-relaxed resize-none"
                      placeholder={'# Your .env file\nAPI_KEY=sk-proj-abc123\nDB_URL=postgres://user:pass@host/db\nSECRET_KEY=super_secret_value'}
                      autoFocus
                    />
                    {parsedCount > 0 && (
                      <div className="absolute bottom-3 right-3 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {parsedCount} key{parsedCount !== 1 ? 's' : ''} detected
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-info/5 border border-info/10 px-3 py-2">
                    <FiAlertCircle className="h-3.5 w-3.5 text-info shrink-0" />
                    <p className="text-[11px] text-text-secondary">Lines starting with # are ignored. Values are encrypted before upload.</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => { closeEnvImportModal(); setEnvContent(''); }}
                      className="btn-ghost text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isSubmitting || !envContent.trim()}
                      className="btn-primary text-xs"
                    >
                      {isSubmitting ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <FiUpload className="h-3.5 w-3.5" />
                          Import {parsedCount > 0 ? `${parsedCount} Secrets` : ''}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
