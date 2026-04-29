// Firebase authentication for CLI using REST API

import { readAuthConfig, writeAuthConfig, FIREBASE_API_KEY } from './config.js';
import type { AuthConfig } from './types.js';

// Get a valid ID token (refresh if needed)
export async function getValidIdToken(): Promise<string> {
  const config = readAuthConfig();
  if (!config) {
    throw new Error('Not logged in. Run: scync login');
  }

  try {
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${config.refreshToken}`,
      }
    );

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json() as {
      id_token: string;
      refresh_token: string;
    };

    // Update refresh token if it changed
    if (data.refresh_token && data.refresh_token !== config.refreshToken) {
      writeAuthConfig({
        ...config,
        refreshToken: data.refresh_token,
      });
    }

    return data.id_token;
  } catch (error) {
    throw new Error('Session expired. Run: scync login');
  }
}

// Get current auth config
export function getAuthConfig(): AuthConfig | null {
  return readAuthConfig();
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  return readAuthConfig() !== null;
}
