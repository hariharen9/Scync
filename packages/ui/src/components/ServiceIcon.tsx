import React from 'react';
import { 
  SiGithub, SiGoogle, SiStripe, SiOpenai, SiVercel, SiSupabase,
  SiCloudflare, SiTwilio, SiNetlify, SiRailway, SiPlanetscale,
  SiSendgrid, SiHuggingface, SiAnthropic, SiFirebase,
  SiDigitalocean, SiGitlab, SiSlack
} from 'react-icons/si';
import { FiLayers, FiDatabase, FiZap, FiCpu } from 'react-icons/fi';
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
    case 'AWS':         return <FaAws {...props} />;
    case 'GitHub':      return <SiGithub {...props} />;
    case 'Google':      return <SiGoogle {...props} />;
    case 'Stripe':      return <SiStripe {...props} />;
    case 'OpenAI':      return <SiOpenai {...props} />;
    case 'Vercel':      return <SiVercel {...props} />;
    case 'Supabase':    return <SiSupabase {...props} />;
    case 'Cloudflare':  return <SiCloudflare {...props} />;
    case 'Twilio':      return <SiTwilio {...props} />;
    case 'SendGrid':    return <SiSendgrid {...props} />;
    case 'Netlify':     return <SiNetlify {...props} />;
    case 'Railway':     return <SiRailway {...props} />;
    case 'PlanetScale': return <SiPlanetscale {...props} />;
    case 'Neon':        return <FiDatabase {...props} />;
    case 'Anthropic':   return <SiAnthropic {...props} />;
    case 'HuggingFace': return <SiHuggingface {...props} />;
    case 'OpenRouter':  return <FiZap {...props} />;
    case 'Firebase':    return <SiFirebase {...props} />;
    case 'Azure':       return <FaMicrosoft {...props} />;
    case 'DigitalOcean': return <SiDigitalocean {...props} />;
    case 'GitLab':      return <SiGitlab {...props} />;
    case 'Slack':       return <SiSlack {...props} />;
    case 'Other':       return <FiLayers {...props} />;
    default:            return <FiCpu {...props} />;
  }
};

