// Type definitions for Scync CLI
// Keep in sync with packages/core/src/types.ts

export interface EncryptedField {
  iv: string;
  ciphertext: string;
}

export interface VaultMeta {
  salt: string;
  verifier: EncryptedField;
  createdAt: Date;
  biometric?: boolean;
}

export interface StoredSecret {
  id: string;
  name: string;
  service: string;
  type: string;
  environment: string;
  status: string;
  encValue: EncryptedField;
  encNotes: EncryptedField | null;
  projectId: string | null;
  lastRotated: Date | null;
  expiresOn: Date | null;
  remainingCodes: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthConfig {
  refreshToken: string;
  uid: string;
  email: string;
}

export interface Session {
  keyBase64: string; // Base64-encoded raw key bytes
  uid: string;
  expires: number; // Unix timestamp
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}
