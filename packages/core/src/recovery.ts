import QRCode from 'qrcode';
import { encrypt, decrypt, generateSalt, base64Decode, utf8Encode } from './crypto';
import type { EncryptedField, RecoveryKitMeta } from './types';

// Unambiguous Base32 character set (excludes 0, O, 1, I, L)
const RECOVERY_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a QR Code Data URL for an Emergency Recovery Key
 */
export async function generateRecoveryQRCode(recoveryKey: string): Promise<string> {
  return QRCode.toDataURL(recoveryKey, {
    width: 220,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });
}

/**
 * Generates a high-entropy Emergency Recovery Key formatted as:
 * SCYNC-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX (120 bits of entropy)
 */
export function generateRecoveryKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(RECOVERY_CHARSET[bytes[i] % RECOVERY_CHARSET.length]);
  }

  const blocks: string[] = [];
  for (let i = 0; i < chars.length; i += 4) {
    blocks.push(chars.slice(i, i + 4).join(''));
  }

  return `SCYNC-${blocks.join('-')}`;
}

/**
 * Normalizes user input for an emergency key
 */
export function normalizeRecoveryKey(input: string): string {
  let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.startsWith('SCYNC')) {
    cleaned = cleaned.slice(5);
  }
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    chunks.push(cleaned.slice(i, i + 4));
  }
  return chunks.length > 0 ? `SCYNC-${chunks.join('-')}` : '';
}

/**
 * Derives an AES-GCM-256 key from an Emergency Recovery Key
 */
export async function deriveRecoveryCryptoKey(
  recoveryKey: string,
  uid: string,
  saltBase64: string
): Promise<CryptoKey> {
  const normalizedKey = normalizeRecoveryKey(recoveryKey);
  const salt = base64Decode(saltBase64);
  const keyMaterial = utf8Encode(normalizedKey + uid);

  const imported = await crypto.subtle.importKey(
    'raw',
    keyMaterial as any,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    imported,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Creates the encrypted recovery payload for storage in Firestore
 */
export async function createRecoveryPayload(
  recoveryKey: string,
  uid: string,
  masterPasswordPlain: string
): Promise<Omit<RecoveryKitMeta, 'createdAt'>> {
  const salt = generateSalt();
  const cryptoKey = await deriveRecoveryCryptoKey(recoveryKey, uid, salt);
  const encMasterPassword = await encrypt(cryptoKey, masterPasswordPlain);

  return {
    salt,
    encMasterPassword,
  };
}

/**
 * Recovers the master password from an Emergency Recovery Key
 */
export async function recoverMasterPassword(
  recoveryKey: string,
  uid: string,
  saltBase64: string,
  encMasterPassword: EncryptedField
): Promise<string> {
  const cryptoKey = await deriveRecoveryCryptoKey(recoveryKey, uid, saltBase64);
  return decrypt(cryptoKey, encMasterPassword);
}

/**
 * Generates an offline, printable Emergency Recovery Kit HTML document
 */
export async function generateRecoveryKitHtml(options: {
  email?: string;
  userEmail?: string;
  uid?: string;
  userId?: string;
  recoveryKey: string;
  qrDataUrl?: string;
  createdAt?: Date;
}): Promise<string> {
  const email = options.email || options.userEmail || 'user';
  const uid = options.uid || options.userId || '';
  const qrDataUrl = options.qrDataUrl || await generateRecoveryQRCode(options.recoveryKey).catch(() => undefined);
  const dateStr = (options.createdAt || new Date()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scync Emergency Recovery Kit - ${email}</title>
  <style>
    @page { margin: 20mm; size: A4 portrait; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .sheet {
      background: #ffffff;
      width: 100%;
      max-width: 680px;
      border: 2px solid #0f172a;
      padding: 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.04em;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: #0f172a;
      color: #ffffff;
      padding: 4px 8px;
      margin-top: 6px;
    }
    .meta-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 16px;
      margin-bottom: 24px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-label {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.06em;
      color: #475569;
    }
    .meta-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
    }
    .key-section {
      border: 2px dashed #0f172a;
      padding: 24px;
      margin-bottom: 28px;
      background: #ffffff;
      text-align: center;
    }
    .key-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #047857;
      margin-bottom: 12px;
    }
    .key-display {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #0f172a;
      background: #f8fafc;
      padding: 14px;
      border: 1px solid #e2e8f0;
      word-break: break-all;
    }
    .qr-container {
      margin-top: 18px;
      display: flex;
      justify-content: center;
    }
    .qr-container img {
      width: 140px;
      height: 140px;
      border: 1px solid #e2e8f0;
    }
    .notice {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 14px;
      margin-bottom: 24px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #92400e;
    }
    .steps {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .steps ol {
      padding-left: 20px;
      margin: 8px 0 0 0;
    }
    .footer {
      margin-top: 32px;
      border-top: 1px solid #cbd5e1;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { border: 2px solid #000000; box-shadow: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="brand">SCYNC</h1>
        <div class="badge">Emergency Recovery Kit</div>
      </div>
      <div style="text-align: right;">
        <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: #ffffff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 2px;">Print Kit</button>
      </div>
    </div>

    <div class="notice">
      <strong>CRITICAL SECURITY DOCUMENT</strong><br>
      Store this kit offline in a secure location (such as a safe deposit box or an offline flash drive). 
      Scync operates under strict zero-knowledge encryption. <strong>If you lose your Master Password and this Emergency Key, your vault cannot be recovered by anyone.</strong>
    </div>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Account Login</span>
        <span class="meta-value">${email}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Account UID</span>
        <span class="meta-value">${uid}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Kit Created</span>
        <span class="meta-value">${dateStr}</span>
      </div>
    </div>

    <div class="key-section">
      <div class="key-title">Your Emergency Recovery Key</div>
      <div class="key-display">${options.recoveryKey}</div>
      ${qrDataUrl ? `
      <div class="qr-container">
        <img src="${qrDataUrl}" alt="Emergency Recovery Key QR Code" />
      </div>` : ''}
    </div>

    <div class="steps">
      <strong>How to recover your vault:</strong>
      <ol>
        <li>Sign in to your Scync account on any device.</li>
        <li>On the Vault Unlock screen, click <em>"Forgot master password? Recover with Emergency Kit"</em>.</li>
        <li>Enter or scan the Emergency Recovery Key printed on this sheet.</li>
        <li>Your vault will decrypt and prompt you to establish a fresh Master Password immediately.</li>
      </ol>
    </div>

    <div class="footer">
      <span>Scync Zero-Knowledge Architecture</span>
      <span>scync.space</span>
    </div>
  </div>
</body>
</html>`;
}
