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
  | 'Service Account JSON'
  | 'Database URL'
  | 'License Key'
  | 'Passphrase'
  | 'Secret Note'
  | 'Password'
  | 'Other';

export type Environment =
  | 'Personal'
  | 'Work'
  | 'Development'
  | 'Staging'
  | 'Production'
  | 'Local'
  | 'Testing'
  | 'CI/CD';

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

// SSL/TLS Certificate Manager
export interface CertificateInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  isSelfSigned: boolean;
  fingerprint: string;
  hosts: string[];
}

export interface StoredCertificate {
  id: string;
  name: string;
  encCertPem: EncryptedField;
  encKeyPem: EncryptedField | null;
  // Parsed metadata (plaintext for dashboard/filtering)
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  isSelfSigned: boolean;
  fingerprint: string;
  hosts: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DecryptedCertificate extends Omit<StoredCertificate, 'encCertPem' | 'encKeyPem'> {
  certPem: string;
  keyPem: string | null;
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
