# Scync — Agent Context Pack (verified 2026-09-02)

Read this file FIRST before doing any work in this repo. It is the distilled, **code-verified**
reference for the whole project and the **single architecture reference** — so you should not need
to re-read the entire codebase. When a task needs fine detail, jump to the specific files listed per
section. (The old `SCYNC_ARCHITECTURE.md` was deleted on 2026-09-02 as superseded by this file.)

## 0. What Scync Is

Open-source **zero-knowledge secrets manager** for solo developers. Web (React PWA) + Electron
desktop. Production web: scync.space (Netlify). Repo: github.com/hariharen9/Scync (MIT).
Core loop: unlock vault → find secret → copy value. The Firebase backend only ever sees
**encrypted blobs + plaintext metadata** — no server code, no Cloud Functions.

## 1. Repo layout (verified — no other packages exist)

- `apps/web` — React 18 + Vite app (the product). PWA via vite-plugin-pwa.
- `apps/desktop` — Electron 33 shell that serves the built `apps/web/dist` over a local HTTP server.
- `packages/core` (`@scync/core`) — crypto, Firestore, types, domain logic. `"main": "src/index.ts"` (consumed directly by Vite, no build step). **Not React-aware.**
- `packages/ui` (`@scync/ui`) — React components, Zustand stores, hooks, theme. `"main": "src/index.ts"`.
- `firebase/` — `firestore.rules` + `firestore.indexes.json` (Firestore only; **no hosting config** — Netlify hosts).
- There is **no** `apps/mobile`, **no** `packages/cli` (docs mention them; they don't exist).
- Root env: `apps/web` reads env from repo root via `envDir: '../../'` → real config lives in **root `.env.local`** (Firebase keys + emulator flag). `apps/web/.env.example` is a leftover copy; root `.env.example` is canonical. Firebase emulators activate when `VITE_USE_EMULATORS === 'true'` (auth :9099, firestore :8080).

Tech (from manifests): TS strict; React 18 + Vite 8; Tailwind v4 (`@tailwindcss/vite`); Zustand 4; Firebase 10; framer-motion 11; react-icons 5 + lucide-react; lenis (smooth scroll); core deps: node-forge, otpauth, qrcode; ui deps also: @tanstack/react-virtual (unused now), jsqr, tailwind-merge, clsx.

## 2. Zero-knowledge crypto pipeline (packages/core/src/crypto.ts — the ONLY crypto entry point)

- Key derivation: `deriveKey(password, uid, saltBase64)` — PBKDF2, **SHA-256, 310,000 iterations**,
  16-byte random salt (`generateSalt()`, base64), input material = **`password + uid` concatenated**,
  output = non-extractable AES-256-GCM 256-bit `CryptoKey` (usages encrypt/decrypt). Salt + verifier
  are stored in Firestore `/users/{uid}/meta/vault`.
- `encrypt(key, plaintext)` → `{ iv, ciphertext }` (AES-256-GCM, random 12-byte IV, base64 fields);
  `decrypt(key, field)` → string. GCM auth tag = integrity check.
- Vault verification: verifier = `encrypt(key, "Scync_VALID_v1")`. Wrong password ⇒ GCM auth failure ⇒ `checkVerifier` returns false. **No password hash is ever stored.**
- base64 helpers: `utf8Encode/Decode`, `base64Encode/Decode` (standard b64), plus base64url
  `bufferToBase64Url` / `base64UrlToBuffer` (WebAuthn + share keys).
- **Never write bespoke crypto anywhere else.** UI code only calls store actions wrapping core.
- Note: derived key is plain `CryptoKey` object stored in Zustand memory; `lock()` just nulls it.

### Biometric unlock — WebAuthn PRF (packages/core/src/webauthn.ts)
- `registerBiometrics(email, displayName, masterPasswordPlain)` → per-registration random 32-byte
  PRF salt + challenge; `navigator.credentials.create` with `extensions.prf.eval.first = salt`,
  userVerification required, residentKey preferred, ES256/RS256. PRF output (hardware-derived,
  deterministic per credential+salt) is imported as AES-GCM `importPrfKey` and used to **wrap the
  master password** → returns `{ credentialId, salt, encMasterPassword }` (salt & credentialId base64url).
- `unlockWithBiometrics(credentialId, salt, encMasterPassword)` — `credentials.get` with allowCredentials
  + same PRF salt, unwraps the master password, returns plaintext password (then normal `verifyPassword`).
- `VaultMeta.biometrics` is an **array** `BiometricMeta[]` (multiple devices supported; HEAD feature).
  `getVaultMeta` migrates a legacy singular `biometric` field into the array. Password change
  **wipes all biometrics** (`updateVaultBiometrics(uid, null)`).
- Unlock flow (`vaultStore.verifyBiometrics`/`unlockWithBiometrics`) iterates entries until one authenticates.

### Zero-knowledge sharing keys
- `generateShareKey()` — fresh extractable AES-256-GCM-256 key (independent of vault key);
  `exportShareKey` → base64url for the **URL fragment**; recipient `importShareKey` re-imports it
  **non-extractable, `['decrypt']` only**. The fragment (`#key`) never reaches the server.

## 3. Firestore data model (packages/core/src/firestore.ts = all CRUD + subscriptions)

Subcollections under `users/{uid}` (plaintext metadata + `EncryptedField`s; serverTimestamp writes):

| Collection | Entity | Encrypted | Plaintext metadata |
|---|---|---|---|
| `meta/vault` | VaultMeta `{salt, verifier, createdAt, biometrics[]}` | verifier | salt, biometric meta |
| `secrets` | StoredSecret | `encValue`, `encNotes` | name, service, type, environment, status, lastRotated, expiresOn, projectId, remainingCodes |
| `passwords` | StoredPassword | `encPassword`, `encNotes` | name, username, url, category |
| `ssh_keys` | StoredSSHKey | `encPrivateKey` | name, type, publicKey, fingerprint, hosts[], rotationDate |
| `totp_tokens` | StoredTOTP | `encSecret` | issuer, label, algorithm(SHA1/256/512), digits(6/8), period(30/60), icon |
| `certificates` | StoredCertificate | `encCertPem`, `encKeyPem` | name, subject, issuer, serialNumber, validFrom/To, isSelfSigned, fingerprint, hosts[] |
| `projects` | Project `{name, color, icon, description}` | — | all |
| `services` | CustomService `{name, color, icon}` | — | all |

Root collection: `shares/{shareId}` `{encValue, secretName, service, type, expiresAt, viewsAllowed|null, viewsUsed, createdByUid, projectId, createdAt}` — publicly readable ciphertext only.

Key API (all async unless noted): `setupVault`, `getVaultMeta`, `updateVaultBiometrics`,
`changeVaultPassword(uid, oldKey, newKey, newSalt, newVerifier, secrets, sshKeys, totpTokens, certificates, passwords)`
(**atomic `writeBatch` re-encrypt of all five domains**), per-domain
`create*/update*/delete*/subscribeTo*` (`subscribeToX(uid, cb)` returns unsubscribe; data `.toDate()`-converted),
`decryptSecret/decryptPasswordItem`, `createProject/updateProject/deleteProject` (delete does NOT move secrets —
orphans become uncategorized; signature takes `_moveSecretsTo` but ignores it), `createService/updateService/deleteService`,
`deleteUserAccountData(uid)` (one batch — **assumes <500 docs/user, no chunking**), and sharing:
`createShare(uid, ShareConfig) → full URL` (`window.location.origin` else `https://scync.space`),
`fetchUserShares`, `subscribeToUserShares`, `revokeShare`, `consumeShare(shareId, keyFragment) → DecryptedShare`
(**transactional**: read → expiry/view checks → client-side decrypt → atomic `viewsUsed+1`, so concurrent
consumers can't over-deliver and a failed decrypt consumes no view).
- Subscriptions are whole-collection `onSnapshot` with **no orderBy/where** (client-side filtering everywhere).
- Composite indexes in `firebase/firestore.indexes.json` (status/service/type/environment × createdAt DESC) are **unused**.
- Type model (types.ts): `ServiceName = string`; 14 `SecretType`s (API Key … 'Password', 'Recovery Codes', 'Other'); 8 `Environment`s; status `Active|Rotated|Expired|Revoked`; every sensitive entity has `Stored*` / `Decrypted*` pairs; `RecoveryCodeSet {codes: [{code, used, usedAt}]}` stored as JSON inside a secret's value; **"secret" ≠ "password"** (see §7).
- Constants (constants.ts): `SERVICES` list, `SECRET_TYPES`, `ENVIRONMENTS`, `STATUSES`,
  `SERVICE_COLORS` (hex accent map — single source of truth, fixed 2026-09-02), `STATUS_COLORS`, `PROJECT_COLORS` (hex map).
  `utils.getAttentionSecrets(secrets)` → expired / expiringSoon (≤30d) / rotationOverdue (>180d) / recoveryCodesLow (≤2) — Active-only except recoveryCodesLow.

### Firestore rules (firebase/firestore.rules)
- `/shares/{shareId}`: create requires auth + `createdByUid == uid`; read = creator auth OR public read while
  not expired and (`viewsAllowed == null` OR `viewsUsed < viewsAllowed`); update public only when diff keys are
  exactly `['viewsUsed']` and `new == old + 1` (unauthenticated view-counter increment, now issued inside a
  `runTransaction`); delete = creator only.
- **Per-user scoping (fixed 2026-09-02)**: `/users/{uid}` and all descendants are gated by
  `request.auth.uid == uid` — no cross-user read/write. The old permissive catch-all
  (`allow read, write if request.auth != null`) is gone. NOTE: requires `firebase deploy --only firestore:rules`.

## 4. Domain logic in core (small modules)

- `ssh.ts` — `generateSSHKeyPair(comment, 'rsa'|'ed25519')`: RSA-4096 via node-forge (PKCS#1 `RSA PRIVATE KEY` PEM,
  OpenSSH public, `MD5:` fingerprint); ed25519 via WebCrypto `Ed25519` + manual OpenSSH blob packing + PKCS#8 `PRIVATE KEY` PEM.
- `totp.ts` — otpauth wrapper: `generateTOTPCode(config)`, `parseTOTPUri(uri)` (null unless TOTP),
  `buildTOTPUri`, `getRemainingSeconds(period)`, `validateBase32`, `generateTOTPSecret`.
- `certificates.ts` — node-forge `parseCertificatePem` (subject/issuer/serial/validity/SHA-256 colon fingerprint/SANs, CN fallback),
  `validateCertKeyPair` (**RSA modulus comparison only** — EC/PKCS#8 keys return false), `detectPemType`.
- `passwordImport.ts` — CSV parsers for Google / Bitwarden / 1Password / Apple Keychain / LastPass →
  `ImportedPassword {name, url, username, password, notes, category?}`; robust quoted-CSV parser; `normalizeImportName` (hostname/TLD logic, 'Unnamed' fallback). Bitwarden: exact headers `type,name,login_uri,login_username,login_password,notes,folder`, imports only type login/''. LastPass exact: `name,url,username,password,extra,grouping`. 1Password/Apple fuzzy header matching. Rows without password are skipped; parsers throw on bad header sets.
- Only test: `src/__tests__/crypto.test.ts` (vitest, polyfills webcrypto).

## 5. State layer (packages/ui/src/stores) — 6 plain Zustand stores, no middleware

- **vaultStore** (`vaultStore.ts`, the heart): state `derivedKey: CryptoKey|null`, `isLocked` (initial true),
  `vaultMeta`, and five **ciphertext-only** arrays: `storedSecrets/storedSSHKeys/storedTOTPs/storedCertificates/storedPasswords`.
  Actions: `unlock(password, uid)`, `verifyPassword`, `verifyBiometrics`, `lock()` (nulls key),
  `initializeVault(password, uid)` (salt+key+verifier+setupVault), `changeVaultPassword(uid, old, new)`,
  `exportVault(uid, password)` (returns all five lists), per-domain `create/update/delete/decrypt<X>` +
  `subscribeTo<X>(uid)` (subscriptions write arrays via onSnapshot), `unlockWithBiometrics(uid)`,
  `addBiometric(uid, password)` / `removeBiometric(uid, index)` / `clearAllBiometrics(uid)`.
  **Plaintext is NEVER cached — decrypt-on-demand per call from the ciphertext arrays.** All write/decrypt
  actions throw `"Vault is locked"` if `derivedKey` absent; deletes pass only uid+id.
- **uiStore**: `activeView: 'dashboard'|'project'|'all'|'ssh'|'totp'|'certs'|'passwords'`; boolean per-modal flags
  (`isAddModalOpen`, `isEditModalOpen`, `isEnvImportModalOpen`, `isAddProjectModalOpen`, `isAddServiceModalOpen`,
  `isAddSSHModalOpen`, `isAddTOTPModalOpen`, `isAddCertModalOpen`, `isAddPasswordModalOpen`,
  `isPasswordImportModalOpen`, `isAboutModalOpen`, `isSettingsModalOpen`, `isCommandBarOpen`, `isMobileMenuOpen`);
  `selectedSecretId`; `confirmConfig` (global ConfirmModal contract `{title, message, confirmText?, danger?, onConfirm}`);
  `settings {theme, inactivityLockMinutes|null, windowBlurLock}` persisted in `localStorage['scync_settings']`;
  `filter: VaultFilter {service,type,environment,status,projectId,search}`, `sortBy/sortOrder`
  (updatedAt desc default). Matching `open*/close*` actions; `setFilter/clearFilters/setSortBy/setSortState`.
- **authStore**: `user`, `isLoading`; `signInWithGoogle()` (**popup**, NOT redirect), `signInWithEmail(email, password)`
  and `registerWithEmail(email, password)` (email/password — added 2026-09-02; emails trimmed + lowercased);
  `signOut()`; `deleteUserAccount()` → core `deleteUserAccountData` + `deleteUser` with one
  `auth/requires-recent-login` re-auth retry. Also exports `getAuthErrorMessage(error)` mapping Firebase codes
  to honest copy (incl. "you made these up — unrecoverable" messaging).
- **projectStore / serviceStore**: thin subscribe/CRUD wrappers + `selectedProjectId/selectProject(id|null)` (projects).
- **shareStore**: `activeShares`, `isLoadingShares`; `createShare` (URL + list refresh), `revokeShare`,
  `subscribeToShares`, `fetchActiveShares`, `consumeShare`.
- **Hooks**: `useClipboard` (`copy(text)` → `hasCopied` 2 s **+ clears clipboard after 30 s if unchanged`);
  `useInactivityLock` (listens mousedown/mousemove/keypress/scroll/touchstart; `lock()` after
  `inactivityLockMinutes`; locks on window blur / visibility hidden when `windowBlurLock`).
- **Known store bugs**: `AuthGuard` now calls `reset()`/`resetSession()` on all stores whenever the auth user
  changes (sign-in/sign-out/switch) — fixed 2026-09-02. Remaining: `changeVaultPassword` returns false if
  post-commit biometric wipe/meta fetch fails (data already migrated); `addBiometric(uid, …)` passes uid as
  the registerBiometrics **email** arg; subscription arrays have no orderBy.
- `utils/portableVaultTemplate.ts` — `generatePortableVault(export, uid)` builds a self-contained,
  self-decrypting **HTML** export (embedded base64 JSON, PBKDF2 unlock with verifier-constant check) that
  decrypts and lists **all five domains**: secrets (search + Copy Value/Notes), passwords (Copy Username/
  Password/Notes), SSH keys (Copy Public/Private Key), TOTP (Copy Base32 Secret) and certificates
  (Copy Cert PEM / Private Key). Plaintext is never rendered inline — copy-only (fixed 2026-09-02).

## 6. Barrel exports

- `packages/ui/src/index.ts` re-exports: components (~36 modules),
  the 6 stores, `useInactivityLock` + `useClipboard` hooks (⚠ `useClipboard` and `RecoveryCodeViewer` are
  **NOT** exported from index.ts — import them from their file path), theme (`theme.css` imported by
  `apps/web/src/index.css`). `packages/core/src/index.ts` re-exports all core modules.
- `apps/web/src/pages` exports are page components only (not via @scync/ui).

## 7. UI semantics you must know

- **Secret vs Password**: `secrets` = developer items with type/env/status/expiry/rotation/project/remainingCodes
  (SecretForm, SecretCard/List/Detail, AddEditModal). `passwords` = website-login credentials
  (name/username/url/category) in a separate collection and separate nav view `'passwords'`
  (PasswordDashboard/PasswordModal/PasswordImportModal). 'Password' ALSO exists as one of the 14 SecretTypes
  (e.g. "Legacy Server Root"). They never mix in lists/filters/dashboard charts.
- **Reveal/copy model** (taste requirement): copy is only available **after** reveal (MaskedValue hides the copy
  button while masked); secret copy re-decrypts on demand; MaskedValue auto-hides after **15 s**;
  `useClipboard` clears the clipboard after **30 s**. Some components (SSH/TOTP/cert dashboards, CommandBar,
  ShareModal) use bare `navigator.clipboard.writeText` with no auto-clear — flagged inconsistency.
- Recovery Codes secret: value = JSON `{codes:[{code,used,usedAt}]}`; viewer marks codes used via `updateSecret`
  (re-encrypts whole value, sets `remainingCodes`). SecretForm regenerates the set from the textarea of unused codes.
- Dashboards remount on view switch (`<div key={activeView}>` in VaultPage) — local reveal state/timers reset.
- Styling: components use **inline styles referencing theme.css tokens** (`var(--color-*)`, `var(--font-sans)` = Syne,
  `var(--font-mono)` = DM Mono) + framer-motion + react-icons/fi. Tailwind utilities mainly in apps/web shell.
  Dark mode = `.dark` class on `<html>`. Brutalist: sharp edges, uppercase mono labels, green accent
  (`#059669`/`#10b981`), hairline-separator trick `gap-1` + `background: var(--color-border)`.

## 8. App shell & pages (apps/web)

- **No router library.** `App.tsx`: pathname `/share/...` → public `ShareConsumePage`
  (`shareId = path.split('/')[2]`, key from `location.hash`); else
  `ErrorBoundary > ReactLenis > AuthGuard(fallback=AuthPage) > VaultGuard(setupFallback=SetupPage,
  unlockFallback=UnlockPage) > VaultPage + CommandBar`, global `ConfirmModal`, global Cmd/Ctrl+K listener,
  theme application. AuthGuard = onAuthStateChanged + loading screen. VaultGuard = `getVaultMeta` → hasMeta
  (setup vs unlock) with `isLocked` gate.
- **VaultPage**: registers ALL subscriptions once per user (secrets, ssh, totp, certs, passwords, projects,
  services); renders content by `activeView`; `selectedSecretId` → animated detail panel (sticky desktop /
  draggable bottom-sheet mobile); renders all modals; footer.
- **AuthPage** (marketing landing). All three CTAs (nav/hero/footer) open **`SignInOverlay`**
  (`apps/web/src/components/SignInOverlay.tsx`, portaled, CSS in SignInOverlay.css): Google button +
  email/password Sign-in / Create-account tabs, a "generate a random email & password" helper (CSPRNG),
  and an explicit explainer — made-up login is allowed & must be saved (no recovery), the login is only
  auth, and the Vault Master Password (next screen) is the real, unrecoverable key; vault is tied to the
  login that created it. Email/password must be enabled in Firebase Console (Auth → Sign-in method).
- **SetupPage** (vault creation: password ≥8 chars + uppercase + digit + confirm; warns there is no password
  recovery; **no portable-vault import option**), **UnlockPage** (password + biometric unlock; in-memory 5-attempt
  lockout — attempt 3 → 60 s wait, attempt 5 → auto sign-out; **no forgot-password/resetVault anywhere**).
- PWA via vite-plugin-pwa (autoUpdate SW); `__APP_VERSION__` from git tag via `git describe --tags --abbrev=0`
  (empty in dev); theme applied in App.tsx.

## 9. Desktop shell (apps/desktop)

- `main.ts`: dev loads `http://localhost:5173` (hardcoded default, `VITE_DEV_SERVER_URL` override, file fallback);
  prod finds the web build (`process.resourcesPath/app` | `../app`) and serves it over a **local HTTP server on
  `127.0.0.1` with an ephemeral port** (listen(0)) with SPA fallback — this is what makes Firebase Google Auth
  work (no file:// CORS issues). webPreferences: `nodeIntegration:false, contextIsolation:true` but
  **`sandbox:false` AND `webSecurity:false`**. UA spoofing strips `Electron/x` + `Scync/x` tokens so Google Auth
  popups work. Window-open/navigation allowlists are substring checks (firebaseapp.com, accounts.google.com,
  http://localhost), else `shell.openExternal`. Global shortcut Ctrl+Shift+S re-shows window.
  **No single-instance lock.** `preload.ts` exposes `window.electronAPI {platform, isDesktop}` — currently
  **never consumed** (dead API). electron-builder: NSIS (win x64) + DMG (mac x64+arm64), web dist as extraResource `app`.
- All package manifests were aligned to `2.0.0` (2026-09-02) to match the latest git tag `v2.0.0`.

## 10. Build / CI / deploy

- Turborepo + pnpm 9. Root scripts: `dev/build/test/typecheck/lint` (turbo run). Package scripts:
  web `build` = `tsc -b && vite build`; desktop `build:electron` = tsc; core/ui have `test` (vitest run) + `typecheck`.
  CI (PR→main): lint (web only) → typecheck (core+ui) → build (web). Release (`v*` tag): build web with 6
  `VITE_FIREBASE_*` secrets → Windows NSIS x64 (unsigned, CSC_IDENTITY_AUTO_DISCOVERY:false) + macOS DMG
  (unsigned) → GitHub release. Netlify: `pnpm build --filter web`, publish `apps/web/dist`, node 22 / pnpm 9.
- `.gitignore` covers `.env.local`, dist, node_modules, .turbo, `.commandcode`.

## 11. Conventions & taste

- CONTRIBUTING: feature branches off `main`; strict TS; Tailwind via shared design tokens; crypto ONLY via
  core crypto.ts; Zustand for state; Vitest (Playwright mentioned but no E2E in repo).
- `.commandcode/taste/taste.md` (product rules): copying sensitive values **must require an explicit reveal
  action first** (no silent/background decryption); prefer hiding unavailable actions over disabled ones;
  inline hints explaining interactions; obvious focus states (accent border/glow, not subtle shade shifts).
- Zero-build packages point `main` at `src/index.ts`; barrel exports; `Stored*`/`Decrypted*` type pairs;
  real-time via onSnapshot; non-extractable keys; clipboard hygiene where useClipboard is used.

## 12. Known bugs / gotchas (verified)

Fixed 2026-09-02 (details in HANDOFF): Firestore per-user ownership rules; store reset on auth change;
CSPRNG password generator; transactional share consumption; hex `SERVICE_COLORS` single source (Dashboard,
SecretCard, SecretDetail); portable vault covers all five domains; manifests aligned to v2.0.0.

Remaining:
1. **Firestore rules are edited but NOT yet deployed** — run `firebase deploy --only firestore:rules`.
2. **changeVaultPassword** reports failure if post-batch biometric wipe/meta fetch throws (state/meta already committed).
3. **Imports are non-atomic**: EnvImportModal has no try/catch around the write loop (can strand on spinner);
   PasswordImportModal aborts mid-loop on first failure leaving partial imports. `.env` parser: no
   `export KEY=`, escapes, or multi-line values; "Keep Both" with duplicate keys → unbounded duplicates.
4. **CommandBar copies secrets without useClipboard** → no 30 s clipboard clear.
5. PasswordDashboard delete on last page can strand `currentPage > totalPages` (empty page while items exist).
6. TOTP dashboards keep plaintext secrets in refs for dashboard lifetime; per-second `tick` console.warn spam;
   delete uses `find(...)!` (potential crash between renders).
7. SSH config generator: `IdentityFile ~/.ssh/<slug>` (no extension) vs exports named `<slug>.pem`/`.pub`.
8. Certificate dashboard: private key has no copy button and is excluded from export.
9. RecoveryCodeViewer allows copy while masked; Mark Used has no confirm.
10. VaultGuard doesn't reset `hasMeta` on relock; meta-fetch errors route to the setup screen.
11. Desktop: `sandbox:false`, `webSecurity:false`, no single-instance lock; preload API unused.
12. AddEditModal re-seeds form when `storedSecrets` identity changes (subscription refresh during edit).
13. MaskedValue copy-before-reveal is impossible by design; SecretDetail decrypts on open (plaintext in state
    even while masked) — broader exposure than SecretCard's reveal-on-demand.
14. Modal chrome/input styles/icon-picker duplicated across AddProjectModal/AddServiceModal/SecretForm/others
    (no shared Modal base); Dropdown/DatePicker share portal/coords scaffolding; no Escape handling in modals;
    ConfirmModal has no exit animation and swallows onConfirm errors (stays open on rejection).

## 13. Useful commands

- `pnpm dev` (turbo dev; web Vite dev server default port 5173), `pnpm build`, `pnpm test`, `pnpm typecheck`,
  `pnpm lint`. Env: root `.env.local`; emulator flag `VITE_USE_EMULATORS=true`.
