import React, { useState } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { motion } from 'framer-motion';
import { FiLock, FiAlertCircle } from 'react-icons/fi';

export const SetupPage: React.FC = () => {
  const { user } = useAuthStore();
  const { initializeVault } = useVaultStore();
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      await initializeVault(password, user.uid);
    } catch (err) {
      setError('Failed to setup vault. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111] p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
            <FiLock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Create Vault Password</h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            This password encrypts your secrets locally. It is never stored and cannot be recovered if lost.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Vault Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Min 8 characters"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Create Vault'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
