import { StoredSecret, RecoveryCodeSet } from './types';

export function getAttentionSecrets(secrets: StoredSecret[]): {
  expired: StoredSecret[];
  expiringSoon: StoredSecret[];
  rotationOverdue: StoredSecret[];
  recoveryCodesLow: StoredSecret[]; // Note: this requires synchronous evaluation or assuming structure
} {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const expired = secrets.filter(
    s => s.status === 'Active' && s.expiresOn && s.expiresOn < now
  );

  const expiringSoon = secrets.filter(
    s => s.status === 'Active' && s.expiresOn && s.expiresOn >= now && s.expiresOn <= thirtyDaysFromNow
  );

  const rotationOverdue = secrets.filter(
    s => s.status === 'Active' && s.lastRotated && s.lastRotated < sixMonthsAgo
  );

  // Without decryption, we can't accurately tell if recovery codes are low if they are encrypted.
  // The spec says "Note: this requires decrypt — only shown if vault is unlocked", meaning
  // this util has to be called at the UI level *after* decryption for RecoveryCodes,
  // OR we store remaining codes count unencrypted. For now we will return empty and let UI handle it,
  // or we pass decrypted recovery codes as a separate parameter if needed.
  return {
    expired,
    expiringSoon,
    rotationOverdue,
    recoveryCodesLow: []
  };
}
