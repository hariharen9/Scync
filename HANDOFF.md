# Scync — Handoff Log

Purpose: short, dated record of what changed / was decided each working session, so a later chat only needs
`AGENTS.md` (static reference) + the latest entries here. Append new entries at the TOP under a date heading.
Never put long explanations here — reference files and decisions only.

## 2026-11-18 — Split landing page from the vault app (Option A)

- **Two Vite entries**: `apps/web/index.html` → `src/landing/main.tsx` (standalone marketing),
  `apps/web/app.html` → `src/app/main.tsx` (authenticated vault). Build outputs two independent bundles;
  the landing bundle has no Firebase or `@scync/ui` imports.
- **Landing moved**: `src/pages/AuthPage.tsx` + CSS → `src/landing/LandingPage.tsx` + CSS. All CTAs now
  link to `/app` instead of opening `SignInOverlay`; the landing no longer initializes Firebase.
- **App gate**: `AuthGuard` fallback is the standalone split `SignInPage`
  (`src/pages/SignInPage.tsx` + CSS): brand/explainer/generator left, form right; no overlay/portal.
- **Auth page redesign**: replaced the packed modal with a full-page split layout. Left side carries the
  identity/zero-knowledge explainer, the three-step auth/master-key/recovery flow, and the CSPRNG
  credential generator; right side carries Google + email/password, mode tabs, generated-credential
  handoff, show/hide, copy, and errors. Removed the superseded `SignInOverlay` component and CSS.
- **Routing**: `public/_redirects` maps `/app`, `/app/*`, and `/share/*` to `app.html`; the catch-all stays
  `index.html`. A Vite plugin mirrors the rewrites in dev/preview. `/` is noindex-free marketing; `/app`
  and `/share/*` are noindex/robots-disallowed.
- **PWA**: manifest `start_url` = `/app`, `id` = `/` (preserves existing install identity), `scope` = `/`;
  Workbox navigation fallback `app.html` with an allowlist for `/app` and `/share`.
- Validation: `web` build + typecheck pass; headless Chrome renders landing at `/` and the sign-in gate at
  `/app`; dev rewrites verified for `/`, `/app`, `/share/abc`.

## 2026-10-03 — Removed Desktop completely (Pure Web / PWA only)

- **Removed `apps/desktop/`**: Deleted the entire Electron 33 application (`apps/desktop`).
- **Removed Desktop Release Workflow**: Deleted `.github/workflows/release.yml` (Electron Windows/Mac installers).
- **Cleaned configurations**: Cleaned `.gitignore` (removed `apps/desktop` and `apps/mobile` entries); ran `pnpm install` which pruned all Electron and electron-builder dependencies from `pnpm-lock.yaml`.
- **Cleaned UI & copy**:
  - `packages/ui/src/components/AboutModal.tsx`: Updated "Built as a PWA that runs perfectly across Web, Windows (Electron), and Mobile (Capacitor)" to "Built as a progressive web app (PWA) that runs seamlessly in any modern browser on all devices."
  - `apps/web/src/pages/AuthPage.tsx`: Removed "Web · Desktop · PWA" and desktop hotkey references in favor of Web/PWA and `Cmd/Ctrl+K`.
  - `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SELF-HOSTING.md`, and `AGENTS.md`: Purged all references to desktop builds, Electron, and phantom Capacitor mobile packages.

---

## 2026-09-02 — Email/password sign-in + honest auth-vs-master-password UX

- **Why**: Firebase now has Email/Password enabled; app only offered Google. Landing copy never explained that
  the login is only auth and the vault master password is the real (unrecoverable) key.
- **authStore** (`packages/ui/src/stores/authStore.ts`): `signIn` split into `signInWithGoogle()` (popup),
  `signInWithEmail(email, pwd)` and `registerWithEmail(email, pwd)` (email trimmed/lowercased). Added exported
  `getAuthErrorMessage()` mapping Firebase codes → honest copy ("made-up creds are unrecoverable", etc.).
- **New `apps/web/src/components/SignInOverlay.tsx` + `.css`** — clean dedicated sign-in panel (portaled):
  Google button; email/password tabs Sign in / Create account; 🎲 "generate a random email & password"
  (CSPRNG, `.local` domain, per-field copy); numbered explainer: (1) made-up login allowed but must be saved,
  nobody can reset it, (2) login is only auth, (3) vault Master Password is separate, never stored, forget it =
  data gone, (4) vault is tied to the login that created it — always use the same one. Obvious green focus
  rings per taste rules. Overlay mounts fresh per open (state resets naturally; avoids setState-in-effect lint).
- **AuthPage** (`apps/web/src/pages/AuthPage.tsx`): all three CTAs (nav/hero/footer) now open the overlay
  ("Get started — it's free"); security Layer 1 copy updated to "Google or email & password".
- Validation: turbo typecheck, `web tsc -b`, eslint on changed web files — all clean. (Repo has PRE-EXISTING
  eslint errors in UnlockPage.tsx, vite.config.ts, App.tsx — untouched, CI lint was already red.)
- Manual QA needed: real Firebase flow (create email/password account → Setup → lock/unlock; sign in again).

---

## 2026-09-02 — Bug-fix session (7 items, all verified by typecheck)

1. **Firestore per-user ownership** (`firebase/firestore.rules`): `/users/{uid}` + all descendants now gated by
   `request.auth.uid == uid`; removed the permissive catch-all. Shares: creator may always read own shares
   (fixes Active Shares UI on expired/consumed links). ⚠ **Not deployed — run `firebase deploy --only firestore:rules`.**
2. **Store reset on auth change**: added `reset()` to vault/project/service/share stores and `resetSession()` to
   uiStore (settings preserved); `AuthGuard` invokes all on every auth-uid change (sign-in/out/switch). Fixes
   cross-account derived-key/ciphertext leak.
3. **CSPRNG password generator** (`PasswordModal`): `crypto.getRandomValues` + guaranteed one char per class +
   Fisher–Yates shuffle.
4. **Transactional share consumption** (`firestore.ts` `consumeShare`): now a `runTransaction` — read → validate →
   client-side decrypt → atomic `viewsUsed+1`; wrong key aborts without consuming a view; concurrent consumers
   can't both pass the view limit.
5. **Hex SERVICE_COLORS single source**: `packages/core/src/constants.ts` `SERVICE_COLORS` converted from Tailwind
   class strings to hex (Dashboard's proven palette); Dashboard local duplicate removed + fixed its custom-service
   mapping bug (`s.color` name → `PROJECT_COLOR_MAP` hex). SecretCard/SecretDetail consumers now work.
6. **Portable vault covers all five domains**: SettingsModal `fullExport` now embeds sshKeys/totpTokens/
   certificates/passwords; `portableVaultTemplate.ts` rewritten — unlock verifies `Scync_VALID_v1`, decrypts every
   domain, renders 5 sections with per-field copy buttons (DOM-built, plaintext never rendered inline). Smoke
   tested in Node (script syntax + required IDs, populated & empty vaults).
7. **Version alignment**: root/web/desktop/core/ui manifests → `2.0.0` (matches tag v2.0.0); package-lock root
   entries bumped; `fs.realpath` 1.0.0 dep untouched.

Validation: `pnpm typecheck` (core+ui) and `pnpm --filter web exec tsc -b` pass. AGENTS.md updated accordingly.

---

## 2026-09-02 — Services section collapsible in Sidebar

- **Change**: `packages/ui/src/components/Sidebar.tsx` — Services section is now a collapsible group
  **collapsed by default** (`servicesCollapsed` local state, starts true). Header row (chevron
  right/down + label + count badge when collapsed) toggles it; the "+" add-service button still works
  while collapsed (stopPropagation). Auto-expands when a service filter is active
  (`activeView === 'all' && filter.service`, e.g. set from SecretList) so the active highlight stays visible.
  Service list hoisted to `serviceNames` const. Typecheck passes (`pnpm --filter @scync/ui typecheck`).
- **Note**: collapse state is per Sidebar instance (desktop sticky + mobile drawer), not persisted —
  matches existing hover/rename local-state pattern. Projects section left always-expanded.

---

## 2026-09-02 — Initial context build (no code changes)

- **Goal of session**: full code-verified understanding of the repo so future agents/chats don't re-read ~100 files.
- **Deliverables**:
  - `AGENTS.md` (repo root) — verified reference pack: architecture, crypto spec, Firestore model, stores,
    component/domain inventory, page state machine, conventions, taste, known bugs, doc discrepancies.
  - `HANDOFF.md` (this file).
- **Process**: main agent read first-hand: full `@scync/core` (types, crypto, firestore, firebase, webauthn,
  ssh, totp, certificates, constants, utils, passwordImport, test), all UI stores, app shell
  (App/VaultPage/main.tsx), desktop main/preload, all build/CI/deploy configs, Firestore rules/indexes,
  package manifests, git history (HEAD: `6c2958a feat: Added multiple biometrics support`), tags (v2.0.0).
  Four background subagents then deep-read every UI component + pages + hooks; all reports cross-consistent.
- **Verified headline facts** (details in AGENTS.md):
  - Real prod Firebase project `scync-app`; env lives in ROOT `.env.local` (envDir `../../`).
  - No apps/mobile, no packages/cli. No router lib. No server code. Popup Google auth only.
  - Passwords domain is real and recent (separate collection + UI); portable export drops it anyway (bug).
  - `SCYNC_ARCHITECTURE.md` was deleted this session as superseded — `AGENTS.md` is now the single
    architecture reference (it previously contained several stale claims: passwords domain omission,
    singular biometric field, phantom apps/mobile + packages/cli, wrong component count).
- **Known-open questions / nice-to-haves** (unstarted): add Firestore ownership rule; fix SERVICE_COLORS hex
  misuse; portable vault covers all five domains; CSPRNG password generator; unify clipboard auto-clear;
  store resets on sign-out; atomic imports.
