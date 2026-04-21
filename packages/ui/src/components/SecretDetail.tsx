import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { MaskedValue } from './MaskedValue';
import { FiX, FiEdit2, FiCalendar, FiClock, FiTag, FiFolder, FiHash, FiRefreshCw, FiShield } from 'react-icons/fi';
import { DecryptedSecret } from '@scync/core';
import { motion, AnimatePresence } from 'framer-motion';

const SERVICE_COLORS_MAP: Record<string, string> = {
  'AWS': '#f59e0b', 'GCP': '#4285f4', 'Azure': '#0089d6',
  'GitHub': '#ededed', 'Stripe': '#635bff', 'OpenAI': '#74aa9c',
  'Vercel': '#ffffff', 'Supabase': '#3ecf8e', 'Firebase': '#ffa000',
  'Database': '#06b6d4', 'Other': '#7c6af7',
};

export const SecretDetail: React.FC = () => {
  const { selectedSecretId, selectSecret, openEditModal } = useUIStore();
  const { storedSecrets, decryptValue } = useVaultStore();
  const { projects } = useProjectStore();
  const [decrypted, setDecrypted] = useState<DecryptedSecret | null>(null);

  const secret = storedSecrets.find(s => s.id === selectedSecretId);

  useEffect(() => {
    if (selectedSecretId) {
      setDecrypted(null);
      decryptValue(selectedSecretId).then(setDecrypted);
    } else {
      setDecrypted(null);
    }
  }, [selectedSecretId, decryptValue]);

  if (!secret) return null;

  const project = projects.find(p => p.id === secret.projectId);
  const accentColor = SERVICE_COLORS_MAP[secret.service] || SERVICE_COLORS_MAP['Other'];

  const isExpired = secret.expiresOn && secret.expiresOn.getTime() < Date.now();
  const isExpiringSoon = !isExpired && secret.expiresOn
    && (secret.expiresOn.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

  let statusBg = 'rgba(52,211,153,0.12)';
  let statusColor = '#34d399';
  if (isExpired) { statusBg = 'rgba(248,113,113,0.12)'; statusColor = '#f87171'; }
  else if (isExpiringSoon) { statusBg = 'rgba(251,191,36,0.12)'; statusColor = '#fbbf24'; }
  else if (secret.status === 'Deprecated' || secret.status === 'Revoked') {
    statusBg = 'rgba(139,139,158,0.1)'; statusColor = '#8b8b9e';
  }

  const MetaRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ color: '#44445a', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#44445a', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#ededed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(12,12,20,0.95)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Top accent strip */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}80, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#44445a' }}>
          Secret Details
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            onClick={() => openEditModal(secret.id)}
            title="Edit"
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: 'none', background: 'transparent', color: '#44445a', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,106,247,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#7c6af7'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#44445a'; }}
          >
            <FiEdit2 size={14} />
          </button>
          <button
            onClick={() => selectSecret(null)}
            title="Close"
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', border: 'none', background: 'transparent', color: '#44445a', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#8b8b9e'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#44445a'; }}
          >
            <FiX size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div data-lenis-prevent="true" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Identity block */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '0.2rem 0.625rem', borderRadius: '0.375rem',
              background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30`,
            }}>
              {secret.service}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.625rem', borderRadius: '0.375rem', background: statusBg, color: statusColor }}>
              {isExpired ? 'Expired' : secret.status}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ededed', margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {secret.name}
          </h2>
        </div>

        {/* Secret value */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#44445a', marginBottom: '0.625rem' }}>
            Secret Value
          </div>
          <div style={{
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.35)',
            padding: '0.875rem 1rem',
          }}>
            {decrypted ? (
              <MaskedValue value={decrypted.value} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#44445a', fontSize: '0.8125rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(124,106,247,0.3)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
                Decrypting...
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#44445a', marginBottom: '0.75rem' }}>
            Metadata
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MetaRow icon={<FiTag size={14} />} label="Type" value={secret.type} />
            <MetaRow icon={<FiHash size={14} />} label="Environment" value={secret.environment} />
            <MetaRow icon={<FiFolder size={14} />} label="Project" value={project?.name || 'Uncategorized'} />
            {secret.expiresOn && (
              <MetaRow
                icon={<FiCalendar size={14} />}
                label={isExpired ? 'Expired On' : isExpiringSoon ? 'Expiring Soon' : 'Expires On'}
                value={secret.expiresOn.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
            {secret.lastRotated && (
              <MetaRow
                icon={<FiRefreshCw size={14} />}
                label="Last Rotated"
                value={secret.lastRotated.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        {decrypted?.notes && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#44445a', marginBottom: '0.625rem' }}>
              Notes
            </div>
            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#8b8b9e', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {decrypted.notes}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Created', value: secret.createdAt.toLocaleString() },
            { label: 'Last Updated', value: secret.updatedAt.toLocaleString() },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#44445a', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: '0.75rem', color: '#8b8b9e' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
