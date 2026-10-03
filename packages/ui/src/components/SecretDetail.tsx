import React, { useEffect, useState } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { MaskedValue } from './MaskedValue';
import { RecoveryCodeViewer } from './RecoveryCodeViewer';
import { ServiceAccountInspector } from './ServiceAccountInspector';
import { ShareModal } from './ShareModal';
import { FiX, FiEdit2, FiCalendar, FiTag, FiFolder, FiHash, FiRefreshCw, FiArrowLeft, FiShare2, FiClock, FiRotateCcw } from 'react-icons/fi';
import type { DecryptedSecret } from '@scync/core';
import { useServiceStore } from '../stores/serviceStore';
import { SERVICE_COLORS } from '@scync/core';
import { PROJECT_COLOR_MAP } from './ProjectIcons';

export const SecretDetail: React.FC = () => {
  const { user } = useAuthStore();
  const { selectedSecretId, selectSecret, openEditModal, openConfirmModal } = useUIStore();
  const { storedSecrets, decryptValue, decryptVersionValue, restoreSecretVersion } = useVaultStore();
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const [decrypted, setDecrypted] = useState<DecryptedSecret | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<{ version: number; value: string } | null>(null);
  const [decryptingVersion, setDecryptingVersion] = useState<number | null>(null);
  const secret = storedSecrets.find(s => s.id === selectedSecretId);

  useEffect(() => { 
    if (selectedSecretId) { 
      setDecrypted(null); 
      setPreviewVersion(null);
      decryptValue(selectedSecretId).then(setDecrypted); 
    } else { 
      setDecrypted(null); 
      setPreviewVersion(null);
    } 
  }, [selectedSecretId, decryptValue]);

  if (!secret) return null;

  const handleRollback = (targetVer: number) => {
    if (!user) return;
    openConfirmModal({
      title: `Rollback to Version ${targetVer}`,
      message: `Are you sure you want to restore Version ${targetVer} of "${secret.name}"? This historical key will be saved as new active Version ${(secret.version || 1) + 1} and recorded in your vault ledger.`,
      confirmText: `Confirm Rollback`,
      danger: false,
      onConfirm: async () => {
        try {
          await restoreSecretVersion(user.uid, secret.id, targetVer);
          setPreviewVersion(null);
        } catch (err) {
          console.error('Failed to rollback version:', err);
        }
      }
    });
  };

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
        <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 2, fontFamily: 'var(--font-sans)' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}>
      <style>{`
        .sd-back-btn { display: flex; }
        .sd-close-btn { display: none; }
        @media (min-width: 1024px) {
          .sd-back-btn { display: none !important; }
          .sd-close-btn { display: grid !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={() => selectSecret(null)} 
            className="sd-back-btn"
            style={{ minWidth: 28, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', borderRadius: 4, cursor: 'pointer' }}
          >
            <FiArrowLeft size={14} />
          </button>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>Secret Details</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setIsShareModalOpen(true)} title="Share" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 'none', background: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-green)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}><FiShare2 size={13} /></button>
          <button onClick={() => openEditModal(secret.id)} title="Edit" style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 'none', background: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-green)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}><FiEdit2 size={13} /></button>
          <button onClick={() => selectSecret(null)} title="Close" className="sd-close-btn" style={{ width: 26, height: 26, placeItems: 'center', border: 'none', background: 'none', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'color 140ms' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}><FiX size={14} /></button>
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
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40`, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{secret.service}</span>
              );
            })()}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: statusBg, color: statusColor, whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{isExpired ? 'Expired' : secret.status}</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em', wordBreak: 'break-word', overflowWrap: 'anywhere', fontFamily: 'var(--font-sans)' }}>{secret.name}</h2>
        </div>


        {/* Value */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
            {secret.type === 'Recovery Codes' ? 'Recovery Codes' : 'Secret Value'}
          </div>
          <div style={{ border: secret.type !== 'Recovery Codes' ? '1px solid var(--color-border)' : 'none', background: secret.type !== 'Recovery Codes' ? 'var(--color-bg)' : 'transparent', padding: secret.type !== 'Recovery Codes' ? '10px 12px' : 0 }}>
            {decrypted ? (
              secret.type === 'Recovery Codes' ? (
                <RecoveryCodeViewer secret={decrypted} />
              ) : secret.type === 'Service Account JSON' ? (
                <ServiceAccountInspector secret={secret} decryptedValue={decrypted.value} />
              ) : (
                <MaskedValue value={decrypted.value} />
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-3)', fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 0.8s linear infinite' }} />
                Decrypting...
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>Metadata</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <MetaRow icon={<FiTag size={13} />} label="Type" value={secret.type} />
            <MetaRow icon={<FiHash size={13} />} label="Environment" value={secret.environment} />
            <MetaRow icon={<FiFolder size={13} />} label="Project" value={project?.name || 'Uncategorized'} />
            {secret.expiresOn && <MetaRow icon={<FiCalendar size={13} />} label={isExpired ? 'Expired On' : isExpiringSoon ? 'Expiring Soon' : 'Expires On'} value={secret.expiresOn.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />}
            {secret.lastRotated && <MetaRow icon={<FiRefreshCw size={13} />} label="Created/Rotated" value={secret.lastRotated.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />}
          </div>
        </div>

        {/* Notes */}
        {decrypted?.notes && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>Notes</div>
            <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', padding: '10px 12px', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>{decrypted.notes}</div>
          </div>
        )}

        {/* Version History & Rollback */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-3)', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiClock size={11} color="var(--color-green)" /> Version History
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', background: 'var(--color-green-bg)', color: 'var(--color-green)', border: '1px solid var(--color-green-border)', fontFamily: 'var(--font-mono)' }}>
              v{secret.version || 1} active
            </span>
          </div>

          <div style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {secret.versions && secret.versions.length > 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...secret.versions].reverse().map((ver) => {
                  const isCurrent = ver.version === (secret.version || 1);
                  const isPreviewing = previewVersion?.version === ver.version;
                  const isDecryptingThis = decryptingVersion === ver.version;

                  let typeColor = 'var(--color-text-3)';
                  let typeBg = 'transparent';
                  if (ver.changeType === 'rotated') { typeColor = '#06b6d4'; typeBg = 'rgba(6,182,212,0.12)'; }
                  else if (ver.changeType === 'restored') { typeColor = '#8b5cf6'; typeBg = 'rgba(139,92,246,0.12)'; }
                  else if (ver.changeType === 'created') { typeColor = '#10b981'; typeBg = 'rgba(16,185,129,0.12)'; }

                  return (
                    <div key={ver.version} style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isCurrent ? 'var(--color-green)' : 'var(--color-text)' }}>
                            v{ver.version}
                          </span>
                          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 5px', background: typeBg, color: typeColor, border: `1px solid ${typeColor}33`, fontFamily: 'var(--font-sans)' }}>
                            {ver.changeType || 'saved'}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 5px', background: 'var(--color-green-bg)', color: 'var(--color-green)', fontFamily: 'var(--font-sans)' }}>
                              current
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(ver.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {!isCurrent && (
                            <>
                              <button
                                onClick={async () => {
                                  if (isPreviewing) {
                                    setPreviewVersion(null);
                                  } else {
                                    setDecryptingVersion(ver.version);
                                    const val = await decryptVersionValue(secret.id, ver.version);
                                    setDecryptingVersion(null);
                                    if (val !== null) setPreviewVersion({ version: ver.version, value: val });
                                  }
                                }}
                                disabled={isDecryptingThis}
                                style={{
                                  padding: '2px 7px',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: 'var(--color-surface-2)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-2)',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {isDecryptingThis ? '...' : isPreviewing ? 'Hide' : 'Inspect'}
                              </button>

                              <button
                                onClick={() => handleRollback(ver.version)}
                                style={{
                                  padding: '2px 7px',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: 'var(--color-surface)',
                                  border: '1px solid var(--color-border)',
                                  color: '#8b5cf6',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}
                                title={`Rollback to version ${ver.version}`}
                              >
                                <FiRotateCcw size={10} /> Rollback
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Version Preview */}
                      {isPreviewing && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                          <div style={{ fontSize: 9.5, color: 'var(--color-text-3)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
                            Historical Value (v{ver.version}):
                          </div>
                          <MaskedValue value={previewVersion.value} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                  Initial version (v1). When you edit or rotate this secret, past values are automatically preserved for instantaneous rollback during deployments.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ label: 'Created', value: secret.createdAt.toLocaleString() }, { label: 'Last Updated', value: secret.updatedAt.toLocaleString() }].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>{r.label}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} secret={secret} />
    </div>
  );
};
