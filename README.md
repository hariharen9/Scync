<div align="center">
<img src="./assets/header.png" width="100%" alt="Scync Header" />
<br />
<br />

# 🔐 Scync

### *Your secrets. Synced. Encrypted. Everywhere.*

**The open-source, zero-knowledge secrets manager built for developers who are tired of pasting API keys into Notion.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Initial Release](https://img.shields.io/badge/Status-Initial%20Release-blue.svg)]()
[![Platforms: Web · Desktop · PWA](https://img.shields.io/badge/Platforms-Web%20%C2%B7%20Desktop%20%C2%B7%20PWA-blue.svg)]()
[![Encryption: AES-256-GCM](https://img.shields.io/badge/Encryption-AES--256--GCM-red.svg)]()
[![Zero Knowledge](https://img.shields.io/badge/Architecture-Zero--Knowledge-purple.svg)]()

</div>

---

## The Problem

You have 47 API keys. You know where exactly zero of them are.

One lives in a `.env` file you're scared to delete. Another is in a Slack DM from 2022. A third is a screenshot buried in your camera roll. Your AWS credentials are in a Notion page titled *"stuff"* — right next to your Netflix password and a grocery list.

When you need your OpenAI key, you either find it in 3 seconds or spend 45 minutes regenerating it and updating 6 projects. There's no in-between.

This is not a workflow problem. This is a **missing tool** problem. And the existing tools don't actually solve it:

| Tool | The Issue |
|---|---|
| **Bitwarden / 1Password** | Built for website passwords, not API keys. No metadata, no rotation tracking, awkward for multi-line recovery codes. |
| **Infisical / Doppler** | Engineering team CI/CD tools. You need a screwdriver; they're handing you a factory. |
| **HashiCorp Vault** | You need a dedicated server and two weeks just to get started. |
| **Notion / Apple Notes** | Zero encryption. Notion staff can read your secrets. You know this. You still do it. |
| **KeePassXC** | Great security. No cloud sync. Your phone has no idea your vault exists. |

**There is no tool that is personal-first, zero-knowledge, cross-platform, open source, and actually pleasant to use.**

Scync is that tool.

---

## What Scync Is

> *Notion for developer secrets.* Calm. Organized. Yours. Encrypted.

Scync is an open-source, zero-knowledge, cross-platform secrets manager for individual developers. It gives you one beautiful place to store every API key, token, OAuth secret, recovery code, and credential — organized by project, searchable in milliseconds, copyable in one click, accessible on every device you own.

The server never sees your plaintext data. Your vault password never leaves your device. **Not "we promise." Architecturally impossible.**

### The Core Loop

```
Unlock vault  →  Find secret  →  Copy value
```

That's it. Everything else exists to make that loop faster and the secrets inside it more trustworthy.

---

## Features

### 🔑 Secrets, not passwords
Scync is purpose-built for what developers actually store: API keys, Personal Access Tokens, OAuth client secrets, webhook signing secrets, recovery/backup codes, SSH passphrases, database connection strings, service account credentials. Each type has its own UX.

### 📁 Project-based organization
Secrets live in projects, not a flat list. Your `Stripe` project holds all Stripe keys across environments. Your `Side Project Alpha` holds everything for that app. Organized the way you actually think about your work.

### 🧮 Recovery code UX that actually works
Recovery codes aren't just a text field. They're numbered. You mark them as used. The remaining count is always visible. When you're locked out of GitHub at 2am, you'll know exactly which code to use and whether you have any left.

### ⏰ Expiry and rotation dashboard
Secrets have lifecycles. Scync surfaces them. See what's expiring in the next 30 days. See what hasn't been rotated in over a year. A quick scan of your dashboard tells you the health of your entire credential ecosystem.

### 📄 `.env` workflow integration
Import an entire `.env` file into a project. Export a project back to a `.env` file. The gap between "local secrets" and "stored secrets" is one drag-and-drop away.

### ⚡ One-click copy, always masked
The primary action on every secret is copy. Values are masked by default. Toggle to reveal only when you need to see. Clipboard access is one click, no confirmation dialogs, no "are you sure?"

### 🌐 Web + Desktop + PWA, same codebase
One React codebase. The web app, installable PWA, and Electron desktop app are identical — sharing the same components, logic, and zero-knowledge sync. Access your vault from a browser, a dedicated desktop window, or your mobile home screen.

### 🧬 Biometric Unlock (Passkeys)
Unlock your vault in milliseconds using FaceID, TouchID, or Windows Hello. Scync uses the modern **WebAuthn PRF extension** to derive encryption keys directly from your device's secure hardware. No more typing long master passwords every time you need a key.

### 🔍 Instant search and filtering
Search by name or service. Filter by type, environment, status. All in-memory — no network calls, no loading spinners, just results.

---

## Security Model

Scync is built on a **Zero-Knowledge Architecture**. This means your secrets are encrypted on your device and stay encrypted everywhere else. 

- **End-to-End Encryption**: Secrets are encrypted using AES-256-GCM before they ever leave your device.
- **Hardware-Backed Biometrics**: Modern WebAuthn PRF integration allows hardware-level unlock without compromising zero-knowledge integrity.
- **Server Blindness**: Firebase only sees encrypted blobs. Even in a total backend breach, your data remains secure.
- **No Password Storage**: We never store your vault password or its hash. Verification is handled via cryptographic verifiers.

For a deep dive into our cryptographic specification, key derivation process, and threat model, see **[SECURITY.md](SECURITY.md)**.


---

## Self-Hosting & Local Development

<details>
<summary><b>View instructions for deploying your own Scync instance</b></summary>

### Prerequisites
- Node.js 18+
- pnpm 8+
- A [Firebase](https://console.firebase.google.com/) project (the free Spark plan is more than enough for personal use).

### Why self-host?
Scync is designed to be **Zero-Knowledge**, but for the ultimate level of privacy, you can host your own backend. This ensures that the only person with access to your encrypted blobs and authentication logs is you.

### Setup
1. **Clone & Install**:
   ```bash
   git clone https://github.com/hariharen9/Scync.git
   cd Scync
   pnpm install
   ```

2. **Configure Firebase**:
   - Create a project in the Firebase Console.
   - Enable **Google Auth** and **Firestore**.
   - Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your project credentials.

3. **Deploy or Run Locally**:
   - **Web**: `pnpm dev --filter web`
   - **Desktop**: `pnpm build --filter web && pnpm dev --filter desktop`
   - **Mobile**: `npx cap sync && npx cap open ios`

### Project Structure
Scync uses a Turborepo-managed monorepo. Platform-specific code lives in `apps/` while the shared core logic (Crypto, Store, UI components) lives in `packages/`.

### Tech Stack
| Layer | Technology |
|---|---|
| **Language** | TypeScript (strict) |
| **Framework** | React 18 + Vite |
| **State** | Zustand |
| **Backend** | Firebase (Auth + Firestore) |
| **Crypto** | Web Crypto API |
| **Desktop** | Electron v28+ |
| **Mobile** | Capacitor v5 |
| **MonoRepo** | Turborepo + pnpm |

</details>

---

## Principles

**Zero-knowledge by default.** The server never receives plaintext. Ever. If this principle is violated once, the entire value proposition fails.

**Vault password independence.** The vault password is cryptographically separate from your Google account. Neither alone can decrypt your secrets.

**One codebase, three platforms.** No React Native. No separate mobile logic. One set of components that runs everywhere.

**Speed is a feature.** The vault loads instantly. Search is synchronous. Copy takes one click. Performance is product, not infrastructure.

**Opinionated simplicity.** No custom fields in MVP. No plugin system. No config panels. The structure is baked in — because the structure is correct for developer secrets.

**Open and auditable.** The crypto code uses only the Web Crypto API. Any developer should be able to read and verify it in under 15 minutes.

---

## Contributing

Scync is MIT licensed and open to contributions. Before opening a PR, check your feature against the decision filter:

1. Does it help a solo developer **store, find, or copy a secret faster**?
2. Does it require the server to see plaintext data?
3. Would it make the core loop — unlock → find → copy — slower or more cluttered?
4. Is it already solved well by Bitwarden, Doppler, or Infisical?

If it passes the filter, we want it. Open an issue first for anything significant.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full development setup and workflow guidelines.

```bash
# Run the full CI check locally before pushing
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## What Scync Is Not

To be explicit about scope (and to prevent well-intentioned PRs that miss the point):

- ❌ Not a password manager — no browser autofill, no username/URL triplets as the primary model
- ❌ Not a team tool — no sharing, no RBAC, no audit logs, no SSO
- ❌ Not a CI/CD injector — Doppler owns that space; Scync doesn't compete
- ❌ Not a secrets rotation engine — it tracks rotation dates, it doesn't call APIs to rotate keys
- ❌ Not a browser extension — no form injection
- ❌ Not a subscription product — free, open source, MIT licensed, forever

---

## License

MIT — see [LICENSE](./LICENSE) for details.

Scync is and will remain free. There is no paid tier. There is no enterprise plan. There is no "features behind a paywall someday." The spec says so, and the spec is the law.

---

<div align="center">

**Scync** — Build it like you use it. Because you do.

*The tool that should have existed the moment you first pasted an API key into a Notion page.*

</div>