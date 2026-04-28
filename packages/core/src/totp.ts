import * as OTPAuth from 'otpauth';

export interface TOTPConfig {
  issuer: string;
  label: string;
  secret: string;        // Base32 encoded
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: 30 | 60;
}

/**
 * Generate a TOTP code from a config.
 */
export function generateTOTPCode(config: TOTPConfig): string {
  const totp = new OTPAuth.TOTP({
    issuer: config.issuer,
    label: config.label,
    algorithm: config.algorithm,
    digits: config.digits,
    period: config.period,
    secret: OTPAuth.Secret.fromBase32(config.secret)
  });
  return totp.generate();
}

/**
 * Parse an otpauth:// URI into a TOTPConfig.
 */
export function parseTOTPUri(uri: string): TOTPConfig | null {
  try {
    const otp = OTPAuth.URI.parse(uri);
    if (!(otp instanceof OTPAuth.TOTP)) return null;
    return {
      issuer: otp.issuer || '',
      label: otp.label || '',
      secret: otp.secret.base32,
      algorithm: (otp.algorithm || 'SHA1') as TOTPConfig['algorithm'],
      digits: (otp.digits || 6) as TOTPConfig['digits'],
      period: (otp.period || 30) as TOTPConfig['period']
    };
  } catch {
    return null;
  }
}

/**
 * Build an otpauth:// URI from a config (for QR export).
 */
export function buildTOTPUri(config: TOTPConfig): string {
  const totp = new OTPAuth.TOTP({
    issuer: config.issuer,
    label: config.label,
    algorithm: config.algorithm,
    digits: config.digits,
    period: config.period,
    secret: OTPAuth.Secret.fromBase32(config.secret)
  });
  return totp.toString();
}

/**
 * Get remaining seconds in the current TOTP window.
 */
export function getRemainingSeconds(period: number = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}

/**
 * Validate a Base32 string.
 */
export function validateBase32(input: string): boolean {
  if (!input || input.length === 0) return false;
  // Base32 characters (RFC 4648)
  const cleaned = input.replace(/[\s=-]/g, '').toUpperCase();
  return /^[A-Z2-7]+$/.test(cleaned) && cleaned.length >= 8;
}

/**
 * Generate a random TOTP secret (for testing or self-enrollment).
 */
export function generateTOTPSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}
