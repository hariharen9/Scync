import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiTrash2, FiClock, FiEye, FiLink, FiAlertCircle } from 'react-icons/fi';
import { useShareStore } from '../stores/shareStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ServiceIcon } from './ServiceIcon';
import type { ShareDocument } from '@scync/core';

interface ActiveSharesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveSharesModal: React.FC<ActiveSharesModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { activeShares, isLoadingShares, subscribeToShares, revokeShare } = useShareStore();
  const { openConfirmModal } = useUIStore();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    const unsubscribe = subscribeToShares(user.uid);
    return unsubscribe;
  }, [isOpen, user, subscribeToShares]);

  const handleRevoke = (shareId: string, secretName: string) => {
    openConfirmModal({
      title: 'Revoke Share Link',
      message: `Are you sure you want to revoke the share link for "${secretName}"? It will immediately stop working and anyone with the URL will no longer be able to access it.`,
      confirmText: 'Revoke Link',
      danger: true,
      onConfirm: async () => {
        setRevokingId(shareId);
        try {
          await revokeShare(shareId);
        } catch (error) {
          console.error('Failed to revoke share:', error);
          alert('Failed to revoke share');
        } finally {
          setRevokingId(null);
        }
      }
    });
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expires soon';
  };

  const isExpired = (expiresAt: Date): boolean => {
    return expiresAt.getTime() <= new Date().getTime();
  };

  const isConsumed = (share: ShareDocument): boolean => {
    return share.viewsAllowed !== null && share.viewsUsed >= share.viewsAllowed;
  };

  const getStatusColor = (share: ShareDocument): string => {
    if (isExpired(share.expiresAt)) return 'var(--color-red)';
    if (isConsumed(share)) return 'var(--color-text-3)';
    return 'var(--color-green)';
  };

  const getStatusText = (share: ShareDocument): string => {
    if (isExpired(share.expiresAt)) return 'Expired';
    if (isConsumed(share)) return 'Consumed';
    return 'Active';
  };

  // Sort: active first, then by creation date
  const sortedShares = [...activeShares].sort((a, b) => {
    const aActive = !isExpired(a.expiresAt) && !isConsumed(a);
    const bActive = !isExpired(b.expiresAt) && !isConsumed(b);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.15 }} 
            onClick={onClose} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 8 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.96, y: 8 }} 
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 720, 
              background: 'var(--color-surface)', 
              border: '1px solid var(--color-border-2)', 
              boxShadow: '0 24px 64px rgba(0,0,0,.7)', 
              overflow: 'hidden' 
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiLink size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Active Share Links</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>{activeShares.length} total</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: 'pointer', transition: 'color 140ms' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-2)'}
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Content */}
            <div data-lenis-prevent="true" style={{ padding: 18, maxHeight: '75vh', overflowY: 'auto' }}>
              {isLoadingShares ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--color-text-3)' }}>
                  <div style={{
                    width: 20, height: 20,
                    border: '2px solid var(--color-border)',
                    borderTopColor: 'var(--color-green)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                </div>
              ) : activeShares.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, textAlign: 'center' }}>
                  <div style={{
                    width: 56, height: 56,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    display: 'grid', placeItems: 'center',
                    marginBottom: 14
                  }}>
                    <FiLink size={24} style={{ color: 'var(--color-text-3)' }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
                    No Active Shares
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', maxWidth: 300, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                    Share links you create will appear here. You can revoke them at any time.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sortedShares.map(share => {
                      const expired = isExpired(share.expiresAt);
                      const consumed = isConsumed(share);
                      const statusColor = getStatusColor(share);
                      
                      return (
                        <div
                          key={share.id}
                          style={{
                            padding: 14,
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', gap: 12,
                            opacity: expired || consumed ? 0.5 : 1,
                            transition: 'all 140ms'
                          }}
                        >
                          {/* Service Icon */}
                          <div style={{ flexShrink: 0 }}>
                            <ServiceIcon service={share.service} size={18} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                              marginBottom: 4,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              fontFamily: 'var(--font-sans)'
                            }}>
                              {share.secretName}
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              fontSize: 10, color: 'var(--color-text-3)',
                              fontFamily: 'var(--font-sans)'
                            }}>
                              <span>{share.type}</span>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiClock size={10} />
                                {getTimeRemaining(share.expiresAt)}
                              </span>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiEye size={10} />
                                {share.viewsUsed}/{share.viewsAllowed ?? '∞'}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div style={{
                            padding: '3px 8px',
                            background: `${statusColor}15`,
                            border: `1px solid ${statusColor}40`,
                            fontSize: 9, fontWeight: 700,
                            color: statusColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            flexShrink: 0,
                            fontFamily: 'var(--font-sans)'
                          }}>
                            {getStatusText(share)}
                          </div>

                          {/* Revoke Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevoke(share.id, share.secretName);
                            }}
                            disabled={revokingId === share.id}
                            style={{
                              width: 28, height: 28,
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-surface)',
                              color: 'var(--color-red)',
                              cursor: revokingId === share.id ? 'not-allowed' : 'pointer',
                              display: 'grid', placeItems: 'center',
                              transition: 'all 140ms',
                              flexShrink: 0
                            }}
                            onMouseEnter={e => {
                              if (revokingId !== share.id) {
                                e.currentTarget.style.borderColor = 'var(--color-red)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (revokingId !== share.id) {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.background = 'var(--color-surface)';
                              }
                            }}
                            title="Revoke share"
                          >
                            {revokingId === share.id ? (
                              <div style={{
                                width: 12, height: 12,
                                border: '2px solid var(--color-red)',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                              }} />
                            ) : (
                              <FiTrash2 size={12} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Info */}
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 10, color: 'var(--color-text-3)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.5
                  }}>
                    <FiAlertCircle size={12} style={{ flexShrink: 0 }} />
                    Revoking a link immediately makes it inaccessible, even if someone has the URL.
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
