# Security Policy

Scync is built with a **security-first, zero-knowledge architecture**. This document outlines our security model, cryptographic implementation, and the process for reporting vulnerabilities.

## 🛡 Security Model: Zero-Knowledge

The core principle of Scync is that **your data is yours**. 

1. **Client-Side Only**: All encryption and decryption happen strictly on your device (browser, desktop, or mobile).
2. **Server Blindness**: The Scync server (Firebase) only ever sees encrypted blobs. It never has access to your plaintext secrets, notes, or your vault password.
3. **No Password Storage**: Your vault password is never sent to the server and is never stored in persistent storage (like LocalStorage). It lives only in volatile memory while the vault is unlocked.
4. **Independent Identity**: Your vault password is separate from your Google/Firebase authentication. Even if your Google account is compromised, your vault remains encrypted and inaccessible without your vault password.

## 🔑 Cryptographic Implementation

Scync uses the **Web Crypto API**, a native browser standard, to ensure high-performance and secure cryptographic operations.

| Component | Algorithm | Details |
|---|---|---|
| **Key Derivation** | PBKDF2 | SHA-256, 310,000 iterations |
| **Encryption** | AES-256-GCM | Authenticated encryption with fresh IVs |
| **Biometrics** | WebAuthn PRF | Hardware-backed symmetric key derivation |
| **Hashing** | SHA-256 | Used for verifiers and data integrity |

### Key Derivation Process
When you unlock your vault manually:
1. We take your **Vault Password** + **User UID**.
2. We apply **PBKDF2** with a unique, random **Salt** stored in your user profile.
3. We run **310,000 iterations** of SHA-256.
4. The resulting 256-bit key is used for AES-GCM operations.

### Biometric Unlock (Hardware-Backed)
Scync implements the modern **WebAuthn PRF (Pseudo-Random Function) extension** to provide biometric convenience without compromising zero-knowledge principles.

1. **Hardware Derivation**: When you enable biometrics, your device's Secure Enclave (iOS/Android) or TPM (Windows/Mac) generates a deterministic symmetric key based on a local "salt."
2. **Key Wrapping**: This hardware-derived key never leaves your device. It is used to encrypt (wrap) your Master Password. 
3. **Storage**: The wrapped (encrypted) Master Password and the WebAuthn `credentialId` are stored in your profile.
4. **Unlocking**: To unlock, your biometric signature triggers the hardware to re-derive the same symmetric key. This key then decrypts (unwraps) your Master Password into memory.
5. **Security Boundary**: The "unwrapped" password is never persisted. If you change your Master Password, Scync automatically invalidates and wipes all biometric metadata to prevent key-reuse attacks.

## ⚠️ Single Point of Failure
Because Scync is zero-knowledge, **your vault password is the single point of failure.** 
- **If you lose your vault password, your data cannot be recovered.** We do not have a "Forgot Password" feature because we don't have your keys.
- **If you lose your recovery codes** (generated during setup), you will be locked out of your vault permanently if you forget your password.

## 🚨 Reporting a Vulnerability

We take the security of Scync extremely seriously. If you believe you've found a security vulnerability, please report it to us responsibly.

**Please do not open a public GitHub Issue for security vulnerabilities.**

Instead, please send an email to **security@scync.app** (or the project maintainer). 

### What to include:
- A detailed description of the vulnerability.
- Steps to reproduce the issue.
- Any potential impact you've identified.

### Our Commitment:
- We will acknowledge your report within **48 hours**.
- We will provide an estimated timeline for a fix.
- We will notify you once the vulnerability is patched.
- We follow a **90-day disclosure policy** — we ask that you do not share details of the vulnerability publicly until we have had 90 days to address it.

## 🛡 Breach Impact
In the event of a total compromise of the Scync infrastructure:
- An attacker would gain access to **encrypted blobs** and **salts**.
- Without your unique vault password, the cost to brute-force your AES-256-GCM encrypted data is astronomically high, especially with our PBKDF2 iteration count.

Thank you for helping keep Scync secure!
