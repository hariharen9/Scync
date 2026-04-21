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
