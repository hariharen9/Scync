Here's a prioritized, realistic roadmap — grouped by what actually moves the needle:

---

## 🔴 Fix the Real Gaps First

These aren't features, they're holes that make the app unreliable today:

- **Atomic imports** — EnvImport and PasswordImport should batch-write or rollback on failure
- **Master password recovery option** — even a "export recovery kit" (encrypted with a secondary passphrase) so a forgotten password isn't total data loss
- **Test coverage** — currently only one crypto test. Add store tests, import parser tests, share flow tests

---

## 🟠 High-Impact Features (Core Dev Workflow)

### 1. CLI / npm package
The single biggest gap. A dev should be able to:
```bash
scync pull --env production > .env
scync get AWS_SECRET_KEY | pbcopy
```
Without a CLI, it's a GUI-only tool disconnected from actual dev workflows.

### 2. Browser Extension
Auto-fill passwords on websites. Without this, the password manager feature competes poorly with Bitwarden/1Password for actual daily use.

### 3. Secret Injection for CI/CD
Generate a **read-only share token** scoped to a project that CI pipelines (GitHub Actions, GitLab CI) can use to pull secrets at build time. No plaintext secrets in your repo or CI environment variables.

### 4. Team / Org Vaults
Right now it's strictly solo. Even a simple "shared project vault" where two users can both decrypt the same secrets would open it up enormously. Doable with asymmetric encryption (each member's public key encrypts the vault key).

---

## 🟡 Medium-Impact Quality-of-Life

### 5. Secret Health Dashboard enhancements
- **Strength meter** for passwords/API keys
- **Duplicate detector** — same secret stored twice
- **Have I Been Pwned** integration — check if a password appears in breach data (k-anonymity API, still zero-knowledge)

### 6. `.env` Environments Sync
Right now `.env` import is one-way. Add **export to `.env`** filtered by project + environment. Huge QoL for switching between dev/staging/prod.

### 7. Audit Log
Client-side log of: when a secret was revealed, copied, edited, shared. Stored encrypted, never leaves the vault. Useful for compliance-conscious devs.

### 8. Secret Templates
Pre-built forms for common services — AWS (Access Key ID + Secret), Stripe (publishable + secret), GitHub PAT, etc. Instead of a blank form, guided entry with field validation.

### 9. Expiry Notifications
Currently expiry is tracked but you only see it when you open the app. Add **email/push notifications** via Firebase Cloud Messaging when a secret is about to expire (7 days out). This makes the rotation tracking actually actionable.

### 10. QR Code for TOTP Export
Export a TOTP entry as a QR code to re-scan in another authenticator. Currently you can copy the base32 secret but no QR output.

---

## 🟢 Smaller but Meaningful

| Idea | Why |
|---|---|
| **Keyboard-first navigation** | Devs live on keyboards — full arrow-key + shortcut vault browsing |
| **Markdown in notes** | Secret notes currently plain text; markdown rendering would be useful for storing setup instructions |
| **Secret versioning** | Keep last N values of a rotated secret, not just the current one |
| **SSH key agent integration** | Load a key into `ssh-agent` directly from the desktop app |
| **Certificate auto-renewal alerts** | Already store expiry dates — just surface them more aggressively |
| **Offline mode** | Currently requires Firebase connectivity. A local-first cache (IndexedDB of encrypted blobs) would make it usable offline |
| **Mobile app** | AGENTS.md mentions it doesn't exist — a React Native port sharing `@scync/core` would be relatively lightweight |

---

## What I'd Actually Build First

If I had to pick **three** in order:

1. **`.env` export** — lowest effort, highest immediate utility, rounds out the import feature
2. **CLI** — connects the vault to real workflows, makes it a tool rather than a website
3. **Expiry push notifications** — the rotation tracking is useless if you don't get reminded

The rest (team vaults, CI injection, browser extension) are bigger architectural bets — worth doing but require more design thought around the zero-knowledge constraint.