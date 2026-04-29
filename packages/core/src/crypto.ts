import type { EncryptedField } from './types';

// Base64 Utilities
export function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function utf8Decode(b: ArrayBuffer): string {
  return new TextDecoder().decode(b);
}

export function base64Encode(b: Uint8Array | ArrayBuffer): string {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64Decode(s: string): Uint8Array {
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Function 1: generateSalt
export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return base64Encode(bytes);
}

// Function 2: deriveKey
export async function deriveKey(password: string, uid: string, saltBase64: string): Promise<CryptoKey> {
  const inputMaterial = password + uid;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    utf8Encode(inputMaterial) as any,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64Decode(saltBase64) as any,
      iterations: 310000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
}

// Function 3: encrypt
export async function encrypt(key: CryptoKey, plaintext: string): Promise<EncryptedField> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    utf8Encode(plaintext) as any
  );

  return {
    iv: base64Encode(iv),
    ciphertext: base64Encode(ciphertext)
  };
}

// Function 4: decrypt
export async function decrypt(key: CryptoKey, field: EncryptedField): Promise<string> {
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64Decode(field.iv) as any },
    key,
    base64Decode(field.ciphertext) as any
  );

  return utf8Decode(plaintextBuffer);
}

// Function 5: createVerifier
export async function createVerifier(key: CryptoKey): Promise<EncryptedField> {
  return encrypt(key, "Scync_VALID_v1");
}

// Function 6: checkVerifier
export async function checkVerifier(key: CryptoKey, verifier: EncryptedField): Promise<boolean> {
  try {
    const decrypted = await decrypt(key, verifier);
    return decrypted === "Scync_VALID_v1";
  } catch (error) {
    // AES-GCM authentication tag failed or other decrypt failure
    return false;
  }
}

// WebAuthn Biometric PRF specific utilities
export async function importPrfKey(keyMaterial: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
}

// Base64URL encoding for WebAuthn credential IDs
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  // Add padding back if necessary
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Zero-Knowledge Secret Sharing Functions

/**
 * Generate a fresh AES-256-GCM key for share encryption
 * This key is completely independent of the user's vault key
 */
export async function generateShareKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable - we need to export it for the URL fragment
    ["encrypt", "decrypt"]
  );
}

/**
 * Export a share key to base64url format for URL fragment
 */
export async function exportShareKey(key: CryptoKey): Promise<string> {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64Url(rawKey);
}

/**
 * Import a share key from base64url format (from URL fragment)
 */
export async function importShareKey(base64urlKey: string): Promise<CryptoKey> {
  const rawKey = base64UrlToBuffer(base64urlKey);
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false, // non-extractable after import
    ["decrypt"]
  );
}
