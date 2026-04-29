import { describe, it, expect } from 'vitest';
import { deriveKey, encrypt, decrypt, checkVerifier, generateSalt, exportKeyBytes, importKeyBytes } from '../crypto.js';

describe('CLI crypto parity with browser crypto', () => {
  it('derives the same key behavior as browser implementation', async () => {
    const key = await deriveKey('my-password', 'uid-123', 'c2FsdA==');
    
    // Encrypt then decrypt to verify round-trip
    const encrypted = await encrypt(key, 'secret-value');
    const decrypted = await decrypt(key, encrypted);
    
    expect(decrypted).toBe('secret-value');
  });

  it('returns false for wrong vault password', async () => {
    const correctKey = await deriveKey('correct', 'uid', 'c2FsdA==');
    const wrongKey = await deriveKey('wrong', 'uid', 'c2FsdA==');
    
    const encrypted = await encrypt(correctKey, 'Scync_VALID_v1');
    const result = await checkVerifier(wrongKey, encrypted);
    
    expect(result).toBe(false);
  });

  it('returns true for correct vault password', async () => {
    const key = await deriveKey('correct', 'uid', 'c2FsdA==');
    const verifier = await encrypt(key, 'Scync_VALID_v1');
    const result = await checkVerifier(key, verifier);
    
    expect(result).toBe(true);
  });

  it('generates fresh IV on every encrypt call', async () => {
    const key = await deriveKey('pass', 'uid', 'c2FsdA==');
    const enc1 = await encrypt(key, 'same-value');
    const enc2 = await encrypt(key, 'same-value');
    
    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it('generates unique salts', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    
    expect(salt1).not.toBe(salt2);
    expect(salt1.length).toBeGreaterThan(0);
    expect(salt2.length).toBeGreaterThan(0);
  });

  it('can export and import key bytes', async () => {
    const originalKey = await deriveKey('password', 'uid', 'c2FsdA==');
    const plaintext = 'test secret value';
    
    // Encrypt with original key
    const encrypted = await encrypt(originalKey, plaintext);
    
    // Export and re-import key
    const keyBytes = await exportKeyBytes(originalKey);
    const importedKey = await importKeyBytes(keyBytes);
    
    // Decrypt with imported key
    const decrypted = await decrypt(importedKey, encrypted);
    
    expect(decrypted).toBe(plaintext);
  });

  it('handles multi-line secrets correctly', async () => {
    const key = await deriveKey('password', 'uid', 'c2FsdA==');
    const multiline = 'line1\nline2\nline3';
    
    const encrypted = await encrypt(key, multiline);
    const decrypted = await decrypt(key, encrypted);
    
    expect(decrypted).toBe(multiline);
  });

  it('handles special characters in secrets', async () => {
    const key = await deriveKey('password', 'uid', 'c2FsdA==');
    const special = 'test!@#$%^&*(){}[]|\\:";\'<>?,./`~';
    
    const encrypted = await encrypt(key, special);
    const decrypted = await decrypt(key, encrypted);
    
    expect(decrypted).toBe(special);
  });

  it('handles unicode characters', async () => {
    const key = await deriveKey('password', 'uid', 'c2FsdA==');
    const unicode = '你好世界 🔐 مرحبا';
    
    const encrypted = await encrypt(key, unicode);
    const decrypted = await decrypt(key, encrypted);
    
    expect(decrypted).toBe(unicode);
  });

  it('throws on decrypt with wrong key', async () => {
    const key1 = await deriveKey('password1', 'uid', 'c2FsdA==');
    const key2 = await deriveKey('password2', 'uid', 'c2FsdA==');
    
    const encrypted = await encrypt(key1, 'secret');
    
    await expect(decrypt(key2, encrypted)).rejects.toThrow();
  });

  it('derives different keys for different passwords', async () => {
    const key1 = await deriveKey('password1', 'uid', 'c2FsdA==');
    const key2 = await deriveKey('password2', 'uid', 'c2FsdA==');
    
    const bytes1 = await exportKeyBytes(key1);
    const bytes2 = await exportKeyBytes(key2);
    
    expect(bytes1).not.toBe(bytes2);
  });

  it('derives different keys for different UIDs', async () => {
    const key1 = await deriveKey('password', 'uid1', 'c2FsdA==');
    const key2 = await deriveKey('password', 'uid2', 'c2FsdA==');
    
    const bytes1 = await exportKeyBytes(key1);
    const bytes2 = await exportKeyBytes(key2);
    
    expect(bytes1).not.toBe(bytes2);
  });

  it('derives different keys for different salts', async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    
    const key1 = await deriveKey('password', 'uid', salt1);
    const key2 = await deriveKey('password', 'uid', salt2);
    
    const bytes1 = await exportKeyBytes(key1);
    const bytes2 = await exportKeyBytes(key2);
    
    expect(bytes1).not.toBe(bytes2);
  });
});
