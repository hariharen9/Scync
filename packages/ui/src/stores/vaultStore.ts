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
  updateVaultBiometrics
} from '@scync/core';

interface VaultState {
  derivedKey: CryptoKey | null;
  isLocked: boolean;
  storedSecrets: StoredSecret[];
  vaultMeta: VaultMeta | null;
  
  setDerivedKey: (key: CryptoKey | null) => void;
  setSecrets: (secrets: StoredSecret[]) => void;
  setVaultMeta: (meta: VaultMeta | null) => void;
  
  unlock: (password: string, uid: string) => Promise<boolean>;
  lock: () => void;
  initializeVault: (password: string, uid: string) => Promise<void>;
  changeVaultPassword: (uid: string, oldPassword: string, newPassword: string) => Promise<boolean>;
  
  createSecret: (uid: string, formData: SecretFormData) => Promise<void>;
  updateSecret: (uid: string, id: string, formData: SecretFormData) => Promise<void>;
  deleteSecret: (uid: string, id: string) => Promise<void>;
  decryptValue: (secretId: string) => Promise<DecryptedSecret | null>;
  
  subscribeToSecrets: (uid: string) => () => void;
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
  vaultMeta: null,
  
  setDerivedKey: (key) => set({ derivedKey: key, isLocked: !key }),
  setSecrets: (secrets) => set({ storedSecrets: secrets }),
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
      const { storedSecrets, vaultMeta } = get();
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
      await coreChangeVaultPassword(uid, oldKey, newKey, newSalt, newVerifier, storedSecrets);

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
  
  subscribeToSecrets: (uid: string) => {
    return subscribeToSecrets(uid, (secrets) => {
      set({ storedSecrets: secrets });
    });
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
        secrets: storedSecrets
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

