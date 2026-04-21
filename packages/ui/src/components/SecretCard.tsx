import React, { useState } from 'react';
import { FiMoreVertical, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { type StoredSecret, type Project } from '@scync/core';
import { MaskedValue } from './MaskedValue';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SecretCardProps {
  secret: StoredSecret;
  project?: Project | null;
}

// Service → accent color mapping for the left border
const SERVICE_BORDER_COLORS: Record<string, string> = {
  'AWS': '#f59e0b',
  'GCP': '#4285f4',
  'Azure': '#0089d6',
  'GitHub': '#f0f6fc',
  'Stripe': '#635bff',
  'OpenAI': '#74aa9c',
  'Vercel': '#ffffff',
  'Supabase': '#3ecf8e',
  'Firebase': '#ffa000',
  'Database': '#06b6d4',
  'Other': '#7c6af7',
};

export const SecretCard: React.FC<SecretCardProps> = ({ secret }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const { decryptValue } = useVaultStore();
  const { openEditModal, selectSecret } = useUIStore();

  const handleRevealToggle = async (revealed: boolean) => {
    if (revealed && !decryptedValue) {
      const dec = await decryptValue(secret.id);
      if (dec) setDecryptedValue(dec.value);
    }
  };

  const isExpired = secret.expiresOn && secret.expiresOn.getTime() < Date.now();
  const isExpiringSoon = !isExpired && secret.expiresOn && (secret.expiresOn.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

  const borderAccent = SERVICE_BORDER_COLORS[secret.service] || SERVICE_BORDER_COLORS['Other'];

  let statusBg = 'rgba(52,211,153,0.12)';
  let statusText = '#34d399';
  if (isExpired) { statusBg = 'rgba(248,113,113,0.12)'; statusText = '#f87171'; }
  else if (isExpiringSoon) { statusBg = 'rgba(251,191,36,0.12)'; statusText = '#fbbf24'; }
  else if (secret.status === 'Revoked') { statusBg = 'rgba(248,113,113,0.12)'; statusText = '#f87171'; }

  return (
    <motion.div
      layout
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
      transition={{ duration: 0.2 }}
      onClick={() => selectSecret(secret.id)}
      style={{
        position: 'relative',
        cursor: 'pointer',
        borderRadius: '0.875rem',
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(15,15,22,0.85)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: 0,
        width: 3,
        background: borderAccent,
        opacity: 0.7,
        borderRadius: '4px 0 0 4px',
      }} />

      <div style={{ padding: '1.25rem 1.25rem 1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minWidth: 0, flex: 1 }}>
            {/* Service badge */}
            <span style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.15rem 0.5rem',
              borderRadius: '0.375rem',
              background: `${borderAccent}20`,
              color: borderAccent,
              border: `1px solid ${borderAccent}30`,
            }}>
              {secret.service}
            </span>
            {/* Name */}
            <h3 style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#ededed',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }} title={secret.name}>
              {secret.name}
            </h3>
          </div>

          {/* Context menu */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: '#44445a',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#8b8b9e'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#44445a'; }}
            >
              <FiMoreVertical size={15} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', right: 0, top: '100%', zIndex: 100,
                    marginTop: '0.375rem',
                    width: 130,
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#1a1a2a',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); openEditModal(secret.id); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', fontSize: '0.8125rem', color: '#8b8b9e', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#ededed'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#8b8b9e'; }}
                  >
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0.75rem' }} />
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.875rem', fontSize: '0.8125rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                  >
                    <FiTrash2 size={13} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Type + Env meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#44445a' }}>
            {secret.type}
          </span>
          <span style={{ color: '#2e2e3a', fontWeight: 400 }}>·</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#44445a' }}>
            {secret.environment}
          </span>
        </div>

        {/* Masked value */}
        <div style={{
          borderRadius: '0.625rem',
          background: 'rgba(0,0,0,0.3)',
          padding: '0.5rem 0.75rem',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <MaskedValue
            value={decryptedValue || ''}
            onRevealToggled={handleRevealToggle}
            compact
          />
        </div>

        {/* Bottom: status + expiry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: 'auto' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.375rem',
            background: statusBg,
            color: statusText,
          }}>
            {isExpired ? 'Expired' : secret.status}
          </span>
          {secret.expiresOn && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: isExpiringSoon ? '#fbbf24' : '#44445a' }}>
              <FiClock size={11} />
              {secret.expiresOn.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
