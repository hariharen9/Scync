import React, { useState } from 'react';
import { useAuthStore, useVaultStore } from '@scync/ui';
import { motion } from 'framer-motion';
import { FiLock, FiAlertCircle, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';

export const SetupPage: React.FC = () => {
  const { user } = useAuthStore();
  const { initializeVault } = useVaultStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 5);
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength];

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-base p-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, oklch(0.40 0.22 280 / 0.12), transparent 70%)',
        }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl glass p-8">
          {/* Header */}
          <div className="mb-7 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg accent-glow-sm"
            >
              <FiShield className="h-6 w-6 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-text-primary">Create Vault Password</h2>
            <p className="mt-2 max-w-xs text-center text-sm text-text-secondary leading-relaxed">
              This password encrypts your secrets locally.
              <span className="text-warning"> It cannot be recovered if lost.</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 flex items-center gap-2 rounded-xl bg-danger/10 p-3.5 text-sm text-danger"
            >
              <FiAlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Vault Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Min 8 characters"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= strength ? strengthColor : 'var(--color-border-subtle)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                </motion.div>
              )}
            </div>

            {/* Confirm Field */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input-field"
                placeholder="Confirm password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <FiLock className="h-4 w-4" />
                  Create Vault
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
