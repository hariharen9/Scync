// Firestore REST API client

import { FIREBASE_PROJECT_ID } from './config.js';
import type { VaultMeta, StoredSecret, Project } from './types.js';

const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Parse Firestore field value
function parseField(field: unknown): unknown {
  const f = field as Record<string, unknown>;
  
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return parseInt(f.integerValue as string);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('timestampValue' in f) return new Date(f.timestampValue as string);
  if ('nullValue' in f) return null;
  
  if ('mapValue' in f) {
    const mapFields = (f.mapValue as { fields?: Record<string, unknown> }).fields;
    if (!mapFields) return {};
    return Object.fromEntries(
      Object.entries(mapFields).map(([k, v]) => [k, parseField(v)])
    );
  }
  
  if ('arrayValue' in f) {
    const values = (f.arrayValue as { values?: unknown[] }).values || [];
    return values.map(v => parseField(v));
  }
  
  return f;
}

// Parse Firestore document
function parseDocument(doc: unknown): Record<string, unknown> {
  const d = doc as { name?: string; fields?: Record<string, unknown> };
  if (!d.fields) return {};
  
  const parsed = Object.fromEntries(
    Object.entries(d.fields).map(([k, v]) => [k, parseField(v)])
  );
  
  // Extract ID from document name
  if (d.name) {
    const parts = d.name.split('/');
    parsed.id = parts[parts.length - 1];
  }
  
  return parsed;
}

// Generic Firestore GET request
async function firestoreGet(path: string, idToken: string): Promise<unknown> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  
  if (!res.ok) {
    throw new Error(`Firestore GET failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json();
}

// Get vault metadata
export async function getVaultMeta(uid: string, idToken: string): Promise<VaultMeta> {
  const doc = await firestoreGet(`users/${uid}/meta/vault`, idToken);
  return parseDocument(doc) as unknown as VaultMeta;
}

// Get all secrets
export async function getAllSecrets(uid: string, idToken: string): Promise<StoredSecret[]> {
  const res = await fetch(`${BASE}/users/${uid}/secrets`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch secrets: ${res.status}`);
  }
  
  const data = await res.json() as { documents?: unknown[] };
  if (!data.documents) return [];
  
  return data.documents.map(doc => parseDocument(doc) as unknown as StoredSecret);
}

// Get all projects
export async function getAllProjects(uid: string, idToken: string): Promise<Project[]> {
  const res = await fetch(`${BASE}/users/${uid}/projects`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  
  if (!res.ok) {
    if (res.status === 404) return []; // No projects yet
    throw new Error(`Failed to fetch projects: ${res.status}`);
  }
  
  const data = await res.json() as { documents?: unknown[] };
  if (!data.documents) return [];
  
  return data.documents.map(doc => parseDocument(doc) as unknown as Project);
}

// Alias for consistency with env command
export const getProjects = getAllProjects;
