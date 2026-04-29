// 1Password CSV parser

import { inferService, inferType, generateLocalId } from './index.js';
import type { ImportCandidate, ImportParseResult } from '../types.js';

export function parse1PasswordCsv(csvString: string): ImportParseResult {
  const lines = csvString.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSV file appears empty or has no data rows.');
  }

  // Parse header row
  const headers = parseCSVRow(lines[0] ?? '').map(h => h.toLowerCase().trim());
  const titleIdx = headers.indexOf('title');
  const passwordIdx = headers.indexOf('password');
  const notesIdx = headers.indexOf('notes');
  const typeIdx = headers.indexOf('type');
  const otpIdx = headers.indexOf('otpauth');

  if (titleIdx === -1 || passwordIdx === -1) {
    throw new Error(
      'Could not find required columns (Title, Password). ' +
      'Make sure you exported from 1Password as CSV.'
    );
  }

  const candidates: ImportCandidate[] = [];
  let skippedItems = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i] ?? '');
    const title = row[titleIdx] ?? '';
    const password = row[passwordIdx] ?? '';
    const notes = notesIdx !== -1 ? (row[notesIdx] ?? '') : '';
    const type1P = typeIdx !== -1 ? (row[typeIdx] ?? '') : '';
    const otpAuth = otpIdx !== -1 ? (row[otpIdx] ?? '') : '';

    // Skip items without a usable value
    if (!password || password.trim() === '') {
      skippedItems++;
      continue;
    }

    candidates.push({
      localId: generateLocalId(),
      name: title,
      service: inferService(title, password),
      type: inferType(title, password, type1P),
      environment: 'Personal',
      status: 'Active',
      value: password,
      notes,
      selected: true,
      sourceType: `1Password ${type1P || 'Item'}`,
      projectId: null,
    });

    // If there's also an OTP secret, add it as a separate entry
    if (otpAuth && otpAuth.trim() !== '') {
      candidates.push({
        localId: generateLocalId(),
        name: `${title} — 2FA Secret`,
        service: inferService(title),
        type: 'Recovery Codes',
        environment: 'Personal',
        status: 'Active',
        value: otpAuth,
        notes: '',
        selected: true,
        sourceType: '1Password TOTP',
        projectId: null,
      });
    }
  }

  return {
    candidates,
    totalItems: lines.length - 1,
    skippedItems,
    warnings: [],
    sourceFormat: 'onepassword-csv',
  };
}

/** Parse a single CSV row, respecting quoted values */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
