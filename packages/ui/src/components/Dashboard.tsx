import React, { useMemo } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { getAttentionSecrets } from '@scync/core';
import { SecretCard } from './SecretCard';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiRefreshCw, FiPlus, FiKey } from 'react-icons/fi';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
}> = ({ label, value, icon, accentColor }) => (
  <motion.div
    variants={item}
    style={{
      borderRadius: '1rem',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(18,18,28,0.7)',
      padding: '1.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
      cursor: 'default',
    }}
    whileHover={{
      background: 'rgba(26,26,40,0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      y: -2,
    }}
  >
    <div style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: '#ededed', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8b8b9e', marginTop: '0.5rem' }}>
        {label}
      </div>
    </div>
  </motion.div>
);

export const Dashboard: React.FC = () => {
  const { storedSecrets } = useVaultStore();
  const { projects } = useProjectStore();
  const { openAddModal } = useUIStore();

  const attention = useMemo(() => getAttentionSecrets(storedSecrets), [storedSecrets]);
  const hasIssues = attention.expired.length > 0 || attention.expiringSoon.length > 0 || attention.rotationOverdue.length > 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}
    >
      {/* ── Hero ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 
          className="text-3xl sm:text-4xl"
          style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#ededed', margin: 0 }}
        >
          {greeting}.{' '}
          <span className="gradient-text">Your vault is unlocked.</span>
        </h2>
        <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: '#8b8b9e' }}>
          {storedSecrets.length} secrets · {projects.length} projects
        </p>
      </div>

      {/* ── Stats ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}
      >
        <StatCard
          label="Active Secrets"
          value={storedSecrets.filter(s => s.status === 'Active').length}
          icon={<FiKey size={20} />}
          accentColor="#34d399"
        />
        <StatCard
          label="Expiring Soon"
          value={attention.expiringSoon.length}
          icon={<FiAlertTriangle size={20} />}
          accentColor={attention.expiringSoon.length > 0 ? '#fbbf24' : '#44445a'}
        />
        <StatCard
          label="Rotation Due"
          value={attention.rotationOverdue.length}
          icon={<FiRefreshCw size={20} />}
          accentColor={attention.rotationOverdue.length > 0 ? '#f87171' : '#44445a'}
        />
      </motion.div>

      {/* ── Vault health / issues ── */}
      {!hasIssues ? (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          style={{
            borderRadius: '1rem',
            border: '1px solid rgba(52,211,153,0.2)',
            background: 'rgba(52,211,153,0.05)',
            padding: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: '0.875rem',
            background: 'rgba(52,211,153,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FiShield size={22} color="#34d399" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', margin: 0 }}>Vault is healthy</h3>
            <p style={{ fontSize: '0.875rem', color: '#8b8b9e', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
              No expired keys, no rotations overdue. Everything looks secure.
            </p>
          </div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {(attention.expired.length > 0 || attention.expiringSoon.length > 0) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <FiAlertTriangle size={16} color="#fbbf24" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fbbf24' }}>
                  Needs Attention
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {[...attention.expired, ...attention.expiringSoon].map(s => (
                  <SecretCard key={s.id} secret={s} />
                ))}
              </div>
            </div>
          )}
          {attention.rotationOverdue.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <FiRefreshCw size={16} color="#f87171" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171' }}>
                  Rotation Overdue
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {attention.rotationOverdue.map(s => (
                  <SecretCard key={s.id} secret={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {storedSecrets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            borderRadius: '1rem',
            border: '1px dashed rgba(255,255,255,0.08)',
            background: 'rgba(18,18,28,0.4)',
            padding: '5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '1rem',
            background: 'rgba(124,106,247,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <FiKey size={24} color="#7c6af7" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ededed', margin: '0 0 0.5rem 0' }}>
            Your vault is empty
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#8b8b9e', margin: '0 0 1.75rem 0', maxWidth: 320 }}>
            Add your first secret to get started. Everything is encrypted before it leaves your device.
          </p>
          <button onClick={openAddModal} className="btn-primary">
            <FiPlus size={16} />
            Add Your First Secret
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
