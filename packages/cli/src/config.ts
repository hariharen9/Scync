// Config file management for ~/.scync directory

import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, chmodSync } from 'fs';
import type { AuthConfig } from './types.js';

// Firebase configuration (same as web app)
// These are public identifiers, not secrets
export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyDubqBg3OWE9uwTKZI_tQpVF7CK7J3d2xo';
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'scync-app';
export const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || 'scync-app.firebaseapp.com';

const SCYNC_DIR = join(homedir(), '.scync');
const AUTH_FILE = join(SCYNC_DIR, 'auth.json');
const CONFIG_FILE = join(SCYNC_DIR, 'config.json');

// Ensure ~/.scync directory exists
export function ensureScyncDir(): void {
  if (!existsSync(SCYNC_DIR)) {
    mkdirSync(SCYNC_DIR, { recursive: true, mode: 0o700 });
  }
}

// Read auth config
export function readAuthConfig(): AuthConfig | null {
  if (!existsSync(AUTH_FILE)) return null;
  try {
    const data = readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(data) as AuthConfig;
  } catch {
    return null;
  }
}

// Write auth config
export function writeAuthConfig(config: AuthConfig): void {
  ensureScyncDir();
  writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  // Ensure file is only readable by owner
  try {
    chmodSync(AUTH_FILE, 0o600);
  } catch {
    // chmod might fail on Windows, that's okay
  }
}

// Delete auth config
export function deleteAuthConfig(): void {
  if (existsSync(AUTH_FILE)) {
    unlinkSync(AUTH_FILE);
  }
}

// Read user config (currently unused, for future preferences)
export function readUserConfig(): Record<string, unknown> {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Write user config
export function writeUserConfig(config: Record<string, unknown>): void {
  ensureScyncDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
