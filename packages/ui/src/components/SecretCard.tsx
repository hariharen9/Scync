import React, { useState } from 'react';
import { FiMoreVertical, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { type StoredSecret, type Project } from '@scync/core';
import { MaskedValue } from './MaskedValue';
import { useVaultStore } from '../stores/vaultStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { SERVICE_COLORS } from '@scync/core';
import { ServiceIcon } from './ServiceIcon';
import { PROJECT_COLOR_MAP } from './ProjectIcons';
import { CustomServiceIcon } from './CustomServiceIcons';

interface SecretCardProps {
  secret: StoredSecret;
  project?: Project | null;
}

const getServiceColor = (service: string, customServices: any[]) => {
  const custom = customServices.find(s => s.name === service);
  if (custom) return PROJECT_COLOR_MAP[custom.color as any] ?? '#10b981';
  return SERVICE_COLORS[service as keyof typeof SERVICE_COLORS] || '#10b981';
};

const ENV_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  'Development': { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6' },
  'Staging': { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b' },
  'Production': { bg: 'rgba(239,68,68,0.08)', color: '#ef4444' },
  'Personal': { bg: 'rgba(139,92,246,0.08)', color: '#8b5cf6' },
  'Work': { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6' },
};

export const SecretCard: React.FC<SecretCardProps> = ({ secret, project }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const { decryptValue } = useVaultStore();
  const { customServices } = useServiceStore();
  const { openEditModal, selectSecret, openConfirmModal } = useUIStore();
  const { user } = useAuthStore();
  const { deleteSecret } = useVaultStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!user) return;
    
    openConfirmModal({
      title: 'Delete Secret',
      message: `Are you sure you want to delete "${secret.name}"? This action cannot be undone.`,
      confirmText: 'Delete Secret',
      danger: true,
      onConfirm: async () => {
        await deleteSecret(user.uid, secret.id);
        selectSecret(null); // Clear selection if deleted
      }
    });
  };

  const handleRevealToggle = async (revealed: boolean) => {
    if (revealed && !decryptedValue) {
      const dec = await decryptValue(secret.id);
      if (dec) setDecryptedValue(dec.value);
    }
  };

  const isExpired = secret.expiresOn && secret.expiresOn.getTime() < Date.now();
  const isExpiringSoon = !isExpired && secret.expiresOn && (secret.expiresOn.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

  const accentColor = getServiceColor(secret.service, customServices);
  const envStyle = ENV_BADGE_COLORS[secret.environment] || { bg: 'rgba(100,116,139,0.08)', color: '#64748b' };

  let statusLabel: string = secret.status;
  let statusBg = 'var(--color-green-bg)';
  let statusColor = 'var(--color-green)';
  if (isExpired) { statusLabel = 'Expired'; statusBg = 'var(--color-red-bg)'; statusColor = 'var(--color-red)'; }
  else if (isExpiringSoon) { statusLabel = 'Expiring'; statusBg = 'var(--color-amber-bg)'; statusColor = 'var(--color-amber)'; }
  else if (secret.status === 'Revoked') { statusBg = 'var(--color-red-bg)'; statusColor = 'var(--color-red)'; }

  return (
    <div
      onClick={() => selectSecret(secret.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        position: 'relative', cursor: 'pointer',
        background: hovered ? 'var(--color-surface-2)' : 'var(--color-surface)',
        padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'background 140ms',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
          {/* Service */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
            fontSize: '9.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: accentColor,
          }}>
            {(() => {
              const custom = customServices.find(s => s.name === secret.service);
              if (custom) return <CustomServiceIcon iconKey={custom.icon || 'FaAmazon'} size={10} color="currentcolor" />;
              return <ServiceIcon service={secret.service} size={10} className="text-current" />;
            })()}
            {secret.service}
          </div>
          {/* Name */}
          <h3 style={{
            fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text)',
            margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }} title={secret.name}>
            {secret.name}
          </h3>
        </div>

        {/* 3-dot menu (visible on hover) */}
        <div style={{ position: 'relative', flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 140ms' }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{
              width: 26, height: 26, display: 'grid', placeItems: 'center',
              background: 'none', border: 'none',
              color: 'var(--color-text-3)', cursor: 'pointer',
              transition: 'color 140ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            <FiMoreVertical size={14} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 100, marginTop: 4,
              width: 120, background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-2)',
              boxShadow: '0 8px 32px rgba(0,0,0,.6)', overflow: 'hidden',
            }}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); openEditModal(secret.id); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 12px', fontSize: 12, color: 'var(--color-text-2)',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-sans)', transition: 'background 100ms, color 100ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-3)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
              >
                <FiEdit2 size={12} /> Edit
              </button>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <button
                onClick={handleDelete}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 12px', fontSize: 12, color: 'var(--color-red)',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-sans)', transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <FiTrash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        {project && (
          <>
            <span style={{
              fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.05em',
              color: 'var(--color-green)', background: 'var(--color-green-bg)',
              border: '1px solid var(--color-green-border)', padding: '1px 5px',
            }}>
              {project.name}
            </span>
            <span style={{ color: 'var(--color-border-2)', fontSize: 10 }}>/</span>
          </>
        )}
        <span style={{ fontSize: '9.5px', fontWeight: 500, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {secret.type}
        </span>
        <span style={{ color: 'var(--color-border-2)', fontSize: 10 }}>·</span>
        <span style={{
          fontSize: '9.5px', fontWeight: 600,
          padding: '1px 5px',
          background: envStyle.bg, color: envStyle.color,
          border: `1px solid ${envStyle.color}20`,
        }}>
          {secret.environment}
        </span>
      </div>

      {/* Masked value */}
      <div style={{
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        padding: '6px 10px',
      }}>
        <MaskedValue
          value={decryptedValue || ''}
          onRevealToggled={handleRevealToggle}
          compact
        />
      </div>

      {/* Bottom: status + expiry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <span style={{
          fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          padding: '2px 6px', background: statusBg, color: statusColor,
        }}>
          {statusLabel}
        </span>
        {secret.expiresOn && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: isExpiringSoon ? 'var(--color-amber)' : 'var(--color-text-3)' }}>
            <FiClock size={10} />
            {secret.expiresOn.toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
