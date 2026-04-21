# Scync (secure sync/security sync) — Master Specification Document
**Version:** 1.0  
**Status:** Pre-development  
**Purpose:** Complete authoritative reference for building Scync from zero to production

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [The Problem — The Gap We Identified](#2-the-problem--the-gap-we-identified)
3. [Market Landscape — What Exists and Why It Falls Short](#3-market-landscape--what-exists-and-why-it-falls-short)
4. [What We Are Building](#4-what-we-are-building)
5. [Core Principles](#5-core-principles)
6. [Security Model — Zero-Knowledge Architecture](#6-security-model--zero-knowledge-architecture)
7. [Technical Architecture](#7-technical-architecture)
8. [Tech Stack — Every Choice with Rationale](#8-tech-stack--every-choice-with-rationale)
9. [Monorepo Structure — Complete File Tree](#9-monorepo-structure--complete-file-tree)
10. [Data Models — Firestore Schema and TypeScript Types](#10-data-models--firestore-schema-and-typescript-types)
11. [Feature Scope — MVP, V2, and Future](#11-feature-scope--mvp-v2-and-future)
12. [User Flows](#12-user-flows)
13. [Platform-Specific Details](#13-platform-specific-details)
14. [Firebase Setup and Configuration](#14-firebase-setup-and-configuration)
15. [Encryption Implementation — Detailed Specification](#15-encryption-implementation--detailed-specification)
16. [UI/UX Guidelines and Design System](#16-uiux-guidelines-and-design-system)
17. [Component Architecture](#17-component-architecture)
18. [State Management](#18-state-management)
19. [Testing Strategy](#19-testing-strategy)
20. [CI/CD Pipeline](#20-cicd-pipeline)
21. [Development Phases and Milestones](#21-development-phases-and-milestones)
22. [Open Source Strategy](#22-open-source-strategy)
23. [Future Roadmap](#23-future-roadmap)
24. [Agent Instructions and Build Order](#24-agent-instructions-and-build-order)

---

## 1. Project Identity

**Name:** Scync - Secure Sync
**Tagline:** Your secrets. Synced. Encrypted. Everywhere.  
**Mission:** Build the simplest, most beautiful, and most secure personal secrets manager that works across every device — without trusting any server with your plaintext data. 
**Analogy** - Notion for developer secrets. Organized, beautiful, zero-knowledge, yours 
**License:** MIT  
**Repository:** `github.com/hariharen9/Scync` (public, open source)  
**Target user:** Individual developers, freelancers, and power users who manage many API keys, tokens, recovery codes, and secrets across multiple services and need fast, organized, cross-device access — without the overhead of enterprise tools.

---

## 2. The Problem — The Gap We Identified

### 2.1 The Core Pain

Modern developers accumulate a sprawling collection of sensitive credentials:

- API keys from dozens of services (Google, OpenAI, Anthropic, OpenRouter, AWS, Stripe, Vercel, Cloudflare, etc.)
- Personal Access Tokens (GitHub PATs, GitLab tokens, npm tokens)
- OAuth client secrets and refresh tokens
- Recovery/backup codes for 2FA-protected accounts
- SSH key passphrases
- Webhook signing secrets
- Service account credentials
- Database connection strings with embedded passwords

These secrets have no natural home. They end up scattered across:

- Sticky notes and physical notebooks
- Plaintext `.env` files checked into private repos
- Screenshots saved on phone
- Notion pages (not encrypted, cloud-visible)
- Slack DMs and email threads
- Notes apps (unencrypted)
- The developer's memory (until they forget and spend an hour regenerating)

The problem is not just storage — it is **organized, accessible, searchable, encrypted storage** that works on every device.

### 2.2 Why This Is Dangerous

When secrets are stored carelessly:
- A Notion breach, a screenshot leak, or a compromised laptop exposes every key at once
- There is no metadata — no record of when a key was created, when it was last rotated, what environment it belongs to, or where it is used
- Recovery codes are lost when needed most (during account lockout)
- Rotating keys is painful because you cannot find where you wrote the old one
- Sharing secrets with a colleague becomes a security incident (Slack DMs, email)

### 2.3 The Specific Gap

There is no tool that satisfies all of the following simultaneously:

1. **Personal use** — not team/enterprise focused
2. **Cross-device sync** — web, desktop (Windows at minimum), and mobile (iOS + Android)
3. **Zero-knowledge encryption** — the server never sees plaintext, ever
4. **Beautiful, fast UI** — something a developer actually enjoys using, not a spreadsheet in a box
5. **Structured metadata** — service, type, environment, status, rotation date, expiry
6. **Open source** — auditable, forkable, self-hostable
7. **Free at the personal tier** — or very low cost

Every existing tool fails at least two of these criteria. This is the gap.

---

## 3. Market Landscape — What Exists and Why It Falls Short

### 3.1 Enterprise Secret Managers (Wrong Category)

**Infisical**
- Open source: yes
- Target: engineering teams managing secrets in CI/CD pipelines
- Failure modes: complex self-hosted setup, team-oriented UX, no mobile app, no personal use mental model, massive feature surface that is irrelevant to personal use

**HashiCorp Vault**
- Open source: yes
- Target: enterprise infrastructure teams
- Failure modes: requires a dedicated server, requires expertise to operate, CLI-first with no consumer UI, zero personal use relevance

**AWS Secrets Manager, Azure Key Vault, GCP Secret Manager**
- Proprietary, cloud-vendor specific
- Designed for machine-to-machine use, not human browsing
- No UI for personal secret management, billing by secret

**Doppler**
- Cloud-only, not open source
- Team-focused, no personal use framing
- No mobile app

### 3.2 Password Managers (Wrong Tool)

**Bitwarden**
- Open source: yes
- Cross-platform: yes
- Zero-knowledge: yes
- Failure modes: UI is dated and cluttered, designed around website passwords (username/URL/password) not around API keys and recovery codes, poor metadata support for developer secrets, awkward to use for multi-line recovery codes or structured token storage

**1Password**
- Excellent UI and developer mode
- Cross-platform: yes
- Not open source
- $3–5/month subscription
- Has "developer" category but it is a password manager with a tag, not a purpose-built secrets vault

**KeePassXC**
- Open source: yes
- Zero-knowledge: yes (local only)
- No cloud sync at all — fails the cross-device requirement
- Outdated UI

**Dashlane, LastPass, NordPass**
- Not open source
- Built for passwords, not developer secrets
- UI not suited for structured metadata or recovery codes

### 3.3 Note-Taking Apps Used as Secrets Stores (Insecure)

**Notion**
- Not encrypted at rest (Notion staff can read content)
- No native secret masking or copy-without-revealing
- No dedicated developer secret fields
- No expiry tracking

**Apple Notes, Google Keep, Obsidian (cloud)**
- Not encrypted (or encryption varies)
- No secret-specific metadata
- No cross-platform or no good UI

### 3.4 Conclusion on the Gap

The gap is a personal-first, developer-focused, zero-knowledge, cross-platform (web + native desktop + native mobile) secrets manager with a beautiful UI, structured metadata, open source code, and a free personal tier. **This does not exist.** Scync fills it.

---

## 4. What We Are Building

### 4.1 Product Summary

Scync is an open source, zero-knowledge, cross-platform secrets manager for individual developers. It is not a password manager, though that capability is on the future roadmap. It is specifically designed for storing and organizing developer secrets: API keys, tokens, recovery codes, and other credentials — with rich metadata, fast search, and a UI that feels modern and intentional.

### 4.2 Platform Targets

- **Web app** — deployed to Firebase Hosting, accessible from any browser, fully functional PWA
- **Desktop app (Windows)** — Electron wrapper around the web app, ships as a `.exe` installer; Mac and Linux to follow
- **Mobile app** — Capacitor wrapper around the web app, ships as iOS and Android apps

The critical architectural decision: **all three platforms share 100% of the same React application code**. Electron and Capacitor are thin native shells. There is no React Native rewrite, no separate mobile codebase.

### 4.3 Core Capabilities (MVP)

- Google Sign-In via Firebase Auth
- Vault password (separate from Google account) that never leaves the device
- AES-256-GCM client-side encryption of all secret values and notes
- Full CRUD on secrets (create, read, update, delete)
- Rich metadata per secret: name, service, type, environment, status, last rotated, expires on, notes
- Search across name and service
- Filter by service, type, environment, status
- Copy secret value to clipboard without revealing it on screen
- Toggle show/hide secret value in UI
- Responsive UI that works on mobile screen sizes

### 4.4 What Scync Is Not (MVP Scope Boundary)

- Not a team secrets manager (no sharing, no RBAC)
- Not a CI/CD secrets injector
- Not a password manager (no browser autofill)
- Not a secrets rotation engine (though it tracks rotation dates)
- Not self-hosted in MVP (Firebase is the backend; self-hosting is a V3 goal)

---

## 5. Core Principles

These principles are non-negotiable and must guide every technical and design decision.

### 5.1 Zero-Knowledge by Default

The server (Firebase Firestore) must never receive plaintext secret values under any circumstance. Encryption and decryption happen exclusively in the client application before any network call. If this principle is violated even once, Scync's core value proposition fails.

### 5.2 Vault Password Independence

The vault password that protects the encryption key is entirely separate from the Google account used for authentication. Google Sign-In handles identity and sync routing. The vault password handles cryptographic key derivation. A Firebase breach cannot expose secrets. A Google account compromise cannot expose secrets. Both credentials must be compromised simultaneously to decrypt anything.

### 5.3 One Codebase, Three Platforms

There must be exactly one React codebase. The same components, the same hooks, the same logic runs on web, Electron, and Capacitor. Platform-specific code is limited to thin adapter layers in each `apps/` directory. This is enforced structurally in the monorepo.

### 5.4 Speed Over Features

The app must be fast. Loading the vault should feel instant. Searching must be synchronous (filter in memory, no network calls). Adding a secret must complete in under one second. Performance is a product feature, not an engineering concern.

### 5.5 Opinionated Simplicity

The UI makes opinionated choices about what metadata matters for developer secrets and presents exactly those fields. There are no plugins, no custom fields in MVP, no configuration panels. Structure is baked in. This is a product decision, not a limitation.

### 5.6 Open and Auditable

The encryption implementation uses only the Web Crypto API (a browser native, NIST-standardized, widely audited implementation). No third-party crypto libraries are used. Any developer should be able to read the crypto code in under 15 minutes and verify its correctness.

---

## 6. Security Model — Zero-Knowledge Architecture

This section is the most critical in the entire document. Implement exactly as described.

### 6.1 Authentication vs. Encryption — Two Separate Layers

Scync has two completely independent security layers that must never be conflated:

**Layer 1 — Identity (Firebase Auth + Google Sign-In)**
- Determines who the user is
- Provides Firebase with a verified `uid`
- Controls which Firestore documents the user is allowed to read/write
- Does NOT protect secret content — Firebase still stores the data

**Layer 2 — Encryption (Vault Password + Web Crypto API)**
- Protects the content of secrets
- Operates entirely in the client
- Firebase never participates in this layer
- The vault password is entered by the user after Google Sign-In
- The vault password is never stored, never transmitted, never hashed for storage

These two layers are independent. Losing access to Google does not expose secrets. A Firebase breach does not expose secrets. Only the vault password, used locally to derive the key, can decrypt anything.

### 6.2 Key Derivation

When the user sets their vault password for the first time, or when they unlock the vault on any device:

1. Retrieve the user's `uid` from Firebase Auth (already established by Google Sign-In)
2. Retrieve the `salt` from Firestore at `users/{uid}/meta` (stored as base64, not sensitive)
3. Concatenate: `inputKeyMaterial = utf8Encode(vaultPassword + uid)`
   - Including the `uid` in the key material means the same vault password on a different account derives a completely different key — prevents cross-account attacks
4. Run PBKDF2:
   - Algorithm: PBKDF2
   - Hash: SHA-256
   - Iterations: 310,000 (OWASP 2023 recommendation for SHA-256)
   - Salt: the stored random 16-byte salt
   - Output: 256-bit AES key
5. The derived key exists only in memory as a `CryptoKey` object (non-extractable)
6. The key is held in React state for the session and discarded when the user locks the vault or closes the app

**Salt generation (first-time setup only):**
- Generate 16 random bytes using `crypto.getRandomValues`
- Encode as base64
- Store in Firestore at `users/{uid}/meta.salt`
- The salt is NOT secret — it is public per PBKDF2 design — its purpose is to prevent precomputed rainbow table attacks

### 6.3 Vault Password Verification

After key derivation, the app needs to know whether the vault password was correct without storing the password or a hash of it. This is done using an encrypted verifier:

**First-time setup:**
1. Derive key from vault password (see 6.2)
2. Encrypt the plaintext string `"Scync_VALID_v1"` using AES-256-GCM with a fresh random 12-byte IV
3. Store `{ iv: base64(iv), ciphertext: base64(ciphertext) }` at `users/{uid}/meta.verifier`

**Every subsequent unlock:**
1. Derive key from entered vault password
2. Attempt to decrypt `meta.verifier.ciphertext` using the derived key and stored IV
3. If decryption succeeds and plaintext equals `"Scync_VALID_v1"` → password correct, vault unlocked
4. If decryption throws (AES-GCM authentication tag fails) → password incorrect, show error

This approach is cryptographically sound: AES-GCM includes an authentication tag. A wrong key will cause `subtle.decrypt` to throw — no need to compare hashes, no timing attacks.

### 6.4 Secret Encryption

Every secret stored in Firestore follows this pattern:

**Encrypted fields:** `value` (the actual key/token/code), `notes` (any user notes)  
**Plaintext fields:** `name`, `service`, `type`, `environment`, `status`, `lastRotated`, `expiresOn`, `createdAt`, `updatedAt`

The decision to leave metadata plaintext is deliberate: it enables fast server-side filtering and search-by-name without decryption round-trips. The actual sensitive content (the secret value and notes) is always encrypted.

**Per-field encryption:**
1. Generate a fresh random 12-byte IV for each field being encrypted (value and notes each get their own IV)
2. Encrypt with `crypto.subtle.encrypt({ name: "AES-GCM", iv }, derivedKey, utf8Encode(plaintext))`
3. Store as `{ iv: base64(iv), ciphertext: base64(ciphertext) }`

**Why a fresh IV per operation?**  
AES-GCM security requires that the same key is never used with the same IV twice. By generating a fresh IV for every encrypt call, this is guaranteed even if the same value is written multiple times.

### 6.5 Firestore Security Rules

Firestore security rules enforce that users can only read and write their own data. Rules are enforced server-side by Firebase and cannot be bypassed by client code.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This means even if an attacker obtains Firebase credentials for the project (not the user's Google account), they cannot read another user's documents. Each user's data is isolated by their `uid`.

### 6.6 What Firebase Can See

Firebase has access to the following fields for each secret:
- `name` (plaintext) — e.g. "Claude API Key - Personal"
- `service` (plaintext) — e.g. "Anthropic"
- `type` (plaintext) — e.g. "API Key"
- `environment` (plaintext) — e.g. "Personal"
- `status` (plaintext) — e.g. "Active"
- `lastRotated`, `expiresOn`, `createdAt`, `updatedAt` (timestamps)
- `encValue` (encrypted blob — completely unreadable)
- `encNotes` (encrypted blob — completely unreadable)

The `uid` is visible as the document path component. Firebase knows the user's Google identity from Auth. The actual secret values and notes are never visible to Firebase. This is an acceptable trade-off for MVP — a future "full encryption" mode that encrypts metadata fields too can be added in V2 with in-memory search.

### 6.7 Session Management

- The derived `CryptoKey` exists only in React state (memory)
- It is never written to `localStorage`, `sessionStorage`, `IndexedDB`, or any persistent store
- Refreshing the page clears the key — the user must re-enter their vault password (they do not need to re-do Google Sign-In if the Firebase session is still active)
- The app provides a manual "Lock Vault" action that clears the key from state
- On Electron and Capacitor, the Firebase session can persist (handled by Firebase SDK automatically), but the vault key is always cleared on app restart

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Web App    │  │   Desktop    │  │   Mobile App     │  │
│  │ (Firebase    │  │  (Electron   │  │  (Capacitor on   │  │
│  │  Hosting)    │  │   wrapper)   │  │  iOS + Android)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                   │             │
│         └─────────────────┼───────────────────┘             │
│                           │                                 │
│              ┌────────────▼────────────┐                   │
│              │   packages/core         │                   │
│              │   (crypto, types,       │                   │
│              │    firebase config)     │                   │
│              └────────────┬────────────┘                   │
│                           │                                 │
│              ┌────────────▼────────────┐                   │
│              │   packages/ui           │                   │
│              │   (React components,    │                   │
│              │    design system)       │                   │
│              └────────────┬────────────┘                   │
│                           │                                 │
│         ┌─────────────────┴──────────────────┐             │
│         │      AES-256-GCM Encryption         │             │
│         │      (Web Crypto API, in-memory)    │             │
│         └─────────────────┬──────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │       FIREBASE             │
              │                           │
              │  ┌───────────┐            │
              │  │  Auth     │ Google     │
              │  │  (uid,    │ Sign-In    │
              │  │  session) │            │
              │  └───────────┘            │
              │                           │
              │  ┌───────────┐            │
              │  │ Firestore │ Encrypted  │
              │  │ (meta,    │ blobs only │
              │  │ secrets)  │            │
              │  └───────────┘            │
              │                           │
              │  ┌───────────┐            │
              │  │ Hosting   │ Web app    │
              │  │           │ CDN        │
              │  └───────────┘            │
              └───────────────────────────┘
```

### 7.2 Data Flow — Storing a Secret

1. User types secret value into form field in React UI
2. User clicks "Save"
3. `packages/core/crypto.ts` calls `aesEncrypt(derivedKey, plaintext)` → returns `{ iv, ciphertext }` (both base64)
4. React component assembles the Firestore document with plaintext metadata + encrypted value/notes
5. Firestore SDK writes the document to `users/{uid}/secrets/{newId}`
6. Firestore security rules verify `request.auth.uid == userId` — if the check passes, write is committed
7. Real-time listener in React state updates the UI with the new entry (optimistic update also applied)

### 7.3 Data Flow — Reading a Secret

1. App unlocks (Google Sign-In + vault password entry)
2. Firestore real-time listener starts on `users/{uid}/secrets` — receives all secret documents
3. React state stores the raw encrypted documents
4. When user opens a secret or clicks "Copy value":
   - `packages/core/crypto.ts` calls `aesDecrypt(derivedKey, encValue.iv, encValue.ciphertext)`
   - Returns plaintext string
   - String is placed into clipboard or shown briefly in UI
5. Plaintext never persists in state — it is decrypted on demand and discarded immediately after use

### 7.4 Real-time Sync

Firestore's `onSnapshot` listener provides real-time synchronization across devices. When the user adds a key on their phone, the web app and desktop app update within milliseconds. The data flowing through the listener is always encrypted — devices decrypt locally after receiving updates.

---

## 8. Tech Stack — Every Choice with Rationale

### 8.1 Language

**TypeScript (strict mode)**  
Rationale: Type safety across all packages prevents entire classes of bugs. The `SecretEntry` and `EncryptedField` types, defined once in `packages/core`, are used identically across web, desktop, and mobile. Strict mode is mandatory — no `any`, no type assertions without justification.

### 8.2 Package Manager and Monorepo

**pnpm + pnpm workspaces + Turborepo**

pnpm is chosen over npm and yarn for:
- Strict node_modules layout (no phantom dependencies)
- Content-addressable store (fast installs, minimal disk usage)
- Native workspace support

Turborepo is chosen as the monorepo build orchestrator for:
- Intelligent build caching (only rebuild what changed)
- Parallel task execution
- Pipelines that enforce build order (core → ui → apps)
- Simple `turbo.json` configuration

### 8.3 Frontend Framework

**React 18 + Vite**

React 18 for:
- Concurrent features (transitions, Suspense)
- Vast ecosystem
- First-class support in Capacitor and Electron

Vite for:
- Sub-second HMR even with TypeScript
- Native ESM in development
- Simple plugin ecosystem
- Fast production builds

### 8.4 Styling

**Tailwind CSS v3**

Rationale:
- Utility-first removes the naming overhead of BEM or CSS Modules
- Purges unused styles in production (tiny bundle)
- Consistent design tokens across all components
- Pairs well with the component library approach in `packages/ui`

A custom Tailwind config in `packages/ui` defines the Scync design tokens (colors, spacing, border-radius, typography scales) that are extended by each app.

### 8.5 State Management

**Zustand**

Rationale:
- Minimal boilerplate compared to Redux
- Works perfectly with TypeScript
- The vault state (auth user, crypto key, unlocked entries) fits cleanly in a Zustand store
- No context providers needed — stores are module singletons
- Works identically on web, Electron, and Capacitor

Specific stores:
- `authStore` — Firebase user, sign-in/sign-out actions
- `vaultStore` — vault locked/unlocked state, derived CryptoKey, unlocked entries
- `uiStore` — modal open/closed, selected entry, active filter, search query

### 8.6 Backend

**Firebase (Google)**

Firebase is chosen because:
- Firebase Auth provides Google Sign-In with minimal setup
- Firestore provides real-time sync across devices out of the box
- Firebase Hosting deploys the web app to a global CDN in one command
- Firebase's free Spark plan covers personal use (1 GB Firestore, 10 GB Hosting, Auth free)
- The Firebase JS SDK works identically in browser, Electron renderer, and Capacitor WebView
- Well-documented, actively maintained, widely understood

Firebase services used:
- **Firebase Auth** — Google Sign-In only (no email/password in MVP)
- **Cloud Firestore** — document database for secret storage
- **Firebase Hosting** — web app deployment

Firebase services NOT used in MVP:
- Firebase Storage (not needed)
- Firebase Functions (not needed in MVP)
- Firebase Analytics (no tracking in MVP)
- Firebase Crashlytics (desktop/mobile — V2)

### 8.7 Cryptography

**Web Crypto API (browser native)**

Rationale:
- Built into every modern browser, Node.js 15+, and all WebView environments
- NIST-standardized, FIPS 140-2 validated implementations
- Zero additional dependencies — no crypto library to audit or update
- Non-extractable `CryptoKey` objects — the key bytes cannot be read by JavaScript code, only used for operations
- Works identically in Chrome, Firefox, Safari, Electron, and Capacitor WebViews

No third-party crypto libraries (CryptoJS, sjcl, forge, etc.) are used anywhere in Scync.

### 8.8 Desktop

**Electron (v28+)**

The Electron app is a shell that:
- Loads the Vite-built web app from `file://` (packaged) or `localhost:5173` (development)
- Provides a `BrowserWindow` with appropriate security settings
- Packages to a Windows `.exe` installer using Electron Builder
- Does not run any custom main-process logic in MVP — it is a pure wrapper

Why Electron over Tauri:
- Tauri uses a system WebView (Edge on Windows, WebKit on Mac/Linux) — behavior differences require testing across browsers
- Electron bundles Chromium — exactly the same rendering engine as Chrome — zero cross-browser surprises
- The team (initially one developer) already writes web code; Electron requires zero new skills
- Tauri is a V2 consideration for smaller binary size

### 8.9 Mobile

**Capacitor v5 (Ionic)**

Capacitor wraps the same React web app for mobile. It is chosen over:
- React Native: requires a completely separate codebase (UI components, navigation, styling all differ)
- Expo: adds unnecessary managed workflow complexity

What Capacitor provides:
- `npx cap add ios` and `npx cap add android` scaffold native projects
- `npx cap sync` copies the Vite build into the native projects
- Native bridge plugins for system APIs if needed (biometric auth, secure storage — V2)
- Ships as a real `.ipa` and `.apk`, not a mobile website

### 8.10 Testing

- **Vitest** — unit tests for all `packages/core` functions (crypto, data transforms)
- **React Testing Library** — component tests for `packages/ui` components
- **Playwright** — end-to-end tests for the web app (unlock flow, CRUD flow)
- **Firebase Emulator Suite** — local Firestore and Auth emulation for testing without hitting production

### 8.11 CI/CD

**GitHub Actions**

Pipelines:
- On every PR: lint, typecheck, unit tests, build
- On merge to `main`: build + deploy web app to Firebase Hosting preview channel
- On tag `v*.*.*`: build web + build Electron installer + build Capacitor (triggered manually for mobile)

---

## 9. Monorepo Structure — Complete File Tree

```
Scync/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, typecheck, test on every PR
│       ├── deploy-preview.yml        # Deploy web preview on merge to main
│       └── release.yml               # Build all platforms on version tag
│
├── apps/
│   ├── web/                          # React + Vite web application
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── icon-192.png          # PWA icons
│   │   │   └── icon-512.png
│   │   ├── src/
│   │   │   ├── main.tsx              # React root, Firebase init
│   │   │   ├── App.tsx               # Root component, routing
│   │   │   ├── pages/
│   │   │   │   ├── AuthPage.tsx      # Google Sign-In screen
│   │   │   │   ├── UnlockPage.tsx    # Vault password entry
│   │   │   │   ├── SetupPage.tsx     # First-time vault password setup
│   │   │   │   └── VaultPage.tsx     # Main authenticated vault view
│   │   │   ├── firebase.ts           # Firebase app init (uses core config)
│   │   │   └── vite-env.d.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts        # Extends packages/ui tailwind config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── desktop/                      # Electron wrapper
│   │   ├── src/
│   │   │   └── main.ts               # Electron main process
│   │   ├── build/
│   │   │   └── icon.ico              # App icon for Windows
│   │   ├── electron-builder.yml      # Packaging config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                       # Capacitor wrapper
│       ├── android/                  # Generated by capacitor (git-ignored except gradle configs)
│       ├── ios/                      # Generated by capacitor (git-ignored except xcconfig)
│       ├── capacitor.config.ts       # Capacitor config pointing to apps/web build output
│       └── package.json
│
├── packages/
│   ├── core/                         # Shared logic — crypto, types, Firebase config
│   │   ├── src/
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── crypto.ts             # All encryption/decryption functions
│   │   │   ├── types.ts              # All TypeScript interfaces and types
│   │   │   ├── firebase.ts           # Firebase config and initialization
│   │   │   ├── firestore.ts          # All Firestore read/write functions
│   │   │   └── constants.ts          # Service names, types, environments, statuses
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ui/                           # Shared React component library
│       ├── src/
│       │   ├── index.ts              # Barrel export of all components
│       │   ├── components/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── SecretCard.tsx    # The main secret display card
│       │   │   ├── SecretForm.tsx    # Add/edit secret form
│       │   │   ├── SearchBar.tsx
│       │   │   ├── FilterBar.tsx
│       │   │   ├── ServiceIcon.tsx   # Color-coded service badge
│       │   │   ├── MaskedValue.tsx   # Show/hide + copy secret value
│       │   │   └── EmptyState.tsx
│       │   ├── hooks/
│       │   │   ├── useVault.ts       # Vault state from Zustand
│       │   │   ├── useAuth.ts        # Auth state from Zustand
│       │   │   ├── useClipboard.ts   # Copy with timeout feedback
│       │   │   └── useSearch.ts      # Client-side filter/search
│       │   └── stores/
│       │       ├── authStore.ts      # Zustand auth store
│       │       ├── vaultStore.ts     # Zustand vault store
│       │       └── uiStore.ts        # Zustand UI state store
│       ├── tailwind.config.ts        # Master design tokens
│       ├── tsconfig.json
│       └── package.json
│
├── firebase/
│   ├── firestore.rules               # Firestore security rules
│   ├── firestore.indexes.json        # Composite indexes
│   └── .firebaserc                   # Firebase project alias
│
├── .env.example                      # Template for required env vars
├── .eslintrc.js                      # ESLint config (shared)
├── .prettierrc                        # Prettier config (shared)
├── .gitignore
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace package paths
├── package.json                      # Root package.json (dev scripts)
├── README.md                         # Public-facing project README
└── Scync_MASTER_SPEC.md          # This document
```

---

## 10. Data Models — Firestore Schema and TypeScript Types

### 10.1 Firestore Collection Structure

```
Firestore root
└── users/                            (collection)
    └── {uid}/                        (document — user root)
        ├── meta/                     (subcollection)
        │   └── vault/                (document)
        │       ├── salt: string      (base64, 16 bytes, random, for PBKDF2)
        │       ├── verifier: {       (encrypted "Scync_VALID_v1")
        │       │     iv: string      (base64, 12 bytes)
        │       │     ciphertext: string (base64)
        │       │   }
        │       └── createdAt: Timestamp
        │
        └── secrets/                  (subcollection)
            └── {secretId}/           (document per secret)
                ├── id: string        (Firestore auto-ID, also stored for convenience)
                ├── name: string      (plaintext — e.g. "Claude API Key - Personal")
                ├── service: string   (plaintext — e.g. "Anthropic")
                ├── type: string      (plaintext — e.g. "API Key")
                ├── environment: string (plaintext — e.g. "Personal")
                ├── status: string    (plaintext — e.g. "Active")
                ├── encValue: {       (encrypted secret value)
                │     iv: string
                │     ciphertext: string
                │   }
                ├── encNotes: {       (encrypted notes — nullable)
                │     iv: string
                │     ciphertext: string
                │   } | null
                ├── lastRotated: Timestamp | null
                ├── expiresOn: Timestamp | null
                ├── createdAt: Timestamp
                └── updatedAt: Timestamp
```

### 10.2 TypeScript Types (packages/core/src/types.ts)

```typescript
// Encrypted field pair — always stored together
export interface EncryptedField {
  iv: string;          // base64-encoded 12-byte IV
  ciphertext: string;  // base64-encoded AES-GCM ciphertext
}

// Vault metadata stored in Firestore (not sensitive, but required)
export interface VaultMeta {
  salt: string;
  verifier: EncryptedField;
  createdAt: Date;
}

// A secret as stored in Firestore (encrypted fields are blobs)
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
}

// A secret in memory after decryption — never persisted
export interface DecryptedSecret extends Omit<StoredSecret, 'encValue' | 'encNotes'> {
  value: string;       // decrypted plaintext secret value
  notes: string;       // decrypted plaintext notes (empty string if null)
}

// Form data for creating or editing a secret
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
}

// Enum-like string union types (stored as strings in Firestore)
export type ServiceName =
  | 'Google'
  | 'Anthropic'
  | 'GitHub'
  | 'OpenRouter'
  | 'AWS'
  | 'Vercel'
  | 'Stripe'
  | 'Cloudflare'
  | 'Supabase'
  | 'OpenAI'
  | 'HuggingFace'
  | 'Twilio'
  | 'SendGrid'
  | 'Netlify'
  | 'Railway'
  | 'PlanetScale'
  | 'Neon'
  | 'Other';

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

// Filter state for the vault UI
export interface VaultFilter {
  service: ServiceName | '';
  type: SecretType | '';
  environment: Environment | '';
  status: SecretStatus | '';
  search: string;
}
```

### 10.3 Constants (packages/core/src/constants.ts)

All the string arrays for services, types, environments, and statuses are defined here as `readonly` arrays and imported everywhere — forms, filter bars, Firestore queries. Never duplicated.

Each service has an associated color (used for the service badge in the UI). Colors are defined as Tailwind class names, not raw hex values.

```typescript
export const SERVICE_COLORS: Record<ServiceName, string> = {
  'Google': 'bg-blue-100 text-blue-800',
  'Anthropic': 'bg-orange-100 text-orange-800',
  'GitHub': 'bg-gray-100 text-gray-800',
  'OpenRouter': 'bg-purple-100 text-purple-800',
  'AWS': 'bg-yellow-100 text-yellow-800',
  'Vercel': 'bg-zinc-100 text-zinc-800',
  'Stripe': 'bg-indigo-100 text-indigo-800',
  'Cloudflare': 'bg-orange-100 text-orange-800',
  'Supabase': 'bg-green-100 text-green-800',
  'OpenAI': 'bg-teal-100 text-teal-800',
  // ... etc
  'Other': 'bg-slate-100 text-slate-600',
};

export const STATUS_COLORS: Record<SecretStatus, string> = {
  'Active': 'bg-green-100 text-green-700',
  'Rotated': 'bg-yellow-100 text-yellow-700',
  'Expired': 'bg-red-100 text-red-700',
  'Revoked': 'bg-gray-100 text-gray-600',
};
```

---

## 11. Feature Scope — MVP, V2, and Future

### 11.1 MVP (Version 1.0) — The Lovable Core

**Authentication**
- Google Sign-In via Firebase Auth
- Persistent Firebase session (user stays logged into Google until they sign out)
- Vault password entry on each session (vault key is not persisted)
- First-time vault password setup with confirmation
- Vault password change (re-encrypt all secrets with new key — see Section 15.5)
- Manual vault lock button

**Secret Management**
- Create secret with all metadata fields
- View list of all secrets (name, service badge, type chip, status chip, expiry indicator)
- Open a secret to see its details
- Copy secret value to clipboard (value is decrypted on demand, never shown by default)
- Toggle show/hide secret value in the detail view (revealed with a countdown timer — hides again after 15 seconds automatically)
- Edit any field of an existing secret
- Delete a secret (with confirmation dialog)
- Expiry warning indicator — secrets expiring within 30 days are visually flagged

**Organization**
- Filter by service (single select)
- Filter by type (single select)
- Filter by environment (single select)
- Filter by status (single select)
- Search by name (client-side, case-insensitive substring match)
- Sort by: date created (default, newest first), name (A–Z), expiry date (soonest first)

**Platforms**
- Web app deployed to Firebase Hosting with full PWA support (installable, offline-capable via service worker with no secret caching)
- Windows Electron app (`.exe` installer via GitHub Releases)
- iOS Capacitor app (TestFlight for MVP — App Store for V1.1)
- Android Capacitor app (Google Play Internal Testing for MVP — public for V1.1)

**Security UX**
- Auto-lock after 15 minutes of inactivity (configurable in settings: 5m, 15m, 30m, never)
- Auto-lock on window blur (configurable: on/off)
- Clear clipboard after 30 seconds of copying a secret value (web + Electron + Capacitor with Clipboard plugin)
- No secret values in browser history, URL params, or console logs

### 11.2 V2 — Enhanced Vault

**Full Encryption Mode**
- Option to encrypt all metadata fields (name, service, type) in addition to value and notes
- Enables in-memory-only search (all decrypted on unlock, searched client-side)
- Trade-off is that Firestore cannot filter — all filtering is client-side

**Biometric Unlock**
- On mobile (Capacitor): Face ID / Touch ID / fingerprint to unlock vault without typing vault password
- Implemented via Capacitor's `@capacitor-community/biometric-auth` plugin
- Biometric unlocks a securely stored vault password, not the vault directly (the password is stored in iOS Keychain / Android Keystore)

**Secret Versioning**
- Every time a secret's value changes, the previous value is stored in a `history` subcollection
- User can view past values (all encrypted, decrypted on demand)
- History is limited to last 10 versions per secret

**Import / Export**
- Export vault to encrypted JSON file (AES-256 encrypted, password-protected)
- Import from exported JSON file (for backup / migration)
- Import from CSV (for bulk adding from a spreadsheet)

**Tags**
- User-defined free-form tags per secret
- Multi-select filter by tag

**Notifications**
- Email or push notification (via Firebase Cloud Messaging) 7 days before a secret expires
- Requires Firebase Functions for the scheduled notification job

**Mac and Linux Desktop**
- Electron packaging for macOS `.dmg` and Linux `.AppImage`

### 11.3 V3 — Team and Self-Hosting

**Team Vaults**
- Shared vaults between multiple Google accounts
- Invitation system via email
- Role-based access: Owner, Editor, Viewer
- Encrypted with a shared vault key — key distribution mechanism to be designed (likely asymmetric wrap)

**Self-Hosting**
- Docker Compose configuration to run Scync backend on any server
- Replace Firebase with self-hosted alternatives:
  - Authentication: Supabase Auth or Authentik
  - Database: Supabase (PostgreSQL)
  - Hosting: Any static server (Nginx)

**Audit Log**
- Every read, write, and delete on a shared vault is logged (timestamp, user, action, secret name)
- Logs are stored in Firestore, viewable by Owners

### 11.4 Future Roadmap (V4+)

- **Browser extension** — autofill API keys in developer tool web UIs (GitHub token fields, Vercel environment variable inputs, etc.)
- **Password management** — extend to full website password + username storage with autofill
- **CLI tool** — `Scync get <secret-name>` to pipe secrets into terminal commands
- **Secret rotation integrations** — trigger GitHub PAT rotation, Stripe key rotation, etc. via their APIs
- **Secrets health score** — dashboard showing percentage of secrets that are active, have been rotated recently, have expiry dates set

---

## 12. User Flows

### 12.1 First-Time Onboarding Flow

```
App opens
  └─> Check Firebase Auth session
        ├─> No session → Auth Page
        │     └─> "Sign in with Google" button
        │           └─> Firebase Google OAuth flow
        │                 └─> Success → check if vault meta exists in Firestore
        │                       ├─> No meta (new user) → Setup Page
        │                       │     └─> "Create a vault password" form
        │                       │           ├─> Password field + confirm field
        │                       │           ├─> Strength indicator
        │                       │           └─> Submit → generate salt, derive key, 
        │                       │                        create verifier, write meta,
        │                       │                        unlock vault → Vault Page
        │                       └─> Meta exists (returning user) → Unlock Page
        │
        └─> Session exists → check vault unlock state
              ├─> Vault not unlocked → Unlock Page
              │     └─> Enter vault password
              │           ├─> Correct → unlock vault → Vault Page
              │           └─> Wrong → error, retry (no lockout in MVP)
              └─> Vault unlocked (in-session navigation) → Vault Page
```

### 12.2 Adding a Secret

```
Vault Page
  └─> Click "Add secret" button (+ icon, top right)
        └─> Add Secret Modal / Side Panel opens
              ├─> Name field (required, text)
              ├─> Service select (required, dropdown with search)
              ├─> Type select (required, dropdown)
              ├─> Environment select (required, dropdown)
              ├─> Value field (required, textarea, masked by default)
              │     └─> Toggle show/hide button inline
              ├─> Status select (defaults to "Active")
              ├─> Last rotated date picker (optional)
              ├─> Expires on date picker (optional)
              └─> Notes textarea (optional)
              
              └─> Submit button
                    └─> Validate fields
                          ├─> Validation fails → inline error messages, no submission
                          └─> Validation passes →
                                encrypt value → encrypt notes →
                                write to Firestore →
                                close modal → new entry appears in vault list
```

### 12.3 Copying a Secret Value

```
Vault Page → Secret Card
  └─> Click "Copy" icon (clipboard icon on each card)
        └─> Decrypt encValue using derivedKey
              └─> Write plaintext to clipboard (navigator.clipboard.writeText)
                    └─> Show brief "Copied!" toast notification (2 seconds)
                          └─> Start 30-second countdown
                                └─> After 30 seconds: write "" to clipboard (clear it)
```

### 12.4 Vault Lock Flow

```
Auto-lock trigger (inactivity timeout OR window blur OR manual lock click)
  └─> Clear derivedKey from Zustand vaultStore (set to null)
        └─> Clear all decrypted content from state
              └─> Redirect to Unlock Page
                    └─> User sees locked vault prompt
                          └─> Enters vault password → re-derive key → unlock
```

---

## 13. Platform-Specific Details

### 13.1 Web App

**Build output:** `apps/web/dist/` — standard Vite SPA build  
**Deployment:** Firebase Hosting via `firebase deploy --only hosting`  
**PWA:** `vite-plugin-pwa` generates the service worker and manifest  
**Service worker strategy:** Cache-first for app shell assets; network-only for ALL Firebase calls (no caching of any Firestore data in the service worker)  
**Offline behaviour:** App shell loads from cache; vault is inaccessible offline (Firestore requires network); show friendly "You're offline — connect to access your vault" state

**Environment variables (Vite):**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

These are Vite public variables (exposed in the browser bundle). Firebase API keys are not secrets — they are public identifiers. Security is enforced by Firestore security rules and Auth, not by keeping the API key private.

### 13.2 Desktop (Electron)

**Main process (`apps/desktop/src/main.ts`):**
- Creates `BrowserWindow` with these security settings:
  - `webPreferences.contextIsolation: true` (mandatory)
  - `webPreferences.nodeIntegration: false` (mandatory)
  - `webPreferences.sandbox: true`
  - `webPreferences.webSecurity: true`
- In production: loads `file://` path to `apps/web/dist/index.html`
- In development: loads `http://localhost:5173` (Vite dev server)
- Sets `Content-Security-Policy` header
- Handles deep links for Google OAuth redirect (custom protocol `Scync://`)

**Window behaviour:**
- Single window, no tabs
- Resizable with minimum width 800px, minimum height 600px
- Remembers window size and position between launches (using `electron-store`)
- Custom title bar: no native title bar (frameless window), custom HTML/CSS title bar with traffic lights on Mac

**Packaging (`electron-builder.yml`):**
- Target: `nsis` for Windows (creates installer `.exe`)
- Auto-update: `electron-updater` configured to pull from GitHub Releases
- Code signing: Windows code signing certificate (required for V1 production; dev builds unsigned)
- App ID: `com.Scync.app`
- Icons: `apps/desktop/build/icon.ico` (Windows)

**Build pipeline:**
```
pnpm run build (in apps/web) → produces dist/
electron-builder → packages dist/ into Electron installer
```

### 13.3 Mobile (Capacitor)

**Capacitor config (`apps/mobile/capacitor.config.ts`):**
```typescript
{
  appId: 'com.Scync.app',
  appName: 'Scync',
  webDir: '../web/dist',         // points to the web build output
  server: {
    androidScheme: 'https'
  }
}
```

**Native plugins used in MVP:**
- `@capacitor/clipboard` — write to and clear native clipboard (more reliable than `navigator.clipboard` on some Android versions)
- `@capacitor/status-bar` — style the status bar to match app theme

**Native plugins for V2:**
- `@capacitor-community/biometric-auth` — Face ID / fingerprint unlock

**Firebase Auth on mobile:**
- Google Sign-In on mobile uses `firebase/auth` with `signInWithRedirect` (not popup — popups do not work in WebViews)
- The `capacitor-firebase-auth` plugin is NOT used — the web Firebase SDK handles auth via WebView redirect
- The Firebase Auth redirect URL must be whitelisted in the Firebase console under "Authorized domains" — add the Capacitor custom scheme

**Android-specific:**
- `minSdkVersion: 24` (Android 7.0) — covers 97%+ of active Android devices
- `targetSdkVersion: 34`
- Build variant: `release` for distribution, `debug` for development

**iOS-specific:**
- `ios.scheme: 'Scync'` — custom URL scheme for OAuth redirect
- Minimum iOS version: 15.0
- Privacy descriptions in `Info.plist`: FaceID usage description (for V2 biometric)

---

## 14. Firebase Setup and Configuration

### 14.1 Firebase Project Setup Steps

1. Go to `console.firebase.google.com`
2. Create a new project named `Scync-prod`
3. Create a second project named `Scync-dev` (for development and testing)
4. In each project:
   - Enable **Authentication** → Sign-in providers → Google → Enable
   - Enable **Cloud Firestore** → Create database → Production mode
   - Enable **Hosting**
5. Register a web app in each project → copy the config object → place in `.env` files

### 14.2 Firestore Security Rules (firebase/firestore.rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // All user data is strictly isolated by uid
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // Deny all other reads/writes by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 14.3 Firestore Indexes (firebase/firestore.indexes.json)

The following composite indexes are needed for filtered queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "secrets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "secrets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "service", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "secrets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "secrets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "environment", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 14.4 Firebase Emulator Configuration

For local development and testing, the Firebase Emulator Suite provides local Firestore and Auth. Configure in `firebase.json`:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

In `packages/core/src/firebase.ts`, detect `VITE_USE_EMULATORS=true` and connect the SDK to the local emulators instead of production Firebase.

### 14.5 Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains, add:
- `localhost` (for development)
- `Scync.app` (production domain — update when domain is purchased)
- `Scync-prod.web.app` (Firebase Hosting default domain)
- Any Capacitor custom schemes needed for mobile OAuth

---

## 15. Encryption Implementation — Detailed Specification

This section specifies every cryptographic operation. Implement exactly as written. Do not deviate.

### 15.1 Core Crypto Module (packages/core/src/crypto.ts)

This module exports six pure functions. All functions are `async` because Web Crypto API is Promise-based.

**Function 1: `generateSalt(): string`**  
Purpose: Generate the random salt used in PBKDF2 during first-time setup.  
Implementation: `crypto.getRandomValues(new Uint8Array(16))` → base64 encode → return string  
Returns: base64 string (stored in Firestore, NOT sensitive)

**Function 2: `deriveKey(password: string, uid: string, saltBase64: string): Promise<CryptoKey>`**  
Purpose: Derive the AES-256 encryption key from the vault password using PBKDF2.  
Steps:
1. Concatenate `inputMaterial = password + uid`
2. `crypto.subtle.importKey("raw", utf8Encode(inputMaterial), "PBKDF2", false, ["deriveKey"])`
3. `crypto.subtle.deriveKey(`  
   `{ name: "PBKDF2", salt: base64Decode(saltBase64), iterations: 310000, hash: "SHA-256" },`  
   `keyMaterial,`  
   `{ name: "AES-GCM", length: 256 },`  
   `false,` ← non-extractable: key bytes cannot be read by JS  
   `["encrypt", "decrypt"]`  
   `)`  
Returns: `CryptoKey` object (non-extractable, lives in memory only)

**Function 3: `encrypt(key: CryptoKey, plaintext: string): Promise<EncryptedField>`**  
Purpose: Encrypt any string value.  
Steps:
1. `iv = crypto.getRandomValues(new Uint8Array(12))` — fresh IV every call
2. `ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, utf8Encode(plaintext))`
3. Return `{ iv: base64Encode(iv), ciphertext: base64Encode(ciphertext) }`  
Returns: `EncryptedField` — safe to store in Firestore

**Function 4: `decrypt(key: CryptoKey, field: EncryptedField): Promise<string>`**  
Purpose: Decrypt an EncryptedField back to plaintext.  
Steps:
1. `plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64Decode(field.iv) }, key, base64Decode(field.ciphertext))`
2. Return `utf8Decode(plaintext)`  
Returns: plaintext string  
Throws: if key is wrong OR ciphertext is corrupted → AES-GCM authentication tag verification fails → do NOT catch this error silently

**Function 5: `createVerifier(key: CryptoKey): Promise<EncryptedField>`**  
Purpose: Create the encrypted verifier blob for vault password checking.  
Implementation: `return encrypt(key, "Scync_VALID_v1")`

**Function 6: `checkVerifier(key: CryptoKey, verifier: EncryptedField): Promise<boolean>`**  
Purpose: Check if a derived key is correct by decrypting the verifier.  
Steps:
1. Try `decrypted = await decrypt(key, verifier)` — wrap in try/catch
2. If throws → return `false` (wrong password — AES-GCM auth tag failed)
3. If `decrypted === "Scync_VALID_v1"` → return `true`
4. Otherwise → return `false` (should not happen in practice)

### 15.2 Base64 Utilities

The Web Crypto API works with `ArrayBuffer` and `Uint8Array`. Firestore stores strings. These utilities bridge between them.

```
utf8Encode(s: string): Uint8Array   → new TextEncoder().encode(s)
utf8Decode(b: ArrayBuffer): string  → new TextDecoder().decode(b)
base64Encode(b: Uint8Array): string → btoa(String.fromCharCode(...b))
base64Decode(s: string): Uint8Array → Uint8Array.from(atob(s), c => c.charCodeAt(0))
```

Note: `btoa`/`atob` are available in all browser environments including Electron renderer and Capacitor WebViews.

### 15.3 Firestore CRUD with Encryption (packages/core/src/firestore.ts)

**createSecret(uid, key, formData): Promise<void>**
1. Generate new Firestore document ID: `const ref = doc(collection(db, "users", uid, "secrets"))`
2. `encValue = await encrypt(key, formData.value)`
3. `encNotes = formData.notes ? await encrypt(key, formData.notes) : null`
4. Assemble `StoredSecret` object (all metadata plaintext, value/notes encrypted)
5. `await setDoc(ref, storedSecret)`

**updateSecret(uid, key, id, formData): Promise<void>**
1. Get reference to existing document
2. Re-encrypt value and notes (fresh IVs each time even if value unchanged)
3. `await updateDoc(ref, { ...updatedFields, updatedAt: serverTimestamp() })`

**deleteSecret(uid, id): Promise<void>**
1. `await deleteDoc(doc(db, "users", uid, "secrets", id))`

**subscribeToSecrets(uid, callback): Unsubscribe**
1. `onSnapshot(collection(db, "users", uid, "secrets"), snapshot => callback(snapshot.docs.map(toStoredSecret)))`
2. Returns unsubscribe function — call it in React `useEffect` cleanup

**decryptSecret(key, stored): Promise<DecryptedSecret>**
1. `value = await decrypt(key, stored.encValue)`
2. `notes = stored.encNotes ? await decrypt(key, stored.encNotes) : ""`
3. Return `{ ...stored, value, notes }` (without encValue and encNotes)

### 15.4 Decryption Strategy — On-Demand vs. Bulk

**MVP strategy: On-demand decryption**  
Secrets are stored as `StoredSecret[]` in Zustand (encrypted blobs). Decryption happens only at the moment a user clicks "Copy" or "Show value" for a specific secret. The decrypted plaintext is used immediately and discarded — it is never placed in React state.

This is the safer approach: if the device is compromised and memory is dumped, plaintext secrets are not present in the JavaScript heap unless the user is actively viewing them.

**V2 option: Bulk decryption on unlock**  
Decrypt all secrets on unlock and store `DecryptedSecret[]` in Zustand. Enables client-side full-text search (including searching within notes and values). Higher security risk (all plaintexts in memory), but acceptable for a local app. This mode would be gated behind a user preference toggle.

### 15.5 Vault Password Change

When the user changes their vault password, all encrypted data must be re-encrypted with the new key. This is a multi-step atomic operation:

1. Derive `oldKey` from old password (verify it first with `checkVerifier`)
2. Derive `newKey` from new password with NEW randomly generated salt
3. For each secret in the vault:
   a. Decrypt `encValue` with `oldKey`
   b. Re-encrypt with `newKey` (fresh IV)
   c. Decrypt `encNotes` with `oldKey` (if present)
   d. Re-encrypt with `newKey` (fresh IV)
4. Generate new verifier with `newKey`
5. Write all updates to Firestore in a single **batch write** (atomic — either all succeed or all fail)
6. Write new salt and new verifier to meta
7. Replace `oldKey` with `newKey` in Zustand vaultStore

This operation can be slow if the vault contains many secrets. Show a progress indicator. Do NOT allow the user to navigate away during this operation.

---

## 16. UI/UX Guidelines and Design System

### 16.1 Design Philosophy

Scync's UI should feel like a well-designed developer tool — not a consumer app, not an enterprise dashboard. References: Linear, Vercel dashboard, Raycast. Characteristics:

- Dark mode as the **default** (not light mode)
- Dense but not cramped — every pixel carries meaning
- Keyboard-first — power users should never need to reach for the mouse
- Monospace for secret values — they are code, not prose
- Fast transitions — no unnecessary animation delays
- Clear hierarchy — locked vault feels very different from unlocked vault

### 16.2 Color Palette

```
Background:
  bg-primary:     #0d0d0d    (page background)
  bg-secondary:   #141414    (card backgrounds)
  bg-tertiary:    #1c1c1c    (input backgrounds, hover states)
  bg-elevated:    #252525    (modal backgrounds)

Text:
  text-primary:   #f0f0f0    (main content)
  text-secondary: #888888    (labels, hints)
  text-muted:     #555555    (disabled, placeholder)

Border:
  border-subtle:  #2a2a2a    (card borders)
  border-default: #3a3a3a    (input borders)
  border-strong:  #555555    (focus rings)

Accent:
  accent:         #7c6af7    (primary action — purple, matching the brand)
  accent-hover:   #9284ff

Status:
  success:        #22c55e
  warning:        #f59e0b
  danger:         #ef4444
  info:           #3b82f6
```

Light mode support is a V1.1 feature — MVP ships dark mode only.

### 16.3 Typography

- Body: system-ui (Inter if self-hosted fonts added in V2)
- Monospace: `font-mono` (JetBrains Mono in V2, system mono in MVP)
- Scale: 12px (xs), 14px (sm), 16px (base), 18px (lg), 24px (xl)
- Secret values always render in monospace regardless of font setting

### 16.4 Spacing

Standard 4px grid. Common values: 4, 8, 12, 16, 20, 24, 32, 48px.

### 16.5 Key Screens

**Auth Screen** — Centered card, Scync logo/wordmark, Google Sign-In button, brief tagline. No other content.

**Setup Screen** — Centered card, brief explanation of what the vault password is and why it is separate from Google, two password inputs with strength meter, submit button.

**Unlock Screen** — Centered card showing Google account avatar and email to confirm identity, single password input, unlock button. Quick and focused.

**Vault Screen (main)** — Three-column layout on desktop:
- Left sidebar (220px): Search bar at top; filter pills for service, type, environment, status; count of filtered secrets
- Center (flexible): Grid or list of `SecretCard` components, sort controls at top
- Right panel (320px): Secret detail view, opens when a card is selected; shows all metadata and masked value with copy/show buttons

On mobile: sidebar becomes a bottom sheet (pull up for filters); card grid becomes single column; detail view opens as a full-screen overlay.

**Add/Edit Modal** — Full-screen modal on mobile, centered dialog (560px wide) on desktop. All form fields for creating or editing a secret.

### 16.6 SecretCard Component Anatomy

```
┌──────────────────────────────────────────────┐
│ [Service Badge]  Name of Secret         [···]│ ← kebab menu: edit, delete
│ API Key · Personal                           │
│ ●●●●●●●●●●●●●●●●●●    [Copy] [Show] [···]  │ ← masked value row
│ Active · Expires Jan 2026                    │
└──────────────────────────────────────────────┘
```

- Service Badge: colored pill with service name abbreviation
- Name: 14px medium weight, truncated with ellipsis
- Type · Environment: 12px muted text
- Masked value: `●` repeated 20 times, monospace font; Copy icon (clipboard) and Show icon (eye) inline
- Status chip: color-coded (green=Active, yellow=Rotated, etc.)
- Expiry: shown in red if within 30 days, orange if within 90 days, muted gray otherwise

### 16.7 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open search / command palette |
| `Cmd/Ctrl + N` | New secret |
| `Escape` | Close modal / deselect secret |
| `Cmd/Ctrl + C` on selected | Copy secret value |
| `Cmd/Ctrl + L` | Lock vault |

---

## 17. Component Architecture

### 17.1 Component Hierarchy

```
App
├── AuthGuard (checks Firebase auth session)
│   ├── AuthPage (if not authenticated)
│   └── VaultGuard (checks vault unlock state)
│       ├── SetupPage (if first-time user — no vault meta)
│       ├── UnlockPage (if vault locked)
│       └── VaultPage (if vault unlocked)
│           ├── Sidebar
│           │   ├── SearchBar
│           │   └── FilterBar
│           ├── SecretList
│           │   └── SecretCard[]
│           ├── SecretDetail (conditionally rendered)
│           │   ├── MaskedValue
│           │   └── MetadataGrid
│           └── AddEditModal (conditionally rendered)
│               └── SecretForm
│                   ├── Input (name)
│                   ├── Select (service, type, environment, status)
│                   ├── MaskedInput (value)
│                   ├── DatePicker (lastRotated, expiresOn)
│                   └── Textarea (notes)
```

### 17.2 Guards

`AuthGuard` and `VaultGuard` are React components (not HOCs) that subscribe to their respective Zustand stores and conditionally render their children or redirect to the appropriate page. They handle loading states while Firebase resolves the initial auth session.

### 17.3 Shared Hooks (packages/ui/src/hooks/)

**useVault()** — provides: `{ entries, filter, setFilter, sortedAndFiltered, addEntry, updateEntry, deleteEntry, copyValue, revealValue }`  
**useAuth()** — provides: `{ user, signIn, signOut, isLoading }`  
**useClipboard()** — provides: `{ copy(text), hasCopied }` — handles 30-second auto-clear  
**useSearch()** — provides: `{ query, setQuery, results }` — client-side fuzzy search  
**useInactivityLock()** — sets up event listeners for mouse/keyboard activity; dispatches lock action after timeout

---

## 18. State Management

### 18.1 authStore (Zustand)

```typescript
interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  signIn: () => Promise<void>;       // Google Sign-In popup/redirect
  signOut: () => Promise<void>;      // Firebase signOut + clear vaultStore
}
```

Initialized once in `App.tsx` via `onAuthStateChanged(auth, user => authStore.setState({ user, isLoading: false }))`.

### 18.2 vaultStore (Zustand)

```typescript
interface VaultState {
  // Crypto
  derivedKey: CryptoKey | null;      // null = locked
  isLocked: boolean;
  
  // Data
  storedSecrets: StoredSecret[];     // raw encrypted entries from Firestore
  
  // Actions
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  setupVault: (password: string) => Promise<void>;
  
  // CRUD (all handle encryption internally)
  createSecret: (formData: SecretFormData) => Promise<void>;
  updateSecret: (id: string, formData: SecretFormData) => Promise<void>;
  deleteSecret: (id: string) => Promise<void>;
  decryptValue: (secretId: string) => Promise<string>; // on-demand decrypt
  
  // Subscription management
  subscribeToSecrets: () => () => void; // returns unsubscribe
}
```

### 18.3 uiStore (Zustand)

```typescript
interface UIState {
  selectedSecretId: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  filter: VaultFilter;
  sortBy: 'createdAt' | 'name' | 'expiresOn';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  selectSecret: (id: string | null) => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (id: string) => void;
  closeEditModal: () => void;
  setFilter: (filter: Partial<VaultFilter>) => void;
  clearFilters: () => void;
  setSortBy: (by: UIState['sortBy']) => void;
}
```

---

## 19. Testing Strategy

### 19.1 Unit Tests (Vitest)

Location: `packages/core/src/__tests__/`

Priority test cases:
- `crypto.test.ts`: encrypt → decrypt round-trip produces original string; deriveKey with same inputs produces same key behavior (verified through encrypt/decrypt); checkVerifier returns true for correct password and false for wrong password; changing one character of vault password produces different key (cannot decrypt)
- `firestore.test.ts`: createSecret produces correct shape; decryptSecret restores original values (using Firebase emulator)

### 19.2 Component Tests (React Testing Library + Vitest)

Location: `packages/ui/src/__tests__/`

Priority test cases:
- `MaskedValue`: value is masked by default; clicking "Show" reveals value; value auto-hides after 15 seconds; clicking "Copy" triggers copy callback
- `SecretForm`: submits correct FormData structure; validation prevents submission with empty required fields
- `AuthGuard`: renders children when user is authenticated; renders AuthPage when user is null

### 19.3 End-to-End Tests (Playwright)

Location: `apps/web/e2e/`

Priority flows:
- Full onboarding: load app → click sign in (Firebase emulator mock) → enter vault password → vault unlocked → vault page renders
- Add secret: unlock vault → open add modal → fill form → save → new entry appears in list
- Copy value: select entry → click copy → clipboard contains correct value (check Playwright clipboard API)
- Lock and unlock: click lock → unlock page appears → re-enter password → vault reloads

### 19.4 Firebase Emulator in Tests

All tests that touch Firebase use the local Firebase Emulator Suite. In CI, the emulators start before tests run and stop after. No test ever touches the production Firebase project.

---

## 20. CI/CD Pipeline

### 20.1 Pull Request Checks (.github/workflows/ci.yml)

Triggers: every push to any branch that has an open PR.

Steps:
1. Checkout code
2. Setup pnpm
3. `pnpm install --frozen-lockfile`
4. `pnpm turbo run typecheck` — TypeScript compiler check across all packages
5. `pnpm turbo run lint` — ESLint across all packages
6. Start Firebase Emulators
7. `pnpm turbo run test` — Vitest unit + component tests
8. `pnpm turbo run build --filter=apps/web` — ensure web app builds successfully

### 20.2 Deploy Preview (.github/workflows/deploy-preview.yml)

Triggers: push to `main` branch.

Steps:
1. All CI checks (as above)
2. `firebase deploy --only hosting:preview --project Scync-prod` → deploys to a preview URL
3. Comment on the last merged PR with the preview URL

### 20.3 Release (.github/workflows/release.yml)

Triggers: push of a tag matching `v*.*.*` (e.g. `v1.0.0`).

Steps:
1. All CI checks
2. Build web app → deploy to Firebase Hosting production
3. Build Electron app for Windows → upload `.exe` as GitHub Release asset
4. (V2) Build Electron for Mac and Linux
5. (V2) Build Capacitor for iOS → upload `.ipa`
6. (V2) Build Capacitor for Android → upload `.aab`

### 20.4 Secrets in CI

GitHub Actions secrets (not to be confused with Scync secrets):
- `FIREBASE_SERVICE_ACCOUNT_Scync_PROD` — Firebase service account JSON for deployment
- `VITE_FIREBASE_*` — Firebase config vars for the production project (set as GitHub Actions environment vars)
- `WINDOWS_CODE_SIGNING_CERT` — Windows code signing certificate (V1 production)
- `WINDOWS_CODE_SIGNING_CERT_PASSWORD` — Certificate password

---

## 21. Development Phases and Milestones

### Phase 0 — Scaffolding (1–2 days)

Goal: A working monorepo with all packages set up, no features yet.

Tasks:
- Initialize pnpm workspace with `turbo.json`
- Scaffold `packages/core` with TypeScript, Vitest, barrel export
- Scaffold `packages/ui` with TypeScript, Tailwind, React, barrel export
- Scaffold `apps/web` with Vite, React, Tailwind
- Scaffold `apps/desktop` with Electron
- Scaffold `apps/mobile` with Capacitor
- Set up ESLint, Prettier, TypeScript configs at root level (shared, extended by packages)
- Configure Turborepo pipelines: `build`, `test`, `typecheck`, `lint`, `dev`
- Create Firebase project (dev + prod)
- Write `.env.example` with all required vars documented
- Initial `README.md` with setup instructions
- Initialize GitHub repo, push, set up branch protection on `main`

Milestone: `pnpm dev` starts all three app dev servers. `pnpm test` runs (with zero tests passing — that is acceptable). `pnpm build` produces build artifacts for all apps.

### Phase 1 — Core Crypto and Data Layer (2–3 days)

Goal: Encryption works, Firestore read/write works, TypeScript types are complete.

Tasks:
- Implement `packages/core/src/crypto.ts` — all six functions
- Write unit tests for all crypto functions (using Firebase Emulator)
- Implement `packages/core/src/types.ts` — all TypeScript types
- Implement `packages/core/src/constants.ts` — all service, type, environment, status arrays
- Implement `packages/core/src/firestore.ts` — all Firestore CRUD functions
- Deploy Firestore security rules and indexes
- Write tests for Firestore functions (using Firebase Emulator)

Milestone: Unit tests pass for all crypto and Firestore functions. A developer can call `createSecret` and `decryptSecret` in a test and get the original plaintext back.

### Phase 2 — Authentication Flow (1–2 days)

Goal: Google Sign-In works, vault setup and unlock work, Zustand stores are initialized.

Tasks:
- Implement `authStore` in `packages/ui/src/stores/authStore.ts`
- Implement `vaultStore` in `packages/ui/src/stores/vaultStore.ts`
- Implement `AuthGuard` and `VaultGuard` components
- Build `AuthPage` (Google Sign-In button)
- Build `SetupPage` (vault password creation)
- Build `UnlockPage` (vault password entry)
- Wire up Firebase Auth with `onAuthStateChanged`
- Test full sign-in → setup → unlock → sign-out flow manually

Milestone: Can sign in with a real Google account, set a vault password, refresh the page, re-enter vault password, and reach a (blank) vault page.

### Phase 3 — Vault UI (3–5 days)

Goal: Full secret CRUD works in the web UI.

Tasks:
- Implement `uiStore`
- Build `Sidebar` with `SearchBar` and `FilterBar`
- Build `SecretList` with grid layout
- Build `SecretCard` component with masked value, copy, show/hide
- Build `SecretDetail` panel
- Build `AddEditModal` with `SecretForm`
- Implement `useClipboard` hook with 30-second auto-clear
- Implement `useInactivityLock` hook
- Implement auto-lock on window blur
- Manual lock button
- Real-time Firestore subscription via `subscribeToSecrets` in `vaultStore`
- Sort functionality
- Filter functionality (client-side)
- Search functionality (client-side)

Milestone: Can add, edit, delete secrets. Can search and filter. Vault locks after inactivity. Real-time sync works (open two browser tabs — changes in one appear in the other).

### Phase 4 — Web App Polish and Deployment (1–2 days)

Goal: Web app is production-ready and deployed.

Tasks:
- PWA setup with `vite-plugin-pwa`
- Responsive layout (mobile breakpoints)
- Error states (Firestore offline, wrong password, network error)
- Empty states (no secrets, no search results)
- Toast notifications
- Loading skeletons
- Settings page (auto-lock timeout, change vault password)
- Deploy to Firebase Hosting production
- Set up custom domain (if available)
- Configure CI/CD pipeline for automatic deployment on merge to main

Milestone: Web app is live at production URL. Works on mobile browser.

### Phase 5 — Desktop App (1–2 days)

Goal: Windows Electron app builds and distributes.

Tasks:
- Implement Electron main process (`apps/desktop/src/main.ts`)
- Configure security settings on BrowserWindow
- Handle Google OAuth redirect in Electron (custom protocol)
- Configure `electron-builder.yml` for Windows NSIS packaging
- Set up `electron-updater` for auto-updates via GitHub Releases
- Test installer on Windows
- Add to GitHub Actions release pipeline
- Create GitHub Release with `.exe` installer attached

Milestone: User can download `.exe`, install Scync on Windows, use it identically to the web version.

### Phase 6 — Mobile App (2–3 days)

Goal: iOS and Android apps distribute via TestFlight / Play Internal Testing.

Tasks:
- `npx cap add ios` and `npx cap add android`
- Configure `capacitor.config.ts`
- Handle Google OAuth redirect in Capacitor (custom URL scheme)
- Configure Android permissions and `minSdkVersion`
- Configure iOS `Info.plist` and URL schemes
- Build and test on iOS Simulator and Android Emulator
- Build and test on physical devices
- Upload to TestFlight (iOS) and Google Play Internal Testing (Android)

Milestone: App installs on real iPhone and Android phone, works identically to web version.

### Phase 7 — Open Source Launch (1 day)

Goal: Project is public, community-ready.

Tasks:
- Write comprehensive `README.md` with screenshots, feature list, installation instructions, self-hosting note (future)
- Write `CONTRIBUTING.md` with development setup guide
- Write `SECURITY.md` with vulnerability disclosure policy and the cryptographic design summary
- Add MIT `LICENSE` file
- Create GitHub Discussions for feature requests
- Create issue templates (bug report, feature request)
- Tag `v1.0.0` and create GitHub Release with all platform installers
- (Optional) Post on Hacker News, Reddit r/selfhosted, r/programming, Product Hunt

Milestone: Repository is public, `v1.0.0` is tagged, installers are attached to the release.

---

## 22. Open Source Strategy

### 22.1 License

**MIT License** — maximally permissive. Users can fork, modify, sell, and redistribute without restriction as long as the copyright notice is retained. This is the right choice for a developer tool designed to build community.

### 22.2 Repository Structure

Public GitHub repository with:
- `main` branch — always deployable, CI must pass
- Feature branches — all development, merged via PR
- Branch protection on `main`: require passing CI, require one review (waived for solo development phase)
- GitHub Issues for bug tracking
- GitHub Discussions for feature requests and Q&A
- GitHub Projects (kanban) for roadmap tracking

### 22.3 SECURITY.md Contents

Must include:
- Summary of the zero-knowledge encryption design
- Statement that the server never sees plaintext values
- The specific algorithms used (PBKDF2-SHA256, 310,000 iterations, AES-256-GCM)
- Instructions for responsible disclosure of vulnerabilities (private email, 90-day disclosure timeline)
- What a breach of Firebase would and would not expose
- Acknowledgment that the vault password is the single point of failure — if lost, data cannot be recovered (by design)

### 22.4 Community Guidelines

- Code of conduct: Contributor Covenant
- Contributors: credited in `README.md` and GitHub contributors graph
- Issues triaged within 72 hours
- PRs reviewed within 1 week

---

## 23. Future Roadmap

### Biometric Authentication (V2)

On mobile, vault password entry is replaced by Face ID / Touch ID. The vault password is securely stored in iOS Keychain / Android Keystore, unlocked by biometric. On desktop (V3), Windows Hello or macOS Touch ID integration via Electron's native APIs.

### Browser Extension (V2)

Chrome extension that connects to the web app (via extension messaging or a local Scync daemon). Allows injecting API keys into developer tool web forms — GitHub personal access token fields, Vercel environment variable inputs, etc. NOT a general autofill extension — scoped to developer contexts.

### Password Management (V3)

Extend the data model to include a `LoginCredential` type (URL, username, password, TOTP secret). Add browser extension autofill for website login forms. This makes Scync a full-featured password + secrets manager — Bitwarden's open source model but with a better UI and zero-knowledge architecture.

### Secret Rotation Automation (V3)

For services that have rotation APIs (GitHub, Stripe, AWS IAM), add one-click rotation: generates a new key via the service's API, stores the new key in Scync, marks the old key as rotated, optionally deletes the old key from the service.

### CLI Tool (V2)

`npm install -g Scync-cli`  
`Scync auth` — authenticate to your vault  
`Scync get github-pat` — prints the value to stdout  
`GITHUB_TOKEN=$(Scync get github-pat)` — pipe into shell commands  
Useful for local development scripts that need credentials without hardcoding them.

### Self-Hosting (V3)

Replace Firebase with a self-hostable backend:
- Docker Compose: Supabase (auth + database) + Nginx (static web app hosting)
- All the same Firestore rules logic translated to Supabase Row Level Security policies
- Identical encryption model — client-side only, server never sees plaintext
- Configuration via environment variables — swap `VITE_FIREBASE_*` for `VITE_SUPABASE_*`

---

## 24. Agent Instructions and Build Order

This section is written specifically for an AI agent executing the development of this project.

### 24.1 First Principles for This Agent

1. **Read this entire document before writing a single line of code.** The security model, type system, and architecture decisions are interdependent. Missing any one of them creates inconsistencies that are expensive to fix later.

2. **Always start from `packages/core`.** Everything downstream (UI, apps) depends on it. The types defined in `packages/core/src/types.ts` are the contract that every component, every Firestore function, and every UI hook must honor.

3. **Never store plaintext secret values in React state.** The `DecryptedSecret` type exists only in-memory during a decrypt operation and is discarded immediately. The Zustand `vaultStore` holds `StoredSecret[]` (encrypted). Decryption is always on-demand.

4. **Never deviate from the encryption specification in Section 15.** The algorithm choices, iteration counts, and key handling rules are not suggestions — they are security requirements.

5. **Tests before the next phase.** Phase N's code must have passing tests before Phase N+1 begins. The crypto module in particular must be fully tested before building any UI that depends on it.

### 24.2 Recommended Build Order

Follow the development phases in Section 21 exactly:

```
Phase 0: Scaffolding
  ↓
Phase 1: Crypto + Firestore (core package)
  ↓
Phase 2: Auth flows (stores + guard components)
  ↓
Phase 3: Vault UI (main feature)
  ↓
Phase 4: Web polish + deployment
  ↓
Phase 5: Electron desktop
  ↓
Phase 6: Capacitor mobile
  ↓
Phase 7: Open source launch
```

Do not begin Phase 3 until Phase 2 produces a working sign-in → unlock flow tested manually. Do not begin Phase 5 until Phase 4 is deployed to production.

### 24.3 Files to Create First

In order:
1. `turbo.json` — defines build pipelines
2. `pnpm-workspace.yaml` — defines workspace packages
3. `packages/core/src/types.ts` — all TypeScript types
4. `packages/core/src/constants.ts` — all constant arrays
5. `packages/core/src/crypto.ts` — all six crypto functions
6. `packages/core/src/__tests__/crypto.test.ts` — tests for crypto
7. `packages/core/src/firebase.ts` — Firebase config and init
8. `packages/core/src/firestore.ts` — all Firestore CRUD functions
9. `packages/ui/src/stores/authStore.ts`
10. `packages/ui/src/stores/vaultStore.ts`
11. `packages/ui/src/stores/uiStore.ts`
12. `apps/web/src/pages/AuthPage.tsx`
13. `apps/web/src/pages/SetupPage.tsx`
14. `apps/web/src/pages/UnlockPage.tsx`
15. `apps/web/src/App.tsx` with routing
16. Then: all UI components in order of dependency (bottom-up: atoms → molecules → organisms → pages)

### 24.4 Environment Variable Checklist

Before running any code, ensure these are set in `apps/web/.env.local`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_EMULATORS=true        # set to false for production
```

### 24.5 Security Anti-Patterns — Never Do These

- NEVER log a plaintext secret value to the console
- NEVER store a plaintext secret value in localStorage or sessionStorage
- NEVER store the vault password in any persistent storage
- NEVER store the derived CryptoKey in any persistent storage
- NEVER transmit an unencrypted secret value to Firebase
- NEVER skip the AES-GCM authentication tag check (do NOT use AES-CBC which lacks authentication)
- NEVER use a hardcoded or predictable IV — always `crypto.getRandomValues`
- NEVER reuse an IV with the same key — always fresh IV per encrypt call
- NEVER use a third-party crypto library — only Web Crypto API
- NEVER allow the Firestore security rules to be `allow read, write: if true`

### 24.6 Dependency Management Policy

- All dependency versions pinned in `package.json` files (no `^` or `~` ranges — use exact versions)
- `pnpm install --frozen-lockfile` in CI (lockfile must not drift)
- Security audit on each new dependency addition: check npm advisories, GitHub Advisory Database
- Zero-dependency policy for `packages/core` except Firebase SDK and TypeScript

### 24.7 Naming Conventions

- Files: `camelCase.ts` for utilities, `PascalCase.tsx` for React components
- Variables: `camelCase`
- Types and interfaces: `PascalCase`
- Constants (arrays, objects): `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects
- Firestore collection names: `camelCase` plural (`secrets`, `meta`)
- Firestore field names: `camelCase`
- CSS/Tailwind: only Tailwind utilities in JSX, no raw CSS unless extending the theme

---


# Scync Master Spec — Addendum v1.1
**Appended sections based on design review.**  
**Append this content to the end of `SCYNC_MASTER_SPEC.md` before beginning development.**

---

## 25. Project-Based Vault Organization

### 25.1 The Problem with a Flat List

The current spec organizes secrets as a single flat collection per user. This breaks down quickly for a developer managing 30–50 secrets across multiple projects, clients, and side ventures. Secrets need a home — a context that groups them meaningfully.

### 25.2 Data Model Changes

Add a `projects` subcollection alongside `secrets`:

```
users/{uid}/
  ├── meta/vault/              (unchanged)
  ├── projects/{projectId}/    (NEW)
  │   ├── id: string
  │   ├── name: string         (e.g. "My Portfolio", "Client X", "Home Lab")
  │   ├── color: string        (Tailwind color key for visual identity)
  │   ├── icon: string         (emoji or icon key)
  │   ├── description: string  (optional, plaintext)
  │   ├── createdAt: Timestamp
  │   └── updatedAt: Timestamp
  └── secrets/{secretId}/
      └── projectId: string | null   (NEW — null = "Uncategorized")
```

**TypeScript additions to `packages/core/src/types.ts`:**

```typescript
export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  icon: string;         // emoji, e.g. "🚀", "🏠", "💼"
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
```

**Update `StoredSecret`:**
```typescript
export interface StoredSecret {
  // ... existing fields ...
  projectId: string | null;   // ADD THIS
}
```

### 25.3 UI Changes

**Left Sidebar restructure:**

```
┌─────────────────────┐
│  🔍 Search          │
├─────────────────────┤
│  All Secrets    (42)│  ← default view
├─────────────────────┤
│  PROJECTS           │
│  🚀 Side Project(12)│
│  💼 Client X    (8) │
│  🏠 Home Lab    (6) │
│  📦 Uncategorized(16)│
├─────────────────────┤
│  FILTERS            │
│  Type ▾             │
│  Environment ▾      │
│  Status ▾           │
└─────────────────────┘
```

Selecting a project filters the secret list to that project. Filters then apply within the selected project. "All Secrets" ignores project context and shows everything.

**Project creation:** Simple inline form in the sidebar — name, color picker (8 options), emoji picker (free text). No modal needed.

**Project indicator on SecretCard:** A small colored left border or dot matching the project color, visible in "All Secrets" view.

### 25.4 Firestore Updates

Add CRUD functions to `packages/core/src/firestore.ts`:

```typescript
createProject(uid: string, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>
updateProject(uid: string, projectId: string, data: Partial<Project>): Promise<void>
deleteProject(uid: string, projectId: string, moveSecretsTo: string | null): Promise<void>
// deleteProject reassigns all secrets in the project to moveSecretsTo (another projectId or null)
subscribeToProjects(uid: string, callback: (projects: Project[]) => void): () => void
```

### 25.5 State Management Addition

Add `projectStore` to `packages/ui/src/stores/`:

```typescript
interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;   // null = "All Secrets"
  selectProject: (id: string | null) => void;
  createProject: (data: ...) => Promise<void>;
  updateProject: (id: string, data: ...) => Promise<void>;
  deleteProject: (id: string, moveSecretsTo: string | null) => Promise<void>;
  subscribeToProjects: () => () => void;
}
```

---

## 26. .env Import and Export

### 26.1 Feature Overview

A developer's most common secret context is a `.env` file. Scync should be the canonical place those secrets live — making it trivial to import from a file and export back to one.

This is a high-value differentiator. No mainstream password manager does this.

### 26.2 Import Spec

**Entry point:** "Import .env" button on the vault page toolbar (or inside a project view).

**Parsing rules:**

```
# Comments are ignored
EMPTY_LINE=               → value is empty string, import with warning
KEY=value                 → standard — import as-is
KEY="value with spaces"   → strip surrounding quotes
KEY='single quoted'       → strip surrounding quotes
KEY=value # inline comment → value is "value", comment stripped
EXPORT KEY=value          → strip "export " prefix, treat normally
multiline not supported   → skip lines without = separator, log as skipped
```

**Import flow:**

```
User pastes .env content or drags a .env file
  └─> Parse into key/value pairs
        └─> Show preview table:
              | Key              | Value (masked) | Action        |
              | OPENAI_API_KEY   | sk-●●●●●●●●    | Import ✓      |
              | DATABASE_URL     | postgres://●●● | Import ✓      |
              | PORT             | 3000            | Skip (not secret?) |
              └─> User can toggle each row on/off
        └─> Select target project (or create new one named after the .env file)
        └─> Auto-detect secret type:
              - contains "KEY" or "TOKEN" → "API Key"
              - contains "SECRET" → "Secret Key"
              - contains "URL" or "DATABASE" → "Database URL"
              - contains "WEBHOOK" → "Webhook Secret"
              - default → "Other"
        └─> Auto-detect service:
              - OPENAI_* → "OpenAI"
              - ANTHROPIC_* → "Anthropic"
              - GITHUB_* → "GitHub"
              - AWS_* → "AWS"
              - STRIPE_* → "Stripe"
              - VERCEL_* → "Vercel"
              - default → "Other"
        └─> Confirm import → encrypt each value → write to Firestore
              └─> Show result: "12 secrets imported, 2 skipped"
```

**Conflict handling:** If a secret with the same name already exists in the target project, show a conflict UI:
- Overwrite existing
- Keep both (import as new)
- Skip

### 26.3 Export Spec

**Entry point:** "Export .env" button in the project view (not available in "All Secrets" — export is always project-scoped).

**Export flow:**

```
User clicks "Export .env" on a project
  └─> Confirm dialog: "This will decrypt all values temporarily"
        └─> Decrypt all secrets in the project in memory
              └─> Generate .env content:
                    # Scync export — [Project Name] — [Date]
                    # DO NOT COMMIT THIS FILE

                    # [Service] — [Type]
                    KEY_NAME=decrypted_value

              └─> Offer: Download as file OR copy to clipboard
                    └─> If download: triggers browser file download as "[project-name].env"
                        If clipboard: copies text, clears clipboard after 60 seconds
```

**Security note in spec:** The export function must:
- Never write the plaintext to any persistent state
- Never log decrypted values
- Clear the in-memory decrypted map immediately after generating the string
- Show a warning in the UI that the downloaded file is unencrypted

### 26.4 Component: EnvImportModal

New component in `packages/ui/src/components/EnvImportModal.tsx`:

```
Props:
  - isOpen: boolean
  - onClose: () => void
  - targetProjectId: string | null
  - onImportComplete: (count: number) => void

State:
  - rawInput: string          (pasted .env text)
  - parsedRows: ParsedEnvRow[]
  - conflictResolution: Record<string, 'overwrite' | 'keep' | 'skip'>
  - isImporting: boolean
```

---

## 27. Recovery Code UX

### 27.1 Why Recovery Codes Need Special Treatment

Recovery codes are fundamentally different from API keys:
- They come in numbered sets (typically 8–12 codes)
- Each code can only be used once
- Tracking which have been used is safety-critical
- Running out of unused codes is an emergency signal

A generic text field for recovery codes is dangerous. Scync should treat them as a first-class type with dedicated UX.

### 27.2 Data Model Addition

When `type === 'Recovery Codes'`, the secret value is structured differently. The `encValue` field encrypts a JSON string representing a `RecoveryCodeSet`:

```typescript
// packages/core/src/types.ts addition
export interface RecoveryCode {
  code: string;
  used: boolean;
  usedAt: Date | null;
}

export interface RecoveryCodeSet {
  codes: RecoveryCode[];
}

// Helper — the encrypted value for Recovery Codes type is:
// JSON.stringify(RecoveryCodeSet) → then encrypted as usual
```

**Backward compatible:** For all other secret types, `encValue` remains a simple encrypted string. Only `type === 'Recovery Codes'` uses the structured format.

### 27.3 Recovery Code Import

When a user creates a secret with `type === 'Recovery Codes'`, the value input transforms:

```
┌─────────────────────────────────────────────┐
│ Recovery Codes                              │
│                                             │
│ Paste all codes below (one per line):       │
│ ┌─────────────────────────────────────────┐ │
│ │ 8f3a-2b1c-9d4e                         │ │
│ │ 7e2d-1a4f-0c8b                         │ │
│ │ 3b9c-5e7a-2f1d                         │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ 10 codes detected                           │
└─────────────────────────────────────────────┘
```

Parse on paste: split by newline, strip whitespace, filter empty lines, deduplicate.

### 27.4 Recovery Code Display Component

New component: `packages/ui/src/components/RecoveryCodeViewer.tsx`

```
┌─────────────────────────────────────────────┐
│ Recovery Codes — GitHub 2FA                 │
│ 7 of 10 remaining  ██████████░░░  (warning) │
├─────────────────────────────────────────────┤
│  1. ●●●●-●●●●-●●●●    [Copy] [Mark Used]   │
│  2. ●●●●-●●●●-●●●●    [Copy] [Mark Used]   │
│  3. ●●●●-●●●●-●●●●    [Copy] [Mark Used]   │
│  4. ~~~~~~~~~~~~~~~~~~  ✓ Used Jan 12 2025  │
│  5. ~~~~~~~~~~~~~~~~~~  ✓ Used Feb 3 2025   │
│  6. ●●●●-●●●●-●●●●    [Copy] [Mark Used]   │
│  ...                                        │
├─────────────────────────────────────────────┤
│  [Reveal All]  [Add More Codes]             │
└─────────────────────────────────────────────┘
```

- Used codes are visually struck through and grayed out
- Remaining count shown as progress bar — turns orange below 4, red below 2
- "Mark Used" button: decrypts, marks code as used with timestamp, re-encrypts, writes to Firestore
- "Add More Codes" appends new codes to the existing set (for when you regenerate)
- Individual copy still works on unused codes
- Reveal All shows all unused codes simultaneously (with 15 second auto-hide)

### 27.5 Expiry Warning Threshold

When remaining codes ≤ 2, the secret card in the vault list shows a `⚠ 2 codes left` badge in red — same visual weight as an expiry warning.

---

## 28. Expiry and Rotation Dashboard

### 28.1 The Problem

The current spec stores `expiresOn` and `lastRotated` fields and shows an expiry indicator on the card. This is passive. Scync should surface actionable urgency — a developer glancing at the dashboard should immediately know what needs attention.

### 28.2 Dashboard View

Add a "Dashboard" or "Overview" view as the default landing after vault unlock (before the user selects a project or "All Secrets").

**Dashboard layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Good morning. Your vault is unlocked.                  │
│                                                         │
│  ⚠  NEEDS ATTENTION (3)                                 │
│  ┌──────────────────┐ ┌──────────────────┐              │
│  │ 🔴 Expired        │ │ 🟡 Expiring Soon  │              │
│  │ AWS Access Key   │ │ Stripe Live Key  │              │
│  │ Expired 3d ago   │ │ Expires in 12d   │              │
│  │ [View]           │ │ [View]           │              │
│  └──────────────────┘ └──────────────────┘              │
│                                                         │
│  🔄 ROTATION OVERDUE (2)                                │
│  ┌──────────────────┐ ┌──────────────────┐              │
│  │ GitHub PAT       │ │ OpenAI API Key   │              │
│  │ Not rotated in   │ │ Not rotated in   │              │
│  │ 14 months        │ │ 8 months         │              │
│  │ [View]           │ │ [View]           │              │
│  └──────────────────┘ └──────────────────┘              │
│                                                         │
│  ✅ Everything else looks good.                         │
│                                                         │
│  VAULT SUMMARY                                          │
│  42 secrets across 4 projects                          │
│  Last unlocked: Today at 9:14am                        │
└─────────────────────────────────────────────────────────┘
```

### 28.3 Logic for Surface Conditions

Computed client-side after secrets load. No additional Firestore queries.

```typescript
// packages/core/src/utils.ts (new file)

export function getAttentionSecrets(secrets: StoredSecret[]): {
  expired: StoredSecret[];
  expiringSoon: StoredSecret[];      // within 30 days
  rotationOverdue: StoredSecret[];   // lastRotated > 6 months ago, status === 'Active'
  recoveryCodesLow: StoredSecret[];  // type === 'Recovery Codes' with ≤ 2 codes remaining
                                     // (requires decrypt — only shown if vault is unlocked)
} 
```

Rotation overdue threshold: 6 months (180 days). Not configurable in MVP — baked in.

### 28.4 State Update

Add to `uiStore`:

```typescript
interface UIState {
  // ... existing ...
  activeView: 'dashboard' | 'project' | 'all';   // ADD
  setActiveView: (view: UIState['activeView']) => void;
}
```

### 28.5 Navigation Update

Update left sidebar:

```
┌─────────────────────┐
│  🔍 Search          │
├─────────────────────┤
│  📊 Dashboard       │  ← default on unlock
│  📋 All Secrets(42) │
├─────────────────────┤
│  PROJECTS           │
│  ...                │
└─────────────────────┘
```

---

## 29. UI/UX Vision — Detailed Specification

### 29.1 Design Direction

**Inspiration:** Vercel Dashboard (information density, clean typography, monochrome base), Raycast (keyboard-first, command palette, speed), Notion (spatial hierarchy, sidebar navigation, content-first layout).

**Personality:** Calm, precise, fast. Not playful. Not enterprise-sterile. The feeling of a well-maintained terminal — powerful and trustworthy — but rendered in a modern web UI.

**Dark mode first.** Light mode is a V1.1 concern. MVP ships one theme and does it perfectly.

**Density:** Between dense and spacious. Cards have breathing room. The sidebar is compact. Information is present but not crowded. The goal is "I can see everything I need without scrolling" on a 1440px display.

### 29.2 Color System (Updated)

The existing spec defines a purple accent (`#7c6af7`). Keep it — it works. Extended palette:

```
Background:
  bg-base:         #0a0a0a    (page background — near black, not pure black)
  bg-surface:      #111111    (card surfaces)
  bg-elevated:     #1a1a1a    (modals, dropdowns)
  bg-hover:        #1f1f1f    (hover state on interactive elements)

Text:
  text-primary:    #ededed    (main content)
  text-secondary:  #888888    (labels, metadata)
  text-muted:      #444444    (disabled, placeholder)

Border:
  border-subtle:   #1f1f1f    (card borders — barely visible)
  border-default:  #2e2e2e    (input borders)
  border-focus:    #7c6af7    (focus ring — accent color)

Accent:
  accent:          #7c6af7    (primary actions, active states)
  accent-hover:    #9284ff
  accent-dim:      #3d3560    (subtle accent backgrounds)

Status:
  success:         #22c55e    (Active)
  warning:         #f59e0b    (Expiring soon, Rotated, low recovery codes)
  danger:          #ef4444    (Expired, Revoked, critically low recovery codes)
  info:            #60a5fa    (informational)

Monospace value color:
  value-masked:    #3a3a3a    (the ● dots — dark, not distracting)
  value-revealed:  #a3e635    (lime green — revealed values pop visually, signals "sensitive")
```

### 29.3 Typography

```
Font stack:
  UI text:     -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  Monospace:   "JetBrains Mono", "Fira Code", "Cascadia Code", monospace
               (load JetBrains Mono via Google Fonts from the start — it's what makes
                secret values feel right)

Scale:
  xs:   11px  (badges, timestamps)
  sm:   13px  (metadata, labels)
  base: 14px  (body text — tighter than typical, matches Vercel/Linear density)
  md:   16px  (card titles, input values)
  lg:   20px  (section headers)
  xl:   28px  (page titles — used sparingly)

Weight:
  normal: 400
  medium: 500  (most UI labels)
  semibold: 600 (card names, important labels)
```

### 29.4 Layout and Spacing

**4px base grid.** Common tokens: 4, 8, 12, 16, 20, 24, 32, 48, 64px.

**Main vault layout (≥ 1024px):**
```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo] Scync                              [Lock] [User Avatar]   │ ← topbar: 48px
├────────────┬─────────────────────────────┬────────────────────────┤
│            │                             │                        │
│  Sidebar   │     Secret List             │   Detail Panel         │
│  240px     │     flex                    │   320px                │
│            │                             │                        │
│            │                             │                        │
└────────────┴─────────────────────────────┴────────────────────────┘
```

**Collapsed state:** Detail panel hides when no secret is selected (list takes full remaining width). Sidebar can be collapsed to 48px icon-only mode via a toggle.

### 29.5 Component Visual Specs

**SecretCard (updated with project + new types):**
```
┌──────────────────────────────────────────────────────┐
│▌ [Anthropic]  Claude API Key — Personal        [···] │
│  API Key · Production                                │
│  ●●●●●●●●●●●●●●●●●●●●●●         [📋 Copy] [👁 Show]│
│  🟢 Active · Exp: Never                              │
└──────────────────────────────────────────────────────┘

▌ = 3px left border in project color (visible in "All Secrets" view)
[Anthropic] = service badge: bg-accent-dim text-accent, 11px, rounded-full
Title = 14px semibold, white
Subtitle = 13px text-secondary
Masked value = monospace, text-muted, 13px
Buttons = icon-only, 28px hit target, text-secondary → text-primary on hover
Status = 11px badge
```

**Secret value revealed state:**
```
  a3f8-2b1c-9d4e-0f7a-3e2b         [📋 Copy] [👁 Hide]  ⏱ 12s
  ↑ lime green (#a3e635), monospace           ↑ countdown timer
```

**Sidebar navigation item:**
```
Active:    [●] My Project    (12)
           ↑ accent dot, full-width highlight bg-accent-dim, text-primary

Inactive:  [ ] Other Project (8)
           text-secondary, hover: bg-hover text-primary
```

**Command palette (Cmd+K):**
Raycast-style. Full-screen overlay with centered search input. Results: recent secrets, actions (New Secret, Lock Vault, Export Project), navigation (go to project). Keyboard navigable. This replaces the sidebar search in power-user flow.

### 29.6 Motion and Interaction

Keep animations minimal and purposeful. Nothing decorative.

```
Transitions:
  Panel open/close:   150ms ease-out (not spring — crisp)
  Modal appear:       120ms ease-out, slight scale 0.97 → 1.0
  Toast appear:       200ms slide up from bottom-right
  Card hover:         80ms border-color transition
  Value reveal:       instant (no fade — it should feel like an action, not an animation)

No:
  - Page transitions
  - Skeleton shimmer animations (use simple opacity pulse)
  - Bounce, spring, or elastic easing on any functional UI
```

### 29.7 Microinteractions

- **Copy button:** On click → icon swaps to checkmark for 1.5s → back to clipboard icon
- **Lock button:** Brief pulse animation on the lock icon before redirect (signals action was registered)
- **Vault unlock:** On correct password → brief green flash on the input border → transition to vault
- **Wrong password:** Input border flashes red + subtle shake (CSS keyframe, not JS) — no other feedback
- **Expiry badge:** Pulses slowly (3s cycle, low opacity) if a secret is expired — draws attention without being annoying

### 29.8 Empty States

Each empty state has a specific illustration (simple SVG, not stock art) and a primary action:

```
No secrets yet:
  Icon: A simple lock with a + badge
  Headline: "Your vault is empty"
  Sub: "Add your first secret to get started."
  CTA: [+ Add Secret]

No search results:
  Icon: Magnifying glass with a question mark
  Headline: "No secrets match "openai""
  Sub: "Try a different name or clear filters."
  CTA: [Clear search]

No secrets in project:
  Icon: Folder outline
  Headline: "This project has no secrets"
  Sub: "Import a .env file or add secrets manually."
  CTA: [Import .env]  [+ Add Secret]

Dashboard — all clear:
  Icon: Shield with checkmark
  Headline: "Everything looks good"
  Sub: "No expired keys, no rotation overdue. Nice."
```

### 29.9 Accessibility Baseline

- All interactive elements keyboard accessible
- Focus rings visible (use `border-focus` color, 2px solid, 2px offset)
- All icon-only buttons have `aria-label`
- Color is never the only indicator of state (always paired with text or icon)
- Masked value dots use `aria-label="Secret value, hidden"` on the container

---
---

## 30. Product North Star — What Scync Is and Is Not

This section is the final word on product identity. It exists to prevent scope creep, misaligned AI agent output, and feature additions that sound good but dilute the core. Every decision made during development — feature, UI, data model, or otherwise — must be checked against this section first.

---

### 30.1 The One-Line Definition

**Scync is Notion for developer secrets.**

That analogy carries everything:
- Notion is calm, organized, and beautiful — so is Scync
- Notion stores your content, not your workflow — Scync stores your secrets, not your deployment pipeline
- Notion works everywhere — so does Scync
- Notion is yours — Scync is zero-knowledge, so it's truly yours
- Notion doesn't autofill your browser — neither does Scync
- Notion doesn't manage your team's permissions — neither does Scync

---

### 30.2 The Product in One Paragraph

Scync is an open source, zero-knowledge, cross-platform secrets manager built for individual developers. It is a beautiful, organized place to store API keys, tokens, OAuth secrets, recovery codes, and other developer credentials — grouped by project, accessible on every device, copyable in one click, with expiry and rotation tracking built in. The server never sees your plaintext data. Your vault password never leaves your device. It is not a password manager, not a team tool, not an enterprise product. It is the tool that should have existed the moment you first pasted an API key into a Notion page.

---

### 30.3 The Gap This Fills

No existing tool satisfies all of the following simultaneously:

1. **Personal and developer-first** — not team/enterprise oriented
2. **Project-based organization** — secrets grouped by project context, not a flat list
3. **.env workflow integration** — import from and export to `.env` files
4. **Recovery code UX** — numbered, mark-as-used, remaining count — not a text field
5. **Expiry and rotation dashboard** — actionable, not just a metadata field
6. **Zero-knowledge encryption** — server never sees plaintext, ever
7. **Cross-platform** — web, desktop, mobile, same codebase
8. **Open source and free** — auditable, forkable, no subscription
9. **Beautiful UI** — something a developer actually enjoys opening

Every existing tool fails at least two of these. This is the gap Scync fills.

---

### 30.4 What Scync Is — Permanently

These are core to Scync's identity at every version:

- **A place to store developer secrets** — API keys, tokens, OAuth secrets, recovery codes, SSH keys, webhook secrets, database URLs, service account credentials
- **Project-organized** — secrets live inside projects, not a flat list
- **Zero-knowledge** — encryption is client-side only, always, no exceptions
- **Cross-device** — web app, desktop app, mobile app, one codebase
- **Copy-first UX** — the primary action on any secret is copy. One click, done.
- **Expiry and rotation aware** — secrets have lifecycles, Scync surfaces them
- **Open source and MIT licensed** — forever

---

### 30.5 What Scync Is Not — Permanently

These are explicitly out of scope at every version unless the product identity fundamentally changes (which requires rewriting this section, not ignoring it):

- **Not a password manager** — no browser autofill, no username/URL/password triplet as the primary data model. Passwords may be stored as a secret type, but Scync will never compete with Bitwarden or 1Password on their core use case.
- **Not a browser extension** — no autofill, no form injection in MVP or V2. A developer-focused extension for injecting API keys into web forms is a V3 consideration only.
- **Not a team or enterprise tool** — no sharing, no RBAC, no audit logs, no SSO, no seat-based pricing. Scync is personal.
- **Not a CI/CD secrets injector** — Doppler and Infisical own that space. Scync does not inject secrets into pipelines.
- **Not a secrets rotation engine** — Scync tracks rotation dates and reminds you. It does not call AWS or GitHub APIs to rotate keys automatically (V3 consideration only).
- **Not a note-taking app** — the `notes` field on a secret exists for context about that secret, not for general developer notes. Scync is not Notion itself.
- **Not a subscription product** — Scync is free, open source, MIT licensed. There is no paid tier in the roadmap.

---

### 30.6 Decision Filter

Before adding any feature, UI element, data field, or page to Scync, run it through this filter in order:

1. **Does it help a solo developer store, find, or copy a secret faster?**
   If no → don't build it.

2. **Does it require trusting the server with plaintext data?**
   If yes → don't build it.

3. **Does it add complexity that a non-developer user would need explained?**
   If yes → reconsider. Scync should feel obvious.

4. **Is it already solved well by Bitwarden, 1Password, Doppler, or Infisical?**
   If yes → don't build it. Let those tools own their space.

5. **Would it make the core loop — unlock → find → copy — slower or more cluttered?**
   If yes → don't build it.

If a feature passes all five, it belongs in Scync.

---

### 30.7 The Core Loop

Every design and engineering decision must protect and optimize this loop:

```
Unlock vault (vault password)
  → Find secret (search or browse by project)
    → Copy value (one click)
```

That's it. Everything else — expiry tracking, rotation reminders, .env import, recovery code UX, the dashboard — exists to support this loop or to make the secrets inside it more trustworthy and organized. Nothing should interrupt or complicate it.

---

### 30.8 The Feeling

When a developer opens Scync, they should feel:

- **Calm** — everything is organized, nothing is missing, nothing is alarming unless it needs to be
- **Fast** — the vault loads instantly, search is instant, copy is one click
- **Trusted** — the UI communicates security without being paranoid or verbose about it
- **In control** — their data is theirs, encrypted, organized the way they think about their work

The closest feeling in existing products: opening a well-maintained Notion workspace, or launching Raycast and knowing the answer is one keystroke away. That is the bar.

---

### 30.9 A Note to the Developer and Any AI Agent Building This

This spec was written with care. The security model is not negotiable. The product identity is not negotiable. The build order exists for a reason — the crypto module is the foundation of everything, and it must be correct before any UI is built on top of it.

Scync is not trying to be the next Bitwarden. It is not trying to raise funding or capture enterprise contracts. It is trying to be the tool that a developer reaches for without thinking — the place their secrets live, calm and organized, the way their code lives in GitHub.

Build it like you use it. Because you do.

---

*End of specification. Version 1.0 complete.*  
*Sections 1–24: Core specification*  
*Sections 25–29: Addendum — project organization, .env workflows, recovery codes, dashboard, UI/UX vision*  
*Section 30: Product north star — read this before building anything*

*Document ends here. Version 1.0 — tobe updated as architecture decisions evolve during development.*
