import React, { useState } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { motion } from 'framer-motion';
import { FiUnlock } from 'react-icons/fi';

export const UnlockPage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { unlock } = useVaultStore();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !user) return;

    try {
      setLoading(true);
      setError(false);
      const success = await unlock(password, user.uid);
      if (!success) {
        setError(true);
        setPassword('');
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#111] p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="mb-4 h-14 w-14 rounded-full border border-zinc-700" />
          ) : (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="text-lg font-semibold text-zinc-100">{user?.email}</h2>
          <p className="text-xs text-zinc-500">Vault is locked</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              className={`w-full rounded-lg border bg-zinc-900 px-4 py-2.5 text-center text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 ${
                error 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-zinc-700 focus:border-accent focus:ring-accent'
              }`}
              placeholder="Vault Password"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none disabled:opacity-50"
          >
            <FiUnlock className="h-4 w-4" />
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={signOut}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Sign out of Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};
