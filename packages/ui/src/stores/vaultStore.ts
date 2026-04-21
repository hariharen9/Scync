import { create } from 'zustand';
import { 
  type StoredSecret, type SecretFormData, type DecryptedSecret,
  deriveKey, createSecret, updateSecret, deleteSecret,
  decryptSecret as coreDecryptSecret,
  subscribeToSecrets,
  getVaultMeta,
  checkVerifier,
  setupVault,
  generateSalt,
  createVerifier
} from '@scync/core';

interface VaultState {
  derivedKey: CryptoKey | null;
  isLocked: boolean;
  storedSecrets: StoredSecret[];
  
  setDerivedKey: (key: CryptoKey | null) => void;
  setSecrets: (secrets: StoredSecret[]) => void;
  
  unlock: (password: string, uid: string) => Promise<boolean>;
  lock: () => void;
  initializeVault: (password: string, uid: string) => Promise<void>;
  
  createSecret: (uid: string, formData: SecretFormData) => Promise<void>;
  updateSecret: (uid: string, id: string, formData: SecretFormData) => Promise<void>;
  deleteSecret: (uid: string, id: string) => Promise<void>;
  decryptValue: (secretId: string) => Promise<DecryptedSecret | null>;
  
  subscribeToSecrets: (uid: string) => () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  derivedKey: null,
  isLocked: true,
  storedSecrets: [],
  
  setDerivedKey: (key) => set({ derivedKey: key, isLocked: !key }),
  setSecrets: (secrets) => set({ storedSecrets: secrets }),
  
  unlock: async (password: string, uid: string) => {
    try {
      const meta = await getVaultMeta(uid);
      if (!meta) {
        throw new Error("Vault not setup");
      }
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
  }
}));
