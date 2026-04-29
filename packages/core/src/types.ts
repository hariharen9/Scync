export interface EncryptedField {
  iv: string;
  ciphertext: string;
}

export interface BiometricMeta {
  credentialId: string;
  salt: string;
  encMasterPassword: EncryptedField;
}

export interface VaultMeta {
  salt: string;
  verifier: EncryptedField;
  createdAt: Date;
  biometric?: BiometricMeta;
}

export interface StoredSecret {
  id: string;
  name: string;
  service: ServiceName;
  type: SecretType;
  environment: Environment;
  status: SecretStatus;
  encValue: EncryptedField;
  encNotes: EncryptedField | null;
  lastRotated: Date | null;
  expiresOn: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  remainingCodes: number | null;
}

export interface DecryptedSecret extends Omit<StoredSecret, 'encValue' | 'encNotes'> {
  value: string;
  notes: string;
}

export interface SecretFormData {
  name: string;
  service: ServiceName;
  type: SecretType;
  environment: Environment;
  status: SecretStatus;
  value: string;
  notes: string;
  lastRotated: Date | null;
  expiresOn: Date | null;
  projectId?: string | null;
  remainingCodes?: number | null;
}

export type ServiceName = string;

export interface CustomService {
  id: string;
  name: string;
  color: ProjectColor;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SecretType =
  | 'API Key'
  | 'Personal Access Token'
  | 'OAuth Token'
  | 'OAuth Client Secret'
  | 'Recovery Codes'
  | 'Secret Key'
  | 'Webhook Secret'
  | 'SSH Key'
  | 'Service Account JSON'
  | 'Database URL'
  | 'Password'
  | 'Other';

export type Environment =
  | 'Personal'
  | 'Work'
  | 'Development'
  | 'Staging'
  | 'Production';

export type SecretStatus =
  | 'Active'
  | 'Rotated'
  | 'Expired'
  | 'Revoked';

export interface VaultFilter {
  service: ServiceName | '';
  type: SecretType | '';
  environment: Environment | '';
  status: SecretStatus | '';
  projectId: string | '';
  search: string;
}

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  icon: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectColor =
  | 'violet'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'yellow'
  | 'gray';

export interface RecoveryCode {
  code: string;
  used: boolean;
  usedAt: Date | null;
}

export interface RecoveryCodeSet {
  codes: RecoveryCode[];
}

export interface StoredSSHKey {
  id: string;
  name: string;
  type: string;
  publicKey: string;
  fingerprint: string;
  encPrivateKey: EncryptedField;
  hosts: string[];
  createdAt: Date;
  updatedAt: Date;
  rotationDate: Date | null;
}

export interface DecryptedSSHKey extends Omit<StoredSSHKey, 'encPrivateKey'> {
  privateKey: string;
}

export interface StoredTOTP {
  id: string;
  issuer: string;
  label: string;
  encSecret: EncryptedField;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: 30 | 60;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecryptedTOTP extends Omit<StoredTOTP, 'encSecret'> {
  secret: string;
}

// Zero-Knowledge Secret Sharing
export interface ShareDocument {
  id: string;
  encValue: EncryptedField;
  // Plaintext metadata
  secretName: string;
  service: ServiceName;
  type: SecretType;
  // Lifecycle
  expiresAt: Date;
  viewsAllowed: number | null;
  viewsUsed: number;
  // Relational
  createdByUid: string;
  projectId: string | null;
  createdAt: Date;
}

export interface ShareConfig {
  secretId: string;
  secretName: string;
  service: ServiceName;
  type: SecretType;
  value: string;
  expiryHours: number;
  viewsAllowed: number | null;
  projectId: string | null;
}

export interface DecryptedShare {
  secretName: string;
  service: ServiceName;
  type: SecretType;
  value: string;
  viewsRemaining: number | null;
  expiresAt: Date;
}

// ────────────────────────────────────────────────────
// IMPORT TYPES
// ────────────────────────────────────────────────────

/** A secret candidate parsed from an external import file, before encryption */
export interface ImportCandidate {
  /** Stable ID for UI selection state (generated locally, not stored) */
  localId: string;
  /** The secret name as parsed from the source file */
  name: string;
  /** Inferred Scync ServiceName — may be 'Other' if no match found */
  service: ServiceName;
  /** Inferred Scync SecretType */
  type: SecretType;
  /** Always 'Personal' for imported secrets — user can change after import */
  environment: Environment;
  /** Always 'Active' — user can change after import */
  status: SecretStatus;
  /** The plaintext secret value — encrypted immediately on import */
  value: string;
  /** Any notes from the source entry */
  notes: string;
  /** Whether this item is selected for import (default: true) */
  selected: boolean;
  /** Reason this item was excluded or flagged — shown in UI */
  warning?: string;
  /** The raw source type string for display (e.g. "Bitwarden Secure Note") */
  sourceType: string;
  /** Which project to assign this secret to (null = uncategorized) */
  projectId: string | null;
}

/** Result of parsing an import file */
export interface ImportParseResult {
  candidates: ImportCandidate[];
  /** Total items in source file, including skipped ones */
  totalItems: number;
  /** Items that were skipped (e.g. credit cards, identities — not developer secrets) */
  skippedItems: number;
  /** Warnings about items that were partially parsed */
  warnings: string[];
  /** The source format that was detected */
  sourceFormat: 'bitwarden-json' | 'onepassword-csv' | 'onepassword-1pux';
}

/** Result of completing a batch import */
export interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}
