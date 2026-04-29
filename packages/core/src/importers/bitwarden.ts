// Bitwarden JSON parser

import { inferService, inferType, generateLocalId } from './index.js';
import type { ImportCandidate, ImportParseResult } from '../types.js';

interface BwField {
  name: string;
  value: string | null;
  type: number; // 0=text, 1=hidden, 2=boolean
}

interface BwLogin {
  username: string | null;
  password: string | null;
  uris?: Array<{ uri: string }>;
  totp?: string | null;
}

interface BwItem {
  id: string;
  type: 1 | 2 | 3 | 4;
  name: string;
  notes: string | null;
  fields?: BwField[];
  login?: BwLogin | null;
  secureNote?: { type: number } | null;
}

export function parseBitwardenExport(jsonString: string): ImportParseResult {
  let data: any;

  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file. Make sure you exported from Bitwarden as unencrypted JSON.');
  }

  // Handle both direct export format and wrapped format
  const actualData = data.encrypted !== undefined ? data : (data.items ? data : null);
  
  if (!actualData) {
    throw new Error('Invalid Bitwarden export format. Could not find vault data.');
  }

  if (actualData.encrypted === true) {
    throw new Error(
      'This is an encrypted Bitwarden export. Please re-export from Bitwarden using ' +
      'Account → Export Vault → File Format: .json (unencrypted).'
    );
  }

  const items = actualData.items || [];
  
  if (!Array.isArray(items)) {
    throw new Error('Invalid Bitwarden export format: items is not an array.');
  }

  const candidates: ImportCandidate[] = [];
  let skippedItems = 0;
  const warnings: string[] = [];

  for (const item of items) {
    // Skip credit cards and identities — not developer secrets
    if (item.type === 3 || item.type === 4) {
      skippedItems++;
      continue;
    }

    const extractedSecrets = extractBitwardenSecrets(item);

    for (const extracted of extractedSecrets) {
      if (!extracted.value || extracted.value.trim() === '') {
        skippedItems++;
        continue;
      }

      candidates.push({
        localId: generateLocalId(),
        name: extracted.name,
        service: inferService(extracted.name, extracted.value),
        type: inferType(extracted.name, extracted.value, extracted.sourceType),
        environment: 'Personal',
        status: 'Active',
        value: extracted.value,
        notes: item.notes ?? '',
        selected: true,
        sourceType: extracted.sourceType,
        warning: extracted.warning,
        projectId: null,
      });
    }
  }

  return {
    candidates,
    totalItems: items.length,
    skippedItems,
    warnings,
    sourceFormat: 'bitwarden-json',
  };
}

interface ExtractedSecret {
  name: string;
  value: string;
  sourceType: string;
  warning?: string;
}

function extractBitwardenSecrets(item: BwItem): ExtractedSecret[] {
  const results: ExtractedSecret[] = [];

  if (item.type === 2) {
    // Secure Note — extract from custom fields
    if (item.fields && item.fields.length > 0) {
      for (const field of item.fields) {
        if (field.value && field.value.trim() !== '') {
          results.push({
            name: field.name ? `${item.name} — ${field.name}` : item.name,
            value: field.value,
            sourceType: 'Bitwarden Secure Note',
          });
        }
      }
    }

    // If no fields, check if notes contain a value
    if (results.length === 0 && item.notes && item.notes.trim() !== '') {
      results.push({
        name: item.name,
        value: item.notes,
        sourceType: 'Bitwarden Secure Note',
        warning: 'Value was extracted from the notes field',
      });
    }
  }

  if (item.type === 1 && item.login) {
    // Login item — extract password + TOTP + custom fields
    if (item.login.password) {
      results.push({
        name: item.name,
        value: item.login.password,
        sourceType: 'login',
      });
    }

    if (item.login.totp) {
      results.push({
        name: `${item.name} — 2FA Secret`,
        value: item.login.totp,
        sourceType: 'TOTP',
      });
    }

    // Custom fields on login items (often where devs stash API keys)
    if (item.fields) {
      for (const field of item.fields) {
        if (field.value && field.value.trim() !== '' && field.type !== 2) {
          results.push({
            name: `${item.name} — ${field.name}`,
            value: field.value,
            sourceType: 'Bitwarden Login Custom Field',
          });
        }
      }
    }
  }

  return results;
}
