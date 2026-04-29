# Scync Feature Spec — Vault CLI (`scync-cli`)
**Version:** 1.0  
**Feature ID:** FEAT-003  
**Target Release:** V2  
**Status:** Ready for Implementation  
**Depends on:** Core spec sections 6, 8, 10, 15, 24

---

## 1. Overview

The Vault CLI is a Node.js command-line tool that lets developers access their Scync vault directly from the terminal. It exposes the same zero-knowledge architecture as the web app — secrets are fetched as encrypted blobs from Firestore and decrypted locally in the Node process using Node's native `crypto.subtle` API. The server never sees plaintext. The vault password is never stored.

**The killer use case:**
```bash
# Inject a secret directly into a shell command — no hardcoding
OPENAI_API_KEY=$(scync get OPENAI_KEY) node my-script.js

# Load an entire project's secrets into the current shell session
eval $(scync env --project "Side Project")

# Pipe directly to clipboard
scync get STRIPE_SECRET | pbcopy
```

**npm package name:** `scync-cli`  
**Install command:** `npm install -g scync-cli`  
**Binary name:** `scync`

---

## 2. Architecture Principles

### 2.1 Zero-Knowledge Preserved
- All secrets are fetched from Firestore as encrypted `EncryptedField` objects (`{ iv: string, ciphertext: string }`)
- Decryption happens inside the Node.js process using `globalThis.crypto.subtle` (Node 18+)
- The vault password is prompted interactively and held in memory for the session only
- The vault password is **never** written to disk, config file, environment variable, shell history, or any log
- The derived `CryptoKey` is held in memory for the session and discarded on process exit

### 2.2 Crypto Parity
Node.js 18+ ships the Web Crypto API at `globalThis.crypto.subtle` — the **exact same spec** as the browser. The CLI's crypto module is a direct copy of `packages/core/src/crypto.ts` with zero modifications. This guarantees that the same vault password decrypts correctly in both the browser and the CLI.

### 2.3 Authentication Strategy
The web app uses Firebase Google Sign-In (browser popup). The CLI uses **Firebase REST API device auth flow**:
1. User runs `scync login` → CLI opens a browser URL
2. User signs in with Google in their browser
3. Firebase returns a refresh token
4. CLI stores only the refresh token in `~/.scync/auth.json`
5. On every subsequent command, CLI exchanges the refresh token for a fresh ID token via Firebase REST API
6. The ID token authenticates all Firestore REST API calls

The refresh token is the only persistent credential. It does not decrypt secrets — it only proves Google identity to Firebase, which grants read/write access to the user's own Firestore documents (the encrypted blobs).

### 2.4 Firestore Access via REST API
The CLI uses the **Firestore REST API** directly — no Firebase JS SDK. This keeps the CLI lightweight (no 300KB SDK bundle) and avoids Node.js SDK dependency complexity.

Base URL: `https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents`

All requests include `Authorization: Bearer {idToken}` header.

---

## 3. Monorepo Placement

Add a new package to the existing Turborepo monorepo:

```
Scync/
├── packages/
│   ├── core/          ← existing
│   ├── ui/            ← existing
│   └── cli/           ← NEW PACKAGE
│       ├── src/
│       │   ├── index.ts           ← CLI entry point, commander setup
│       │   ├── auth.ts            ← Firebase device auth, token management
│       │   ├── crypto.ts          ← Copy of packages/core/src/crypto.ts
│       │   ├── firestore.ts       ← Firestore REST API client
│       │   ├── config.ts          ← Config file read/write (~/.scync/)
│       │   ├── session.ts         ← In-memory session (vault key, uid)
│       │   ├── prompt.ts          ← Interactive password prompt (hidden input)
│       │   └── commands/
│       │       ├── login.ts       ← scync login
│       │       ├── logout.ts      ← scync logout
│       │       ├── unlock.ts      ← scync unlock (prompt vault password)
│       │       ├── list.ts        ← scync list
│       │       ├── get.ts         ← scync get <name>
│       │       ├── copy.ts        ← scync copy <name>
│       │       └── env.ts         ← scync env --project <name>
│       ├── bin/
│       │   └── scync.js           ← Shebang entry: #!/usr/bin/env node
│       ├── package.json
│       └── tsconfig.json
```

---

## 4. Package Configuration

### 4.1 `packages/cli/package.json`

```json
{
  "name": "scync-cli",
  "version": "1.0.0",
  "description": "Terminal access to your Scync zero-knowledge secrets vault",
  "bin": {
    "scync": "./bin/scync.js"
  },
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest"
  },
  "dependencies": {
    "commander": "11.1.0",
    "open": "10.0.3",
    "chalk": "5.3.0",
    "ora": "8.0.1",
    "prompts": "2.4.2"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "vitest": "1.2.2",
    "@types/node": "20.11.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Dependency rationale:**
- `commander` — CLI argument parsing and subcommand routing
- `open` — cross-platform browser opener for `scync login`
- `chalk` — terminal color output (masked values in red, success in green, etc.)
- `ora` — spinner for async operations (deriving key, fetching from Firestore)
- `prompts` — secure password prompt with hidden input (no echo to terminal)
- No Firebase SDK — uses REST API directly to keep bundle small

### 4.2 `packages/cli/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

### 4.3 `packages/cli/bin/scync.js`

```js
#!/usr/bin/env node
import('../dist/index.js');
```

---

## 5. Config and Session Files

### 5.1 `~/.scync/` Directory Structure

```
~/.scync/
├── auth.json          ← Firebase refresh token + uid (written by scync login)
└── config.json        ← User preferences (optional, currently empty)
```

**`~/.scync/auth.json` schema:**
```json
{
  "refreshToken": "...",
  "uid": "abc123",
  "email": "user@gmail.com"
}
```

This file is **not encrypted**. The refresh token grants Firebase identity access only — it cannot decrypt any secret. Firestore security rules ensure that this token can only read/write `users/{uid}/...` documents, which contain only encrypted blobs. Even with a stolen refresh token, an attacker cannot decrypt anything without the vault password.

Permission: set to `chmod 600` on creation (owner read/write only).

### 5.2 Session (In-Memory Only)

```typescript
// src/session.ts
// Module-level singleton — lives for the process lifetime only

interface Session {
  derivedKey: CryptoKey | null;
  uid: string | null;
  idToken: string | null;
}

let session: Session = {
  derivedKey: null,
  uid: null,
  idToken: null,
};

export function setSession(s: Session) { session = s; }
export function getSession(): Session { return session; }
export function clearSession() {
  session = { derivedKey: null, uid: null, idToken: null };
}
```

The `derivedKey` is a non-extractable `CryptoKey` object. It cannot be serialized or written to disk even accidentally.

---

## 6. Auth Module (`src/auth.ts`)

### 6.1 Firebase Device Auth Flow

Firebase supports an OAuth 2.0 device authorization flow via the Identity Platform REST API.

**Step 1 — `scync login` opens browser:**
```
https://accounts.google.com/o/oauth2/auth
  ?client_id={FIREBASE_WEB_CLIENT_ID}
  &redirect_uri=urn:ietf:wg:oauth:2.0:oob
  &response_type=code
  &scope=email+profile+openid
```

**Step 2 — User pastes the auth code back into terminal (or use localhost redirect):**

For a better UX, use a local HTTP server approach:
1. CLI starts a temporary HTTP server on `localhost:9876`
2. Opens browser to Google OAuth with `redirect_uri=http://localhost:9876/callback`
3. User signs in → browser redirects to `localhost:9876/callback?code=...`
4. CLI server captures the code, shuts down, exchanges code for tokens

**Step 3 — Exchange auth code for tokens:**
```
POST https://oauth2.googleapis.com/token
{
  "code": "...",
  "client_id": "{FIREBASE_WEB_CLIENT_ID}",
  "client_secret": "{FIREBASE_WEB_CLIENT_SECRET}",
  "redirect_uri": "http://localhost:9876/callback",
  "grant_type": "authorization_code"
}
```

Response includes: `access_token`, `refresh_token`, `id_token`

**Step 4 — Get Firebase user info:**
```
GET https://www.googleapis.com/oauth2/v1/userinfo
Authorization: Bearer {access_token}
```

Response includes: `id` (this is the Firebase `uid`), `email`

**Step 5 — Write `~/.scync/auth.json`**

### 6.2 Token Refresh (Every Command)

On every CLI command, refresh the ID token before making Firestore calls:

```typescript
// src/auth.ts
export async function getValidIdToken(): Promise<string> {
  const config = readAuthConfig(); // reads ~/.scync/auth.json
  if (!config) throw new Error('Not logged in. Run: scync login');

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${config.refreshToken}`,
    }
  );

  const data = await response.json() as { id_token: string };
  return data.id_token;
}
```

ID tokens expire after 1 hour. Refreshing on every command ensures they're always valid and avoids expiry edge cases.

---

## 7. Crypto Module (`src/crypto.ts`)

This is a **direct copy** of `packages/core/src/crypto.ts`. Do not modify it. Both files must stay in sync.

The only difference: Node 18+ exposes `globalThis.crypto.subtle` automatically — no import needed. The same `btoa`/`atob` functions work in Node 18+.

```typescript
// src/crypto.ts
// IMPORTANT: This file must remain identical to packages/core/src/crypto.ts
// Node 18+ implements the Web Crypto API at globalThis.crypto.subtle

import type { EncryptedField } from './types.js';

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: ArrayBuffer): string {
  return new TextDecoder().decode(b);
}

function base64Encode(b: Uint8Array): string {
  return btoa(String.fromCharCode(...b));
}

function base64Decode(s: string): Uint8Array {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

export function generateSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return base64Encode(salt);
}

export async function deriveKey(
  password: string,
  uid: string,
  saltBase64: string
): Promise<CryptoKey> {
  const inputMaterial = utf8Encode(password + uid);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', inputMaterial, 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64Decode(saltBase64),
      iterations: 310_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<EncryptedField> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    utf8Encode(plaintext)
  );
  return {
    iv: base64Encode(iv),
    ciphertext: base64Encode(new Uint8Array(ciphertext)),
  };
}

export async function decrypt(
  key: CryptoKey,
  field: EncryptedField
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64Decode(field.iv) },
    key,
    base64Decode(field.ciphertext)
  );
  return utf8Decode(plaintext);
}

export async function checkVerifier(
  key: CryptoKey,
  verifier: EncryptedField
): Promise<boolean> {
  try {
    const result = await decrypt(key, verifier);
    return result === 'Scync_VALID_v1';
  } catch {
    return false;
  }
}
```

---

## 8. Firestore REST Client (`src/firestore.ts`)

### 8.1 Base Request Helper

```typescript
// src/firestore.ts

const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function firestoreGet(path: string, idToken: string): Promise<unknown> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error(`Firestore GET failed: ${res.status} ${res.statusText}`);
  return res.json();
}
```

### 8.2 Firestore Document Parsing

Firestore REST API returns documents in a typed format:
```json
{
  "name": "projects/.../documents/users/uid/secrets/secretId",
  "fields": {
    "name":        { "stringValue": "OpenAI Key" },
    "service":     { "stringValue": "OpenAI" },
    "encValue": {
      "mapValue": {
        "fields": {
          "iv":         { "stringValue": "base64..." },
          "ciphertext": { "stringValue": "base64..." }
        }
      }
    }
  }
}
```

Write a parser:
```typescript
function parseField(field: unknown): unknown {
  const f = field as Record<string, unknown>;
  if ('stringValue' in f) return f.stringValue;
  if ('timestampValue' in f) return new Date(f.timestampValue as string);
  if ('nullValue' in f) return null;
  if ('mapValue' in f) {
    const mapFields = (f.mapValue as { fields: Record<string, unknown> }).fields;
    return Object.fromEntries(
      Object.entries(mapFields).map(([k, v]) => [k, parseField(v)])
    );
  }
  return f;
}

function parseDocument(doc: unknown): Record<string, unknown> {
  const d = doc as { fields: Record<string, unknown> };
  return Object.fromEntries(
    Object.entries(d.fields).map(([k, v]) => [k, parseField(v)])
  );
}
```

### 8.3 Fetching Vault Meta

```typescript
export async function getVaultMeta(uid: string, idToken: string): Promise<VaultMeta> {
  const doc = await firestoreGet(`users/${uid}/meta/vault`, idToken);
  return parseDocument(doc) as VaultMeta;
}
```

### 8.4 Fetching All Secrets

```typescript
export async function getAllSecrets(uid: string, idToken: string): Promise<StoredSecret[]> {
  const res = await fetch(
    `${BASE}/users/${uid}/secrets`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  const data = await res.json() as { documents?: unknown[] };
  if (!data.documents) return [];
  return data.documents.map(doc => parseDocument(doc) as StoredSecret);
}
```

---

## 9. Commands — Full Specification

### 9.1 `scync login`

```
$ scync login
```

**Behavior:**
1. Print: `Opening browser for Google Sign-In...`
2. Start local HTTP server on `localhost:9876`
3. Open browser to Google OAuth URL
4. Wait for redirect to `localhost:9876/callback`
5. Exchange code for tokens
6. Write `~/.scync/auth.json` with `chmod 600`
7. Print: `✓ Signed in as user@gmail.com`

**Flags:** none

**Error cases:**
- Browser fails to open → print the URL for manual copy-paste
- OAuth denied by user → print error, exit 1
- Already logged in → print current account, ask to re-login (y/n)

---

### 9.2 `scync logout`

```
$ scync logout
```

**Behavior:**
1. Delete `~/.scync/auth.json`
2. Print: `✓ Signed out`

---

### 9.3 `scync unlock`

```
$ scync unlock
```

**Behavior:**
1. Check `~/.scync/auth.json` exists — if not, print `Not logged in. Run: scync login` and exit 1
2. Refresh ID token
3. Fetch vault meta (`salt`, `verifier`) from Firestore
4. Prompt: `Vault password:` (hidden input — no echo)
5. Derive key using `deriveKey(password, uid, salt)`
6. Check verifier using `checkVerifier(key, verifier)`
7. If wrong → print `✗ Incorrect vault password` and exit 1
8. Store `derivedKey` in session
9. Print: `✓ Vault unlocked`

**How session persistence works across commands:**

The problem: each CLI invocation is a new process. Memory doesn't persist between `scync unlock` and `scync get`.

**Solution: Encrypted session file**

After unlock, write an encrypted session file:
```
~/.scync/session.enc
```

This file stores the raw AES-256-GCM key bytes, encrypted with a **machine-derived key**. The machine-derived key comes from a secret stored in the OS keychain:
- macOS: Keychain via `security` CLI tool
- Linux: `secret-tool` (libsecret) or `~/.scync/.machine-key` with `chmod 600`
- Windows: DPAPI via `node-dpapi` or `~/.scync/.machine-key`

The session file expires after 15 minutes (timestamp embedded in file).

**Simpler alternative (V1 of CLI):** Require `scync unlock` to run in the same shell session using `eval`. Print shell-compatible output:

```bash
# User runs:
eval $(scync unlock)

# scync unlock prints to stdout:
export SCYNC_SESSION_KEY="base64_encoded_raw_key_bytes"
export SCYNC_SESSION_UID="abc123"
export SCYNC_SESSION_EXPIRES="1700000000"

# Subsequent commands read SCYNC_SESSION_* from environment
```

**Implement the `eval` approach for V1. Implement the keychain approach for V2.**

---

### 9.4 `scync list`

```
$ scync list
$ scync list --project "Side Project"
$ scync list --type "API Key"
$ scync list --json
```

**Behavior:**
1. Verify session (check `SCYNC_SESSION_KEY` env var or keychain session)
2. If no session → print `Vault is locked. Run: eval $(scync unlock)` and exit 1
3. Fetch all secrets from Firestore (encrypted blobs)
4. Filter by `--project` or `--type` if specified
5. Print table — do NOT decrypt values, show metadata only

**Default output format:**
```
NAME                        SERVICE     TYPE            ENVIRONMENT   STATUS    EXPIRES
OPENAI_KEY                  OpenAI      API Key         Personal      Active    —
GITHUB_PAT                  GitHub      Personal Access Personal      Active    2025-12-31
STRIPE_SECRET               Stripe      API Key         Production    Active    —
AWS_SECRET_ACCESS_KEY       AWS         API Key         Production    Active    —
```

**`--json` flag output:**
```json
[
  {
    "id": "abc123",
    "name": "OPENAI_KEY",
    "service": "OpenAI",
    "type": "API Key",
    "environment": "Personal",
    "status": "Active",
    "projectId": "proj_xyz",
    "expiresOn": null,
    "lastRotated": "2024-01-15T00:00:00Z"
  }
]
```

Note: `encValue` and `encNotes` are never included in `--json` output.

---

### 9.5 `scync get <name>`

```
$ scync get OPENAI_KEY
$ scync get OPENAI_KEY --show
$ scync get OPENAI_KEY --json
```

**Behavior:**
1. Verify session
2. Fetch all secrets from Firestore
3. Find the secret whose `name` matches `<name>` (case-insensitive, exact match first, then substring match)
4. If not found → print `✗ Secret "OPENAI_KEY" not found` and exit 1
5. If multiple matches → list them and ask user to be more specific
6. Reconstruct `CryptoKey` from session
7. Decrypt `encValue`
8. **Default behavior:** print the plaintext value to stdout with no trailing newline

```bash
$ scync get OPENAI_KEY
sk-abc123xyz...
```

This allows piping: `OPENAI_KEY=$(scync get OPENAI_KEY)`

**`--show` flag:** Wraps output in a warning box instead of raw stdout:
```
⚠  Revealing: OPENAI_KEY
   sk-abc123xyz...
   (value copied from terminal history — consider using: scync copy instead)
```

**`--json` flag:**
```json
{
  "name": "OPENAI_KEY",
  "service": "OpenAI",
  "value": "sk-abc123xyz...",
  "environment": "Personal"
}
```

**Security note:** The value is printed to stdout. If the terminal has logging enabled, the value may appear in logs. For sensitive contexts, recommend `scync copy` instead. Do NOT print the value to stderr.

---

### 9.6 `scync copy <name>`

```
$ scync copy OPENAI_KEY
```

**Behavior:**
1–7 same as `scync get`
8. Write decrypted value to system clipboard
9. Print: `✓ OPENAI_KEY copied to clipboard (clears in 30 seconds)`
10. After 30 seconds, clear clipboard (write empty string)

**Clipboard implementation — cross-platform:**
```typescript
// src/commands/copy.ts
import { execSync } from 'child_process';

function writeToClipboard(text: string): void {
  const platform = process.platform;
  if (platform === 'darwin') {
    execSync('pbcopy', { input: text });
  } else if (platform === 'win32') {
    execSync('clip', { input: text });
  } else {
    // Linux — try xclip, then xsel, then wl-clipboard
    try { execSync('xclip -selection clipboard', { input: text }); return; } catch {}
    try { execSync('xsel --clipboard --input', { input: text }); return; } catch {}
    execSync('wl-copy', { input: text });
  }
}

async function clearClipboardAfter(seconds: number): Promise<void> {
  await new Promise(r => setTimeout(r, seconds * 1000));
  writeToClipboard('');
}
```

---

### 9.7 `scync env`

```
$ scync env
$ scync env --project "Side Project"
$ scync env --format export     (default)
$ scync env --format dotenv
$ scync env --format json
```

**Behavior:**
1. Verify session
2. Fetch all secrets, optionally filtered by project
3. Decrypt ALL values (in parallel — `Promise.all`)
4. Output in requested format to stdout

**`--format export` (default) — for `eval $(scync env)`:**
```bash
export OPENAI_KEY="sk-abc123"
export GITHUB_PAT="ghp_xyz789"
export STRIPE_SECRET="sk_live_abc"
```

**`--format dotenv` — for writing to `.env` file:**
```
OPENAI_KEY=sk-abc123
GITHUB_PAT=ghp_xyz789
STRIPE_SECRET=sk_live_abc
```

**`--format json`:**
```json
{
  "OPENAI_KEY": "sk-abc123",
  "GITHUB_PAT": "ghp_xyz789"
}
```

**Usage patterns:**
```bash
# Load all personal secrets into current shell
eval $(scync env)

# Load a specific project's secrets
eval $(scync env --project "Client X")

# Write to .env file
scync env --format dotenv > .env

# Use in a script without eval
scync env --format json | jq -r '.OPENAI_KEY'
```

**Security warning:** `eval $(scync env)` loads ALL secret values into shell environment variables. All child processes will inherit them. This is intentional — it's the developer's responsibility to scope this appropriately. Print a warning if more than 20 secrets are being loaded.

---

### 9.8 `scync --help` and `scync <command> --help`

```
$ scync --help

Scync CLI — Zero-knowledge secrets vault for your terminal

Usage: scync <command> [options]

Commands:
  login               Sign in with Google (opens browser)
  logout              Sign out and remove stored credentials
  unlock              Unlock your vault (prompts for vault password)
  list                List all secrets (metadata only, no values)
  get <name>          Print a secret value to stdout
  copy <name>         Copy a secret value to clipboard
  env                 Output all secrets as shell exports

Options:
  -h, --help          Display help
  -v, --version       Display version

Examples:
  eval $(scync unlock)
  scync get OPENAI_KEY
  OPENAI_KEY=$(scync get OPENAI_KEY) node script.js
  eval $(scync env --project "Side Project")
  scync env --format dotenv > .env

Documentation: https://github.com/hariharen9/Scync
```

---

## 10. Error Handling

Every command must handle these error cases gracefully:

| Error | Output | Exit Code |
|---|---|---|
| Not logged in | `✗ Not logged in. Run: scync login` | 1 |
| Vault locked | `✗ Vault is locked. Run: eval $(scync unlock)` | 1 |
| Wrong vault password | `✗ Incorrect vault password` | 1 |
| Secret not found | `✗ Secret "NAME" not found. Run scync list to see all secrets.` | 1 |
| Firestore network error | `✗ Could not reach Scync servers. Check your internet connection.` | 1 |
| Firebase auth expired | Silently refresh token; if refresh fails → `✗ Session expired. Run: scync login` | 1 |
| Node version < 18 | `✗ Scync CLI requires Node.js 18 or higher. Current: {version}` | 1 |
| Multiple secrets match | List matches and prompt user to be more specific | 0 |

---

## 11. TypeScript Types (`src/types.ts`)

Copy the following from `packages/core/src/types.ts` — keep in sync:

```typescript
export interface EncryptedField {
  iv: string;
  ciphertext: string;
}

export interface VaultMeta {
  salt: string;
  verifier: EncryptedField;
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthConfig {
  refreshToken: string;
  uid: string;
  email: string;
}
```

---

## 12. Environment Variables

The CLI needs Firebase config to make REST API calls. These are bundled at build time (not secret — same values as the web app's `VITE_FIREBASE_*` vars):

```typescript
// src/config.ts
export const FIREBASE_API_KEY = '...';        // same as VITE_FIREBASE_API_KEY
export const FIREBASE_PROJECT_ID = '...';     // same as VITE_FIREBASE_PROJECT_ID
export const FIREBASE_WEB_CLIENT_ID = '...';  // OAuth 2.0 client ID from Firebase Console
```

These are baked into the published npm package. They are not secret — they identify the Firebase project but cannot access any data without a valid auth token.

---

## 13. Turbo Pipeline Addition

Add to `turbo.json`:
```json
{
  "pipeline": {
    "cli#build": {
      "dependsOn": [],
      "outputs": ["dist/**"]
    }
  }
}
```

Add to `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```
(`packages/cli` is already covered by `packages/*`)

---

## 14. Testing Strategy

### 14.1 Unit Tests (`src/__tests__/crypto.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { deriveKey, encrypt, decrypt, checkVerifier } from '../crypto.js';

describe('CLI crypto parity with browser crypto', () => {
  it('derives the same key behavior as browser implementation', async () => {
    const key = await deriveKey('my-password', 'uid-123', 'c2FsdA==');
    // Encrypt then decrypt to verify round-trip
    const encrypted = await encrypt(key, 'secret-value');
    const decrypted = await decrypt(key, encrypted);
    expect(decrypted).toBe('secret-value');
  });

  it('returns false for wrong vault password', async () => {
    const correctKey = await deriveKey('correct', 'uid', 'c2FsdA==');
    const wrongKey = await deriveKey('wrong', 'uid', 'c2FsdA==');
    const encrypted = await encrypt(correctKey, 'Scync_VALID_v1');
    const result = await checkVerifier(wrongKey, encrypted);
    expect(result).toBe(false);
  });

  it('fresh IV on every encrypt call', async () => {
    const key = await deriveKey('pass', 'uid', 'c2FsdA==');
    const enc1 = await encrypt(key, 'same-value');
    const enc2 = await encrypt(key, 'same-value');
    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });
});
```

### 14.2 Integration Tests

Use Firebase Emulator for Firestore REST API tests. Set `FIRESTORE_EMULATOR_HOST=localhost:8080` environment variable — the Firestore REST API respects this.

---

## 15. Distribution and CI

### 15.1 Publishing to npm

Add to `release.yml` GitHub Actions:
```yaml
- name: Publish CLI to npm
  run: |
    cd packages/cli
    pnpm build
    npm publish --access public
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 15.2 Version Pinning

CLI version tracks the main Scync version. When `v2.0.0` is tagged, `scync-cli@2.0.0` is published simultaneously.

---

## 16. Security Anti-Patterns — Never Do These

These rules apply in addition to the main spec's Section 24.5:

- **NEVER** write the vault password to disk, even temporarily
- **NEVER** write the derived `CryptoKey` raw bytes to disk (it is non-extractable — this is enforced by the Web Crypto API spec)
- **NEVER** log secret values to stdout unless the user explicitly ran `scync get` or `scync env`
- **NEVER** include secret values in error messages
- **NEVER** add the decrypted value to shell history (it goes to stdout, not to readline history)
- **NEVER** use `console.log` for secret output — use `process.stdout.write` directly to avoid any middleware logging

---

## 17. README for npm Package

The `packages/cli/README.md` is what npm.com displays. It must be compelling:

```markdown
# scync-cli

Zero-knowledge secrets vault for your terminal. Access your [Scync](https://github.com/hariharen9/Scync) vault directly from the command line.

## Install
npm install -g scync-cli

## Quick Start
scync login                          # Sign in with Google (opens browser)
eval $(scync unlock)                 # Unlock your vault
scync get OPENAI_KEY                 # Print a secret to stdout
OPENAI=$(scync get OPENAI_KEY) npm start  # Inject into a command
eval $(scync env --project "my-app") # Load all project secrets into shell
scync copy GITHUB_PAT                # Copy to clipboard (clears in 30s)

## Zero-Knowledge
Your vault password never leaves your machine. Secrets are decrypted locally using Node's native crypto.subtle API — the same spec as the browser. The Scync server only ever sees encrypted blobs.

## Requirements
Node.js 18+
A Scync account (free at scync.app)
```

---

*End of CLI Feature Spec. Implement in order: types → crypto → config → auth → firestore → prompt → commands (get first, then list, copy, env, login, logout, unlock). Tests for crypto before any command implementation.*
