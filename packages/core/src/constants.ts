import type { ServiceName, SecretType, Environment, SecretStatus, ProjectColor } from './types';

export const SERVICES: readonly ServiceName[] = [
  'AWS', 'Azure', 'Google', 'OpenAI', 'Anthropic', 'OpenRouter',
  'DigitalOcean', 'Vercel', 'Netlify', 'Railway',
  'Cloudflare', 'Supabase', 'Firebase', 'GitHub', 'GitLab',
  'HuggingFace', 'Stripe', 'Twilio', 'Slack', 'Other'
];

export const SECRET_TYPES: readonly SecretType[] = [
  'API Key', 'Personal Access Token', 'OAuth Token', 'OAuth Client Secret',
  'Recovery Codes', 'Secret Key', 'Webhook Secret',
  'Service Account JSON', 'Database URL', 'License Key', 'Passphrase',
  'Secret Note', 'Password', 'Other'
];

export const ENVIRONMENTS: readonly Environment[] = [
  'Personal', 'Work', 'Local', 'Development', 'Testing', 'Staging', 'Production', 'CI/CD'
];

export const STATUSES: readonly SecretStatus[] = [
  'Active', 'Rotated', 'Expired', 'Revoked'
];

export const SERVICE_COLORS: Record<ServiceName, string> = {
  'Google': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Anthropic': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'GitHub': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'OpenRouter': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'AWS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
  'Vercel': 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  'Stripe': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Cloudflare': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Supabase': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'OpenAI': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'HuggingFace': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
  'Twilio': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Netlify': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'Railway': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Firebase': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Azure': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'DigitalOcean': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'GitLab': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Slack': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Other': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export const STATUS_COLORS: Record<SecretStatus, string> = {
  'Active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Rotated': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
  'Expired': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Revoked': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const PROJECT_COLORS: Record<ProjectColor, string> = {
  'violet': 'bg-violet-500',
  'blue': 'bg-blue-500',
  'green': 'bg-emerald-500',
  'orange': 'bg-orange-500',
  'red': 'bg-rose-500',
  'pink': 'bg-pink-500',
  'yellow': 'bg-yellow-500',
  'gray': 'bg-zinc-500'
};
