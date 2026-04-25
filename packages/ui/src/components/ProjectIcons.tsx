import React from 'react';
import {
  FiFolder, FiGlobe, FiServer, FiDatabase, FiCode, FiTerminal,
  FiShield, FiKey, FiLock, FiUnlock, FiCloud, FiCpu,
  FiPackage, FiBox, FiGrid, FiLayers, FiZap, FiActivity,
  FiGitBranch, FiGithub, FiGitCommit, FiGitMerge,
  FiMonitor, FiSmartphone, FiTablet, FiHardDrive,
  FiWifi, FiLink, FiAnchor, FiCompass, FiMap, FiNavigation,
  FiMail, FiMessageSquare, FiSlack, FiSend,
  FiDollarSign, FiCreditCard, FiTrendingUp, FiBarChart2,
  FiSettings, FiTool, FiSliders, FiToggleLeft,
  FiHome, FiUser, FiUsers, FiBriefcase,
  FiStar, FiFlag, FiBookmark, FiTag, FiHash,
  FiFileText, FiFile, FiArchive, FiInbox,
  FiEye, FiSearch, FiBell, FiAlertTriangle,
  FiPlayCircle, FiVideo, FiImage, FiMusic,
  FiSun, FiMoon, FiDroplet, FiFeather,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import type { ProjectColor } from '@scync/core';

export const PROJECT_COLOR_MAP: Record<ProjectColor, string> = {
  violet: '#7c6af7', blue: '#3b82f6', green: '#10b981',
  orange: '#f59e0b', red: '#ef4444', pink: '#ec4899',
  yellow: '#eab308', gray: '#6b7280',
};

export const PROJECT_ICON_MAP: Record<string, IconType> = {
  // Folders & Organization
  FiFolder, FiArchive, FiInbox, FiBox, FiPackage, FiLayers, FiGrid,

  // Code & Dev
  FiCode, FiTerminal, FiCpu, FiGitBranch, FiGithub, FiGitCommit, FiGitMerge,

  // Security
  FiShield, FiKey, FiLock, FiUnlock, FiEye,

  // Infrastructure
  FiServer, FiDatabase, FiCloud, FiHardDrive, FiGlobe,

  // Networking & Links
  FiWifi, FiLink, FiAnchor, FiNavigation, FiCompass, FiMap,

  // Devices
  FiMonitor, FiSmartphone, FiTablet,

  // Communication
  FiMail, FiMessageSquare, FiSend, FiSlack,

  // Finance
  FiDollarSign, FiCreditCard, FiTrendingUp, FiBarChart2,

  // Settings & Tools
  FiSettings, FiTool, FiSliders, FiToggleLeft, FiZap, FiActivity,

  // People & Work
  FiHome, FiUser, FiUsers, FiBriefcase,

  // Metadata & Tagging
  FiStar, FiFlag, FiBookmark, FiTag, FiHash, FiSearch, FiBell, FiAlertTriangle,

  // Docs
  FiFileText, FiFile,

  // Media
  FiPlayCircle, FiVideo, FiImage, FiMusic,

  // Misc
  FiSun, FiMoon, FiDroplet, FiFeather,
};

export const PROJECT_ICON_KEYS = Object.keys(PROJECT_ICON_MAP);

interface ProjectIconProps {
  iconKey: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({ iconKey, size = 14, color, style }) => {
  const Icon = PROJECT_ICON_MAP[iconKey] ?? FiFolder;
  return <Icon size={size} color={color} style={style} />;
};
