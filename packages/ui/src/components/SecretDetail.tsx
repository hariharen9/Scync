import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { MaskedValue } from './MaskedValue';
import { FiX, FiEdit2, FiCalendar, FiTag, FiFolder, FiHash, FiRefreshCw } from 'react-icons/fi';
import type { DecryptedSecret } from '@scync/core';
import { useServiceStore } from '../stores/serviceStore';
import { SERVICE_COLORS } from '@scync/core';
import { PROJECT_COLOR_MAP } from './ProjectIcons';

export const SecretDetail: React.FC = () => {
  const { selectedSecretId, selectSecret, openEditModal } = useUIStore();
  const { storedSecrets, decryptValue } = useVaultStore();
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const [decrypted, setDecrypted] = useState<DecryptedSecret | null>(null);
  const secret = storedSecrets.find(s => s.id === selectedSecretId);

  useEffect(() => { if (selectedSecretId) { setDecrypted(null); decryptValue(selectedSecretId).then(setDecrypted); } else { setDecrypted(null); } }, [selectedSecretId, decryptValue]);
  if (!secret) return null;

  const project = projects.find(p => p.id === secret.projectId);
  const isExpired = secret.expiresOn && secret.expiresOn.getTime() < Date.now();
  const isExpiringSoon = !isExpired && secret.expiresOn && (secret.expiresOn.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

  let statusBg = 'var(--color-green-bg)'; let statusColor = 'var(--color-green)';
  if (isExpired) { statusBg = 'var(--color-red-bg)'; statusColor = 'var(--color-red)'; }
  else if (isExpiringSoon) { statusBg = 'var(--color-amber-bg)'; statusColor = 'var(--color-amber)'; }
  else if (secret.status === 'Revoked') { statusBg = 'var(--color-red-bg)'; statusColor = 'var(--color-red)'; }

  const MetaRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
      <div style={{ color: 'var(--color-text-3)', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Secret Details</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => openEditModal(secret.id)} title="Edit" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 'none', background: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-green)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}><FiEdit2 size={13} /></button>
          <button onClick={() => selectSecret(null)} title="Close" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 'none', background: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}><FiX size={14} /></button>
        </div>
      </div>

      <div data-lenis-prevent="true" style={{ flex: 1, overflowY: 'auto', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Identity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {(() => {
              const custom = customServices.find(s => s.name === secret.service);
              const accentColor = custom ? (PROJECT_COLOR_MAP[custom.color] ?? '#10b981') : (SERVICE_COLORS[secret.service as keyof typeof SERVICE_COLORS] || '#10b981');
              return (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }}>{secret.service}</span>
              );
            })()}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: statusBg, color: statusColor }}>{isExpired ? 'Expired' : secret.status}</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em' }}>{secret.name}</h2>
        </div>

        {/* Value */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Secret Value</div>
          <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', padding: '10px 12px' }}>
            {decrypted ? <MaskedValue value={decrypted.value} /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-3)', fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 0.8s linear infinite' }} />
                Decrypting...
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Metadata</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <MetaRow icon={<FiTag size={13} />} label="Type" value={secret.type} />
            <MetaRow icon={<FiHash size={13} />} label="Environment" value={secret.environment} />
            <MetaRow icon={<FiFolder size={13} />} label="Project" value={project?.name || 'Uncategorized'} />
            {secret.expiresOn && <MetaRow icon={<FiCalendar size={13} />} label={isExpired ? 'Expired On' : isExpiringSoon ? 'Expiring Soon' : 'Expires On'} value={secret.expiresOn.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />}
            {secret.lastRotated && <MetaRow icon={<FiRefreshCw size={13} />} label="Last Rotated" value={secret.lastRotated.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />}
          </div>
        </div>

        {/* Notes */}
        {decrypted?.notes && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8 }}>Notes</div>
            <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', padding: '10px 12px', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{decrypted.notes}</div>
          </div>
        )}

        {/* Timestamps */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ label: 'Created', value: secret.createdAt.toLocaleString() }, { label: 'Last Updated', value: secret.updatedAt.toLocaleString() }].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
