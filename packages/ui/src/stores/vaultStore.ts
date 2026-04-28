import { create } from 'zustand';
import { 
  type StoredSecret, type SecretFormData, type DecryptedSecret, type VaultMeta,
  deriveKey, createSecret, updateSecret, deleteSecret,
  decryptSecret as coreDecryptSecret,
  subscribeToSecrets,
  getVaultMeta,
  checkVerifier,
  setupVault,
  generateSalt,
  createVerifier,
  changeVaultPassword as coreChangeVaultPassword,
  registerBiometrics,
  unlockWithBiometrics as coreUnlockWithBiometrics,
  updateVaultBiometrics,
  type StoredSSHKey,
  type DecryptedSSHKey,
  subscribeToSSHKeys,
  createSSHKey,
  deleteSSHKey,
  decrypt,
  type StoredTOTP,
  type DecryptedTOTP,
  subscribeToTOTPs,
  createTOTP,
  deleteTOTP
} from '@scync/core';

interface VaultState {
  derivedKey: CryptoKey | null;
  isLocked: boolean;
  storedSecrets: StoredSecret[];
  storedSSHKeys: StoredSSHKey[];
  storedTOTPs: StoredTOTP[];
  vaultMeta: VaultMeta | null;
  
  setDerivedKey: (key: CryptoKey | null) => void;
  setSecrets: (secrets: StoredSecret[]) => void;
  setSSHKeys: (keys: StoredSSHKey[]) => void;
  setTOTPs: (tokens: StoredTOTP[]) => void;
  setVaultMeta: (meta: VaultMeta | null) => void;
  
  unlock: (password: string, uid: string) => Promise<boolean>;
  lock: () => void;
  initializeVault: (password: string, uid: string) => Promise<void>;
  changeVaultPassword: (uid: string, oldPassword: string, newPassword: string) => Promise<boolean>;
  
  createSecret: (uid: string, formData: SecretFormData) => Promise<void>;
  updateSecret: (uid: string, id: string, formData: SecretFormData) => Promise<void>;
  deleteSecret: (uid: string, id: string) => Promise<void>;
  decryptValue: (secretId: string) => Promise<DecryptedSecret | null>;
  
  createSSHKey: (uid: string, data: Omit<StoredSSHKey, 'id' | 'createdAt' | 'updatedAt' | 'encPrivateKey'> & { privateKey: string }) => Promise<void>;
  deleteSSHKey: (uid: string, id: string) => Promise<void>;
  decryptSSHKey: (keyId: string) => Promise<DecryptedSSHKey | null>;
  
  createTOTP: (uid: string, data: Omit<StoredTOTP, 'id' | 'createdAt' | 'updatedAt' | 'encSecret'> & { secret: string }) => Promise<void>;
  deleteTOTP: (uid: string, id: string) => Promise<void>;
  decryptTOTP: (tokenId: string) => Promise<DecryptedTOTP | null>;
  
  subscribeToSecrets: (uid: string) => () => void;
  subscribeToSSHKeys: (uid: string) => () => void;
  subscribeToTOTPs: (uid: string) => () => void;
  exportVault: (uid: string, password: string) => Promise<{
    meta: { salt: string; verifier: any };
    secrets: StoredSecret[];
  } | null>;
  unlockWithBiometrics: (uid: string) => Promise<boolean>;
  updateBiometrics: (uid: string, enabled: boolean, password?: string) => Promise<boolean>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  derivedKey: null,
  isLocked: true,
  storedSecrets: [],
  storedSSHKeys: [],
  storedTOTPs: [],
  vaultMeta: null,
  
  setDerivedKey: (key) => set({ derivedKey: key, isLocked: !key }),
  setSecrets: (secrets) => set({ storedSecrets: secrets }),
  setSSHKeys: (keys) => set({ storedSSHKeys: keys }),
  setTOTPs: (tokens) => set({ storedTOTPs: tokens }),
  setVaultMeta: (meta) => set({ vaultMeta: meta }),
  
  unlock: async (password: string, uid: string) => {
    try {
      const meta = await getVaultMeta(uid);
      if (!meta) {
        throw new Error("Vault not setup");
      }
      set({ vaultMeta: meta });
      const key = await deriveKey(password, uid, meta.salt);
      const isValid = await checkVerifier(key, meta.verifier);
      
      if (isValid) {
        set({ derivedKey: key, isLocked: false });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  
  lock: () => {
    set({ derivedKey: null, isLocked: true });
  },
  
  initializeVault: async (password: string, uid: string) => {
    const salt = generateSalt();
    const key = await deriveKey(password, uid, salt);
    const verifier = await createVerifier(key);
    await setupVault(uid, salt, verifier);
    set({ derivedKey: key, isLocked: false });
  },

  changeVaultPassword: async (uid: string, oldPassword: string, newPassword: string) => {
    try {
      const { storedSecrets, storedSSHKeys, vaultMeta } = get();
      const meta = vaultMeta || await getVaultMeta(uid);
      if (!meta) return false;

      // Verify old password
      const oldKey = await deriveKey(oldPassword, uid, meta.salt);
      const isValid = await checkVerifier(oldKey, meta.verifier);
      if (!isValid) return false; // Incorrect old password

      // Derive new key with new salt
      const newSalt = generateSalt();
      const newKey = await deriveKey(newPassword, uid, newSalt);
      const newVerifier = await createVerifier(newKey);

      // Batch re-encrypt
      await coreChangeVaultPassword(uid, oldKey, newKey, newSalt, newVerifier, storedSecrets, storedSSHKeys, get().storedTOTPs);

      // If biometrics was enabled, we MUST clear it because the wrapped password is now wrong
      if (meta.biometric) {
        await updateVaultBiometrics(uid, null);
      }

      // Update state
      const updatedMeta = await getVaultMeta(uid);
      set({ derivedKey: newKey, vaultMeta: updatedMeta });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  
  createSecret: async (uid: string, formData: SecretFormData) => {
    const { derivedKey } = get();
    if (!derivedKey) throw new Error("Vault is locked");
    await createSecret(uid, derivedKey, formData);
  },
  
  updateSecret: async (uid: string, id: string, formData: SecretFormData) => {
    const { derivedKey } = get();
    if (!derivedKey) throw new Error("Vault is locked");
    await updateSecret(uid, derivedKey, id, formData);
  },
  
  deleteSecret: async (uid: string, id: string) => {
    await deleteSecret(uid, id);
  },
  
  decryptValue: async (secretId: string) => {
    const { derivedKey, storedSecrets } = get();
    if (!derivedKey) return null;
    const secret = storedSecrets.find(s => s.id === secretId);
    if (!secret) return null;
    try {
      return await coreDecryptSecret(derivedKey, secret);
    } catch {
      return null;
    }
  },
  
  createSSHKey: async (uid: string, data) => {
    const { derivedKey } = get();
    if (!derivedKey) throw new Error("Vault is locked");
    await createSSHKey(uid, derivedKey, data);
  },

  deleteSSHKey: async (uid: string, id: string) => {
    await deleteSSHKey(uid, id);
  },

  decryptSSHKey: async (keyId: string) => {
    const { derivedKey, storedSSHKeys } = get();
    if (!derivedKey) return null;
    const sshKey = storedSSHKeys.find(s => s.id === keyId);
    if (!sshKey) return null;
    try {
      const privateKey = await decrypt(derivedKey, sshKey.encPrivateKey);
      return {
        ...sshKey,
        privateKey
      };
    } catch {
      return null;
    }
  },

  subscribeToSecrets: (uid: string) => {
    return subscribeToSecrets(uid, (secrets) => {
      set({ storedSecrets: secrets });
    });
  },

  subscribeToSSHKeys: (uid: string) => {
    return subscribeToSSHKeys(uid, (keys) => {
      set({ storedSSHKeys: keys });
    });
  },

  subscribeToTOTPs: (uid: string) => {
    return subscribeToTOTPs(uid, (tokens) => {
      set({ storedTOTPs: tokens });
    });
  },

  createTOTP: async (uid: string, data) => {
    const { derivedKey } = get();
    if (!derivedKey) throw new Error("Vault is locked");
    await createTOTP(uid, derivedKey, data);
  },

  deleteTOTP: async (uid: string, id: string) => {
    await deleteTOTP(uid, id);
  },

  decryptTOTP: async (tokenId: string) => {
    const { derivedKey, storedTOTPs } = get();
    if (!derivedKey) return null;
    const token = storedTOTPs.find(t => t.id === tokenId);
    if (!token) return null;
    try {
      const secret = await decrypt(derivedKey, token.encSecret);
      return { ...token, secret };
    } catch {
      return null;
    }
  },

  exportVault: async (uid: string, password: string) => {
    try {
      const { storedSecrets } = get();
      const meta = await getVaultMeta(uid);
      if (!meta) return null;

      // Verify password
      const key = await deriveKey(password, uid, meta.salt);
      const isValid = await checkVerifier(key, meta.verifier);
      
      if (!isValid) return null;

      return {
        meta: {
          salt: meta.salt,
          verifier: meta.verifier
        },
        secrets: storedSecrets,
        sshKeys: get().storedSSHKeys,
        totpTokens: get().storedTOTPs
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  unlockWithBiometrics: async (uid: string) => {
    try {
      let meta = get().vaultMeta;
      if (!meta) {
        meta = await getVaultMeta(uid);
        if (!meta) throw new Error("Vault not setup");
        set({ vaultMeta: meta });
      }

      if (!meta.biometric) return false;

      const password = await coreUnlockWithBiometrics(
        meta.biometric.credentialId,
        meta.biometric.salt,
        meta.biometric.encMasterPassword
      );

      return get().unlock(password, uid);
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  updateBiometrics: async (uid: string, enabled: boolean, password?: string) => {
    try {
      if (enabled) {
        if (!password) return false;
        const result = await registerBiometrics(
          uid,
          'User',
          password
        );
        await updateVaultBiometrics(uid, result);
        const meta = await getVaultMeta(uid);
        set({ vaultMeta: meta });
        return true;
      } else {
        await updateVaultBiometrics(uid, null);
        const meta = await getVaultMeta(uid);
        set({ vaultMeta: meta });
        return true;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}));

