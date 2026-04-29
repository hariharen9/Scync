import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShield, FiLock, FiDownload, FiCheck, FiAlertTriangle, FiEye, FiEyeOff, FiLoader, FiSettings, FiUpload } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { Dropdown } from './Dropdown';
import { generatePortableVault } from '../utils/portableVaultTemplate';

const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none', transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6 };
const btnPrimaryStyle: React.CSSProperties = { width: '100%', padding: '10px 16px', background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };
const btnOutlineStyle: React.CSSProperties = { padding: '8px 12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' };

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, closeSettingsModal, settings, updateSettings, openImportWizard } = useUIStore();
  const { changeVaultPassword, exportVault } = useVaultStore();
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { user, deleteUserAccount } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'security' | 'vault'>('security');
  
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
  const [deleteStep, setDeleteStep] = useState(0); // 0 = not deleting, 1 = warning/type, 2 = password
  const [obliterateText, setObliterateText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showDeletePass, setShowDeletePass] = useState(false);

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
    
    // Simulate a slight delay so UI can render loading state before intense crypto blocks thread
    await new Promise(r => setTimeout(r, 100));

    const success = await changeVaultPassword(user.uid, oldPassword, newPassword);
    
    setIsSubmitting(false);

    if (success) {
      const wasBiometricEnabled = !!vaultMeta?.biometric;
      setPasswordSuccess(
        `Master password changed successfully. All secrets have been re-encrypted.${wasBiometricEnabled ? ' Biometric unlock has been disabled for security.' : ''}`
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
        projects: projects,
        services: customServices,
        secrets: exportData.secrets
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

  const { unlock } = useVaultStore();

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

  // Biometric state
  const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState('');
  const [biometricError, setBiometricError] = useState('');
  const [showBiometricPass, setShowBiometricPass] = useState(false);

  const { vaultMeta, updateBiometrics } = useVaultStore();

  const handleToggleBiometric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!vaultMeta?.biometric) {
      // Enabling - needs password
      setIsSubmitting(true);
      setBiometricError('');
      const success = await updateBiometrics(user.uid, true, biometricPassword);
      setIsSubmitting(false);
      
      if (success) {
        setIsEnablingBiometric(false);
        setBiometricPassword('');
      } else {
        setBiometricError('Failed to enable biometrics. Check your password and Passkey support.');
      }
    } else {
      // Disabling
      setIsSubmitting(true);
      await updateBiometrics(user.uid, false);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while encrypting
    closeSettingsModal();
    setTimeout(() => {
      setActiveTab('security');
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

  const timerOptions = [
    { value: '5', label: '5 minutes' },
    { value: '15', label: '15 minutes (Default)' },
    { value: '30', label: '30 minutes' },
    { value: 'never', label: 'Never (Not Recommended)' }
  ];

  return (
    <AnimatePresence>
      {isSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', maxWidth: 460, background: 'var(--color-surface)', border: '1px solid var(--color-border-2)', boxShadow: '0 24px 64px rgba(0,0,0,.7)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center' }}>
                  <FiSettings size={14} color="var(--color-text)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0, fontFamily: 'var(--font-sans)' }}>Vault Settings</h2>
                  <p style={{ fontSize: 11, color: 'var(--color-text-2)', margin: '2px 0 0 0', fontFamily: 'var(--font-sans)' }}>Manage security preferences</p>
                </div>
              </div>
              <button disabled={isSubmitting} onClick={handleClose} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}><FiX size={14} /></button>
            </div>

            <div style={{ padding: 18, minHeight: 360, maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
                <button
                  disabled={isSubmitting}
                  onClick={() => setActiveTab('security')}
                  style={{
                    background: 'none', border: 'none', color: activeTab === 'security' ? 'var(--color-text)' : 'var(--color-text-muted)',
                    fontWeight: activeTab === 'security' ? 600 : 400, padding: '0 4px 8px 4px', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    borderBottom: activeTab === 'security' ? '2px solid var(--color-text)' : '2px solid transparent',
                    marginBottom: -1, fontSize: 13, fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
                  }}
                >
                  General & Security
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => setActiveTab('vault')}
                  style={{
                    background: 'none', border: 'none', color: activeTab === 'vault' ? 'var(--color-text)' : 'var(--color-text-muted)',
                    fontWeight: activeTab === 'vault' ? 600 : 400, padding: '0 4px 8px 4px', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    borderBottom: activeTab === 'vault' ? '2px solid var(--color-text)' : '2px solid transparent',
                    marginBottom: -1, fontSize: 13, fontFamily: 'var(--font-sans)', transition: 'all 0.2s'
                  }}
                >
                  Vault Management
                </button>
              </div>

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>Appearance</h3>
                    <Dropdown
                      options={[
                        { value: 'dark', label: 'Dark Mode' },
                        { value: 'light', label: 'Light Mode' },
                        { value: 'system', label: 'System Default' }
                      ]}
                      value={settings.theme}
                      onChange={(val) => updateSettings({ theme: val as any })}
                    />
                  </div>
                  
                  <div style={{ height: 1, background: 'var(--color-border)', margin: '24px 0' }} />

                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                      <FiLock size={13} /> Inactivity Auto-Lock
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                      Automatically lock your vault and clear the encryption key from memory when you are away.
                    </p>
                    <Dropdown
                      options={timerOptions}
                      value={settings.inactivityLockMinutes === null ? 'never' : settings.inactivityLockMinutes.toString()}
                      onChange={(val) => updateSettings({ inactivityLockMinutes: val === 'never' ? null : parseInt(val) })}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                      <div>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                          <FiShield size={13} /> Lock on Window Blur
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                          Lock instantly if you switch tabs.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSettings({ windowBlurLock: !settings.windowBlurLock })}
                        style={{
                          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: settings.windowBlurLock ? 'var(--color-green)' : 'var(--color-border-2)',
                          position: 'relative', transition: 'background 0.2s'
                        }}
                      >
                        <motion.div
                          animate={{ x: settings.windowBlurLock ? 22 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ padding: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEnablingBiometric ? 16 : 0 }}>
                        <div>
                          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                            <FiShield size={13} /> Biometric Unlock
                          </h3>
                          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                            Use FaceID, TouchID, or Windows Hello.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            if (vaultMeta?.biometric) {
                              handleToggleBiometric({ preventDefault: () => {} } as any);
                            } else {
                              setIsEnablingBiometric(!isEnablingBiometric);
                            }
                          }}
                          style={{
                            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                            background: (vaultMeta?.biometric || isEnablingBiometric) ? 'var(--color-green)' : 'var(--color-border-2)',
                            position: 'relative', transition: 'background 0.2s', opacity: isSubmitting ? 0.5 : 1
                          }}
                        >
                          <motion.div
                            animate={{ x: (vaultMeta?.biometric || isEnablingBiometric) ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                              width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          />
                        </button>
                      </div>

                      {isEnablingBiometric && !vaultMeta?.biometric && (
                        <motion.form 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          onSubmit={handleToggleBiometric} 
                          style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                          <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0 8px 0' }} />
                          <p style={{ fontSize: 11, color: 'var(--color-text-2)', lineHeight: 1.4, margin: 0 }}>
                            Enter your master password to securely wrap it with your device's biometric key.
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
                            <button type="button" onClick={() => setShowBiometricPass(!showBiometricPass)} style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                              {showBiometricPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </button>
                          </div>
                          {biometricError && <p style={{ color: 'var(--color-red)', fontSize: 11, margin: 0 }}>{biometricError}</p>}
                          <button type="submit" disabled={isSubmitting || !biometricPassword} style={{ ...btnPrimaryStyle, padding: '8px 12px', fontSize: 12, marginTop: 4 }}>
                            {isSubmitting ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex', alignItems: 'center' }}>
                                <FiLoader />
                              </motion.div>
                            ) : 'Register Biometrics'}
                          </button>
                        </motion.form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Vault Tab */}
              {activeTab === 'vault' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  {(!isChangingPassword && !isExporting && deleteStep === 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-2)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                          <FiUpload /> Import Secrets
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                          Migrate your secrets from Bitwarden or 1Password. All parsing happens in your browser — files never leave your device.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            style={{ ...btnOutlineStyle, flex: 1 }} 
                            onClick={() => {
                              closeSettingsModal();
                              setTimeout(() => openImportWizard('bitwarden'), 200);
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            Import from Bitwarden
                          </button>
                          <button 
                            style={{ ...btnOutlineStyle, flex: 1 }} 
                            onClick={() => {
                              closeSettingsModal();
                              setTimeout(() => openImportWizard('onepassword'), 200);
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            Import from 1Password
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-2)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-text)' }}>Change Master Password</h3>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                          This will re-derive a new encryption key and atomically re-encrypt all your stored secrets using a batch write. This operation cannot be interrupted.
                        </p>
                        <button 
                          style={btnOutlineStyle} 
                          onClick={() => setIsChangingPassword(true)}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Change Password
                        </button>
                      </div>

                      <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface-2)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                          <FiDownload /> Export Portable Vault
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                          Download a standalone, self-decrypting HTML file for offline access. You will need your master password to unlock it.
                        </p>
                        <button 
                          style={btnOutlineStyle} 
                          onClick={() => setIsExporting(true)}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          Generate HTML Vault
                        </button>
                      </div>

                      <div style={{ padding: 16, border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 4, background: 'rgba(239, 68, 68, 0.05)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--color-red)' }}>Danger Zone</h3>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                          Permanently delete your Scync account, vault, projects, custom services, and all encrypted secrets. This action is immediate and absolutely irrecoverable.
                        </p>
                        <button 
                          style={{ ...btnOutlineStyle, borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--color-red)' }} 
                          onClick={() => setDeleteStep(1)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-red)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-red)'; }}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  ) : isChangingPassword ? (
                    <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Change Master Password</h3>
                        {!isSubmitting && (
                          <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordError(''); setPasswordSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Cancel
                          </button>
                        )}
                      </div>

                      {passwordError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiAlertTriangle size={14} /> {passwordError}
                        </div>
                      )}
                      
                      {passwordSuccess && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '10px 12px', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiCheck size={14} /> {passwordSuccess}
                        </div>
                      )}

                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Current Password</label>
                        <input
                          type={showOld ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={e => setOldPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} 
                          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        />
                        <button type="button" onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: 10, top: 28, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                          {showOld ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                        </button>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>New Password</label>
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          disabled={isSubmitting}
                          style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} 
                          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 10, top: 28, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                          {showNew ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                        </button>
                      </div>

                      <div>
                        <label style={labelStyle}>Confirm New Password</label>
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          disabled={isSubmitting}
                          style={inputStyle}
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} 
                          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        />
                      </div>

                      <button type="submit" disabled={isSubmitting} style={{ ...btnPrimaryStyle, opacity: isSubmitting ? 0.7 : 1, marginTop: 8 }}>
                        {isSubmitting ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                              <FiLoader />
                            </motion.div>
                            Re-encrypting Vault...
                          </>
                        ) : 'Confirm Password Change'}
                      </button>
                    </form>
                  ) : isExporting ? (
                    <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Export Portable Vault</h3>
                        {!isSubmitting && (
                          <button type="button" onClick={() => { setIsExporting(false); setExportError(''); setExportSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Cancel
                          </button>
                        )}
                      </div>

                      {exportError && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiAlertTriangle size={14} /> {exportError}
                        </div>
                      )}
                      
                      {exportSuccess && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '10px 12px', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiCheck size={14} /> {exportSuccess}
                        </div>
                      )}

                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Authorize with Master Password</label>
                        <input
                          type={showExportPass ? 'text' : 'password'}
                          value={exportPassword}
                          onChange={e => setExportPassword(e.target.value)}
                          required
                          disabled={isSubmitting}
                          style={inputStyle}
                          autoFocus
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} 
                          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        />
                        <button type="button" onClick={() => setShowExportPass(!showExportPass)} style={{ position: 'absolute', right: 10, top: 28, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                          {showExportPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                        </button>
                      </div>

                      <button type="submit" disabled={isSubmitting} style={{ ...btnPrimaryStyle, opacity: isSubmitting ? 0.7 : 1, marginTop: 8 }}>
                        {isSubmitting ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                              <FiLoader />
                            </motion.div>
                            Generating Vault...
                          </>
                        ) : (
                          <>
                            <FiDownload /> Authorize & Download HTML
                          </>
                        )}
                      </button>
                    </form>
                  ) : deleteStep > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 700, color: 'var(--color-red)' }}>Obliterate Account</h3>
                        {!isSubmitting && (
                          <button type="button" onClick={() => { setDeleteStep(0); setObliterateText(''); setDeleteError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Cancel
                          </button>
                        )}
                      </div>

                      {deleteStep === 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 4 }}>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text)', margin: '0 0 12px 0', fontWeight: 600 }}>This is a destructive action.</p>
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
                              If you proceed, your Firebase Authentication profile and the entire Firestore document tree (including all secrets, projects, and services) will be immediately and permanently destroyed. <strong style={{ color: 'var(--color-red)' }}>There are no backups.</strong>
                            </p>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => setDeleteStep(2)} 
                            style={{ ...btnPrimaryStyle, background: 'var(--color-red)', color: '#fff' }}
                          >
                            Yes, I understand
                          </button>
                        </motion.div>
                      )}

                      {deleteStep === 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ position: 'relative' }}>
                            <label style={{ ...labelStyle, color: 'var(--color-red)' }}>Type "OBLITERATE" to continue</label>
                            <input 
                              value={obliterateText}
                              onChange={e => setObliterateText(e.target.value)}
                              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', background: 'rgba(239, 68, 68, 0.05)', borderColor: obliterateText === 'OBLITERATE' ? 'var(--color-red)' : 'var(--color-border)' }}
                              placeholder="OBLITERATE"
                              autoFocus
                            />
                          </div>

                          <button 
                            type="button"
                            disabled={obliterateText !== 'OBLITERATE'}
                            onClick={() => setDeleteStep(3)} 
                            style={{ ...btnPrimaryStyle, background: 'var(--color-red)', color: '#fff', opacity: obliterateText === 'OBLITERATE' ? 1 : 0.5 }}
                          >
                            Proceed
                          </button>
                        </motion.div>
                      )}

                      {deleteStep === 3 && (
                        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {deleteError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 12px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FiAlertTriangle size={14} /> {deleteError}
                            </div>
                          )}

                          <div style={{ position: 'relative' }}>
                            <label style={labelStyle}>Authorize with Master Password</label>
                            <input
                              type={showDeletePass ? 'text' : 'password'}
                              value={deletePassword}
                              onChange={e => setDeletePassword(e.target.value)}
                              required
                              disabled={isSubmitting}
                              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                              autoFocus
                              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-red)'} 
                              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            />
                            <button type="button" onClick={() => setShowDeletePass(!showDeletePass)} style={{ position: 'absolute', right: 10, top: 28, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                              {showDeletePass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            </button>
                          </div>

                          <button type="submit" disabled={isSubmitting} style={{ ...btnPrimaryStyle, background: 'var(--color-red)', color: '#fff', opacity: isSubmitting ? 0.7 : 1 }}>
                            {isSubmitting ? (
                              <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                  <FiLoader />
                                </motion.div>
                                Obliterating Data...
                              </>
                            ) : 'Permanently Delete Account'}
                          </button>
                        </motion.form>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
