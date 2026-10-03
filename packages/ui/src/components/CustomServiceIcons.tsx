import React from 'react';
import type { IconType } from 'react-icons';
import { 
  SiGithub, SiGoogle, SiStripe, SiOpenai, SiVercel, SiSupabase,
  SiCloudflare, SiTwilio, SiNetlify, SiRailway, SiPlanetscale,
  SiSendgrid, SiHuggingface, SiAnthropic,
  SiApple, SiDigitalocean, SiHeroku, SiFirebase, SiMongodb,
  SiPostgresql, SiRedis, SiMysql, SiDocker, SiKubernetes,
  SiSlack, SiDiscord, SiFacebook,
  SiInstagram, SiTrello, SiJira, SiNotion, SiFigma,
  SiLinear, SiSentry, SiDatadog, SiNewrelic, SiGitlab,
  SiBitbucket, SiDropbox, SiBox, SiSalesforce, SiHubspot,
  SiZendesk, SiIntercom, SiMailchimp, SiShopify, SiWordpress,
  SiReact, SiVuedotjs, SiAngular, SiSvelte, SiNodedotjs,
  SiPython, SiGo, SiRust, SiPhp, SiRuby, SiFastapi,
  SiAuth0, SiOkta, SiClerk, SiBitwarden, SiVault, SiTailscale,
  SiTerraform, SiNginx, SiApache, SiElasticsearch, SiRabbitmq,
  SiApachekafka, SiResend, SiPosthog, SiGrafana, SiPrometheus,
  SiClickhouse, SiPrisma, SiSnowflake, SiDatabricks, SiDeno, SiBun
} from 'react-icons/si';
import { FaAws, FaAmazon, FaMicrosoft, FaLinkedin, FaTwitter } from 'react-icons/fa';
import {
  FiServer, FiDatabase, FiCpu, FiHardDrive, FiCloud, FiTerminal,
  FiShield, FiLock, FiKey, FiGlobe, FiRadio, FiActivity, FiZap,
  FiCode, FiLayers, FiBox, FiSend, FiMail, FiSliders, FiWifi,
  FiLink, FiTool
} from 'react-icons/fi';

export type ServiceCategory = 'all' | 'infra' | 'database' | 'security' | 'api_ai' | 'devops' | 'tools';

export interface ServiceIconDefinition {
  key: string;
  name: string;
  category: Exclude<ServiceCategory, 'all'>;
  keywords: string[];
  icon: IconType;
}

export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'infra', label: 'Cloud & Infra' },
  { id: 'database', label: 'Data & Storage' },
  { id: 'security', label: 'Security & Auth' },
  { id: 'api_ai', label: 'APIs & AI' },
  { id: 'devops', label: 'DevOps & Langs' },
  { id: 'tools', label: 'SaaS & Tools' },
];

export const SERVICE_ICON_DEFINITIONS: ServiceIconDefinition[] = [
  // ── Infrastructure & Cloud ──
  { key: 'FiServer', name: 'Server', category: 'infra', keywords: ['server', 'host', 'vps', 'node', 'baremetal', 'compute'], icon: FiServer },
  { key: 'FiCloud', name: 'Cloud', category: 'infra', keywords: ['cloud', 'hosting', 'network', 'provider'], icon: FiCloud },
  { key: 'FiCpu', name: 'CPU / Compute', category: 'infra', keywords: ['cpu', 'processor', 'compute', 'hardware'], icon: FiCpu },
  { key: 'FiHardDrive', name: 'Disk / Storage', category: 'infra', keywords: ['disk', 'storage', 'ssd', 'hdd', 'volume', 'nas'], icon: FiHardDrive },
  { key: 'FiGlobe', name: 'Global Network', category: 'infra', keywords: ['globe', 'web', 'internet', 'cdn', 'dns', 'domain'], icon: FiGlobe },
  { key: 'FiTerminal', name: 'Terminal / SSH', category: 'infra', keywords: ['terminal', 'ssh', 'bash', 'shell', 'cli', 'console'], icon: FiTerminal },
  { key: 'FiWifi', name: 'Network / Gateway', category: 'infra', keywords: ['wifi', 'network', 'gateway', 'router', 'vpn', 'ip'], icon: FiWifi },
  { key: 'FiLayers', name: 'Layers / Cluster', category: 'infra', keywords: ['layers', 'stack', 'cluster', 'group'], icon: FiLayers },
  { key: 'FaAws', name: 'AWS', category: 'infra', keywords: ['aws', 'amazon', 'cloud', 's3', 'ec2'], icon: FaAws },
  { key: 'FaMicrosoft', name: 'Azure', category: 'infra', keywords: ['azure', 'microsoft', 'cloud'], icon: FaMicrosoft },
  { key: 'SiGoogle', name: 'Google Cloud', category: 'infra', keywords: ['gcp', 'google', 'cloud'], icon: SiGoogle },
  { key: 'SiCloudflare', name: 'Cloudflare', category: 'infra', keywords: ['cloudflare', 'cdn', 'dns', 'workers', 'r2'], icon: SiCloudflare },
  { key: 'SiDigitalocean', name: 'DigitalOcean', category: 'infra', keywords: ['digitalocean', 'droplet', 'vps'], icon: SiDigitalocean },
  { key: 'SiHeroku', name: 'Heroku', category: 'infra', keywords: ['heroku', 'paas', 'dyno'], icon: SiHeroku },
  { key: 'SiVercel', name: 'Vercel', category: 'infra', keywords: ['vercel', 'nextjs', 'deploy'], icon: SiVercel },
  { key: 'SiNetlify', name: 'Netlify', category: 'infra', keywords: ['netlify', 'jamstack', 'web'], icon: SiNetlify },
  { key: 'SiRailway', name: 'Railway', category: 'infra', keywords: ['railway', 'deploy', 'paas'], icon: SiRailway },
  { key: 'SiTailscale', name: 'Tailscale', category: 'infra', keywords: ['tailscale', 'vpn', 'wireguard', 'mesh', 'network'], icon: SiTailscale },

  // ── Databases & Storage ──
  { key: 'FiDatabase', name: 'Database', category: 'database', keywords: ['database', 'db', 'sql', 'storage', 'data'], icon: FiDatabase },
  { key: 'SiPostgresql', name: 'PostgreSQL', category: 'database', keywords: ['postgres', 'postgresql', 'sql', 'relational', 'db'], icon: SiPostgresql },
  { key: 'SiMysql', name: 'MySQL', category: 'database', keywords: ['mysql', 'sql', 'mariadb'], icon: SiMysql },
  { key: 'SiRedis', name: 'Redis', category: 'database', keywords: ['redis', 'cache', 'keyvalue', 'inmemory'], icon: SiRedis },
  { key: 'SiMongodb', name: 'MongoDB', category: 'database', keywords: ['mongo', 'mongodb', 'nosql', 'document'], icon: SiMongodb },
  { key: 'SiSupabase', name: 'Supabase', category: 'database', keywords: ['supabase', 'postgres', 'baas', 'auth'], icon: SiSupabase },
  { key: 'SiFirebase', name: 'Firebase', category: 'database', keywords: ['firebase', 'firestore', 'google', 'realtime'], icon: SiFirebase },
  { key: 'SiPlanetscale', name: 'PlanetScale', category: 'database', keywords: ['planetscale', 'mysql', 'vitess'], icon: SiPlanetscale },
  { key: 'SiElasticsearch', name: 'Elasticsearch', category: 'database', keywords: ['elastic', 'elasticsearch', 'search', 'elk'], icon: SiElasticsearch },
  { key: 'SiClickhouse', name: 'ClickHouse', category: 'database', keywords: ['clickhouse', 'olap', 'analytics', 'columnar'], icon: SiClickhouse },
  { key: 'SiSnowflake', name: 'Snowflake', category: 'database', keywords: ['snowflake', 'warehouse', 'data', 'analytics'], icon: SiSnowflake },
  { key: 'SiDatabricks', name: 'Databricks', category: 'database', keywords: ['databricks', 'spark', 'lakehouse'], icon: SiDatabricks },
  { key: 'SiDropbox', name: 'Dropbox', category: 'database', keywords: ['dropbox', 'storage', 'files', 'cloud'], icon: SiDropbox },
  { key: 'SiBox', name: 'Box', category: 'database', keywords: ['box', 'storage', 'files'], icon: SiBox },

  // ── Security & Authentication ──
  { key: 'FiShield', name: 'Shield / Security', category: 'security', keywords: ['shield', 'security', 'firewall', 'protection', 'safe'], icon: FiShield },
  { key: 'FiLock', name: 'Lock / Encryption', category: 'security', keywords: ['lock', 'auth', 'ssl', 'tls', 'crypto', 'private'], icon: FiLock },
  { key: 'FiKey', name: 'Access Key', category: 'security', keywords: ['key', 'token', 'secret', 'apikey', 'credential'], icon: FiKey },
  { key: 'SiVault', name: 'HashiCorp Vault', category: 'security', keywords: ['vault', 'hashicorp', 'secrets', 'pki'], icon: SiVault },
  { key: 'SiAuth0', name: 'Auth0', category: 'security', keywords: ['auth0', 'sso', 'oauth', 'jwt', 'identity'], icon: SiAuth0 },
  { key: 'SiOkta', name: 'Okta', category: 'security', keywords: ['okta', 'identity', 'sso', 'saml'], icon: SiOkta },
  { key: 'SiClerk', name: 'Clerk', category: 'security', keywords: ['clerk', 'auth', 'user', 'session'], icon: SiClerk },
  { key: 'SiBitwarden', name: 'Bitwarden', category: 'security', keywords: ['bitwarden', 'passwords', 'vault'], icon: SiBitwarden },

  // ── APIs, Messaging & AI ──
  { key: 'FiZap', name: 'Fast API / Webhook', category: 'api_ai', keywords: ['zap', 'fast', 'webhook', 'trigger', 'api', 'event'], icon: FiZap },
  { key: 'FiRadio', name: 'Broadcaster / Stream', category: 'api_ai', keywords: ['radio', 'stream', 'broadcast', 'websocket', 'pubsub'], icon: FiRadio },
  { key: 'FiSend', name: 'Messaging / Push', category: 'api_ai', keywords: ['send', 'message', 'push', 'notification', 'chat'], icon: FiSend },
  { key: 'FiMail', name: 'Email Service', category: 'api_ai', keywords: ['mail', 'email', 'smtp', 'inbox'], icon: FiMail },
  { key: 'SiOpenai', name: 'OpenAI', category: 'api_ai', keywords: ['openai', 'chatgpt', 'gpt4', 'llm', 'ai'], icon: SiOpenai },
  { key: 'SiAnthropic', name: 'Anthropic', category: 'api_ai', keywords: ['anthropic', 'claude', 'llm', 'ai'], icon: SiAnthropic },
  { key: 'SiHuggingface', name: 'Hugging Face', category: 'api_ai', keywords: ['huggingface', 'models', 'ml', 'ai'], icon: SiHuggingface },
  { key: 'SiStripe', name: 'Stripe', category: 'api_ai', keywords: ['stripe', 'payments', 'billing', 'creditcard', 'checkout'], icon: SiStripe },
  { key: 'SiTwilio', name: 'Twilio', category: 'api_ai', keywords: ['twilio', 'sms', 'voice', 'phone', 'otp'], icon: SiTwilio },
  { key: 'SiSendgrid', name: 'SendGrid', category: 'api_ai', keywords: ['sendgrid', 'email', 'smtp', 'transactional'], icon: SiSendgrid },
  { key: 'SiResend', name: 'Resend', category: 'api_ai', keywords: ['resend', 'email', 'api', 'react-email'], icon: SiResend },
  { key: 'SiRabbitmq', name: 'RabbitMQ', category: 'api_ai', keywords: ['rabbitmq', 'amqp', 'queue', 'broker', 'message'], icon: SiRabbitmq },
  { key: 'SiApachekafka', name: 'Apache Kafka', category: 'api_ai', keywords: ['kafka', 'stream', 'event', 'pipeline', 'queue'], icon: SiApachekafka },
  { key: 'SiPosthog', name: 'PostHog', category: 'api_ai', keywords: ['posthog', 'analytics', 'telemetry', 'product'], icon: SiPosthog },

  // ── DevOps, Containers & Languages ──
  { key: 'FiCode', name: 'Source Code', category: 'devops', keywords: ['code', 'source', 'git', 'repo', 'dev'], icon: FiCode },
  { key: 'FiBox', name: 'Package / Container', category: 'devops', keywords: ['box', 'package', 'container', 'npm', 'artifact'], icon: FiBox },
  { key: 'FiTool', name: 'Build Tools', category: 'devops', keywords: ['tool', 'build', 'compile', 'utility'], icon: FiTool },
  { key: 'SiDocker', name: 'Docker', category: 'devops', keywords: ['docker', 'container', 'image', 'compose'], icon: SiDocker },
  { key: 'SiKubernetes', name: 'Kubernetes', category: 'devops', keywords: ['k8s', 'kubernetes', 'cluster', 'orchestration'], icon: SiKubernetes },
  { key: 'SiTerraform', name: 'Terraform', category: 'devops', keywords: ['terraform', 'iac', 'hashicorp', 'infra'], icon: SiTerraform },
  { key: 'SiGithub', name: 'GitHub', category: 'devops', keywords: ['github', 'git', 'actions', 'ci'], icon: SiGithub },
  { key: 'SiGitlab', name: 'GitLab', category: 'devops', keywords: ['gitlab', 'git', 'ci', 'devops'], icon: SiGitlab },
  { key: 'SiBitbucket', name: 'Bitbucket', category: 'devops', keywords: ['bitbucket', 'atlassian', 'git'], icon: SiBitbucket },
  { key: 'SiNginx', name: 'Nginx', category: 'devops', keywords: ['nginx', 'proxy', 'reverseproxy', 'loadbalancer'], icon: SiNginx },
  { key: 'SiApache', name: 'Apache', category: 'devops', keywords: ['apache', 'httpd', 'server'], icon: SiApache },
  { key: 'SiPrisma', name: 'Prisma ORM', category: 'devops', keywords: ['prisma', 'orm', 'schema'], icon: SiPrisma },
  { key: 'SiNodedotjs', name: 'Node.js', category: 'devops', keywords: ['node', 'nodejs', 'javascript', 'backend'], icon: SiNodedotjs },
  { key: 'SiPython', name: 'Python', category: 'devops', keywords: ['python', 'py', 'django', 'fastapi'], icon: SiPython },
  { key: 'SiGo', name: 'Go', category: 'devops', keywords: ['go', 'golang'], icon: SiGo },
  { key: 'SiRust', name: 'Rust', category: 'devops', keywords: ['rust', 'cargo'], icon: SiRust },
  { key: 'SiDeno', name: 'Deno', category: 'devops', keywords: ['deno', 'typescript', 'runtime'], icon: SiDeno },
  { key: 'SiBun', name: 'Bun', category: 'devops', keywords: ['bun', 'runtime', 'fast'], icon: SiBun },
  { key: 'SiFastapi', name: 'FastAPI', category: 'devops', keywords: ['fastapi', 'python', 'api'], icon: SiFastapi },
  { key: 'SiReact', name: 'React', category: 'devops', keywords: ['react', 'nextjs', 'frontend'], icon: SiReact },
  { key: 'SiVuedotjs', name: 'Vue.js', category: 'devops', keywords: ['vue', 'vuejs', 'frontend'], icon: SiVuedotjs },
  { key: 'SiAngular', name: 'Angular', category: 'devops', keywords: ['angular', 'frontend', 'google', 'ts', 'framework'], icon: SiAngular },
  { key: 'SiSvelte', name: 'Svelte', category: 'devops', keywords: ['svelte', 'sveltekit'], icon: SiSvelte },

  // ── Productivity, Monitoring & SaaS ──
  { key: 'FiActivity', name: 'Activity / Health', category: 'tools', keywords: ['activity', 'pulse', 'health', 'status', 'monitor', 'uptime'], icon: FiActivity },
  { key: 'FiSliders', name: 'Configuration', category: 'tools', keywords: ['sliders', 'settings', 'config', 'flags'], icon: FiSliders },
  { key: 'FiLink', name: 'Integration / Webhook', category: 'tools', keywords: ['link', 'integration', 'connect', 'url'], icon: FiLink },
  { key: 'SiSentry', name: 'Sentry', category: 'tools', keywords: ['sentry', 'errors', 'monitoring', 'logs'], icon: SiSentry },
  { key: 'SiDatadog', name: 'Datadog', category: 'tools', keywords: ['datadog', 'apm', 'metrics', 'monitoring'], icon: SiDatadog },
  { key: 'SiGrafana', name: 'Grafana', category: 'tools', keywords: ['grafana', 'dashboards', 'metrics'], icon: SiGrafana },
  { key: 'SiPrometheus', name: 'Prometheus', category: 'tools', keywords: ['prometheus', 'metrics', 'alerts'], icon: SiPrometheus },
  { key: 'SiNewrelic', name: 'New Relic', category: 'tools', keywords: ['newrelic', 'apm', 'observability'], icon: SiNewrelic },
  { key: 'SiSlack', name: 'Slack', category: 'tools', keywords: ['slack', 'chat', 'comms', 'channel'], icon: SiSlack },
  { key: 'SiDiscord', name: 'Discord', category: 'tools', keywords: ['discord', 'bot', 'chat', 'community'], icon: SiDiscord },
  { key: 'SiLinear', name: 'Linear', category: 'tools', keywords: ['linear', 'issues', 'tasks'], icon: SiLinear },
  { key: 'SiJira', name: 'Jira', category: 'tools', keywords: ['jira', 'atlassian', 'tickets'], icon: SiJira },
  { key: 'SiNotion', name: 'Notion', category: 'tools', keywords: ['notion', 'docs', 'wiki'], icon: SiNotion },
  { key: 'SiFigma', name: 'Figma', category: 'tools', keywords: ['figma', 'design', 'ui'], icon: SiFigma },
  { key: 'SiShopify', name: 'Shopify', category: 'tools', keywords: ['shopify', 'ecommerce', 'store'], icon: SiShopify },
  { key: 'SiWordpress', name: 'WordPress', category: 'tools', keywords: ['wordpress', 'cms', 'blog'], icon: SiWordpress },
  { key: 'SiMailchimp', name: 'Mailchimp', category: 'tools', keywords: ['mailchimp', 'newsletter', 'marketing'], icon: SiMailchimp },
  { key: 'SiHubspot', name: 'HubSpot', category: 'tools', keywords: ['hubspot', 'crm', 'sales'], icon: SiHubspot },
  { key: 'SiSalesforce', name: 'Salesforce', category: 'tools', keywords: ['salesforce', 'crm', 'enterprise'], icon: SiSalesforce },
  { key: 'SiIntercom', name: 'Intercom', category: 'tools', keywords: ['intercom', 'support', 'chat'], icon: SiIntercom },
  { key: 'SiZendesk', name: 'Zendesk', category: 'tools', keywords: ['zendesk', 'support', 'helpdesk'], icon: SiZendesk },
];

// Build backwards-compatible map of all keys
export const CUSTOM_SERVICE_ICON_MAP: Record<string, IconType> = {
  // Legacy FontAwesome icons
  FaAws, FaAmazon, FaMicrosoft, FaLinkedin, FaTwitter,
  // All defined icons
  ...SERVICE_ICON_DEFINITIONS.reduce((acc, item) => {
    acc[item.key] = item.icon;
    return acc;
  }, {} as Record<string, IconType>),
  // Extra brand fallbacks
  SiApple, SiFacebook, SiInstagram, SiTrello, SiPhp, SiRuby,
};

export const CUSTOM_SERVICE_ICON_KEYS = Object.keys(CUSTOM_SERVICE_ICON_MAP);

export interface CustomServiceIconProps {
  iconKey: string;
  serviceName?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const CustomServiceIcon: React.FC<CustomServiceIconProps> = ({ iconKey, serviceName, size = 14, color, style }) => {
  // Monogram / Initials badge mode: 'mono:XX' or 'monogram:XX'
  if (iconKey && (iconKey.startsWith('mono:') || iconKey.startsWith('monogram:'))) {
    const raw = iconKey.includes(':') ? iconKey.split(':')[1] : '';
    const initials = (raw || (serviceName ? serviceName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) : 'SV')).slice(0, 3).toUpperCase();
    return (
      <div
        style={{
          width: size + 4,
          height: size + 4,
          display: 'grid',
          placeItems: 'center',
          background: color ? `${color}18` : 'var(--color-surface-3)',
          border: `1px solid ${color ? `${color}55` : 'var(--color-border)'}`,
          color: color || 'var(--color-text)',
          fontSize: Math.max(8.5, Math.round(size * 0.52)),
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
          userSelect: 'none',
          boxSizing: 'border-box',
          flexShrink: 0,
          ...style,
        }}
        title={`Custom Monogram: ${initials}`}
      >
        {initials}
      </div>
    );
  }

  const Icon = CUSTOM_SERVICE_ICON_MAP[iconKey] ?? FiLayers;
  return <Icon size={size} color={color} style={style} />;
};
