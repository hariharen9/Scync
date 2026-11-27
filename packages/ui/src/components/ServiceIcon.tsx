import React from 'react';
import {
  SiGithub, SiGoogle, SiStripe, SiOpenai, SiVercel, SiSupabase,
  SiCloudflare, SiTwilio, SiNetlify, SiRailway, SiPlanetscale,
  SiSendgrid, SiHuggingface, SiAnthropic, SiFirebase,
  SiDigitalocean, SiGitlab, SiSlack, SiGooglegemini, SiPerplexity,
  SiReplicate, SiElevenlabs, SiFlydotio, SiRender, SiHetzner,
  SiUpstash, SiMongodb, SiRedis, SiPostgresql, SiClerk, SiAuth0,
  SiLemonsqueezy, SiResend, SiDiscord, SiLinear, SiNotion, SiFigma,
  SiDocker, SiNpm, SiSentry, SiDatadog, SiPosthog, SiGrafana,
  SiTerraform, SiAlgolia, SiMapbox, SiGooglecloud,
} from 'react-icons/si';
import { FiLayers, FiDatabase, FiZap, FiCpu, FiMail } from 'react-icons/fi';
import { FaAws, FaMicrosoft } from 'react-icons/fa';

interface ServiceIconProps {
  service: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ service, size = 16, className, style }) => {
  const props = { size, className, style };

  switch (service) {
    // AI & LLMs
    case 'OpenAI':       return <SiOpenai {...props} />;
    case 'Anthropic':    return <SiAnthropic {...props} />;
    case 'Google':       return <SiGoogle {...props} />;
    case 'Gemini':       return <SiGooglegemini {...props} />;
    case 'OpenRouter':   return <FiZap {...props} />;
    case 'Groq':         return <FiZap {...props} />;
    case 'Mistral':      return <FiCpu {...props} />;
    case 'Cohere':       return <FiCpu {...props} />;
    case 'Perplexity':   return <SiPerplexity {...props} />;
    case 'xAI':          return <FiZap {...props} />;
    case 'DeepSeek':     return <FiCpu {...props} />;
    case 'Replicate':    return <SiReplicate {...props} />;
    case 'HuggingFace':  return <SiHuggingface {...props} />;
    case 'ElevenLabs':   return <SiElevenlabs {...props} />;

    // Cloud & Hosting
    case 'AWS':          return <FaAws {...props} />;
    case 'Azure':        return <FaMicrosoft {...props} />;
    case 'GCP':          return <SiGooglecloud {...props} />;
    case 'Cloudflare':   return <SiCloudflare {...props} />;
    case 'DigitalOcean': return <SiDigitalocean {...props} />;
    case 'Vercel':       return <SiVercel {...props} />;
    case 'Netlify':      return <SiNetlify {...props} />;
    case 'Railway':      return <SiRailway {...props} />;
    case 'Fly.io':       return <SiFlydotio {...props} />;
    case 'Render':       return <SiRender {...props} />;
    case 'Hetzner':      return <SiHetzner {...props} />;

    // Databases & Caching
    case 'Supabase':     return <SiSupabase {...props} />;
    case 'Firebase':     return <SiFirebase {...props} />;
    case 'Neon':         return <FiDatabase {...props} />;
    case 'PlanetScale':  return <SiPlanetscale {...props} />;
    case 'Turso':        return <FiDatabase {...props} />;
    case 'Upstash':      return <SiUpstash {...props} />;
    case 'MongoDB':      return <SiMongodb {...props} />;
    case 'Redis':        return <SiRedis {...props} />;
    case 'PostgreSQL':   return <SiPostgresql {...props} />;

    // Auth, Payments & Comms
    case 'Clerk':        return <SiClerk {...props} />;
    case 'Auth0':        return <SiAuth0 {...props} />;
    case 'Stripe':       return <SiStripe {...props} />;
    case 'LemonSqueezy': return <SiLemonsqueezy {...props} />;
    case 'Resend':       return <SiResend {...props} />;
    case 'SendGrid':     return <SiSendgrid {...props} />;
    case 'Postmark':     return <FiMail {...props} />;
    case 'Twilio':       return <SiTwilio {...props} />;
    case 'Slack':        return <SiSlack {...props} />;
    case 'Discord':      return <SiDiscord {...props} />;

    // DevTools, Product & Observability
    case 'GitHub':       return <SiGithub {...props} />;
    case 'GitLab':       return <SiGitlab {...props} />;
    case 'Docker':       return <SiDocker {...props} />;
    case 'npm':          return <SiNpm {...props} />;
    case 'Linear':       return <SiLinear {...props} />;
    case 'Notion':       return <SiNotion {...props} />;
    case 'Figma':        return <SiFigma {...props} />;
    case 'Sentry':       return <SiSentry {...props} />;
    case 'Datadog':      return <SiDatadog {...props} />;
    case 'PostHog':      return <SiPosthog {...props} />;
    case 'Grafana':      return <SiGrafana {...props} />;
    case 'Terraform':    return <SiTerraform {...props} />;
    case 'Algolia':      return <SiAlgolia {...props} />;
    case 'Mapbox':       return <SiMapbox {...props} />;

    case 'Other':        return <FiLayers {...props} />;
    default:             return <FiCpu {...props} />;
  }
};
