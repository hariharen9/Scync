// Importer utilities and service/type inference

import type { ServiceName, SecretType } from '../types.js';

// ── Service inference ──────────────────────────────────────────────────────

const SERVICE_KEYWORDS: Record<string, string[]> = {
  'Google':      ['google', 'gcp', 'gmail', 'firebase', 'vertex', 'cloud console'],
  'Anthropic':   ['anthropic', 'claude'],
  'GitHub':      ['github', 'gh', 'ghp_', 'pat '],
  'OpenRouter':  ['openrouter'],
  'AWS':         ['aws', 'amazon', 'ec2', 's3', 'iam', 'dynamodb', 'lambda', 'secret_access_key', 'access_key_id'],
  'Vercel':      ['vercel'],
  'Stripe':      ['stripe', 'sk_live', 'sk_test', 'pk_live', 'pk_test'],
  'Cloudflare':  ['cloudflare', 'cf_'],
  'Supabase':    ['supabase'],
  'OpenAI':      ['openai', 'sk-'],
  'HuggingFace': ['huggingface', 'hugging face', 'hf_'],
  'Twilio':      ['twilio'],
  'SendGrid':    ['sendgrid'],
  'Netlify':     ['netlify'],
  'Railway':     ['railway'],
  'PlanetScale': ['planetscale'],
  'Neon':        ['neon', 'neon.tech'],
  'Other':       [],
};

export function inferService(name: string, value: string = ''): ServiceName {
  const haystack = (name + ' ' + value).toLowerCase();
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (service === 'Other') continue;
    if (keywords.some(kw => haystack.includes(kw))) {
      return service as ServiceName;
    }
  }
  return 'Other';
}

// ── Type inference ─────────────────────────────────────────────────────────

export function inferType(name: string, value: string = '', sourceType: string = ''): SecretType {
  const haystack = (name + ' ' + value + ' ' + sourceType).toLowerCase();

  if (haystack.includes('ssh') || value.startsWith('-----BEGIN')) return 'SSH Key';
  if (haystack.includes('recovery') || haystack.includes('backup code')) return 'Recovery Codes';
  if (haystack.includes('webhook')) return 'Webhook Secret';
  if (haystack.includes('oauth') && haystack.includes('secret')) return 'OAuth Client Secret';
  if (haystack.includes('oauth') || haystack.includes('refresh_token')) return 'OAuth Token';
  if (haystack.includes('pat') || haystack.includes('personal access')) return 'Personal Access Token';
  if (haystack.includes('database') || haystack.includes('db_url') || value.includes('postgres://') || value.includes('mysql://')) return 'Database URL';
  if (haystack.includes('service account') || value.startsWith('{')) return 'Service Account JSON';
  if (haystack.includes('api key') || haystack.includes('api_key') || haystack.includes('apikey')) return 'API Key';
  if (sourceType === 'login') return 'Password';
  return 'API Key'; // best default for developer secrets
}

// ── Local ID generator ─────────────────────────────────────────────────────

export function generateLocalId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Re-export parsers
export { parseBitwardenExport } from './bitwarden.js';
export { parse1PasswordCsv } from './onepassword-csv.js';
export { parse1PasswordOnePux } from './onepassword-1pux.js';
