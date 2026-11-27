import forge from 'node-forge';

export interface GeneratedSSHKeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  type: 'ssh-rsa' | 'ssh-ed25519';
}

export interface ParsedSSHPrivateKey {
  publicKey: string;
  fingerprint: string;
  type: string;
  encrypted: boolean;
  needsPassphrase: boolean;
  passphraseError?: string;
}

const SSH_PRIVATE_KEY_HEADER_RE = /-----BEGIN (?:RSA |DSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/;

/**
 * Returns true if the given text looks like a PEM or OpenSSH private key.
 */
export function looksLikeSSHPrivateKey(text: string): boolean {
  return SSH_PRIVATE_KEY_HEADER_RE.test(text);
}

/**
 * Computes the MD5 colon-separated fingerprint of an OpenSSH public key line.
 */
export function computeOpenSSHFingerprint(publicKey: string): string {
  const parts = publicKey.trim().split(/\s+/);
  const b64 = parts[1];
  if (!b64) return 'Unknown';
  try {
    const bin = forge.util.decode64(b64);
    const md5 = forge.md.md5.create();
    md5.update(bin);
    return `MD5:${md5.digest().toHex().match(/.{2}/g)?.join(':')}`;
  } catch {
    return 'Unknown';
  }
}

/**
 * Detects the SSH key type prefix from an OpenSSH public key string.
 */
export function detectSSHKeyType(publicKey: string): string {
  const firstToken = publicKey.trim().split(/\s+/)[0];
  if (firstToken && (firstToken.startsWith('ssh-') || firstToken.startsWith('ecdsa-'))) {
    return firstToken;
  }
  return 'ssh-rsa';
}

function readUint32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function readOpenSSHString(buf: Uint8Array, offset: number): { bytes: Uint8Array; nextOffset: number } | null {
  if (offset + 4 > buf.length) return null;
  const len = readUint32BE(buf, offset);
  const start = offset + 4;
  if (start + len > buf.length) return null;
  return { bytes: buf.subarray(start, start + len), nextOffset: start + len };
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parseOpenSSHPrivateKeyBlob(pem: string, comment?: string): ParsedSSHPrivateKey | null {
  const match = pem.match(/-----BEGIN OPENSSH PRIVATE KEY-----([\s\S]+?)-----END OPENSSH PRIVATE KEY-----/);
  if (!match) return null;

  const b64 = match[1].replace(/\s+/g, '');
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const magic = new TextDecoder().decode(raw.subarray(0, 15));
  if (magic !== 'openssh-key-v1\0') return null;

  let offset = 15;
  const cipher = readOpenSSHString(raw, offset);
  if (!cipher) return null;
  offset = cipher.nextOffset;

  const kdf = readOpenSSHString(raw, offset);
  if (!kdf) return null;
  offset = kdf.nextOffset;

  const kdfOpts = readOpenSSHString(raw, offset);
  if (!kdfOpts) return null;
  offset = kdfOpts.nextOffset;

  if (offset + 4 > raw.length) return null;
  const numKeys = readUint32BE(raw, offset);
  offset += 4;
  if (numKeys < 1) return null;

  const pubBlobRes = readOpenSSHString(raw, offset);
  if (!pubBlobRes) return null;

  const pubBlob = pubBlobRes.bytes;
  const keyTypeRes = readOpenSSHString(pubBlob, 0);
  const keyType = keyTypeRes ? new TextDecoder().decode(keyTypeRes.bytes) : 'ssh-ed25519';
  const pubB64 = toBase64(pubBlob);
  const publicKey = comment ? `${keyType} ${pubB64} ${comment}` : `${keyType} ${pubB64}`;

  const md5 = forge.md.md5.create();
  md5.update(forge.util.binary.raw.encode(pubBlob));
  const fingerprint = `MD5:${md5.digest().toHex().match(/.{2}/g)?.join(':')}`;

  const cipherName = new TextDecoder().decode(cipher.bytes);
  const encrypted = cipherName !== 'none';

  return {
    publicKey,
    fingerprint,
    type: keyType,
    encrypted,
    needsPassphrase: false, // Public key is readable in header even when private part is encrypted
  };
}

/**
 * Parses an imported SSH private key (PKCS#1 RSA, PKCS#8 RSA/Ed25519, or OpenSSH)
 * and derives its OpenSSH public key, key type, and MD5 fingerprint when possible.
 */
export async function parseSSHPrivateKey(
  pemInput: string,
  passphrase?: string,
  comment?: string
): Promise<ParsedSSHPrivateKey> {
  const pem = pemInput.trim();
  if (!pem) {
    return { publicKey: '', fingerprint: 'Unknown', type: 'ssh-rsa', encrypted: false, needsPassphrase: false };
  }

  // 1. OpenSSH private key format (contains unencrypted public key in header)
  if (pem.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
    try {
      const parsed = parseOpenSSHPrivateKeyBlob(pem, comment);
      if (parsed) return parsed;
    } catch {
      // Fall through to generic fallback
    }
    return { publicKey: '', fingerprint: 'Unknown', type: 'ssh-ed25519', encrypted: false, needsPassphrase: false };
  }

  // 2. Check for encrypted PKCS#1 or PKCS#8 PEM
  const isEncryptedPkcs1 = pem.includes('Proc-Type: 4,ENCRYPTED') || pem.includes('DEK-Info:');
  const isEncryptedPkcs8 = pem.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----');

  if (isEncryptedPkcs1 || isEncryptedPkcs8) {
    if (!passphrase) {
      return {
        publicKey: '',
        fingerprint: 'Unknown',
        type: 'ssh-rsa',
        encrypted: true,
        needsPassphrase: true,
      };
    }

    try {
      let rsaPriv: forge.pki.rsa.PrivateKey | null = null;
      if (isEncryptedPkcs1) {
        rsaPriv = forge.pki.decryptRsaPrivateKey(pem, passphrase);
      } else {
        const msg = forge.pem.decode(pem)[0];
        if (msg) {
          const encInfo = forge.asn1.fromDer(msg.body);
          const privInfo = forge.pki.decryptPrivateKeyInfo(encInfo, passphrase);
          if (privInfo) {
            rsaPriv = forge.pki.privateKeyFromAsn1(privInfo) as forge.pki.rsa.PrivateKey;
          }
        }
      }

      if (!rsaPriv || !rsaPriv.n || !rsaPriv.e) {
        return {
          publicKey: '',
          fingerprint: 'Unknown',
          type: 'ssh-rsa',
          encrypted: true,
          needsPassphrase: true,
          passphraseError: 'Incorrect passphrase or unsupported encrypted key format.',
        };
      }

      const rsaPub = forge.pki.setRsaPublicKey(rsaPriv.n, rsaPriv.e);
      const publicKey = forge.ssh.publicKeyToOpenSSH(rsaPub, comment);
      const fingerprint = `MD5:${forge.ssh.getPublicKeyFingerprint(rsaPub, { encoding: 'hex', delimiter: ':' })}`;
      return { publicKey, fingerprint, type: 'ssh-rsa', encrypted: true, needsPassphrase: false };
    } catch {
      return {
        publicKey: '',
        fingerprint: 'Unknown',
        type: 'ssh-rsa',
        encrypted: true,
        needsPassphrase: true,
        passphraseError: 'Incorrect passphrase or unsupported encrypted key format.',
      };
    }
  }

  // 3. Unencrypted RSA (PKCS#1 or PKCS#8) via node-forge
  try {
    const privKey = forge.pki.privateKeyFromPem(pem) as forge.pki.rsa.PrivateKey;
    if (privKey && privKey.n && privKey.e) {
      const rsaPub = forge.pki.setRsaPublicKey(privKey.n, privKey.e);
      const publicKey = forge.ssh.publicKeyToOpenSSH(rsaPub, comment);
      const fingerprint = `MD5:${forge.ssh.getPublicKeyFingerprint(rsaPub, { encoding: 'hex', delimiter: ':' })}`;
      return { publicKey, fingerprint, type: 'ssh-rsa', encrypted: false, needsPassphrase: false };
    }
  } catch {
    // Not a forge-parseable RSA key; try Ed25519 PKCS#8 below
  }

  // 4. Unencrypted Ed25519 PKCS#8 via WebCrypto
  if (pem.includes('-----BEGIN PRIVATE KEY-----') && typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s+/g, '');
      const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const key = await crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, true, ['sign']);
      const jwk = await crypto.subtle.exportKey('jwk', key);
      if (jwk.x) {
        const pubBytes = base64UrlToUint8Array(jwk.x);
        const pubBlob = packAll([pack('ssh-ed25519'), pack(pubBytes)]);
        const pubB64 = toBase64(pubBlob);
        const publicKey = comment ? `ssh-ed25519 ${pubB64} ${comment}` : `ssh-ed25519 ${pubB64}`;
        const md5 = forge.md.md5.create();
        md5.update(forge.util.binary.raw.encode(pubBlob));
        const fingerprint = `MD5:${md5.digest().toHex().match(/.{2}/g)?.join(':')}`;
        return { publicKey, fingerprint, type: 'ssh-ed25519', encrypted: false, needsPassphrase: false };
      }
    } catch {
      // Fall through
    }
  }

  // 5. Fallback for EC / unknown PEMs: still allow saving the private key
  const type = pem.includes('EC PRIVATE KEY') ? 'ecdsa' : 'ssh-rsa';
  return { publicKey: '', fingerprint: 'Unknown', type, encrypted: false, needsPassphrase: false };
}

/**
 * Packs a string or buffer into an OpenSSH binary string (length + content)
 */
function pack(data: string | Uint8Array): Uint8Array {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const len = bytes.length;
  const res = new Uint8Array(4 + len);
  res[0] = (len >>> 24) & 0xff;
  res[1] = (len >>> 16) & 0xff;
  res[2] = (len >>> 8) & 0xff;
  res[3] = len & 0xff;
  res.set(bytes, 4);
  return res;
}

/**
 * Packs multiple chunks into one Uint8Array
 */
function packAll(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const res = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    res.set(c, offset);
    offset += c.length;
  }
  return res;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Generates an SSH key pair (RSA-4096 or Ed25519) completely in the browser.
 */
export async function generateSSHKeyPair(
  comment: string = 'scync-generated',
  type: 'rsa' | 'ed25519' = 'rsa'
): Promise<GeneratedSSHKeyPair> {
  if (type === 'rsa') {
    return new Promise((resolve, reject) => {
      forge.pki.rsa.generateKeyPair({ bits: 4096, workers: -1 }, (err, keypair) => {
        if (err) return reject(err);
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        const publicKey = forge.ssh.publicKeyToOpenSSH(keypair.publicKey, comment);
        const fingerprint = forge.ssh.getPublicKeyFingerprint(keypair.publicKey, {
          encoding: 'hex',
          delimiter: ':'
        });

        resolve({
          publicKey,
          privateKey,
          fingerprint: `MD5:${fingerprint}`,
          type: 'ssh-rsa'
        });
      });
    });
  } else {
    // Generate Ed25519 using Web Crypto
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    const pubExport = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privExport = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    const pubBytes = new Uint8Array(pubExport);
    
    // Format Public Key: ssh-ed25519 <base64> <comment>
    const pubBlob = packAll([
      pack('ssh-ed25519'),
      pack(pubBytes)
    ]);
    const publicKey = `ssh-ed25519 ${toBase64(pubBlob)} ${comment}`;

    // Calculate MD5 Fingerprint for the public key blob
    const md5 = forge.md.md5.create();
    md5.update(forge.util.binary.raw.encode(pubBlob));
    const fingerprint = md5.digest().toHex().match(/.{2}/g)?.join(':');

    // For simplicity, we export the private key in PKCS8 PEM format
    const privBase64 = toBase64(new Uint8Array(privExport));
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${privBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    return {
      publicKey,
      privateKey,
      fingerprint: `MD5:${fingerprint}`,
      type: 'ssh-ed25519'
    };
  }
}
