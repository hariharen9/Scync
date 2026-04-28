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

