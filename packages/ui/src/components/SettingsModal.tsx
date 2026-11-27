import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiShield,
  FiLock,
  FiDownload,
  FiCheck,
  FiAlertTriangle,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiSettings,
  FiTrash2,
  FiPlus,
  FiKey,
  FiSliders,
  FiDatabase,
  FiMoon,
  FiSun,
  FiMonitor,
} from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { generatePortableVault } from '../utils/portableVaultTemplate';

type SettingsSection = 'general' | 'auth' | 'vault' | 'danger';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--color-text)',
  outline: 'none',
  transition: 'border-color 140ms',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--color-text-2)',
  marginBottom: 6,
  fontFamily: 'var(--font-mono)',
};
const btnPrimaryStyle: React.CSSProperties = {
  padding: '9px 16px',
  background: 'var(--color-text)',
  color: 'var(--color-bg)',
  border: 'none',
  fontWeight: 700,
  fontSize: 12.5,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};
const btnOutlineStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  border: '1px solid var(--color-border-2)',
  color: 'var(--color-text)',
  fontWeight: 600,
  fontSize: 12.5,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  transition: 'background 140ms, border-color 140ms',
};
const cardStyle: React.CSSProperties = {
  padding: '18px 20px',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, closeSettingsModal, settings, updateSettings, openRecoveryKitModal } = useUIStore();
  const { changeVaultPassword, exportVault, unlock, vaultMeta, addBiometric, removeBiometric, clearAllBiometrics } = useVaultStore();
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { user, deleteUserAccount } = useAuthStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');
  const [showExportPass, setShowExportPass] = useState(false);

  // Delete account state
  const [deleteStep, setDeleteStep] = useState(0);
  const [obliterateText, setObliterateText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showDeletePass, setShowDeletePass] = useState(false);

  // Biometric state
  const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState('');
  const [biometricError, setBiometricError] = useState('');
  const [showBiometricPass, setShowBiometricPass] = useState(false);

  const biometrics = vaultMeta?.biometrics ?? [];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!user) return;
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 100));

    const success = await changeVaultPassword(user.uid, oldPassword, newPassword);
    setIsSubmitting(false);

    if (success) {
      const wasBiometricEnabled = (vaultMeta?.biometrics?.length ?? 0) > 0;
      setPasswordSuccess(
        `Master password changed successfully. All secrets have been re-encrypted.${wasBiometricEnabled ? ' All biometric entries have been cleared for security.' : ''}`
      );
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 5000);
    } else {
      setPasswordError('Incorrect current password.');
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError('');
    setExportSuccess('');

    if (!user) return;
    setIsSubmitting(true);

    const exportData = await exportVault(user.uid, exportPassword);

    if (exportData) {
      const fullExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        meta: exportData.meta,
        projects,
        services: customServices,
        secrets: exportData.secrets,
        sshKeys: exportData.sshKeys || [],
        totpTokens: exportData.totpTokens || [],
        certificates: exportData.certificates || [],
        passwords: exportData.passwords || [],
      };

      const htmlContent = generatePortableVault(fullExport, user.uid);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `scync_portable_vault_${date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess('Portable Vault generated successfully!');
      setExportPassword('');
      setTimeout(() => {
        setIsExporting(false);
        setExportSuccess('');
      }, 3000);
    } else {
      setExportError('Incorrect master password.');
    }

    setIsSubmitting(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!user) return;
    setIsSubmitting(true);

    const isValid = await unlock(deletePassword, user.uid);
    if (!isValid) {
      setDeleteError('Incorrect master password.');
      setIsSubmitting(false);
      return;
    }

    try {
      await deleteUserAccount();
      closeSettingsModal();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleAddBiometric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setBiometricError('');
    const success = await addBiometric(user.uid, biometricPassword);
    setIsSubmitting(false);

    if (success) {
      setIsEnablingBiometric(false);
      setBiometricPassword('');
    } else {
      setBiometricError('Failed to register biometrics. Check your password and Passkey support.');
    }
  };

  const handleRemoveBiometric = async (index: number) => {
    if (!user) return;
    await removeBiometric(user.uid, index);
  };

  const handleClearAllBiometrics = async () => {
    if (!user) return;
    await clearAllBiometrics(user.uid);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    closeSettingsModal();
    setTimeout(() => {
      setActiveSection('general');
      setIsChangingPassword(false);
      setIsExporting(false);
      setIsEnablingBiometric(false);
      setDeleteStep(0);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setExportPassword('');
      setBiometricPassword('');
      setPasswordError('');
      setPasswordSuccess('');
      setExportError('');
      setExportSuccess('');
      setBiometricError('');
      setDeletePassword('');
      setDeleteError('');
      setObliterateText('');
    }, 200);
  };

  React.useEffect(() => {
    if (!isSettingsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsModalOpen, isSubmitting]);

  const navSections: { id: SettingsSection; label: string; icon: React.ComponentType<{ size?: number }>; danger?: boolean }[] = [
    { id: 'general', label: 'Appearance & Lock', icon: FiSliders },
    { id: 'auth', label: 'Biometrics & Recovery', icon: FiShield },
    { id: 'vault', label: 'Password & Export', icon: FiDatabase },
    { id: 'danger', label: 'Danger Zone', icon: FiAlertTriangle, danger: true },
  ];

  const themeOptions: { value: 'dark' | 'light' | 'system'; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { value: 'dark', label: 'Dark', icon: FiMoon },
    { value: 'light', label: 'Light', icon: FiSun },
    { value: 'system', label: 'System', icon: FiMonitor },
  ];

  const timerOptions: { value: number | null; label: string }[] = [
    { value: 5, label: '5 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: null, label: 'Never' },
  ];

  return (
    <AnimatePresence>
      {isSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 860,
              height: 'min(620px, 88vh)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-2)',
              boxShadow: '0 24px 64px rgba(0,0,0,.75)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiSettings size={14} color="var(--color-green)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Vault Settings</h2>
                  <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                    Security, biometrics, recovery &amp; portable backups
                  </p>
                </div>
              </div>
              <button
                disabled={isSubmitting}
                onClick={handleClose}
                aria-label="Close settings"
                style={{
                  width: 30,
                  height: 30,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid var(--color-border)',
                  background: 'none',
                  color: 'var(--color-text-2)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Mobile horizontal nav */}
            <div className="flex md:hidden" style={{ borderBottom: '1px solid var(--color-border)', overflowX: 'auto', flexShrink: 0, background: 'var(--color-surface)' }}>
              {navSections.map((item) => {
                const active = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    disabled={isSubmitting}
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 14px',
                      border: 'none',
                      borderBottom: active ? `2px solid ${item.danger ? 'var(--color-red)' : 'var(--color-green)'}` : '2px solid transparent',
                      background: 'none',
                      color: active ? (item.danger ? 'var(--color-red)' : 'var(--color-text)') : 'var(--color-text-3)',
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Two-Column Body */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              {/* Desktop Left Rail */}
              <aside
                className="hidden md:flex"
                style={{
                  width: 224,
                  flexShrink: 0,
                  borderRight: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '14px 10px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {navSections.map((item) => {
                    const active = activeSection === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        disabled={isSubmitting}
                        onClick={() => setActiveSection(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          border: 'none',
                          borderLeft: active
                            ? `2px solid ${item.danger ? 'var(--color-red)' : 'var(--color-green)'}`
                            : '2px solid transparent',
                          background: active ? 'var(--color-surface-2)' : 'transparent',
                          color: active
                            ? item.danger
                              ? 'var(--color-red)'
                              : 'var(--color-text)'
                            : item.danger
                              ? 'rgba(239, 68, 68, 0.75)'
                              : 'var(--color-text-2)',
                          fontSize: 13,
                          fontWeight: active ? 700 : 500,
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          transition: 'all 140ms',
                        }}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {user && (
                  <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 4 }}>
                      Signed In As
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email || user.uid}
                    </div>
                  </div>
                )}
              </aside>

              {/* Right Content Pane */}
              <div
                data-lenis-prevent="true"
                style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', overscrollBehavior: 'contain' }}
              >
                {/* ─── SECTION 1: APPEARANCE & LOCK ─── */}
                {activeSection === 'general' && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={cardStyle}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>Appearance</h3>
                        <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0 }}>Choose how Scync looks across your workspace.</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {themeOptions.map((opt) => {
                          const Icon = opt.icon;
                          const active = settings.theme === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateSettings({ theme: opt.value })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '10px 12px',
                                border: `1px solid ${active ? 'var(--color-green)' : 'var(--color-border)'}`,
                                background: active ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface)',
                                color: active ? 'var(--color-text)' : 'var(--color-text-2)',
                                fontSize: 12.5,
                                fontWeight: active ? 700 : 500,
                                cursor: 'pointer',
                              }}
                            >
                              <Icon size={14} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                          <FiLock size={14} color="var(--color-green)" /> Inactivity Auto-Lock
                        </h3>
                        <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
                          Automatically lock your vault and clear the encryption key from memory when idle.
                        </p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {timerOptions.map((opt) => {
                          const active = settings.inactivityLockMinutes === opt.value;
                          return (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() => updateSettings({ inactivityLockMinutes: opt.value })}
                              style={{
                                padding: '9px 10px',
                                border: `1px solid ${active ? 'var(--color-green)' : 'var(--color-border)'}`,
                                background: active ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface)',
                                color: active ? 'var(--color-green)' : 'var(--color-text-2)',
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ ...cardStyle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                          <FiShield size={14} color="var(--color-green)" /> Lock on Window Blur
                        </h3>
                        <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0 }}>
                          Lock instantly when switching browser tabs or minimizing the window.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSettings({ windowBlurLock: !settings.windowBlurLock })}
                        aria-label="Toggle lock on window blur"
                        style={{
                          width: 46,
                          height: 24,
                          borderRadius: 12,
                          border: 'none',
                          cursor: 'pointer',
                          flexShrink: 0,
                          background: settings.windowBlurLock ? 'var(--color-green)' : 'var(--color-border-2)',
                          position: 'relative',
                          transition: 'background 0.2s',
                        }}
                      >
                        <motion.div
                          animate={{ x: settings.windowBlurLock ? 24 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ─── SECTION 2: BIOMETRICS & RECOVERY ─── */}
                {activeSection === 'auth' && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Biometric Unlock */}
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                            <FiShield size={14} color="var(--color-green)" /> Biometric Unlock (WebAuthn PRF)
                          </h3>
                          <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
                            Use Face ID, Touch ID, or Windows Hello to unwrap your master password. Register once per device.
                          </p>
                        </div>
                      </div>

                      {biometrics.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={labelStyle}>Registered Devices ({biometrics.length})</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                            {biometrics.map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 11px',
                                  background: 'var(--color-surface)',
                                  border: '1px solid var(--color-border)',
                                  fontSize: 12.5,
                                  color: 'var(--color-text)',
                                }}
                              >
                                <span>Device {i + 1}</span>
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleRemoveBiometric(i)}
                                  style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: '2px 4px' }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-red)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
                                  title="Remove this device"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                          {biometrics.length > 1 && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={handleClearAllBiometrics}
                              style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', fontSize: 11.5, cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: 2 }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-red)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
                            >
                              Clear all registered devices
                            </button>
                          )}
                        </div>
                      )}

                      {isEnablingBiometric ? (
                        <form onSubmit={handleAddBiometric} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                          <p style={{ fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.5, margin: 0 }}>
                            Enter your master password to securely wrap it with this device&apos;s biometric key.
                          </p>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showBiometricPass ? 'text' : 'password'}
                              value={biometricPassword}
                              onChange={e => setBiometricPassword(e.target.value)}
                              placeholder="Master Password"
                              required
                              disabled={isSubmitting}
                              style={inputStyle}
                            />
                            <button type="button" onClick={() => setShowBiometricPass(!showBiometricPass)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}>
                              {showBiometricPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </button>
                          </div>
                          {biometricError && <p style={{ color: 'var(--color-red)', fontSize: 12, margin: 0 }}>{biometricError}</p>}
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsEnablingBiometric(false)} style={btnOutlineStyle}>Cancel</button>
                            <button type="submit" disabled={isSubmitting || !biometricPassword} style={btnPrimaryStyle}>
                              {isSubmitting ? <FiLoader /> : 'Register Biometrics'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setIsEnablingBiometric(true)}
                            style={{
                              ...btnOutlineStyle,
                              background: biometrics.length > 0 ? 'transparent' : 'var(--color-green)',
                              color: biometrics.length > 0 ? 'var(--color-text)' : '#060606',
                              border: biometrics.length > 0 ? '1px solid var(--color-border-2)' : '1px solid var(--color-green)',
                            }}
                          >
                            <FiPlus size={13} />
                            {biometrics.length > 0 ? 'Register Another Device' : 'Enable Biometric Unlock'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Emergency Recovery Kit */}
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                          <FiKey size={14} color="var(--color-green)" /> Emergency Recovery Kit
                        </h3>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '3px 8px',
                          fontFamily: 'var(--font-mono)',
                          background: vaultMeta?.recovery ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                          color: vaultMeta?.recovery ? 'var(--color-green)' : '#f59e0b',
                          border: `1px solid ${vaultMeta?.recovery ? 'var(--color-green-border)' : 'rgba(245, 158, 11, 0.35)'}`,
                        }}>
                          {vaultMeta?.recovery ? 'Active' : 'Not Configured'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.55 }}>
                        Generate an offline printable recovery kit with a master recovery key and QR code. If you ever forget your master password, this kit is the only way to recover your vault.
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => openRecoveryKitModal()}
                          style={{
                            ...btnOutlineStyle,
                            background: vaultMeta?.recovery ? 'transparent' : 'var(--color-green)',
                            color: vaultMeta?.recovery ? 'var(--color-text)' : '#060606',
                            border: vaultMeta?.recovery ? '1px solid var(--color-border-2)' : '1px solid var(--color-green)',
                          }}
                        >
                          <FiKey size={13} />
                          {vaultMeta?.recovery ? 'View or Regenerate Recovery Kit' : 'Set Up Emergency Recovery Kit'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ─── SECTION 3: PASSWORD & EXPORT ─── */}
                {activeSection === 'vault' && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
                    {(!isChangingPassword && !isExporting) ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        <div style={{ ...cardStyle, justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text)' }}>Change Master Password</h3>
                            <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.55 }}>
                              Derive a new encryption key and atomically re-encrypt all stored secrets, SSH keys, TOTPs, certificates, and passwords.
                            </p>
                          </div>
                          <div>
                            <button style={btnOutlineStyle} onClick={() => setIsChangingPassword(true)}>
                              <FiLock size={13} /> Change Password
                            </button>
                          </div>
                        </div>

                        <div style={{ ...cardStyle, justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                              <FiDownload size={14} color="var(--color-green)" /> Export Portable Vault
                            </h3>
                            <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.55 }}>
                              Download a standalone, self-decrypting HTML backup of your entire vault for offline disaster recovery.
                            </p>
                          </div>
                          <div>
                            <button style={btnOutlineStyle} onClick={() => setIsExporting(true)}>
                              <FiDownload size={13} /> Generate HTML Vault
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : isChangingPassword ? (
                      <form onSubmit={handlePasswordChange} style={{ ...cardStyle, maxWidth: 460 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Change Master Password</h3>
                          {!isSubmitting && (
                            <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordError(''); setPasswordSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Back
                            </button>
                          )}
                        </div>

                        {passwordError && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiAlertTriangle size={14} /> {passwordError}
                          </div>
                        )}
                        {passwordSuccess && (
                          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '10px 12px', border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiCheck size={14} /> {passwordSuccess}
                          </div>
                        )}

                        <div style={{ position: 'relative' }}>
                          <label style={labelStyle}>Current Password</label>
                          <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required disabled={isSubmitting} style={inputStyle} />
                          <button type="button" onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: 10, top: 31, background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}>
                            {showOld ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                        </div>

                        <div style={{ position: 'relative' }}>
                          <label style={labelStyle}>New Password</label>
                          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} disabled={isSubmitting} style={inputStyle} />
                          <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 10, top: 31, background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}>
                            {showNew ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                        </div>

                        <div>
                          <label style={labelStyle}>Confirm New Password</label>
                          <input type={showNew ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} disabled={isSubmitting} style={inputStyle} />
                        </div>

                        <button type="submit" disabled={isSubmitting} style={{ ...btnPrimaryStyle, opacity: isSubmitting ? 0.7 : 1 }}>
                          {isSubmitting ? <><FiLoader /> Re-encrypting Vault...</> : 'Confirm Password Change'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleExport} style={{ ...cardStyle, maxWidth: 460 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Export Portable Vault</h3>
                          {!isSubmitting && (
                            <button type="button" onClick={() => { setIsExporting(false); setExportError(''); setExportSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Back
                            </button>
                          )}
                        </div>

                        {exportError && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiAlertTriangle size={14} /> {exportError}
                          </div>
                        )}
                        {exportSuccess && (
                          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '10px 12px', border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiCheck size={14} /> {exportSuccess}
                          </div>
                        )}

                        <div style={{ position: 'relative' }}>
                          <label style={labelStyle}>Authorize with Master Password</label>
                          <input type={showExportPass ? 'text' : 'password'} value={exportPassword} onChange={e => setExportPassword(e.target.value)} required disabled={isSubmitting} style={inputStyle} autoFocus />
                          <button type="button" onClick={() => setShowExportPass(!showExportPass)} style={{ position: 'absolute', right: 10, top: 31, background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}>
                            {showExportPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                        </div>

                        <button type="submit" disabled={isSubmitting} style={{ ...btnPrimaryStyle, opacity: isSubmitting ? 0.7 : 1 }}>
                          {isSubmitting ? <><FiLoader /> Generating Vault...</> : <><FiDownload size={14} /> Authorize &amp; Download HTML</>}
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* ─── SECTION 4: DANGER ZONE ─── */}
                {activeSection === 'danger' && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
                    {deleteStep === 0 ? (
                      <div style={{ padding: '20px', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiAlertTriangle size={15} /> Permanently Delete Account
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>
                          Permanently delete your Scync account, vault, projects, custom services, and all encrypted secrets. This action is immediate and absolutely irrecoverable.
                        </p>
                        <div>
                          <button
                            style={{ ...btnOutlineStyle, borderColor: 'rgba(239, 68, 68, 0.45)', color: 'var(--color-red)' }}
                            onClick={() => setDeleteStep(1)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-red)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-red)'; }}
                          >
                            <FiTrash2 size={13} /> Delete Account
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ ...cardStyle, maxWidth: 460, borderColor: 'rgba(239, 68, 68, 0.35)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-red)', margin: 0 }}>Obliterate Account</h3>
                          {!isSubmitting && (
                            <button type="button" onClick={() => { setDeleteStep(0); setObliterateText(''); setDeleteError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Cancel
                            </button>
                          )}
                        </div>

                        {deleteStep === 1 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: 14, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--color-text)', margin: '0 0 8px 0', fontWeight: 700 }}>This is a destructive action.</p>
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6 }}>
                                Your Firebase Authentication profile and entire Firestore document tree will be permanently destroyed. <strong style={{ color: 'var(--color-red)' }}>There are no backups.</strong>
                              </p>
                            </div>
                            <button type="button" onClick={() => setDeleteStep(2)} style={{ ...btnPrimaryStyle, background: 'var(--color-red)', color: '#fff' }}>
                              Yes, I understand
                            </button>
                          </div>
                        )}

                        {deleteStep === 2 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                              <label style={{ ...labelStyle, color: 'var(--color-red)' }}>Type &quot;OBLITERATE&quot; to continue</label>
                              <input
                                value={obliterateText}
                                onChange={e => setObliterateText(e.target.value)}
                                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', background: 'rgba(239, 68, 68, 0.05)', borderColor: obliterateText === 'OBLITERATE' ? 'var(--color-red)' : 'var(--color-border)' }}
                                placeholder="OBLITERATE"
                                autoFocus
                              />
                            </div>
                            <button type="button" disabled={obliterateText !== 'OBLITERATE'} onClick={() => setDeleteStep(3)} style={{ ...btnPrimaryStyle, background: 'var(--color-red)', color: '#fff', opacity: obliterateText === 'OBLITERATE' ? 1 : 0.45 }}>
                              Proceed
                            </button>
                          </div>
                        )}

                        {deleteStep === 3 && (
                          <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {deleteError && (
                              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiAlertTriangle size={14} /> {deleteError}
                              </div>
                            )}
                            <div style={{ position: 'relative' }}>
                              <label style={labelStyle}>Authorize with Master Password</label>
                              <input type={showDeletePass ? 'text' : 'password'} value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required disabled={isSubmitting} style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} autoFocus />
                              <button type="button" onClick={() => setShowDeletePass(!showDeletePass)} style={{ position: 'absolute', right: 10, top: 31, background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer' }}>
                                {showDeletePass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                              </button>
                            </div>
                            <button type="submit" disabled={isSubmitting} style={{ ...btnPrimaryStyle, background: 'var(--color-red)', color: '#fff', opacity: isSubmitting ? 0.7 : 1 }}>
                              {isSubmitting ? <><FiLoader /> Obliterating Data...</> : 'Permanently Delete Account'}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
