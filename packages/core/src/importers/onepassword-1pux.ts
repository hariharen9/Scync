// 1Password 1PUX parser (ZIP format)

import { inferService, inferType, generateLocalId } from './index.js';
import type { ImportCandidate, ImportParseResult } from '../types.js';

const SKIP_CATEGORIES = ['002', '004']; // Credit Card, Identity

export async function parse1PasswordOnePux(zipBuffer: ArrayBuffer): Promise<ImportParseResult> {
  // Unzip using JSZip (lazy-loaded)
  const exportData = await extractExportDataFromZip(zipBuffer);
  const parsed = JSON.parse(exportData) as OnePuxExport;

  const candidates: ImportCandidate[] = [];
  let totalItems = 0;
  let skippedItems = 0;

  for (const account of parsed.accounts) {
    for (const vault of account.vaults) {
      for (const item of vault.items) {
        totalItems++;

        if (SKIP_CATEGORIES.includes(item.categoryUuid)) {
          skippedItems++;
          continue;
        }

        const extracted = extractOnePuxSecrets(item);
        for (const e of extracted) {
          if (!e.value || e.value.trim() === '') {
            skippedItems++;
            continue;
          }
          candidates.push({
            localId: generateLocalId(),
            name: e.name,
            service: inferService(e.name, e.value),
            type: inferType(e.name, e.value, item.categoryUuid),
            environment: 'Personal',
            status: 'Active',
            value: e.value,
            notes: item.details.notesPlain ?? '',
            selected: true,
            sourceType: `1Password ${getCategoryName(item.categoryUuid)}`,
            projectId: null,
          });
        }
      }
    }
  }

  return {
    candidates,
    totalItems,
    skippedItems,
    warnings: [],
    sourceFormat: 'onepassword-1pux',
  };
}

function extractOnePuxSecrets(item: OnePuxItem): Array<{ name: string; value: string }> {
  const results: Array<{ name: string; value: string }> = [];
  const title = item.overview.title;

  // Extract from sections/fields
  for (const section of item.details.sections ?? []) {
    for (const field of section.fields ?? []) {
      const value =
        field.value.concealed ??
        field.value.string ??
        field.value.totp ??
        '';

      if (value) {
        const name = section.title
          ? `${title} — ${field.title}`
          : `${title} — ${field.title}`;
        results.push({ name, value });
      }
    }
  }

  // If nothing found in sections, try loginFields
  if (results.length === 0) {
    for (const loginField of item.details.loginFields ?? []) {
      if (loginField.value && loginField.designation === 'password') {
        results.push({ name: title, value: loginField.value });
      }
    }
  }

  return results;
}

// Unzip the .1pux file using JSZip (lazy-loaded)
async function extractExportDataFromZip(buffer: ArrayBuffer): Promise<string> {
  const JSZip = await import('jszip');
  const zip = await JSZip.default.loadAsync(buffer);
  const exportFile = zip.file('export.data');
  if (!exportFile) throw new Error('Invalid .1pux file: missing export.data');
  return exportFile.async('string');
}

function getCategoryName(uuid: string): string {
  const map: Record<string, string> = {
    '001': 'Login',
    '003': 'Secure Note',
    '005': 'Password',
    '109': 'API Credential',
    '110': 'Server',
  };
  return map[uuid] ?? 'Item';
}

// ── Type definitions for 1PUX format ──────────────────────────────────────

interface OnePuxExport {
  accounts: OnePuxAccount[];
}
interface OnePuxAccount {
  vaults: OnePuxVault[];
}
interface OnePuxVault {
  items: OnePuxItem[];
}
interface OnePuxItem {
  uuid: string;
  categoryUuid: string;
  overview: { title: string; tags?: string[] };
  details: {
    loginFields?: Array<{ designation: string; value: string }>;
    sections?: Array<{
      title: string;
      fields?: Array<{
        title: string;
        value: {
          concealed?: string;
          string?: string;
          totp?: string;
        };
      }>;
    }>;
    notesPlain?: string;
  };
}
