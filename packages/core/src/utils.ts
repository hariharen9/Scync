import type { StoredSecret } from './types';

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

  const recoveryCodesLow = secrets.filter(
    s => s.type === 'Recovery Codes' && s.remainingCodes !== null && s.remainingCodes !== undefined && s.remainingCodes <= 2
  );

  return {
    expired,
    expiringSoon,
    rotationOverdue,
    recoveryCodesLow
  };
}
