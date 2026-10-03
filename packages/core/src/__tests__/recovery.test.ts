import { describe, it, expect } from 'vitest';
import { 
  generateRecoveryKey, normalizeRecoveryKey,
  createRecoveryPayload, recoverMasterPassword 
} from '../recovery';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as unknown as Crypto;
}

describe('Recovery Module', () => {
  const uid = 'test_uid_456';
  const masterPassword = 'MasterPassword_2026!#Strong';

  it('generates well-formatted recovery keys', () => {
    const key = generateRecoveryKey();
    expect(key).toMatch(/^SCYNC-[2-9A-HJ-NP-Z]{4}(-[2-9A-HJ-NP-Z]{4}){5}$/);
  });

  it('normalizes formatted and unformatted recovery keys', () => {
    const raw = 'scync-7k9a-4r2m-8px1-w9b3-zq5v-2222';
    const normalized = normalizeRecoveryKey(raw);
    expect(normalized).toBe('SCYNC-7K9A-4R2M-8PX1-W9B3-ZQ5V-2222');

    const withoutPrefix = '7k9a4r2m8px1w9b3zq5v2222';
    expect(normalizeRecoveryKey(withoutPrefix)).toBe('SCYNC-7K9A-4R2M-8PX1-W9B3-ZQ5V-2222');
  });

  it('encrypts and unwraps the master password cleanly', async () => {
    const recoveryKey = generateRecoveryKey();
    const payload = await createRecoveryPayload(recoveryKey, uid, masterPassword);

    expect(payload.salt).toBeDefined();
    expect(payload.encMasterPassword.ciphertext).toBeDefined();

    const recovered = await recoverMasterPassword(
      recoveryKey,
      uid,
      payload.salt,
      payload.encMasterPassword
    );

    expect(recovered).toBe(masterPassword);
  });

  it('fails decryption if wrong recovery key is provided', async () => {
    const recoveryKey = generateRecoveryKey();
    const payload = await createRecoveryPayload(recoveryKey, uid, masterPassword);

    const wrongKey = generateRecoveryKey();
    await expect(
      recoverMasterPassword(wrongKey, uid, payload.salt, payload.encMasterPassword)
    ).rejects.toThrow();
  });
});
