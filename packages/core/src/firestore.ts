import { 
  collection, doc, setDoc, updateDoc, deleteDoc, 
  onSnapshot, serverTimestamp, getDoc, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { encrypt, decrypt } from './crypto';
import type { 
  VaultMeta, SecretFormData, StoredSecret, DecryptedSecret, 
  Project, EncryptedField, CustomService, StoredSSHKey, StoredTOTP
} from './types';

// Vault Meta
export async function setupVault(uid: string, salt: string, verifier: EncryptedField): Promise<void> {
  const ref = doc(db, "users", uid, "meta", "vault");
  await setDoc(ref, {
    salt,
    verifier,
    createdAt: serverTimestamp()
  });
}

export async function getVaultMeta(uid: string): Promise<VaultMeta | null> {
  const ref = doc(db, "users", uid, "meta", "vault");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    salt: data.salt,
    verifier: data.verifier,
    createdAt: data.createdAt?.toDate() || new Date(),
    biometric: data.biometric || undefined
  };
}

export async function updateVaultBiometrics(uid: string, biometric: VaultMeta['biometric'] | null): Promise<void> {
  const ref = doc(db, "users", uid, "meta", "vault");
  if (biometric === null) {
    // We cannot easily delete a nested field without importing `deleteField`, so we set it to null
    await updateDoc(ref, { biometric: null, updatedAt: serverTimestamp() });
  } else {
    await updateDoc(ref, { biometric, updatedAt: serverTimestamp() });
  }
}

export async function changeVaultPassword(
  uid: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
  newSalt: string,
  newVerifier: EncryptedField,
  secrets: StoredSecret[],
  sshKeys: StoredSSHKey[] = [],
  totpTokens: StoredTOTP[] = []
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Update Vault Meta
  const metaRef = doc(db, "users", uid, "meta", "vault");
  batch.update(metaRef, {
    salt: newSalt,
    verifier: newVerifier,
    updatedAt: serverTimestamp()
  });

  // 2. Re-encrypt all secrets
  for (const secret of secrets) {
    const secretRef = doc(db, "users", uid, "secrets", secret.id);
    
    // Decrypt old values
    const valuePlaintext = await decrypt(oldKey, secret.encValue);
    const notesPlaintext = secret.encNotes ? await decrypt(oldKey, secret.encNotes) : null;
    
    // Re-encrypt with new key
    const newEncValue = await encrypt(newKey, valuePlaintext);
    const newEncNotes = notesPlaintext ? await encrypt(newKey, notesPlaintext) : null;
    
    batch.update(secretRef, {
      encValue: newEncValue,
      encNotes: newEncNotes,
      updatedAt: serverTimestamp()
    });
  }

  // 3. Re-encrypt all SSH keys
  for (const key of sshKeys) {
    const keyRef = doc(db, "users", uid, "ssh_keys", key.id);
    const pkPlaintext = await decrypt(oldKey, key.encPrivateKey);
    const newEncPrivateKey = await encrypt(newKey, pkPlaintext);
    batch.update(keyRef, {
      encPrivateKey: newEncPrivateKey,
      updatedAt: serverTimestamp()
    });
  }

  // 4. Re-encrypt all TOTP tokens
  for (const totp of totpTokens) {
    const totpRef = doc(db, "users", uid, "totp_tokens", totp.id);
    const secretPlaintext = await decrypt(oldKey, totp.encSecret);
    const newEncSecret = await encrypt(newKey, secretPlaintext);
    batch.update(totpRef, {
      encSecret: newEncSecret,
      updatedAt: serverTimestamp()
    });
  }

  // 5. Commit the batch atomic operation
  await batch.commit();
}

// SSH Keys
export async function createSSHKey(
  uid: string,
  key: CryptoKey,
  data: Omit<StoredSSHKey, 'id' | 'createdAt' | 'updatedAt' | 'encPrivateKey'> & { privateKey: string }
): Promise<void> {
  const keysRef = collection(db, "users", uid, "ssh_keys");
  const newRef = doc(keysRef);
  
  const encPrivateKey = await encrypt(key, data.privateKey);

  const storedKey: StoredSSHKey = {
    ...data,
    id: newRef.id,
    encPrivateKey,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(newRef, {
    ...storedKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function deleteSSHKey(uid: string, keyId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "ssh_keys", keyId));
}

export function subscribeToSSHKeys(uid: string, onUpdate: (keys: StoredSSHKey[]) => void) {
  const q = collection(db, "users", uid, "ssh_keys");
  return onSnapshot(q, (snapshot) => {
    const keys: StoredSSHKey[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      keys.push({
        id: data.id,
        name: data.name,
        type: data.type,
        publicKey: data.publicKey,
        fingerprint: data.fingerprint,
        encPrivateKey: data.encPrivateKey,
        hosts: data.hosts || [],
        rotationDate: data.rotationDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    onUpdate(keys);
  });
}

// TOTP Tokens
export async function createTOTP(
  uid: string,
  key: CryptoKey,
  data: Omit<StoredTOTP, 'id' | 'createdAt' | 'updatedAt' | 'encSecret'> & { secret: string }
): Promise<void> {
  const tokensRef = collection(db, "users", uid, "totp_tokens");
  const newRef = doc(tokensRef);
  const encSecret = await encrypt(key, data.secret);

  await setDoc(newRef, {
    id: newRef.id,
    issuer: data.issuer,
    label: data.label,
    encSecret,
    algorithm: data.algorithm,
    digits: data.digits,
    period: data.period,
    icon: data.icon,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function deleteTOTP(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "totp_tokens", id));
}

export function subscribeToTOTPs(uid: string, onUpdate: (tokens: StoredTOTP[]) => void) {
  const q = collection(db, "users", uid, "totp_tokens");
  return onSnapshot(q, (snapshot) => {
    const tokens: StoredTOTP[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      tokens.push({
        id: data.id,
        issuer: data.issuer,
        label: data.label,
        encSecret: data.encSecret,
        algorithm: data.algorithm || 'SHA1',
        digits: data.digits || 6,
        period: data.period || 30,
        icon: data.icon || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    onUpdate(tokens);
  });
}

// Secrets
export async function createSecret(
  uid: string, 
  key: CryptoKey, 
  formData: SecretFormData
): Promise<void> {
  const secretsRef = collection(db, "users", uid, "secrets");
  const newRef = doc(secretsRef);
  
  const encValue = await encrypt(key, formData.value);
  const encNotes = formData.notes ? await encrypt(key, formData.notes) : null;

  const storedSecret: StoredSecret = {
    id: newRef.id,
    name: formData.name,
    service: formData.service,
    type: formData.type,
    environment: formData.environment,
    status: formData.status,
    encValue,
    encNotes,
    lastRotated: formData.lastRotated,
    expiresOn: formData.expiresOn,
    createdAt: new Date(), 
    updatedAt: new Date(),
    projectId: formData.projectId || null,
    remainingCodes: formData.remainingCodes || null
  };

  await setDoc(newRef, {
    ...storedSecret,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateSecret(
  uid: string, 
  key: CryptoKey, 
  id: string, 
  formData: SecretFormData
): Promise<void> {
  const ref = doc(db, "users", uid, "secrets", id);
  
  const encValue = await encrypt(key, formData.value);
  const encNotes = formData.notes ? await encrypt(key, formData.notes) : null;

  await updateDoc(ref, {
    name: formData.name,
    service: formData.service,
    type: formData.type,
    environment: formData.environment,
    status: formData.status,
    encValue,
    encNotes,
    lastRotated: formData.lastRotated,
    expiresOn: formData.expiresOn,
    projectId: formData.projectId || null,
    remainingCodes: formData.remainingCodes || null,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSecret(uid: string, id: string): Promise<void> {
  const ref = doc(db, "users", uid, "secrets", id);
  await deleteDoc(ref);
}

export function subscribeToSecrets(
  uid: string, 
  callback: (secrets: StoredSecret[]) => void
): () => void {
  const secretsRef = collection(db, "users", uid, "secrets");
  
  return onSnapshot(secretsRef, (snapshot) => {
    const secrets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastRotated: data.lastRotated?.toDate() || null,
        expiresOn: data.expiresOn?.toDate() || null,
        remainingCodes: data.remainingCodes ?? null
      } as StoredSecret;
    });
    callback(secrets);
  });
}

export async function decryptSecret(
  key: CryptoKey, 
  stored: StoredSecret
): Promise<DecryptedSecret> {
  const value = await decrypt(key, stored.encValue);
  const notes = stored.encNotes ? await decrypt(key, stored.encNotes) : "";
  
  const { encValue, encNotes, ...rest } = stored;
  
  return {
    ...rest,
    value,
    notes
  };
}

export async function createProject(
  uid: string, 
  data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const projectsRef = collection(db, "users", uid, "projects");
  const newRef = doc(projectsRef);
  
  await setDoc(newRef, {
    ...data,
    id: newRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateProject(
  uid: string, 
  projectId: string, 
  data: Partial<Project>
): Promise<void> {
  const ref = doc(db, "users", uid, "projects", projectId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteProject(
  uid: string, 
  projectId: string, 
  _moveSecretsTo: string | null
): Promise<void> {
  // In a real implementation this would ideally be a batch operation
  // querying all secrets with the projectId and updating them to moveSecretsTo
  // For MVP, omitted complex transaction code but acknowledging it.
  const ref = doc(db, "users", uid, "projects", projectId);
  await deleteDoc(ref);
}

export function subscribeToProjects(
  uid: string, 
  callback: (projects: Project[]) => void
): () => void {
  const projectsRef = collection(db, "users", uid, "projects");
  
  return onSnapshot(projectsRef, (snapshot) => {
    const projects = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Project;
    });
    callback(projects);
  });
}

export async function createService(
  uid: string, 
  data: Omit<CustomService, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const servicesRef = collection(db, "users", uid, "services");
  const newRef = doc(servicesRef);
  
  await setDoc(newRef, {
    ...data,
    id: newRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateService(
  uid: string,
  serviceId: string,
  data: Partial<CustomService>
): Promise<void> {
  const ref = doc(db, "users", uid, "services", serviceId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteService(uid: string, serviceId: string): Promise<void> {
  const ref = doc(db, "users", uid, "services", serviceId);
  await deleteDoc(ref);
}

export function subscribeToServices(
  uid: string, 
  callback: (services: CustomService[]) => void
): () => void {
  const servicesRef = collection(db, "users", uid, "services");
  
  return onSnapshot(servicesRef, (snapshot) => {
    const services = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CustomService;
    });
    callback(services);
  });
}

// Account Deletion
export async function deleteUserAccountData(uid: string): Promise<void> {
  const batch = writeBatch(db);

  // 1. Delete all secrets
  const secretsSnap = await getDocs(collection(db, "users", uid, "secrets"));
  secretsSnap.forEach(doc => batch.delete(doc.ref));

  // 2. Delete all projects
  const projectsSnap = await getDocs(collection(db, "users", uid, "projects"));
  projectsSnap.forEach(doc => batch.delete(doc.ref));

  // 3. Delete all services
  const servicesSnap = await getDocs(collection(db, "users", uid, "services"));
  servicesSnap.forEach(doc => batch.delete(doc.ref));

  // 4. Delete all SSH keys
  const sshSnap = await getDocs(collection(db, "users", uid, "ssh_keys"));
  sshSnap.forEach(doc => batch.delete(doc.ref));

  // 5. Delete all TOTP tokens
  const totpSnap = await getDocs(collection(db, "users", uid, "totp_tokens"));
  totpSnap.forEach(doc => batch.delete(doc.ref));

  // 5. Delete vault meta
  const metaRef = doc(db, "users", uid, "meta", "vault");
  batch.delete(metaRef);

  // Note: A Firestore batch can hold up to 500 operations.
  // We assume a user has less than 500 combined documents for this MVP.
  // Otherwise, we would need chunking.
  await batch.commit();

  // 5. Delete main user document (cannot be in the same batch if it causes issues, but usually fine.
  // Actually, let's delete it directly after the batch to be safe).
  await deleteDoc(doc(db, "users", uid));
}

// Zero-Knowledge Secret Sharing

import { query, where, Timestamp } from 'firebase/firestore';
import { generateShareKey, exportShareKey, encrypt as encryptWithKey, importShareKey, decrypt as decryptWithKey } from './crypto';
import type { ShareDocument, ShareConfig, DecryptedShare } from './types';

/**
 * Create a shareable link for a secret
 * Returns the full URL with the decryption key in the fragment
 */
export async function createShare(uid: string, config: ShareConfig): Promise<string> {
  // Generate a fresh share key (independent of vault key)
  const shareKey = await generateShareKey();
  
  // Encrypt the secret value with the share key
  const encValue = await encryptWithKey(shareKey, config.value);
  
  // Calculate expiry timestamp
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.expiryHours);
  
  // Create share document
  const shareRef = doc(collection(db, "shares"));
  const shareDoc: Omit<ShareDocument, 'id'> = {
    encValue,
    secretName: config.secretName,
    service: config.service,
    type: config.type,
    expiresAt,
    viewsAllowed: config.viewsAllowed,
    viewsUsed: 0,
    createdByUid: uid,
    projectId: config.projectId,
    createdAt: new Date()
  };
  
  await setDoc(shareRef, {
    ...shareDoc,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp()
  });
  
  // Export the share key to base64url
  const keyFragment = await exportShareKey(shareKey);
  
  // Construct the full URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://scync.app';
  return `${baseUrl}/share/${shareRef.id}#${keyFragment}`;
}

/**
 * Fetch all active shares created by a user
 */
export async function fetchUserShares(uid: string): Promise<ShareDocument[]> {
  const q = query(
    collection(db, "shares"),
    where("createdByUid", "==", uid)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      encValue: data.encValue,
      secretName: data.secretName,
      service: data.service,
      type: data.type,
      expiresAt: data.expiresAt?.toDate() || new Date(),
      viewsAllowed: data.viewsAllowed,
      viewsUsed: data.viewsUsed,
      createdByUid: data.createdByUid,
      projectId: data.projectId,
      createdAt: data.createdAt?.toDate() || new Date()
    };
  });
}

/**
 * Subscribe to user's shares in real-time
 */
export function subscribeToUserShares(uid: string, callback: (shares: ShareDocument[]) => void): () => void {
  const q = query(
    collection(db, "shares"),
    where("createdByUid", "==", uid)
  );
  
  return onSnapshot(q, snapshot => {
    const shares = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        encValue: data.encValue,
        secretName: data.secretName,
        service: data.service,
        type: data.type,
        expiresAt: data.expiresAt?.toDate() || new Date(),
        viewsAllowed: data.viewsAllowed,
        viewsUsed: data.viewsUsed,
        createdByUid: data.createdByUid,
        projectId: data.projectId,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    callback(shares);
  });
}

/**
 * Revoke a share (delete the document)
 */
export async function revokeShare(shareId: string): Promise<void> {
  await deleteDoc(doc(db, "shares", shareId));
}

/**
 * Consume a share link (recipient side)
 * Reads the share, validates it, increments view count, and decrypts
 */
export async function consumeShare(shareId: string, keyFragment: string): Promise<DecryptedShare> {
  const shareRef = doc(db, "shares", shareId);
  
  // Import the decryption key from URL fragment
  const shareKey = await importShareKey(keyFragment);
  
  // First, read the document to get the encrypted data
  const shareSnap = await getDoc(shareRef);
  
  if (!shareSnap.exists()) {
    throw new Error('SHARE_NOT_FOUND');
  }
  
  const data = shareSnap.data();
  const now = new Date();
  const expiresAt = data.expiresAt?.toDate() || new Date(0);
  
  // Check if expired
  if (expiresAt < now) {
    throw new Error('SHARE_EXPIRED');
  }
  
  // Check if view limit reached BEFORE incrementing
  if (data.viewsAllowed !== null && data.viewsUsed >= data.viewsAllowed) {
    throw new Error('SHARE_CONSUMED');
  }
  
  // Increment view count (fire and forget - don't wait for it)
  // This is safe because we already validated the share is consumable
  updateDoc(shareRef, {
    viewsUsed: data.viewsUsed + 1
  }).catch(err => {
    // Silently fail if update fails (e.g., permission denied after consumption)
    // The user already got the secret, which is what matters
    console.warn('Failed to increment view count:', err);
  });
  
  // Decrypt the value
  const value = await decryptWithKey(shareKey, data.encValue);
  
  return {
    secretName: data.secretName,
    service: data.service,
    type: data.type,
    value,
    viewsRemaining: data.viewsAllowed !== null ? data.viewsAllowed - (data.viewsUsed + 1) : null,
    expiresAt
  };
}

// ────────────────────────────────────────────────────
// BATCH IMPORT
// ────────────────────────────────────────────────────

/**
 * Write multiple secrets to Firestore in a single batch operation.
 * Firestore batch writes are atomic: all succeed or all fail.
 * Maximum 500 documents per batch — this function handles chunking automatically.
 *
 * @param uid - Firebase user ID
 * @param key - Derived vault CryptoKey (from vaultStore)
 * @param candidates - ImportCandidate[] filtered to selected === true
 * @param onProgress - Optional callback for progress reporting (0.0 to 1.0)
 */
export async function batchCreateSecrets(
  uid: string,
  key: CryptoKey,
  candidates: import('./types').ImportCandidate[],
  onProgress?: (progress: number) => void
): Promise<import('./types').ImportResult> {
  const BATCH_SIZE = 400; // Stay under 500 limit with margin
  const results: import('./types').ImportResult = { imported: 0, failed: 0, errors: [] };

  const chunks = chunkArray(candidates, BATCH_SIZE);

  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
    const chunk = chunks[chunkIdx];
    if (!chunk) continue;
    const batch = writeBatch(db);

    for (const candidate of chunk) {
      try {
        const ref = doc(collection(db, 'users', uid, 'secrets'));
        const encValue = await encrypt(key, candidate.value);
        const encNotes = candidate.notes
          ? await encrypt(key, candidate.notes)
          : null;

        const storedSecret = {
          name: candidate.name,
          service: candidate.service,
          type: candidate.type,
          environment: candidate.environment,
          status: candidate.status,
          encValue,
          encNotes,
          projectId: candidate.projectId,
          lastRotated: null,
          expiresOn: null,
          remainingCodes: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        batch.set(ref, storedSecret);
        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `Failed to encrypt "${candidate.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    await batch.commit();

    const progress = (chunkIdx + 1) / chunks.length;
    onProgress?.(progress);
  }

  return results;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
