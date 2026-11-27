import type { ServiceName, SecretType, Environment, SecretStatus, ProjectColor } from './types';

export const SERVICES: readonly ServiceName[] = [
  // AI & LLMs
  'OpenAI', 'Anthropic', 'Google', 'Gemini', 'OpenRouter', 'Groq',
  'Mistral', 'Cohere', 'Perplexity', 'xAI', 'DeepSeek', 'Replicate',
  'HuggingFace', 'ElevenLabs',
  // Cloud & Hosting
  'AWS', 'Azure', 'GCP', 'Cloudflare', 'DigitalOcean', 'Vercel',
  'Netlify', 'Railway', 'Fly.io', 'Render', 'Hetzner',
  // Databases & Caching
  'Supabase', 'Firebase', 'Neon', 'PlanetScale', 'Turso', 'Upstash',
  'MongoDB', 'Redis', 'PostgreSQL',
  // Auth, Payments & Comms
  'Clerk', 'Auth0', 'Stripe', 'LemonSqueezy', 'Resend', 'SendGrid',
  'Postmark', 'Twilio', 'Slack', 'Discord',
  // DevTools, Product & Observability
  'GitHub', 'GitLab', 'Docker', 'npm', 'Linear', 'Notion', 'Figma',
  'Sentry', 'Datadog', 'PostHog', 'Grafana', 'Terraform', 'Algolia', 'Mapbox',
  'Other'
];

export const SECRET_TYPES: readonly SecretType[] = [
  'API Key', 'Personal Access Token', 'OAuth Token', 'OAuth Client Secret',
  'Recovery Codes', 'Recovery Phrase', 'Secret Key', 'Webhook Secret',
  'Service Account JSON', 'Database URL', 'License Key', 'Passphrase',
  'Secret Note', 'Password', 'Other'
];

export const ENVIRONMENTS: readonly Environment[] = [
  'Personal', 'Work', 'Local', 'Development', 'Testing', 'Staging', 'Production', 'CI/CD'
];

export const STATUSES: readonly SecretStatus[] = [
  'Active', 'Rotated', 'Expired', 'Revoked'
];

// Service accent colors (hex) used for chips, icons and charts.
// Single source of truth — do not redefine per-component maps.
export const SERVICE_COLORS: Record<ServiceName, string> = {
  // AI & LLMs
  'OpenAI': '#74aa9c',
  'Anthropic': '#d4a27f',
  'Google': '#4285f4',
  'Gemini': '#4e8df5',
  'OpenRouter': '#9b6dff',
  'Groq': '#f55036',
  'Mistral': '#fa520f',
  'Cohere': '#39594d',
  'Perplexity': '#20808d',
  'xAI': '#e4e4e7',
  'DeepSeek': '#4d6bfe',
  'Replicate': '#ea4c89',
  'HuggingFace': '#ffd21e',
  'ElevenLabs': '#a855f7',
  // Cloud & Hosting
  'AWS': '#f59e0b',
  'Azure': '#0089d6',
  'GCP': '#4285f4',
  'Cloudflare': '#f48120',
  'DigitalOcean': '#0080ff',
  'Vercel': '#ffffff',
  'Netlify': '#00c7b7',
  'Railway': '#a855f7',
  'Fly.io': '#8b5cf6',
  'Render': '#46e3b7',
  'Hetzner': '#d50c2d',
  // Databases & Caching
  'Supabase': '#3ecf8e',
  'Firebase': '#ffca28',
  'Neon': '#00e599',
  'PlanetScale': '#f4f4f5',
  'Turso': '#4ff8d2',
  'Upstash': '#00e9a3',
  'MongoDB': '#47a248',
  'Redis': '#dc382d',
  'PostgreSQL': '#336791',
  // Auth, Payments & Comms
  'Clerk': '#6c47ff',
  'Auth0': '#eb5424',
  'Stripe': '#635bff',
  'LemonSqueezy': '#ffc233',
  'Resend': '#e4e4e7',
  'SendGrid': '#1a82e2',
  'Postmark': '#ffde00',
  'Twilio': '#f22f46',
  'Slack': '#e01e5a',
  'Discord': '#5865f2',
  // DevTools, Product & Observability
  'GitHub': '#f0f6fc',
  'GitLab': '#fca326',
  'Docker': '#2496ed',
  'npm': '#cb3837',
  'Linear': '#5e6ad2',
  'Notion': '#f4f4f5',
  'Figma': '#a259ff',
  'Sentry': '#fb4226',
  'Datadog': '#632ca6',
  'PostHog': '#f54e00',
  'Grafana': '#f46800',
  'Terraform': '#844fba',
  'Algolia': '#003dff',
  'Mapbox': '#4264fb',
  'Other': '#10b981',
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
