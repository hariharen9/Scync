import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import forge from 'node-forge';
import {
  generateSSHKeyPair,
  parseSSHPrivateKey,
  computeOpenSSHFingerprint,
  detectSSHKeyType,
  looksLikeSSHPrivateKey,
} from '../ssh';

beforeAll(() => {
  if (!globalThis.crypto) {
    (globalThis as any).crypto = webcrypto;
  }
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = { crypto: webcrypto };
  }
});

describe('SSH key parsing & detection', () => {
  it('detects SSH / PEM private key headers', () => {
    expect(looksLikeSSHPrivateKey('-----BEGIN RSA PRIVATE KEY-----\nabc')).toBe(true);
    expect(looksLikeSSHPrivateKey('-----BEGIN OPENSSH PRIVATE KEY-----\nabc')).toBe(true);
    expect(looksLikeSSHPrivateKey('-----BEGIN PRIVATE KEY-----\nabc')).toBe(true);
    expect(looksLikeSSHPrivateKey('-----BEGIN ENCRYPTED PRIVATE KEY-----\nabc')).toBe(true);
    expect(looksLikeSSHPrivateKey('sk-proj-123456')).toBe(false);
  });

  it('auto-derives public key, type, and fingerprint from PKCS#1 RSA .pem', async () => {
    const pair = forge.pki.rsa.generateKeyPair({ bits: 1024 });
    const pem = forge.pki.privateKeyToPem(pair.privateKey);
    const expectedPub = forge.ssh.publicKeyToOpenSSH(pair.publicKey, 'azure-vm');
    const expectedFp = `MD5:${forge.ssh.getPublicKeyFingerprint(pair.publicKey, { encoding: 'hex', delimiter: ':' })}`;

    const parsed = await parseSSHPrivateKey(pem, undefined, 'azure-vm');
    expect(parsed.type).toBe('ssh-rsa');
    expect(parsed.publicKey).toBe(expectedPub);
    expect(parsed.fingerprint).toBe(expectedFp);
    expect(parsed.encrypted).toBe(false);
    expect(parsed.needsPassphrase).toBe(false);
  });

  it('auto-derives public key and fingerprint from generated Ed25519 PKCS#8 PEM', async () => {
    const generated = await generateSSHKeyPair('test-ed', 'ed25519');
    const parsed = await parseSSHPrivateKey(generated.privateKey, undefined, 'test-ed');

    expect(parsed.type).toBe('ssh-ed25519');
    expect(parsed.publicKey).toBe(generated.publicKey);
    expect(parsed.fingerprint).toBe(generated.fingerprint);
  });

  it('requests passphrase for encrypted PKCS#1 RSA PEM and decrypts when provided', async () => {
    const pair = forge.pki.rsa.generateKeyPair({ bits: 1024 });
    const encryptedPem = forge.pki.encryptRsaPrivateKey(pair.privateKey, 'secret-pass');

    const withoutPass = await parseSSHPrivateKey(encryptedPem);
    expect(withoutPass.encrypted).toBe(true);
    expect(withoutPass.needsPassphrase).toBe(true);
    expect(withoutPass.publicKey).toBe('');

    const wrongPass = await parseSSHPrivateKey(encryptedPem, 'wrong-pass');
    expect(wrongPass.needsPassphrase).toBe(true);
    expect(wrongPass.passphraseError).toBeTruthy();

    const withPass = await parseSSHPrivateKey(encryptedPem, 'secret-pass', 'azure-enc');
    expect(withPass.needsPassphrase).toBe(false);
    expect(withPass.type).toBe('ssh-rsa');
    expect(withPass.publicKey).toContain('ssh-rsa ');
    expect(withPass.fingerprint).toMatch(/^MD5:/);
  });

  it('computes fingerprint and detects key type from OpenSSH public key string', () => {
    const pair = forge.pki.rsa.generateKeyPair({ bits: 1024 });
    const pub = forge.ssh.publicKeyToOpenSSH(pair.publicKey, 'test');
    const expectedFp = `MD5:${forge.ssh.getPublicKeyFingerprint(pair.publicKey, { encoding: 'hex', delimiter: ':' })}`;

    expect(detectSSHKeyType(pub)).toBe('ssh-rsa');
    expect(computeOpenSSHFingerprint(pub)).toBe(expectedFp);
  });
});
