// Crypto module for Scync CLI
// IMPORTANT: This file must remain functionally identical to packages/core/src/crypto.ts
// Node 18+ implements the Web Crypto API at globalThis.crypto.subtle

import type { EncryptedField } from './types.js';

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: ArrayBuffer): string {
  return new TextDecoder().decode(b);
}

function base64Encode(b: Uint8Array): string {
  return Buffer.from(b).toString('base64');
}

function base64Decode(s: string): BufferSource {
  return Buffer.from(s, 'base64');
}

export function generateSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return base64Encode(salt);
}

export async function deriveKey(
  password: string,
  uid: string,
  saltBase64: string
): Promise<CryptoKey> {
  const inputMaterial = utf8Encode(password + uid);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    inputMaterial as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64Decode(saltBase64),
      iterations: 310_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // extractable = true for CLI (we need to serialize it)
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<EncryptedField> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    utf8Encode(plaintext) as BufferSource
  );
  return {
    iv: base64Encode(iv),
    ciphertext: base64Encode(new Uint8Array(ciphertext)),
  };
}

export async function decrypt(
  key: CryptoKey,
  field: EncryptedField
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64Decode(field.iv) },
    key,
    base64Decode(field.ciphertext)
  );
  return utf8Decode(plaintext);
}

export async function checkVerifier(
  key: CryptoKey,
  verifier: EncryptedField
): Promise<boolean> {
  try {
    const result = await decrypt(key, verifier);
    return result === 'Scync_VALID_v1';
  } catch {
    return false;
  }
}

// Export raw key bytes for session storage
export async function exportKeyBytes(key: CryptoKey): Promise<string> {
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return base64Encode(new Uint8Array(rawKey));
}

// Import key from raw bytes
export async function importKeyBytes(keyBase64: string): Promise<CryptoKey> {
  const rawKey = base64Decode(keyBase64);
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
