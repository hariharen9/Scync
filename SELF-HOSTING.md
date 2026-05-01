# Self-Hosting Scync

This guide will walk you through setting up your own Scync instance. Self-hosting gives you complete control over your data and infrastructure.

## Table of Contents

1. [Why Self-Host?](#why-self-host)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Step 1: Firebase Project Setup](#step-1-firebase-project-setup)
5. [Step 2: Local Development Setup](#step-2-local-development-setup)
6. [Step 3: Configuration](#step-3-configuration)
7. [Step 4: Deploy Firestore Rules](#step-4-deploy-firestore-rules)
8. [Step 5: Build and Deploy](#step-5-build-and-deploy)
9. [Deployment Options](#deployment-options)
10. [Desktop App (Electron)](#desktop-app-electron)
11. [Mobile App (PWA)](#mobile-app-pwa)
12. [Maintenance and Updates](#maintenance-and-updates)
13. [Security Considerations](#security-considerations)
14. [Troubleshooting](#troubleshooting)
15. [Cost Estimation](#cost-estimation)

---

## Why Self-Host?

**Reasons to self-host Scync:**

✅ **Complete Data Control** — Your encrypted secrets live on your Firebase project, not ours  
✅ **Privacy Assurance** — No third-party has access to your Firebase console  
✅ **Custom Domain** — Use your own domain (e.g., `vault.yourdomain.com`)  
✅ **Compliance** — Meet specific regulatory requirements (HIPAA, SOC2, etc.)  
✅ **Learning** — Understand the full stack and cryptographic implementation  
✅ **Customization** — Modify the code to fit your specific needs  

**Important Note:** Even on the official hosted version, Scync uses zero-knowledge encryption. The server (Firebase) never sees your plaintext secrets. Self-hosting provides additional control over the infrastructure, but the security model is identical.

---

## Prerequisites

Before you begin, ensure you have:

### Required Tools
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 9+ (Install: `npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))
- **Firebase CLI** (Install: `npm install -g firebase-tools`)

### Required Accounts
- **Google Account** (for Firebase Console access)
- **Firebase Project** (free Spark plan is sufficient for personal use)

### Optional (for deployment)
- **Netlify Account** (free tier works) OR
- **Vercel Account** (free tier works) OR
- **Your own web server** (nginx, Apache, etc.)

### Technical Knowledge
- Basic command line usage
- Understanding of environment variables
- Familiarity with Firebase Console (we'll guide you)

---

## Architecture Overview

Scync is a **monorepo** with three main components:

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR INFRASTRUCTURE                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Web App (React + Vite)                          │  │
│  │  Deployed to: Netlify / Vercel / Your Server    │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  Firebase Project (YOUR PROJECT)                 │  │
│  │  - Authentication (Google Sign-In)               │  │
│  │  - Firestore (Encrypted secret storage)         │  │
│  │  - Hosting (Optional CDN)                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Desktop App (Electron) - Optional               │  │
│  │  Built locally, runs on your machine             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key Point:** All encryption happens in the browser/app. Firebase only stores encrypted blobs.

---

## Step 1: Firebase Project Setup

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., `my-scync-vault`)
4. **Disable Google Analytics** (not needed for Scync)
5. Click **"Create project"**

### 1.2 Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **"Enable"**
6. Enter a **"Project support email"** (your email)
7. Click **"Save"**

### 1.3 Create a Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. **Start in production mode** (we'll deploy rules later)
4. Choose a location (e.g., `us-central1` or closest to you)
   - ⚠️ **This cannot be changed later**
5. Click **"Enable"**

### 1.4 Register a Web App

1. In Project Overview, click the **Web icon** (`</>`)
2. Enter an app nickname (e.g., `Scync Web`)
3. **Check** "Also set up Firebase Hosting" (optional but recommended)
4. Click **"Register app"**
5. **Copy the Firebase config object** — you'll need this in Step 3

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "my-scync-vault.firebaseapp.com",
  projectId: "my-scync-vault",
  storageBucket: "my-scync-vault.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. Click **"Continue to console"**

### 1.5 Configure Authorized Domains (Important!)

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. By default, `localhost` and `*.firebaseapp.com` are authorized
3. If you plan to use a custom domain (e.g., `vault.yourdomain.com`), add it here
4. For Netlify/Vercel, add your deployment domain (e.g., `my-scync.netlify.app`)

---

## Step 2: Local Development Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/hariharen9/Scync.git
cd Scync
```

### 2.2 Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the monorepo (web, desktop, packages).

**Troubleshooting:**
- If `pnpm` is not found, install it: `npm install -g pnpm`
- If you get permission errors, try `sudo npm install -g pnpm` (Linux/Mac)

### 2.3 Verify Installation

```bash
pnpm --version  # Should show 9.x.x
node --version  # Should show 18.x.x or higher
```

---

## Step 3: Configuration

### 3.1 Create Environment File

Navigate to the web app directory:
```bash
cd apps/web
```

Copy the example environment file:
```bash
cp .env.example .env.local
```

### 3.2 Add Your Firebase Config

Open `apps/web/.env.local` in your text editor and fill in the values from Step 1.4:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=my-scync-vault.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-scync-vault
VITE_FIREBASE_STORAGE_BUCKET=my-scync-vault.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Important Notes:**
- Replace all values with YOUR Firebase project values
- The `VITE_` prefix is required for Vite to expose these to the client
- These values are NOT secret — they're embedded in your client bundle
- Security is enforced by Firestore Security Rules, not by hiding config

### 3.3 (Optional) Enable Firebase Emulators

For local development without touching production data:

```bash
# Install Firebase Emulators
firebase init emulators
# Select: Authentication, Firestore
# Use default ports (9099 for Auth, 8080 for Firestore)
```

Then uncomment this line in `.env.local`:
```env
VITE_USE_EMULATORS=true
```

---

## Step 4: Deploy Firestore Rules

Firestore Security Rules enforce that users can only access their own data.

### 4.1 Login to Firebase CLI

```bash
firebase login
```

This opens a browser window for authentication.

### 4.2 Initialize Firebase in the Project

From the **root** of the Scync repository:

```bash
firebase init
```

- Select: **Firestore** and **Hosting** (use spacebar to select)
- Use an existing project: Select your project from Step 1
- Firestore rules file: `firebase/firestore.rules` (already exists)
- Firestore indexes file: `firebase/firestore.indexes.json` (already exists)
- Public directory: `apps/web/dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**

### 4.3 Deploy Rules

```bash
firebase deploy --only firestore:rules
```

**Expected output:**
```
✔  Deploy complete!
```

### 4.4 Verify Rules

Go to Firebase Console > Firestore Database > Rules. You should see:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Zero-Knowledge Secret Sharing
    match /shares/{shareId} {
      allow create: if request.auth != null 
                    && request.auth.uid == request.resource.data.createdByUid;
      allow read: if resource.data.expiresAt > request.time
                  && (resource.data.viewsAllowed == null 
                      || resource.data.viewsUsed < resource.data.viewsAllowed);
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewsUsed'])
                    && request.resource.data.viewsUsed == resource.data.viewsUsed + 1
                    && resource.data.expiresAt > request.time
                    && (resource.data.viewsAllowed == null 
                        || resource.data.viewsUsed < resource.data.viewsAllowed);
      allow delete: if request.auth != null 
                    && request.auth.uid == resource.data.createdByUid;
    }
    
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 5: Build and Deploy

### 5.1 Test Locally First

From the root directory:

```bash
pnpm dev
```

This starts the development server at `http://localhost:5173`.

**Test the following:**
1. ✅ Google Sign-In works
2. ✅ Create vault password (first-time setup)
3. ✅ Add a test secret
4. ✅ Lock and unlock vault
5. ✅ Secret is visible after unlock

If everything works, proceed to deployment.

### 5.2 Build for Production

```bash
pnpm build --filter web
```

This creates an optimized production build in `apps/web/dist/`.

**Verify the build:**
```bash
ls -lh apps/web/dist/
# Should show index.html, assets/, etc.
```

---

## Deployment Options

Choose one of the following deployment methods:

---

### Option A: Firebase Hosting (Recommended)

**Pros:** Integrated with Firebase, global CDN, automatic SSL, free tier  
**Cons:** Limited to Firebase's infrastructure

#### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**Your app is now live at:**
```
https://YOUR_PROJECT_ID.web.app
```

#### (Optional) Custom Domain

1. Go to Firebase Console > Hosting
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `vault.yourdomain.com`)
4. Follow the DNS configuration instructions
5. Firebase automatically provisions an SSL certificate

---

### Option B: Netlify

**Pros:** Easy deployment, preview branches, free tier, custom domains  
**Cons:** Requires Netlify account

#### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=apps/web/dist
   ```

4. **Follow the prompts:**
   - Create a new site or link to existing
   - Choose a site name

**Your app is now live at:**
```
https://YOUR_SITE_NAME.netlify.app
```

#### Configure Environment Variables (Important!)

Netlify needs your Firebase config:

1. Go to Netlify Dashboard > Your Site > Site settings > Environment variables
2. Add each `VITE_*` variable from your `.env.local`
3. Redeploy: `netlify deploy --prod --dir=apps/web/dist`

**Alternative: Use `netlify.toml`**

The repository includes a `netlify.toml` file. To use it:

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Netlify will auto-deploy on every push

---

### Option C: Vercel

**Pros:** Excellent performance, preview deployments, free tier  
**Cons:** Requires Vercel account

#### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add each `VITE_*` variable

---

### Option D: Self-Hosted Server (Advanced)

**Pros:** Full control, no third-party dependencies  
**Cons:** Requires server management, SSL setup, maintenance

#### Requirements
- A server with nginx or Apache
- A domain name
- SSL certificate (use Let's Encrypt)

#### Steps

1. **Build the app:**
   ```bash
   pnpm build --filter web
   ```

2. **Copy `apps/web/dist/` to your server:**
   ```bash
   scp -r apps/web/dist/* user@yourserver.com:/var/www/scync/
   ```

3. **Configure nginx:**
   ```nginx
   server {
       listen 80;
       server_name vault.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name vault.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/vault.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/vault.yourdomain.com/privkey.pem;

       root /var/www/scync;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

4. **Reload nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Update Firebase Authorized Domains** (Step 1.5)

---

## Desktop App (Electron)

### Build the Desktop App

The Electron app wraps the web app for a native desktop experience.

#### Prerequisites
- Completed web app build (Step 5.2)

#### Build for Windows

```bash
cd apps/desktop
pnpm build:win
```

**Output:** `apps/desktop/release/Scync-Setup-1.0.0.exe`

#### Build for macOS

```bash
cd apps/desktop
pnpm build:mac
```

**Output:** `apps/desktop/release/Scync-1.0.0-arm64.dmg` (Apple Silicon)  
**Output:** `apps/desktop/release/Scync-1.0.0-x64.dmg` (Intel)

#### Build for Both

```bash
cd apps/desktop
pnpm build:all
```

#### Distribute the Installer

- Upload to GitHub Releases
- Host on your own server
- Share directly with users

**Note:** The desktop app uses the same Firebase config as the web app. No additional configuration needed.

---

## Mobile App (PWA)

Scync uses a Progressive Web App (PWA) for mobile instead of native apps.

### Enable PWA Features

The web app is already configured as a PWA. When users visit your deployed site on mobile:

1. **iOS (Safari):**
   - Tap the Share button
   - Tap "Add to Home Screen"
   - The app installs with a custom icon

2. **Android (Chrome):**
   - Chrome will show an "Install" prompt automatically
   - Or tap the menu > "Add to Home Screen"

### PWA Features Included
✅ Offline support (Service Worker)  
✅ Install to home screen  
✅ Custom app icon and splash screen  
✅ Standalone mode (no browser chrome)  
✅ Biometric unlock (WebAuthn PRF)  

### Test PWA Locally

```bash
pnpm build --filter web
pnpm preview --filter web
```

Open `http://localhost:4173` on your phone (same network) and test the install prompt.

---

## Maintenance and Updates

### Updating Scync

When a new version of Scync is released:

1. **Backup your `.env.local` file**
2. **Pull the latest code:**
   ```bash
   git pull origin main
   ```
3. **Install new dependencies:**
   ```bash
   pnpm install
   ```
4. **Rebuild and redeploy:**
   ```bash
   pnpm build --filter web
   firebase deploy --only hosting
   # or netlify deploy --prod --dir=apps/web/dist
   ```

### Monitoring

**Firebase Console:**
- Monitor authentication activity
- Check Firestore usage (free tier: 1 GB storage, 50k reads/day)
- Review error logs

**Set up alerts:**
- Firebase Console > Usage and billing > Set budget alerts

---

## Security Considerations

### 🔒 Critical Security Checklist

- ✅ **Firestore Rules Deployed:** Verify in Firebase Console
- ✅ **HTTPS Enabled:** All production deployments must use HTTPS
- ✅ **Authorized Domains Configured:** Only your domains should be listed
- ✅ **Environment Variables Secured:** Never commit `.env.local` to Git
- ✅ **Firebase API Key Restrictions:** (Optional) Restrict API key to your domain in Google Cloud Console

### API Key Restrictions (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** > **Credentials**
4. Find your API key (starts with `AIza...`)
5. Click **Edit**
6. Under **Application restrictions**, select **HTTP referrers**
7. Add your domain (e.g., `vault.yourdomain.com/*`)
8. Click **Save**

**Warning:** This prevents the API key from working on `localhost`. Use Firebase Emulators for local development instead.

### Regular Security Practices

- 🔄 **Update Dependencies:** Run `pnpm update` monthly
- 🔍 **Audit Dependencies:** Run `pnpm audit` regularly
- 📊 **Monitor Firebase Usage:** Check for unusual activity
- 🔐 **Review Firestore Rules:** Ensure no accidental public access
- 🚨 **Subscribe to Security Advisories:** Watch the GitHub repo for security updates

---

## Troubleshooting

### Issue: "Firebase: Error (auth/unauthorized-domain)"

**Cause:** Your deployment domain is not in Firebase Authorized Domains.

**Fix:**
1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add your deployment domain (e.g., `my-scync.netlify.app`)
3. Wait 5 minutes for propagation

---

### Issue: "Firestore: Missing or insufficient permissions"

**Cause:** Firestore rules not deployed or incorrect.

**Fix:**
```bash
firebase deploy --only firestore:rules
```

Verify rules in Firebase Console > Firestore Database > Rules.

---

### Issue: Build fails with "Cannot find module '@scync/core'"

**Cause:** Dependencies not installed or workspace links broken.

**Fix:**
```bash
# From root directory
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

---

### Issue: "Vault password incorrect" but password is correct

**Cause:** Possible causes:
1. Different Firebase project (salt is different)
2. Browser cache issue
3. Vault was created on a different instance

**Fix:**
- Clear browser cache and try again
- Verify you're using the correct Firebase project
- If migrating, you must export/import vault data

---

### Issue: Biometric unlock not working

**Cause:** WebAuthn PRF not supported on this device/browser.

**Requirements:**
- **iOS:** Safari 16+ on iPhone with Face ID or Touch ID
- **Android:** Chrome 108+ on device with fingerprint sensor
- **Desktop:** Chrome/Edge 108+ on Windows Hello or macOS Touch ID device

**Fix:**
- Update browser to latest version
- Ensure device has biometric hardware
- Try re-enrolling biometrics in Settings

---

### Issue: Secrets not syncing across devices

**Cause:** Firestore real-time listeners not working.

**Fix:**
1. Check internet connection
2. Verify Firestore rules allow read access
3. Check browser console for errors
4. Try signing out and back in

---

### Issue: "Quota exceeded" error

**Cause:** Exceeded Firebase free tier limits.

**Free Tier Limits:**
- 1 GB Firestore storage
- 50,000 document reads/day
- 20,000 document writes/day

**Fix:**
- Upgrade to Firebase Blaze (pay-as-you-go) plan
- Or optimize usage (delete old secrets, reduce sync frequency)

---

## Cost Estimation

### Firebase Free Tier (Spark Plan)

**Included:**
- ✅ 1 GB Firestore storage
- ✅ 50,000 document reads/day
- ✅ 20,000 document writes/day
- ✅ 10 GB Hosting bandwidth/month
- ✅ Unlimited Authentication users

**Typical Personal Use:**
- ~100-500 secrets = ~1-5 MB storage
- ~100-500 reads/day (opening vault, searching)
- ~10-50 writes/day (adding/editing secrets)

**Verdict:** Free tier is sufficient for personal use (1-5 users).

### Firebase Blaze Plan (Pay-as-you-go)

**Pricing (as of 2025):**
- $0.18 per GB storage/month
- $0.06 per 100,000 document reads
- $0.18 per 100,000 document writes
- $0.15 per GB Hosting bandwidth

**Example: Heavy Personal Use**
- 1,000 secrets (~10 MB) = $0.002/month
- 10,000 reads/day = $1.80/month
- 1,000 writes/day = $5.40/month
- 1 GB bandwidth = $0.15/month

**Total:** ~$7.50/month (heavy use)

**Typical Personal Use:** $0-2/month

### Hosting Costs

- **Firebase Hosting:** Free (10 GB/month)
- **Netlify:** Free (100 GB/month)
- **Vercel:** Free (100 GB/month)
- **Self-Hosted:** $5-20/month (VPS)

---

## Advanced Configuration

### Custom Branding

Edit the following files to customize branding:

- `apps/web/index.html` — Page title, meta tags
- `apps/web/public/manifest.webmanifest` — PWA name, icons
- `apps/web/public/favicon.svg` — Browser icon
- `packages/ui/src/components/Sidebar.tsx` — Logo and app name

### Custom Domain with SSL

**Firebase Hosting:**
1. Firebase Console > Hosting > Add custom domain
2. Follow DNS instructions
3. SSL is automatic (Let's Encrypt)

**Netlify:**
1. Netlify Dashboard > Domain settings > Add custom domain
2. Update DNS records
3. SSL is automatic

**Self-Hosted:**
1. Use [Certbot](https://certbot.eff.org/) for Let's Encrypt SSL
2. Configure nginx/Apache with SSL

### Backup Strategy

**Automated Firestore Backups:**
1. Go to Firebase Console > Firestore Database > Backups
2. Enable automated backups (Blaze plan required)
3. Choose backup frequency (daily recommended)

**Manual Export:**
- Users can export their vault from Settings > Export Vault
- Exports a JSON file with encrypted secrets

---

## Getting Help

### Resources

- **Documentation:** [README.md](README.md)
- **Security Model:** [SECURITY.md](SECURITY.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **GitHub Issues:** https://github.com/hariharen9/Scync/issues
- **GitHub Discussions:** https://github.com/hariharen9/Scync/discussions

### Community Support

- Open an issue on GitHub for bugs
- Start a discussion for questions
- Check existing issues for solutions

### Professional Support

For enterprise deployments or custom development:
- Contact: support@scync.app (if available)
- Or hire a developer familiar with React + Firebase

---

## Legal and Compliance

### Data Controller Responsibility

When you self-host Scync, **you are the data controller**. This means:

- ✅ You are responsible for GDPR/CCPA compliance
- ✅ You must provide a Privacy Policy to your users
- ✅ You must handle data subject requests (access, deletion)
- ✅ You must secure your Firebase project

### License

Scync is licensed under the **MIT License**. You are free to:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute
- ✅ Sublicense

**Requirements:**
- Include the original license and copyright notice
- Provide attribution to the original project

See [LICENSE](LICENSE) for full terms.

---

## Conclusion

Congratulations! You now have a fully self-hosted Scync instance. 🎉

**Next Steps:**
1. ✅ Test all features (add secrets, lock/unlock, biometrics)
2. ✅ Set up backups (Firestore automated backups)
3. ✅ Monitor usage (Firebase Console)
4. ✅ Share with your team (if applicable)
5. ✅ Star the repo on GitHub ⭐

**Questions?** Open an issue on GitHub or start a discussion.

**Found a bug?** Please report it — we appreciate contributions!

---

**Happy self-hosting! 🚀**

---

**Document Version:** 1.0  
**Last Updated:** January 1, 2025  
**Maintained by:** Scync Contributors
