import React, { useState } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { motion } from 'framer-motion';
import { FiUnlock, FiLogOut } from 'react-icons/fi';

export const UnlockPage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { unlock } = useVaultStore();

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !user) return;

    try {
      setLoading(true);
      setError(false);
      const success = await unlock(password, user.uid);
      if (!success) {
        setError(true);
        setShake(true);
        setPassword('');
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-base p-4">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />

      {/* Rotating accent ring */}
      <motion.div
        className="pointer-events-none absolute rounded-full border border-accent/10"
        style={{ width: 400, height: 400 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="pointer-events-none absolute rounded-full border border-accent/5"
        style={{ width: 500, height: 500 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shake ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
        }}
        transition={shake
          ? { duration: 0.4, ease: 'easeInOut' }
          : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="rounded-2xl glass p-8">
          {/* Avatar */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full border-2 border-border-default shadow-lg"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-bg text-xl font-bold text-white shadow-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-base bg-warning"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiUnlock className="h-3 w-3 text-black" />
              </motion.div>
            </div>
            <h2 className="text-base font-semibold text-text-primary">
              {user?.displayName || user?.email}
            </h2>
            <p className="text-xs text-text-muted">Vault is locked</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                className={`input-field text-center text-base tracking-widest ${
                  error ? '!border-danger !ring-danger/20 ring-2' : ''
                }`}
                placeholder="●●●●●●●●"
                autoFocus
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-center text-xs text-danger"
                >
                  Wrong password. Try again.
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <FiUnlock className="h-4 w-4" />
                  Unlock Vault
                </>
              )}
            </button>
          </form>

          {/* Sign out link */}
          <div className="mt-5 flex justify-center">
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
            >
              <FiLogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
