# Scync Feature Spec — Import from Bitwarden & 1Password
**Version:** 1.0  
**Feature ID:** FEAT-001  
**Target Release:** V2  
**Status:** Ready for Implementation  
**Depends on:** Core spec sections 6, 10, 15, 16, 17, 18

---

## 1. Overview

This feature adds a one-click migration path for developers currently using Bitwarden or 1Password. It is the single highest-leverage growth feature: developers who hate Bitwarden's UX (Scync's primary target audience) are blocked from switching only by the friction of re-entering their secrets. Removing that friction converts "interested" visitors into committed users.

**Core principle:** All parsing happens **in the browser**. No file ever leaves the device. Files are read using the File API, parsed in JavaScript, and the extracted values are immediately encrypted with the vault key before being written to Firestore. At no point does any plaintext secret value touch a network connection.

**Supported import sources:**
1. **Bitwarden** — unencrypted JSON export (`.json`)
2. **1Password** — CSV export (`.csv`) and 1PUX format (`.1pux`)

**Out of scope for this feature:**
- Importing from Bitwarden's *encrypted* JSON export (requires Bitwarden's own KDF — V3 consideration)
- Importing from LastPass, Dashlane, KeePass, or any other manager (V3)
- Importing from `.env` files (that is a separate existing feature in MVP)

---

## 2. File Placement in Monorepo

### New files to create:

```
packages/core/src/
└── importers/
    ├── index.ts                    ← barrel export
    ├── bitwarden.ts                ← Bitwarden JSON parser
    ├── onepassword-csv.ts          ← 1Password CSV parser
    ├── onepassword-1pux.ts         ← 1Password 1PUX parser
    └── __tests__/
        ├── bitwarden.test.ts
        ├── onepassword-csv.test.ts
        └── onepassword-1pux.test.ts

packages/ui/src/components/
└── ImportWizard/
    ├── index.ts                    ← barrel export
    ├── ImportWizard.tsx            ← Main wizard container
    ├── SourceSelector.tsx          ← Step 1: Choose Bitwarden or 1Password
    ├── FileDropZone.tsx            ← Step 2: File upload UI
    ├── ImportPreview.tsx           ← Step 3: Preview and select items
    ├── ImportProgress.tsx          ← Step 4: Progress during batch write
    └── ImportComplete.tsx          ← Step 5: Success summary

apps/web/src/pages/
└── SettingsPage.tsx                ← Add Import section here (page already exists or create it)
```

### Modified existing files:

```
packages/core/src/index.ts          ← export from importers/index.ts
packages/core/src/firestore.ts      ← add batchCreateSecrets() function
packages/ui/src/stores/uiStore.ts   ← add import wizard open/close state
apps/web/src/App.tsx                ← add route to SettingsPage if not exists
firebase/firestore.rules            ← no changes needed
```

---

## 3. TypeScript Types

Add to `packages/core/src/types.ts`:

```typescript
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
```

---

## 4. Service and Type Inference

The most important piece of parser logic is `inferService` — mapping a human-readable name like "OpenAI Production Key" to the `ServiceName` enum. This determines which colored badge the imported secret gets.

Add to `packages/core/src/importers/index.ts`:

```typescript
import type { ServiceName, SecretType } from '../types.js';

// ── Service inference ──────────────────────────────────────────────────────

const SERVICE_KEYWORDS: Record<ServiceName, string[]> = {
  'Google':      ['google', 'gcp', 'gmail', 'firebase', 'vertex', 'cloud console'],
  'Anthropic':   ['anthropic', 'claude'],
  'GitHub':      ['github', 'gh', 'ghp_', 'pat '],
  'OpenRouter':  ['openrouter'],
  'AWS':         ['aws', 'amazon', 'ec2', 's3', 'iam', 'dynamodb', 'lambda', 'secret_access_key', 'access_key_id'],
  'Vercel':      ['vercel'],
  'Stripe':      ['stripe', 'sk_live', 'sk_test', 'pk_live', 'pk_test'],
  'Cloudflare':  ['cloudflare', 'cf_'],
  'Supabase':    ['supabase'],
  'OpenAI':      ['openai', 'sk-'],
  'HuggingFace': ['huggingface', 'hugging face', 'hf_'],
  'Twilio':      ['twilio'],
  'SendGrid':    ['sendgrid'],
  'Netlify':     ['netlify'],
  'Railway':     ['railway'],
  'PlanetScale': ['planetscale'],
  'Neon':        ['neon', 'neon.tech'],
  'Other':       [],
};

export function inferService(name: string, value: string = ''): ServiceName {
  const haystack = (name + ' ' + value).toLowerCase();
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (service === 'Other') continue;
    if (keywords.some(kw => haystack.includes(kw))) {
      return service as ServiceName;
    }
  }
  return 'Other';
}

// ── Type inference ─────────────────────────────────────────────────────────

export function inferType(name: string, value: string = '', sourceType: string = ''): SecretType {
  const haystack = (name + ' ' + value + ' ' + sourceType).toLowerCase();

  if (haystack.includes('ssh') || value.startsWith('-----BEGIN')) return 'SSH Key';
  if (haystack.includes('recovery') || haystack.includes('backup code')) return 'Recovery Codes';
  if (haystack.includes('webhook')) return 'Webhook Secret';
  if (haystack.includes('oauth') && haystack.includes('secret')) return 'OAuth Client Secret';
  if (haystack.includes('oauth') || haystack.includes('refresh_token')) return 'OAuth Token';
  if (haystack.includes('pat') || haystack.includes('personal access')) return 'Personal Access Token';
  if (haystack.includes('database') || haystack.includes('db_url') || value.includes('postgres://') || value.includes('mysql://')) return 'Database URL';
  if (haystack.includes('service account') || value.startsWith('{')) return 'Service Account JSON';
  if (haystack.includes('api key') || haystack.includes('api_key') || haystack.includes('apikey')) return 'API Key';
  if (sourceType === 'login') return 'Password';
  return 'API Key'; // best default for developer secrets
}

// ── Local ID generator ─────────────────────────────────────────────────────

export function generateLocalId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
```

---

## 5. Bitwarden JSON Parser

### 5.1 Bitwarden Export Format

Bitwarden exports an unencrypted JSON file with this structure:

```json
{
  "encrypted": false,
  "folders": [
    { "id": "folder-uuid", "name": "Work" }
  ],
  "items": [
    {
      "id": "item-uuid",
      "organizationId": null,
      "folderId": "folder-uuid",
      "type": 1,
      "name": "GitHub",
      "notes": "Work account",
      "favorite": false,
      "fields": [
        { "name": "API Token", "value": "ghp_abc123", "type": 0 }
      ],
      "login": {
        "username": "hariharen9",
        "password": "my-password",
        "uris": [{ "uri": "https://github.com" }],
        "totp": "otpauth://totp/GitHub:hariharen9?secret=BASE32SECRET"
      },
      "secureNote": null
    },
    {
      "id": "item-uuid-2",
      "type": 2,
      "name": "OpenAI API Key",
      "notes": "Personal project",
      "fields": [
        { "name": "key", "value": "sk-abc123xyz", "type": 0 }
      ],
      "login": null,
      "secureNote": { "type": 0 }
    }
  ]
}
```

**Bitwarden item types:**
- `1` = Login (username + password + URL)
- `2` = Secure Note (free-form, often used for API keys)
- `3` = Card (credit card — skip)
- `4` = Identity (personal info — skip)

### 5.2 Parser Implementation

```typescript
// packages/core/src/importers/bitwarden.ts

import { inferService, inferType, generateLocalId } from './index.js';
import type { ImportCandidate, ImportParseResult } from '../types.js';

interface BwField {
  name: string;
  value: string | null;
  type: number; // 0=text, 1=hidden, 2=boolean
}

interface BwLogin {
  username: string | null;
  password: string | null;
  uris?: Array<{ uri: string }>;
  totp?: string | null;
}

interface BwItem {
  id: string;
  type: 1 | 2 | 3 | 4;
  name: string;
  notes: string | null;
  fields?: BwField[];
  login?: BwLogin | null;
  secureNote?: { type: number } | null;
}

interface BwExport {
  encrypted: boolean;
  items: BwItem[];
}

export function parseBitwardenExport(jsonString: string): ImportParseResult {
  let data: BwExport;

  try {
    data = JSON.parse(jsonString) as BwExport;
  } catch {
    throw new Error('Invalid JSON file. Make sure you exported from Bitwarden as unencrypted JSON.');
  }

  if (data.encrypted === true) {
    throw new Error(
      'This is an encrypted Bitwarden export. Please re-export from Bitwarden using ' +
      'Account → Export Vault → File Format: .json (unencrypted).'
    );
  }

  if (!Array.isArray(data.items)) {
    throw new Error('Invalid Bitwarden export format: missing items array.');
  }

  const candidates: ImportCandidate[] = [];
  let skippedItems = 0;
  const warnings: string[] = [];

  for (const item of data.items) {
    // Skip credit cards and identities — not developer secrets
    if (item.type === 3 || item.type === 4) {
      skippedItems++;
      continue;
    }

    const extractedSecrets = extractBitwardenSecrets(item);

    for (const extracted of extractedSecrets) {
      if (!extracted.value || extracted.value.trim() === '') {
        skippedItems++;
        continue;
      }

      candidates.push({
        localId: generateLocalId(),
        name: extracted.name,
        service: inferService(extracted.name, extracted.value),
        type: inferType(extracted.name, extracted.value, extracted.sourceType),
        environment: 'Personal',
        status: 'Active',
        value: extracted.value,
        notes: item.notes ?? '',
        selected: true,
        sourceType: extracted.sourceType,
        warning: extracted.warning,
        projectId: null,
      });
    }
  }

  return {
    candidates,
    totalItems: data.items.length,
    skippedItems,
    warnings,
    sourceFormat: 'bitwarden-json',
  };
}

interface ExtractedSecret {
  name: string;
  value: string;
  sourceType: string;
  warning?: string;
}

function extractBitwardenSecrets(item: BwItem): ExtractedSecret[] {
  const results: ExtractedSecret[] = [];

  if (item.type === 2) {
    // Secure Note — extract from custom fields
    if (item.fields && item.fields.length > 0) {
      for (const field of item.fields) {
        if (field.value && field.value.trim() !== '') {
          results.push({
            name: field.name ? `${item.name} — ${field.name}` : item.name,
            value: field.value,
            sourceType: 'Bitwarden Secure Note',
          });
        }
      }
    }

    // If no fields, check if notes contain a value
    if (results.length === 0 && item.notes && item.notes.trim() !== '') {
      results.push({
        name: item.name,
        value: item.notes,
        sourceType: 'Bitwarden Secure Note',
        warning: 'Value was extracted from the notes field',
      });
    }
  }

  if (item.type === 1 && item.login) {
    // Login item — extract password + TOTP + custom fields
    if (item.login.password) {
      results.push({
        name: item.name,
        value: item.login.password,
        sourceType: 'login',
      });
    }

    if (item.login.totp) {
      results.push({
        name: `${item.name} — 2FA Secret`,
        value: item.login.totp,
        sourceType: 'TOTP',
      });
    }

    // Custom fields on login items (often where devs stash API keys)
    if (item.fields) {
      for (const field of item.fields) {
        if (field.value && field.value.trim() !== '' && field.type !== 2) {
          results.push({
            name: `${item.name} — ${field.name}`,
            value: field.value,
            sourceType: 'Bitwarden Login Custom Field',
          });
        }
      }
    }
  }

  return results;
}
```

---

## 6. 1Password CSV Parser

### 6.1 1Password CSV Export Format

1Password exports a CSV with these headers (order may vary):
```
Title,Username,Password,OTPAuth,URL,Notes,Type
```

Values are standard CSV (commas escaped with quotes).

Example rows:
```
"OpenAI API Key","","sk-abc123","","","Production key","API Credential"
"GitHub","hariharen9","ghp_xyz789","otpauth://totp/GitHub?secret=BASE32","https://github.com","","Login"
```

### 6.2 Parser Implementation

```typescript
// packages/core/src/importers/onepassword-csv.ts

import { inferService, inferType, generateLocalId } from './index.js';
import type { ImportCandidate, ImportParseResult } from '../types.js';

export function parse1PasswordCsv(csvString: string): ImportParseResult {
  const lines = csvString.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSV file appears empty or has no data rows.');
  }

  // Parse header row
  const headers = parseCSVRow(lines[0] ?? '').map(h => h.toLowerCase().trim());
  const titleIdx = headers.indexOf('title');
  const passwordIdx = headers.indexOf('password');
  const usernameIdx = headers.indexOf('username');
  const notesIdx = headers.indexOf('notes');
  const typeIdx = headers.indexOf('type');
  const otpIdx = headers.indexOf('otpauth');

  if (titleIdx === -1 || passwordIdx === -1) {
    throw new Error(
      'Could not find required columns (Title, Password). ' +
      'Make sure you exported from 1Password as CSV.'
    );
  }

  const candidates: ImportCandidate[] = [];
  let skippedItems = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i] ?? '');
    const title = row[titleIdx] ?? '';
    const password = row[passwordIdx] ?? '';
    const notes = notesIdx !== -1 ? (row[notesIdx] ?? '') : '';
    const type1P = typeIdx !== -1 ? (row[typeIdx] ?? '') : '';
    const otpAuth = otpIdx !== -1 ? (row[otpIdx] ?? '') : '';

    // Skip items without a usable value
    if (!password || password.trim() === '') {
      skippedItems++;
      continue;
    }

    candidates.push({
      localId: generateLocalId(),
      name: title,
      service: inferService(title, password),
      type: inferType(title, password, type1P),
      environment: 'Personal',
      status: 'Active',
      value: password,
      notes,
      selected: true,
      sourceType: `1Password ${type1P || 'Item'}`,
      projectId: null,
    });

    // If there's also an OTP secret, add it as a separate entry
    if (otpAuth && otpAuth.trim() !== '') {
      candidates.push({
        localId: generateLocalId(),
        name: `${title} — 2FA Secret`,
        service: inferService(title),
        type: 'Recovery Codes',
        environment: 'Personal',
        status: 'Active',
        value: otpAuth,
        notes: '',
        selected: true,
        sourceType: '1Password TOTP',
        projectId: null,
      });
    }
  }

  return {
    candidates,
    totalItems: lines.length - 1,
    skippedItems,
    warnings: [],
    sourceFormat: 'onepassword-csv',
  };
}

/** Parse a single CSV row, respecting quoted values */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
```

---

## 7. 1Password 1PUX Parser

### 7.1 1PUX Format

The `.1pux` file is a ZIP archive. Inside, the primary file is `export.data` which is JSON.

Structure:
```json
{
  "accounts": [
    {
      "attrs": { "name": "My Account" },
      "vaults": [
        {
          "attrs": { "name": "Personal" },
          "items": [
            {
              "uuid": "item-uuid",
              "categoryUuid": "001",
              "overview": {
                "title": "OpenAI API Key",
                "tags": ["dev", "ai"]
              },
              "details": {
                "loginFields": [],
                "sections": [
                  {
                    "title": "Keys",
                    "fields": [
                      {
                        "title": "API Key",
                        "value": { "concealed": "sk-abc123xyz" },
                        "id": "api_key"
                      }
                    ]
                  }
                ],
                "notesPlain": "Production key"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**1Password category UUIDs:**
- `001` = Login
- `002` = Credit Card (skip)
- `003` = Secure Note
- `004` = Identity (skip)
- `005` = Password
- `109` = API Credential
- `110` = Server

### 7.2 Parser Implementation

```typescript
// packages/core/src/importers/onepassword-1pux.ts
// NOTE: Parsing .1pux requires unzipping. Use the browser's built-in DecompressionStream API.

import { inferService, inferType, generateLocalId } from './index.js';
import type { ImportCandidate, ImportParseResult } from '../types.js';

const SKIP_CATEGORIES = ['002', '004']; // Credit Card, Identity

export async function parse1PasswordOnePux(zipBuffer: ArrayBuffer): Promise<ImportParseResult> {
  // Unzip using DecompressionStream (Web API — works in browser + Node 18+)
  const exportData = await extractExportDataFromZip(zipBuffer);
  const parsed = JSON.parse(exportData) as OnePuxExport;

  const candidates: ImportCandidate[] = [];
  let totalItems = 0;
  let skippedItems = 0;

  for (const account of parsed.accounts) {
    for (const vault of account.vaults) {
      for (const item of vault.items) {
        totalItems++;

        if (SKIP_CATEGORIES.includes(item.categoryUuid)) {
          skippedItems++;
          continue;
        }

        const extracted = extractOnePuxSecrets(item);
        for (const e of extracted) {
          if (!e.value || e.value.trim() === '') {
            skippedItems++;
            continue;
          }
          candidates.push({
            localId: generateLocalId(),
            name: e.name,
            service: inferService(e.name, e.value),
            type: inferType(e.name, e.value, item.categoryUuid),
            environment: 'Personal',
            status: 'Active',
            value: e.value,
            notes: item.details.notesPlain ?? '',
            selected: true,
            sourceType: `1Password ${getCategoryName(item.categoryUuid)}`,
            projectId: null,
          });
        }
      }
    }
  }

  return {
    candidates,
    totalItems,
    skippedItems,
    warnings: [],
    sourceFormat: 'onepassword-1pux',
  };
}

function extractOnePuxSecrets(item: OnePuxItem): Array<{ name: string; value: string }> {
  const results: Array<{ name: string; value: string }> = [];
  const title = item.overview.title;

  // Extract from sections/fields
  for (const section of item.details.sections ?? []) {
    for (const field of section.fields ?? []) {
      const value =
        field.value.concealed ??
        field.value.string ??
        field.value.totp ??
        '';

      if (value) {
        const name = section.title
          ? `${title} — ${field.title}`
          : `${title} — ${field.title}`;
        results.push({ name, value });
      }
    }
  }

  // If nothing found in sections, try loginFields
  if (results.length === 0) {
    for (const loginField of item.details.loginFields ?? []) {
      if (loginField.value && loginField.designation === 'password') {
        results.push({ name: title, value: loginField.value });
      }
    }
  }

  return results;
}

// Unzip the .1pux file using the File System Access API + DecompressionStream
// This is a simplified approach — for full ZIP parsing use a streaming approach
async function extractExportDataFromZip(buffer: ArrayBuffer): Promise<string> {
  // In the browser, use JSZip (add to packages/ui devDependencies only, lazy-loaded)
  // JSZip is loaded lazily only when a .1pux file is uploaded
  const JSZip = await import('jszip');
  const zip = await JSZip.default.loadAsync(buffer);
  const exportFile = zip.file('export.data');
  if (!exportFile) throw new Error('Invalid .1pux file: missing export.data');
  return exportFile.async('string');
}

function getCategoryName(uuid: string): string {
  const map: Record<string, string> = {
    '001': 'Login',
    '003': 'Secure Note',
    '005': 'Password',
    '109': 'API Credential',
    '110': 'Server',
  };
  return map[uuid] ?? 'Item';
}

// ── Type definitions for 1PUX format ──────────────────────────────────────

interface OnePuxExport {
  accounts: OnePuxAccount[];
}
interface OnePuxAccount {
  vaults: OnePuxVault[];
}
interface OnePuxVault {
  items: OnePuxItem[];
}
interface OnePuxItem {
  uuid: string;
  categoryUuid: string;
  overview: { title: string; tags?: string[] };
  details: {
    loginFields?: Array<{ designation: string; value: string }>;
    sections?: Array<{
      title: string;
      fields?: Array<{
        title: string;
        value: {
          concealed?: string;
          string?: string;
          totp?: string;
        };
      }>;
    }>;
    notesPlain?: string;
  };
}
```

---

## 8. Batch Write to Firestore

Add to `packages/core/src/firestore.ts`:

```typescript
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
  candidates: ImportCandidate[],
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  const BATCH_SIZE = 400; // Stay under 500 limit with margin
  const results: ImportResult = { imported: 0, failed: 0, errors: [] };

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

        const storedSecret: Omit<StoredSecret, 'id'> = {
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
          createdAt: serverTimestamp() as unknown as Date,
          updatedAt: serverTimestamp() as unknown as Date,
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
```

---

## 9. UI — ImportWizard Component

### 9.1 Access Point

The ImportWizard is accessible from **Settings → Import & Export → Import Secrets**.

In `apps/web/src/pages/SettingsPage.tsx`, add an "Import & Export" section with:
- "Import from Bitwarden" button → opens ImportWizard with `source='bitwarden'`
- "Import from 1Password" button → opens ImportWizard with `source='onepassword'`

### 9.2 Wizard Steps

The ImportWizard has 5 steps rendered as a single-page flow (no page navigation):

```
Step 1: Source Selection
Step 2: Instructions + File Drop
Step 3: Preview & Select
Step 4: Importing (progress)
Step 5: Complete
```

### 9.3 Step 1 — Source Selector (`SourceSelector.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│  Import Secrets                                          │
│                                                          │
│  Where are you importing from?                           │
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │    🔒 Bitwarden     │  │    🔑 1Password          │   │
│  │                     │  │                          │   │
│  │  JSON export        │  │  CSV or .1pux export     │   │
│  └─────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

Both are clickable cards. Clicking one advances to Step 2.

### 9.4 Step 2 — Instructions + File Drop (`FileDropZone.tsx`)

**For Bitwarden:**
```
┌─────────────────────────────────────────────────────────┐
│  Export from Bitwarden                                   │
│                                                          │
│  1. Open Bitwarden → Account Settings                    │
│  2. Click "Export Vault"                                 │
│  3. File Format: JSON (unencrypted)                      │
│  4. Enter your master password to confirm                │
│  5. Save the .json file                                  │
│                                                          │
│  ⚠  The exported file is unencrypted. Delete it          │
│     after importing.                                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                  │   │
│  │   Drag your Bitwarden .json file here            │   │
│  │          or click to browse                      │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  🔒 This file never leaves your device.                  │
│     Parsing happens in your browser.                     │
└─────────────────────────────────────────────────────────┘
```

**File drop zone implementation:**
- Accepts `.json` for Bitwarden, `.csv` and `.1pux` for 1Password
- On drop: read file with `FileReader.readAsText()` (or `readAsArrayBuffer()` for `.1pux`)
- Show filename and file size after selection
- Validate file extension before parsing
- Parse immediately on file selection (show spinner during parse)
- On parse error: show error message inline, allow re-selection

### 9.5 Step 3 — Preview (`ImportPreview.tsx`)

This is the most important UI step. It shows every parsed secret and lets the user control exactly what gets imported.

```
┌─────────────────────────────────────────────────────────────────┐
│  Review Secrets                                                  │
│  47 secrets found · 3 skipped (credit cards, identities)        │
│                                                                  │
│  Select all  |  Deselect all    [Project: Uncategorized ▾]      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ✓  OpenAI API Key          [OpenAI]   API Key    Personal  │ │
│  │ ✓  GitHub PAT              [GitHub]   PAT        Personal  │ │
│  │ ✓  Stripe Secret Key       [Stripe]   API Key    Personal  │ │
│  │ ✓  AWS_SECRET_ACCESS_KEY   [AWS]      API Key    Personal  │ │
│  │ ✓  GitHub — 2FA Secret     [GitHub]   Rec. Codes Personal  │ │
│  │ □  My Netflix Password     [Other]    Password   Personal  │ │
│  │                            ⚠ Not a developer secret         │ │
│  │ ✓  Anthropic Claude Key    [Anthropic] API Key   Personal  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  44 selected                           [Cancel]  [Import 44]    │
└─────────────────────────────────────────────────────────────────┘
```

**Table columns:**
- Checkbox (selected/deselected)
- Name (editable inline — click to edit before importing)
- Service badge (color-coded, matches ServiceName)
- Type chip
- Environment (dropdown — all default to Personal)
- Warning icon if applicable

**Controls:**
- Select All / Deselect All
- Project dropdown — assigns all selected items to a project on import
- Individual checkbox per row
- Click on name to edit inline (for renaming before import)
- Click on service badge to change service
- "Cancel" → close wizard, nothing imported
- "Import N" → advance to Step 4

**Pagination:** If more than 50 candidates, paginate (50 per page). Show total count.

### 9.6 Step 4 — Progress (`ImportProgress.tsx`)

```
┌──────────────────────────────────────────────────────┐
│  Importing 44 secrets...                              │
│                                                       │
│  ██████████████████████░░░░░░░░  32 / 44             │
│                                                       │
│  Encrypting and saving secrets...                     │
│  Do not close this window.                            │
└──────────────────────────────────────────────────────┘
```

- Progress bar driven by `onProgress` callback from `batchCreateSecrets`
- Encryption happens per-secret before batch write
- The progress updates as each chunk commits
- Do not show individual secret names during progress (reduces flicker, avoids accidentally displaying values in a shared screen context)

### 9.7 Step 5 — Complete (`ImportComplete.tsx`)

```
┌──────────────────────────────────────────────────────┐
│  ✓ Import Complete                                    │
│                                                       │
│  44 secrets imported successfully                     │
│  0 failed                                             │
│                                                       │
│  ⚠  Remember to delete the exported file from your   │
│     Downloads folder — it contains unencrypted data. │
│                                                       │
│              [View My Vault]                          │
└──────────────────────────────────────────────────────┘
```

If any failed:
```
│  42 imported · 2 failed                              │
│  ▸ Show failed items                                 │
```

"View My Vault" → close wizard, navigate to VaultPage.

---

## 10. State Management

Add to `packages/ui/src/stores/uiStore.ts`:

```typescript
interface UIState {
  // ... existing fields ...

  // Import wizard state
  isImportWizardOpen: boolean;
  importSource: 'bitwarden' | 'onepassword' | null;
  openImportWizard: (source: 'bitwarden' | 'onepassword') => void;
  closeImportWizard: () => void;
}
```

Import wizard's internal step/candidate state lives in local React state inside `ImportWizard.tsx` — it does not need to be in Zustand because it is ephemeral UI state that only matters while the wizard is open.

---

## 11. Firestore Rules Update

No changes required to `firebase/firestore.rules`. The imported secrets use the same `users/{uid}/secrets/{secretId}` path as manually created secrets, and are subject to the same `request.auth.uid == userId` rule.

---

## 12. `jszip` Dependency

Add `jszip` to `packages/ui/package.json` only (not `packages/core`):

```json
"dependencies": {
  "jszip": "3.10.1"
}
```

Import it lazily in `onepassword-1pux.ts` using dynamic import to avoid bundle size impact for users who never import from 1Password:

```typescript
const JSZip = await import('jszip');
```

---

## 13. Testing

### 13.1 Unit Tests — Parsers

Create test fixture files in `packages/core/src/importers/__tests__/fixtures/`:

```
fixtures/
├── bitwarden-sample.json      ← realistic Bitwarden export with all item types
├── bitwarden-encrypted.json   ← { "encrypted": true } (should throw)
├── onepassword-sample.csv     ← realistic 1P CSV
└── onepassword-sample.1pux   ← realistic 1P 1PUX (ZIP binary)
```

```typescript
// packages/core/src/importers/__tests__/bitwarden.test.ts

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { parseBitwardenExport } from '../bitwarden.js';

const SAMPLE = readFileSync('./fixtures/bitwarden-sample.json', 'utf-8');
const ENCRYPTED = readFileSync('./fixtures/bitwarden-encrypted.json', 'utf-8');

describe('parseBitwardenExport', () => {
  it('parses secure notes into candidates', () => {
    const result = parseBitwardenExport(SAMPLE);
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.sourceFormat).toBe('bitwarden-json');
  });

  it('throws on encrypted exports', () => {
    expect(() => parseBitwardenExport(ENCRYPTED)).toThrow('encrypted');
  });

  it('skips credit cards and identities', () => {
    const result = parseBitwardenExport(SAMPLE);
    expect(result.skippedItems).toBeGreaterThan(0);
  });

  it('infers OpenAI service for matching names', () => {
    const result = parseBitwardenExport(SAMPLE);
    const openai = result.candidates.find(c => c.name.includes('OpenAI'));
    expect(openai?.service).toBe('OpenAI');
  });

  it('marks all candidates as selected by default', () => {
    const result = parseBitwardenExport(SAMPLE);
    expect(result.candidates.every(c => c.selected)).toBe(true);
  });

  it('never produces a candidate with an empty value', () => {
    const result = parseBitwardenExport(SAMPLE);
    expect(result.candidates.every(c => c.value.trim() !== '')).toBe(true);
  });
});
```

### 13.2 Integration Test — Full Import Flow

```typescript
// packages/core/src/importers/__tests__/integration.test.ts
// Uses Firebase Emulator

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { parseBitwardenExport } from '../bitwarden.js';
import { batchCreateSecrets } from '../../firestore.js';
import { deriveKey } from '../../crypto.js';

describe('Full Bitwarden import flow', () => {
  it('parses, encrypts, and writes secrets correctly', async () => {
    const candidates = parseBitwardenExport(SAMPLE_JSON).candidates.slice(0, 5);
    const key = await deriveKey('test-password', 'test-uid', 'c2FsdA==');
    
    const result = await batchCreateSecrets('test-uid', key, candidates);
    
    expect(result.imported).toBe(5);
    expect(result.failed).toBe(0);
    // Verify secrets were written (using Firestore emulator)
  });
});
```

---

## 14. Security Checklist

Before shipping, verify:

- [ ] The imported JSON/CSV file is read using `FileReader` only — never uploaded to any server
- [ ] `parseBitwardenExport` and `parse1PasswordCsv` are pure synchronous functions — they never make network calls
- [ ] All candidate `value` fields are encrypted with `encrypt(key, value)` before being written to Firestore
- [ ] No candidate value ever appears in a log statement
- [ ] The `ImportCandidate` objects (which contain plaintext values) are held in React state only during the wizard session and garbage collected when the wizard closes
- [ ] After `batchCreateSecrets` completes, call `candidates.length = 0` to clear the array reference
- [ ] Test that canceling the wizard at Step 3 does not write anything to Firestore

---

## 15. Settings Page Location

The import feature lives under:
**Settings → Import & Export**

Section layout:
```
Import & Export

Import Secrets
  Migrate your existing secrets from another manager.
  [Import from Bitwarden]   [Import from 1Password]

Export Vault (V2)
  Download an encrypted backup of your vault.
  [Export as Encrypted JSON]
```

---

*End of Import Feature Spec. Implement in order: TypeScript types → inferService/inferType → parseBitwardenExport → parse1PasswordCsv → parse1PasswordOnePux → batchCreateSecrets → ImportWizard UI steps. Tests for parsers before any UI work.*
