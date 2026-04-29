// Session management for CLI
// Uses environment variables for session persistence across commands

import type { Session } from './types.js';
import { importKeyBytes, exportKeyBytes } from './crypto.js';

const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

// Check if session exists in environment
export function hasSession(): boolean {
  return !!(
    process.env.SCYNC_SESSION_KEY &&
    process.env.SCYNC_SESSION_UID &&
    process.env.SCYNC_SESSION_EXPIRES
  );
}

// Get session from environment
export function getSession(): Session | null {
  if (!hasSession()) return null;

  const expires = parseInt(process.env.SCYNC_SESSION_EXPIRES || '0');
  if (Date.now() > expires) {
    return null; // Session expired
  }

  return {
    keyBase64: process.env.SCYNC_SESSION_KEY!,
    uid: process.env.SCYNC_SESSION_UID!,
    expires,
  };
}

// Create session export string for eval
export async function createSessionExport(
  key: CryptoKey,
  uid: string
): Promise<string> {
  const keyBase64 = await exportKeyBytes(key);
  const expires = Date.now() + SESSION_DURATION;

  // Output shell-compatible export statements
  const exports = [
    `export SCYNC_SESSION_KEY="${keyBase64}"`,
    `export SCYNC_SESSION_UID="${uid}"`,
    `export SCYNC_SESSION_EXPIRES="${expires}"`,
  ];

  return exports.join('\n');
}

// Get CryptoKey from session
export async function getSessionKey(): Promise<CryptoKey | null> {
  const session = getSession();
  if (!session) return null;

  try {
    return await importKeyBytes(session.keyBase64);
  } catch {
    return null;
  }
}

// Get UID from session
export function getSessionUid(): string | null {
  const session = getSession();
  return session?.uid || null;
}

// Check if session is valid
export function isSessionValid(): boolean {
  const session = getSession();
  if (!session) return false;
  return Date.now() < session.expires;
}
