# Privacy Policy

**Effective Date:** May 1, 2026
**Last Updated:** May 1, 2026 

## Introduction

Scync ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use the Scync secrets manager application (the "Service").

**The Short Version:** Scync is built on a zero-knowledge architecture. We cannot read your secrets, and we don't want to. Your vault password never leaves your device. We only see encrypted data.

## Our Zero-Knowledge Commitment

Scync is designed from the ground up so that **we cannot access your secret data, even if we wanted to**. This is not a promise — it is a mathematical guarantee enforced by client-side encryption.

### What This Means:
- Your vault password is never transmitted to our servers
- Your secrets are encrypted on your device before being stored
- We only store encrypted blobs that are meaningless without your vault password
- Even in the event of a complete server breach, your secrets remain secure

## Information We Collect

### 1. Authentication Information (via Google Sign-In)
When you sign in with Google, we receive:
- Your Google account email address
- Your Google account display name
- Your Google profile picture URL
- A unique user identifier (UID) from Firebase Authentication

**Purpose:** To identify you and route your encrypted data to the correct account.  
**Storage:** Stored by Firebase Authentication (Google's service).  
**Control:** You can delete your account at any time from the Settings menu.

### 2. Encrypted Secret Data
When you store secrets in Scync, we store:
- **Encrypted fields:** Secret values, notes (fully encrypted with AES-256-GCM)
- **Plaintext metadata:** Secret names, service names, types, environments, status, timestamps

**Why metadata is plaintext:** To enable fast search and filtering without requiring decryption on the server. The actual sensitive content (your API keys, tokens, passwords) is always encrypted.

**Storage:** Stored in Google Cloud Firestore.  
**Access:** Only you can access your data (enforced by Firestore Security Rules).

### 3. Biometric Enrollment Data (Optional)
If you enable biometric unlock (FaceID/TouchID):
- A hardware-derived encryption key wraps your vault password
- The wrapped password and a credential ID are stored in your Firestore profile
- Your biometric data (fingerprint, face scan) **never leaves your device** — it stays in your device's Secure Enclave/TPM

**Purpose:** To allow convenient unlocking without typing your password.  
**Security:** The wrapped password can only be unwrapped by your specific device's hardware.

### 4. Technical Information
We automatically collect:
- Device type and operating system (via Firebase Analytics, if enabled)
- Browser type and version
- IP address (temporarily, for Firebase Authentication security)
- Error logs and crash reports (if you opt in)

**Purpose:** To improve the Service, diagnose issues, and prevent abuse.  
**Retention:** Logs are retained for 90 days, then automatically deleted.

## Information We Do NOT Collect

- ❌ Your vault password (never transmitted, never stored)
- ❌ Decrypted secret values (we cannot decrypt them)
- ❌ Your browsing history or activity outside Scync
- ❌ Your biometric data (stays on your device)
- ❌ Payment information (Scync is free and open source)

## How We Use Your Information

1. **To Provide the Service:** Store and sync your encrypted secrets across devices
2. **To Authenticate You:** Verify your identity via Google Sign-In
3. **To Improve the Service:** Analyze usage patterns (anonymized) to fix bugs and add features
4. **To Communicate:** Send important security updates or service announcements (rare)

**We do NOT:**
- Sell your data to third parties
- Use your data for advertising
- Share your data with anyone except as required by law

## Data Storage and Security

### Where Your Data is Stored
- **Firebase Authentication:** Google's servers (global)
- **Cloud Firestore:** Google Cloud Platform (region: us-central1 by default)
- **Your Device:** Vault password and decrypted secrets exist only in memory while unlocked

### Security Measures
- **Encryption in Transit:** All data is transmitted over HTTPS/TLS 1.3
- **Encryption at Rest:** Firestore encrypts all data at rest (Google-managed keys)
- **Client-Side Encryption:** Your secrets are encrypted with AES-256-GCM before transmission
- **Key Derivation:** PBKDF2-SHA256 with 310,000 iterations
- **Non-Extractable Keys:** Encryption keys are stored in browser memory as non-extractable CryptoKey objects

### What Happens in a Breach?
If our Firebase project is compromised, an attacker would gain access to:
- Encrypted secret blobs (useless without your vault password)
- Plaintext metadata (secret names, service names, timestamps)

They would NOT gain access to:
- Your vault password (never stored)
- Your decrypted secrets (mathematically impossible without your password)

## Your Rights and Choices

### Access Your Data
You can view all your stored secrets at any time by unlocking your vault.

### Export Your Data
You can export your entire vault (encrypted) from Settings > Export Vault.

### Delete Your Data
You can permanently delete your account and all associated data from Settings > Delete Account. This action is irreversible.

**What gets deleted:**
- All your secrets (encrypted and metadata)
- Your vault metadata (salt, verifier, biometric data)
- Your Firebase Authentication profile

**What does NOT get deleted:**
- Firebase Authentication logs (retained for 180 days for security/abuse prevention)

### Opt Out of Analytics
You can disable analytics in Settings > Privacy (if implemented in future versions).

## Third-Party Services

Scync relies on the following third-party services:

### Google Firebase
- **Services Used:** Authentication, Cloud Firestore, Hosting
- **Privacy Policy:** https://firebase.google.com/support/privacy
- **Data Processing:** Google processes data as a service provider under our instructions
- **Location:** Data is stored in Google Cloud Platform data centers

### Netlify (Web Hosting - Optional)
If you access Scync via the official web app:
- **Privacy Policy:** https://www.netlify.com/privacy/
- **Data Collected:** Access logs, IP addresses (retained for 30 days)

### Self-Hosting
If you self-host Scync, you are the data controller. This Privacy Policy does not apply to self-hosted instances. You are responsible for compliance with applicable privacy laws.

## Children's Privacy

Scync is not intended for use by individuals under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.

## International Data Transfers

If you access Scync from outside the United States, your data will be transferred to and processed in the United States (where Firebase servers are located). By using Scync, you consent to this transfer.

**For EU/UK Users:** Google Firebase complies with the EU-U.S. Data Privacy Framework and the UK Extension to the EU-U.S. Data Privacy Framework.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. If we make material changes, we will notify you by:
- Posting a notice in the app
- Updating the "Last Updated" date at the top of this policy
- Sending an email to your registered email address (for significant changes)

Your continued use of Scync after changes are posted constitutes acceptance of the updated policy.

## Data Retention

- **Active Accounts:** Data is retained as long as your account is active
- **Deleted Accounts:** Data is permanently deleted within 30 days of account deletion
- **Inactive Accounts:** We do not automatically delete inactive accounts (your data remains encrypted and accessible)

## Legal Basis for Processing (GDPR)

If you are in the European Economic Area (EEA), our legal basis for processing your personal data is:
- **Consent:** You consent to our processing when you create an account
- **Contract:** Processing is necessary to provide the Service you requested
- **Legitimate Interests:** To improve the Service and prevent fraud

## Your GDPR Rights (EEA Users)

If you are in the EEA, you have the right to:
- **Access:** Request a copy of your personal data
- **Rectification:** Correct inaccurate data
- **Erasure:** Request deletion of your data ("right to be forgotten")
- **Restriction:** Limit how we process your data
- **Portability:** Receive your data in a machine-readable format
- **Objection:** Object to processing based on legitimate interests
- **Withdraw Consent:** Withdraw consent at any time (does not affect prior processing)

To exercise these rights, contact us at the email below.

## California Privacy Rights (CCPA)

If you are a California resident, you have the right to:
- Know what personal information we collect and how we use it
- Request deletion of your personal information
- Opt out of the sale of your personal information (we do not sell data)
- Non-discrimination for exercising your privacy rights

## Contact Us

If you have questions about this Privacy Policy or our privacy practices:

**Email:** privacy@scync.app (or open an issue on GitHub)  
**GitHub:** https://github.com/hariharen9/Scync  
**Response Time:** We aim to respond within 7 business days

## Open Source Transparency

Scync is open source (MIT License). You can review our entire codebase, including all encryption and data handling logic, at:

**GitHub Repository:** https://github.com/hariharen9/Scync

We encourage security researchers and privacy advocates to audit our code. If you discover a security vulnerability, please report it responsibly to security@scync.app.

---

## Summary (TL;DR)

✅ **We use zero-knowledge encryption** — we cannot read your secrets  
✅ **Your vault password never leaves your device**  
✅ **We only store encrypted blobs** — useless without your password  
✅ **You can delete your account anytime** — all data is permanently erased  
✅ **We don't sell your data** — we're open source and free  
✅ **You can self-host** — full control over your data  

**Questions?** Read the full policy above or contact us at privacy@scync.app.

---

**Last Updated:** January 1, 2025  
**Version:** 1.0
