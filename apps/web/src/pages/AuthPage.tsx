import React from 'react';
import { useAuthStore } from '@scync/ui';
import { FaGoogle } from 'react-icons/fa';
import { FiShield, FiLock, FiZap, FiGlobe } from 'react-icons/fi';
import { motion } from 'framer-motion';

const floatingOrbs = [
  { size: 300, x: '15%', y: '20%', delay: 0, color: 'oklch(0.45 0.25 280 / 0.12)' },
  { size: 200, x: '75%', y: '60%', delay: 1.5, color: 'oklch(0.40 0.20 300 / 0.10)' },
  { size: 150, x: '60%', y: '15%', delay: 0.8, color: 'oklch(0.35 0.18 260 / 0.08)' },
  { size: 250, x: '25%', y: '75%', delay: 2.2, color: 'oklch(0.42 0.22 290 / 0.09)' },
];

const features = [
  { icon: FiShield, label: 'Zero-Knowledge', desc: 'Server never sees your secrets' },
  { icon: FiLock, label: 'AES-256-GCM', desc: 'Military-grade encryption' },
  { icon: FiZap, label: 'Instant Sync', desc: 'Real-time across all devices' },
  { icon: FiGlobe, label: 'Cross-Platform', desc: 'Web, Desktop & Mobile' },
];

export const AuthPage: React.FC = () => {
  const { signIn } = useAuthStore();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-base p-4">
      {/* Animated background orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          }}
          animate={{
            y: [0, -20, 10, 0],
            x: [0, 10, -10, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 8,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124, 106, 247, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 106, 247, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-md flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative mb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg shadow-lg accent-glow">
              <FiLock className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-base bg-success" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Scync</h1>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Your secrets. Synced. Encrypted. Everywhere.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full rounded-2xl glass p-8"
        >
          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5
                       text-sm font-semibold text-zinc-900 shadow-lg transition-all duration-200
                       hover:bg-zinc-100 hover:shadow-xl hover:shadow-white/5
                       focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-base
                       active:scale-[0.98]"
          >
            <FaGoogle className="h-4 w-4" />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-default to-transparent" />
            <span className="text-xs text-text-muted">ZERO-KNOWLEDGE VAULT</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-default to-transparent" />
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="group flex items-start gap-2.5 rounded-xl bg-surface/60 p-3 transition-colors hover:bg-hover"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                  <f.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-primary">{f.label}</div>
                  <div className="text-[11px] text-text-muted">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-xs text-text-muted"
        >
          Open source &middot; Self-hostable &middot; No tracking
        </motion.p>
      </motion.div>
    </div>
  );
};
