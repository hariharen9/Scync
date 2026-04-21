import { describe, it, expect, beforeAll } from 'vitest';
import { 
  generateSalt, deriveKey, encrypt, decrypt, 
  createVerifier, checkVerifier 
} from '../crypto';

// Polyfill Web Crypto API for Node environment in tests
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

describe('Crypto Module', () => {
  const password = "correct_horse_battery_staple";
  const wrongPassword = "wrong_password";
  const uid = "test_user_123";
  let salt: string;
  let key: CryptoKey;

  beforeAll(async () => {
    salt = generateSalt();
    key = await deriveKey(password, uid, salt);
  });

  it('generates salt correctly', () => {
    expect(salt).toBeDefined();
    expect(typeof salt).toBe('string');
    // base64 padding check
    expect(salt.endsWith('=') || salt.endsWith('==') || !salt.includes('=')).toBe(true);
  });

  it('encrypts and decrypts correctly', async () => {
    const plaintext = "This is a super secret payload 123 !@#";
    const encrypted = await encrypt(key, plaintext);
    
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toContain(plaintext);
    
    const decrypted = await decrypt(key, encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for same plaintext (different IVs)', async () => {
    const plaintext = "Same string";
    const enc1 = await encrypt(key, plaintext);
    const enc2 = await encrypt(key, plaintext);
    
    expect(enc1.iv).not.toEqual(enc2.iv);
    expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
  });

  it('checkVerifier returns true for correct key', async () => {
    const verifier = await createVerifier(key);
    const isValid = await checkVerifier(key, verifier);
    expect(isValid).toBe(true);
  });

  it('checkVerifier returns false for wrong key', async () => {
    const verifier = await createVerifier(key);
    const wrongKey = await deriveKey(wrongPassword, uid, salt);
    
    const isValid = await checkVerifier(wrongKey, verifier);
    expect(isValid).toBe(false);
  });

  it('fails to decrypt if key is derived from different uid', async () => {
    const otherUidKey = await deriveKey(password, "another_uid", salt);
    const plaintext = "Data";
    const encrypted = await encrypt(key, plaintext);
    
    await expect(decrypt(otherUidKey, encrypted)).rejects.toThrow();
  });
});
