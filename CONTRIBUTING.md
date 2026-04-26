# Contributing to Scync

First off, thank you for considering contributing to Scync! It's people like you that make Scync such a great tool for the developer community.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Scync.git
   cd Scync
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env.local` in `apps/web/` and fill in your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run development servers:**
   ```bash
   pnpm dev
   ```

## 🏗 Project Structure

Scync is a monorepo managed with **Turborepo** and **pnpm workspaces**.

- `apps/web`: The core React web application (Vite).
- `apps/desktop`: Electron wrapper for the desktop experience.
- `apps/mobile`: Capacitor wrapper for iOS and Android.
- `packages/core`: Shared logic, types, and the zero-knowledge crypto engine.
- `packages/ui`: Shared React components and design system (Tailwind CSS).

## 🛠 Development Workflow

### Branching
- `main` is the stable branch. All releases are tagged from here.
- Create feature branches from `main` (e.g., `feat/awesome-new-feature` or `fix/annoying-bug`).
- Submit a Pull Request to `main` when ready.

### Coding Standards
- **TypeScript**: We use strict TypeScript. Ensure your types are accurate.
- **Styling**: We use **Tailwind CSS** via the shared design system in `packages/ui`.
- **Crypto**: Never implement your own crypto logic. Use the functions provided in `packages/core/src/crypto.ts`.
- **State**: We use **Zustand** for state management.

### Testing
We use **Vitest** for unit testing and **Playwright** for E2E tests. Please ensure your changes include relevant tests.

```bash
pnpm test
```

## 🤝 Community
If you have questions or want to discuss a feature, please open a [GitHub Discussion](https://github.com/your-username/Scync/discussions).

## 📜 License
By contributing to Scync, you agree that your contributions will be licensed under its [MIT License](LICENSE).
