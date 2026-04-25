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
} from 'react-icons/si';
import { FaAws, FaAmazon, FaMicrosoft, FaLinkedin, FaTwitter } from 'react-icons/fa';

export const CUSTOM_SERVICE_ICON_MAP: Record<string, IconType> = {
  // Cloud & Infrastructure
  FaAws, FaAmazon, SiGoogle, FaMicrosoft, SiDigitalocean, SiHeroku, SiVercel, SiNetlify, SiRailway, SiCloudflare,

  // Databases & Backend
  SiSupabase, SiFirebase, SiPlanetscale, SiMongodb, SiPostgresql, SiRedis, SiMysql,

  // DevOps & Containers
  SiDocker, SiKubernetes, SiGitlab, SiBitbucket, SiGithub,

  // AI & ML
  SiOpenai, SiAnthropic, SiHuggingface,

  // APIs & Services
  SiStripe, SiTwilio, SiSendgrid, SiMailchimp,

  // Social & Comms
  SiSlack, SiDiscord, FaTwitter, FaLinkedin, SiFacebook, SiInstagram,

  // Productivity & Design
  SiTrello, SiJira, SiNotion, SiFigma, SiLinear,

  // Monitoring
  SiSentry, SiDatadog, SiNewrelic,

  // CMS & E-commerce
  SiWordpress, SiShopify, SiSalesforce, SiHubspot, SiZendesk, SiIntercom,

  // Storage
  SiDropbox, SiBox, SiApple,

  // Frameworks & Langs (often used as service/project tags)
  SiReact, SiVuedotjs, SiAngular, SiSvelte, SiNodedotjs, SiPython, SiGo, SiRust, SiPhp, SiRuby, SiFastapi,
};

export const CUSTOM_SERVICE_ICON_KEYS = Object.keys(CUSTOM_SERVICE_ICON_MAP);

interface CustomServiceIconProps {
  iconKey: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const CustomServiceIcon: React.FC<CustomServiceIconProps> = ({ iconKey, size = 14, color, style }) => {
  const Icon = CUSTOM_SERVICE_ICON_MAP[iconKey] ?? FaAmazon; // Fallback
  return <Icon size={size} color={color} style={style} />;
};
