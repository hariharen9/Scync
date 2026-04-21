import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';

export const EnvImportModal: React.FC = () => {
  const { isEnvImportModalOpen, closeEnvImportModal } = useUIStore();
  const { createSecret } = useVaultStore();
  const { user } = useAuthStore();
  
  const [envContent, setEnvContent] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImport = async () => {
    if (!user || !envContent.trim()) return;
    setIsSubmitting(true);
    
    // Naive .env parser
    const lines = envContent.split('\n');
    const records: {key: string, val: string}[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        let v = trimmed.substring(idx + 1).trim();
        // remove quotes
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        records.push({ key: k, val: v });
      }
    }
    
    for (const {key, val} of records) {
      await createSecret(user.uid, {
        name: key,
        value: val,
        service: 'Other',
        type: 'Other',
        environment: 'Development',
        status: 'Active',
        notes: '',
        lastRotated: null,
        expiresOn: null,
        projectId: projectId || null
      });
    }
    
    setIsSubmitting(false);
    setEnvContent('');
    closeEnvImportModal();
  };

  if (!isEnvImportModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeEnvImportModal}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#111] shadow-2xl"
        >
          <div className="border-b border-zinc-800/50 p-5">
            <h2 className="text-lg font-bold text-white">Import .env File</h2>
          </div>
          
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-zinc-400">
              Paste the contents of your .env file below. We will parse it and add each key as a secret.
            </p>
            
            <textarea
              rows={8}
              value={envContent}
              onChange={(e) => setEnvContent(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-accent"
              placeholder={'API_KEY=xyz\nDB_URL=postgres://...'}
            />
            
            <div className="mt-4 flex justify-end gap-3">
              <button 
                onClick={closeEnvImportModal}
                className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={isSubmitting || !envContent.trim()} 
                className="rounded bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {isSubmitting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
