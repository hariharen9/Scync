import React from 'react';
import { useAuthStore } from '@scync/ui';
import { FaGoogle, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

export const AuthPage: React.FC = () => {
  const { signIn } = useAuthStore();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-zinc-800 bg-[#111] p-8 shadow-2xl"
      >
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent">
          <FaLock className="h-6 w-6" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-100">Scync</h1>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Your secrets. Synced. Encrypted. Everywhere.
        </p>

        <button
          onClick={signIn}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          <FaGoogle className="h-4 w-4" />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
};
