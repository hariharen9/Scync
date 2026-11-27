import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useVaultStore } from '../stores/vaultStore';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { getAttentionSecrets, SERVICE_COLORS, generateTOTPCode, getRemainingSeconds } from '@scync/core';
import type { StoredSecret } from '@scync/core';
import {
  FiAlertTriangle, FiRefreshCw, FiPlus, FiKey,
  FiUploadCloud, FiFolder, FiChevronRight,
  FiActivity, FiLayers, FiGlobe, FiLock, FiTerminal, FiShield, FiCopy, FiCheck, FiAward, FiCommand,
} from 'react-icons/fi';
import { ProjectIcon, PROJECT_COLOR_MAP } from './ProjectIcons';
import { ServiceIcon } from './ServiceIcon';
import { VaultLedger } from './VaultLedger';
import { useClipboard } from '../hooks/useClipboard';

const ENV_COLORS: Record<string, string> = {
  'Production': '#ef4444', 'Staging': '#f59e0b', 'Development': '#3b82f6',
  'Work': '#60a5fa', 'Personal': '#8b5cf6', 'Local': '#71717a',
  'Testing': '#10b981', 'CI/CD': '#6366f1',
};

const TYPE_COLORS: Record<string, string> = {
  'API Key': '#10b981', 'Personal Access Token': '#60a5fa', 'OAuth Token': '#f59e0b',
  'OAuth Client Secret': '#f97316', 'Recovery Codes': '#ef4444', 'Recovery Phrase': '#f59e0b', 'Secret Key': '#34d399',
  'Webhook Secret': '#a78bfa', 'Service Account JSON': '#fbbf24',
  'Database URL': '#ec4899', 'License Key': '#06b6d4', 'Passphrase': '#f59e0b',
  'Secret Note': '#f43f5e', 'Password': '#8b5cf6', 'Other': '#64748b',
};

const panelStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  padding: 20,
};

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--color-text-2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontFamily: 'var(--font-mono)',
  marginBottom: 14,
};

const HBar: React.FC<{ label: string; count: number; max: number; total: number; color: string; icon?: React.ReactNode }> = ({ label, count, max, total, color, icon }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 28 }}>
      <div style={{ width: 130, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7, flexShrink: 0, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-sans)' }}>
          {label}
        </span>
        {icon && <span style={{ color, flexShrink: 0, display: 'inline-flex' }}>{icon}</span>}
      </div>
      <div style={{ flex: 1, height: 6, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max((count / max) * 100, 3)}%` }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', background: color }}
        />
      </div>
      <div style={{ width: 64, display: 'flex', justifyContent: 'flex-end', gap: 8, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{count}</span>
        <span style={{ fontSize: 10.5, color: 'var(--color-text-3)', width: 32, textAlign: 'right' }}>{pct}%</span>
      </div>
    </div>
  );
};

const EnvRing: React.FC<{ data: { label: string; count: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) return null;
  const r = 46;
  const c = 2 * Math.PI * r;
  let cumOffset = 0;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 28, padding: '6px 0' }}>
      <svg width="118" height="118" viewBox="0 0 118 118" style={{ flexShrink: 0 }}>
        <circle cx="59" cy="59" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
        {data.map((d, i) => {
          const f = d.count / total;
          const dl = f * c;
          const doff = -cumOffset;
          cumOffset += dl;
          return (
            <motion.circle
              key={d.label}
              cx="59"
              cy="59"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="8"
              strokeDasharray={`${dl} ${c - dl}`}
              strokeDashoffset={doff}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          );
        })}
        <text x="59" y="55" textAnchor="middle" dominantBaseline="middle" fill="var(--color-text)" fontSize="22" fontWeight="800" fontFamily="var(--font-mono)">
          {total}
        </text>
        <text x="59" y="73" textAnchor="middle" dominantBaseline="middle" fill="var(--color-text-3)" fontSize="8" fontWeight="700" fontFamily="var(--font-mono)" letterSpacing="0.8">
          SECRETS
        </text>
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px 20px', flex: 1 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div style={{ width: 7, height: 7, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{d.label}</span>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text)', marginLeft: 'auto' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{ secret: StoredSecret; isLast: boolean; onSelect: () => void }> = ({ secret, isLast, onSelect }) => {
  const relative = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };
  const wasUpdated = secret.updatedAt.getTime() - secret.createdAt.getTime() > 60000;

  return (
    <div onClick={onSelect} style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
        <div style={{ width: 6, height: 6, background: wasUpdated ? 'var(--color-amber)' : 'var(--color-green)', flexShrink: 0 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--color-border)', marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 12, minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {secret.name}
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            padding: '1px 5px',
            fontFamily: 'var(--font-mono)',
            background: wasUpdated ? 'var(--color-amber-bg)' : 'var(--color-green-bg)',
            color: wasUpdated ? 'var(--color-amber)' : 'var(--color-green)',
            flexShrink: 0,
          }}>
            {wasUpdated ? 'Updated' : 'Created'}
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--color-text-3)', marginTop: 2, display: 'block', fontFamily: 'var(--font-mono)' }}>
          {relative(secret.updatedAt)} · {secret.service}
        </span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { storedSecrets, storedPasswords, storedSSHKeys, storedTOTPs, storedCertificates, vaultMeta, decryptTOTP } = useVaultStore();
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { openAddModal, openEnvImportModal, openAddProjectModal, openAddTOTPModal, openAddSSHModal, setActiveView, setSortState, clearFilters, openRecoveryKitModal, selectSecret, openCommandBar } = useUIStore();
  const { copy } = useClipboard();

  const [analyticsTab, setAnalyticsTab] = useState<'services' | 'environments' | 'types'>('services');
  const [liveCodes, setLiveCodes] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const totpCache = React.useRef<Map<string, any>>(new Map());

  React.useEffect(() => {
    const decrypt = async () => {
      for (const t of storedTOTPs.slice(0, 3)) {
        if (!totpCache.current.has(t.id)) {
          const dec = await decryptTOTP(t.id);
          if (dec) totpCache.current.set(t.id, dec);
        }
      }
    };
    decrypt();
  }, [storedTOTPs, decryptTOTP]);

  React.useEffect(() => {
    const tick = () => {
      const codes: any[] = [];
      totpCache.current.forEach((dec) => {
        try {
          const code = generateTOTPCode(dec);
          const remaining = getRemainingSeconds(dec.period);
          codes.push({ id: dec.id, code, remaining, period: dec.period || 30, issuer: dec.issuer });
        } catch {
          // ignore
        }
      });
      setLiveCodes(codes);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleCopy = (val: string, id: string) => {
    copy(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
  };

  const serviceColorMap = useMemo(() => {
    const map: Record<string, string> = { ...SERVICE_COLORS };
    customServices.forEach(s => { map[s.name] = PROJECT_COLOR_MAP[s.color] ?? '#10b981'; });
    return map;
  }, [customServices]);

  const attention = useMemo(() => getAttentionSecrets(storedSecrets), [storedSecrets]);
  const activeCount = storedSecrets.filter(s => s.status === 'Active').length;

  const vaultScore = useMemo(() => {
    if (storedSecrets.length === 0) return 100;
    let score = 100;
    const total = storedSecrets.length;
    score -= Math.min(40, (attention.expired.length / total) * 80);
    score -= Math.min(25, (attention.expiringSoon.length / total) * 50);
    score -= Math.min(20, (attention.rotationOverdue.length / total) * 40);
    score -= Math.min(25, (attention.recoveryCodesLow.length / total) * 50);
    const revokedOrExpired = storedSecrets.filter(s => s.status === 'Expired' || s.status === 'Revoked').length;
    score -= Math.min(15, (revokedOrExpired / total) * 30);
    return Math.max(0, Math.round(score));
  }, [storedSecrets, attention]);

  const serviceBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    storedSecrets.forEach(s => { m[s.service] = (m[s.service] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [storedSecrets]);

  const envBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    storedSecrets.forEach(s => { m[s.environment] = (m[s.environment] || 0) + 1; });
    return Object.entries(m).map(([l, c]) => ({ label: l, count: c, color: ENV_COLORS[l] || '#64748b' }));
  }, [storedSecrets]);

  const typeBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    storedSecrets.forEach(s => { m[s.type] = (m[s.type] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [storedSecrets]);

  const recentSecrets = useMemo(() => [...storedSecrets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5), [storedSecrets]);
  const projectStats = useMemo(() => projects.map(p => ({ ...p, secretCount: storedSecrets.filter(s => s.projectId === p.id).length })), [projects, storedSecrets]);
  const uncategorized = storedSecrets.filter(s => !s.projectId).length;

  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; })();
  const maxService = serviceBreakdown.length > 0 ? serviceBreakdown[0][1] : 1;
  const maxType = typeBreakdown.length > 0 ? typeBreakdown[0][1] : 1;
  const attentionItems = [...attention.expired, ...attention.expiringSoon, ...attention.rotationOverdue, ...attention.recoveryCodesLow];
  const scoreColor = vaultScore >= 80 ? 'var(--color-green)' : vaultScore >= 50 ? 'var(--color-amber)' : 'var(--color-red)';
  const scoreLabel = vaultScore >= 80 ? 'ALL CLEAR' : vaultScore >= 50 ? 'NEEDS ATTENTION' : 'CRITICAL';

  const domainStrip = [
    { id: 'all' as const, label: 'Secrets', count: storedSecrets.length, icon: FiKey, color: 'var(--color-green)', sub: `${activeCount} active` },
    { id: 'passwords' as const, label: 'Passwords', count: storedPasswords.length, icon: FiLock, color: '#60a5fa', sub: 'Logins' },
    { id: 'ssh' as const, label: 'SSH Keys', count: storedSSHKeys.length, icon: FiTerminal, color: '#a78bfa', sub: '.pem & Ed25519' },
    { id: 'totp' as const, label: '2FA Codes', count: storedTOTPs.length, icon: FiShield, color: '#34d399', sub: 'Authenticator' },
    { id: 'certs' as const, label: 'Certificates', count: storedCertificates.length, icon: FiAward, color: '#f59e0b', sub: 'X.509 TLS' },
    { id: 'project' as const, label: 'Projects', count: projects.length, icon: FiFolder, color: '#ec4899', sub: 'Workspaces' },
  ];

  const totalItems = storedSecrets.length + storedPasswords.length + storedSSHKeys.length + storedTOTPs.length + storedCertificates.length;

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .cockpit-strip {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
        }
        .cockpit-columns {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1120px) {
          .cockpit-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .cockpit-columns { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 600px) {
          .cockpit-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.85); }
        }
      `}</style>

      {/* ─── Command Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 9px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', animation: 'pulseDot 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green)', letterSpacing: '0.08em' }}>
              ZERO-KNOWLEDGE · AES-256-GCM
            </span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-text)', margin: 0, lineHeight: 1.1 }}>
            {greeting}. <span style={{ color: 'var(--color-green)' }}>Vault unlocked.</span>
          </h2>
          <p style={{ marginTop: 6, marginBottom: 0, fontSize: 12.5, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
            {totalItems} encrypted items across {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <button
            onClick={openCommandBar}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-2)', fontSize: 11.5, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
            title="Open Command Bar (Ctrl+K)"
          >
            <FiCommand size={12} /> Ctrl+K
          </button>
          <button
            onClick={openEnvImportModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '1px solid var(--color-border-2)', background: 'var(--color-surface)', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <FiUploadCloud size={13} /> Import .env
          </button>
          <button
            onClick={openAddProjectModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '1px solid var(--color-border-2)', background: 'var(--color-surface)', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <FiFolder size={13} /> New Project
          </button>
          <button
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <FiPlus size={14} /> Add Secret
          </button>
        </div>
      </motion.div>

      {/* ─── Recovery Kit Banner ─── */}
      {!vaultMeta?.recovery && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderLeft: '3px solid #f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          padding: '12px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
            <FiKey size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: 'var(--color-text-2)' }}>
              <strong style={{ color: 'var(--color-text)' }}>Emergency Recovery Kit not configured.</strong> Generate an offline recovery key so you never lose access to your vault.
            </div>
          </div>
          <button
            onClick={() => openRecoveryKitModal()}
            style={{ padding: '7px 14px', background: '#f59e0b', color: '#080808', border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <FiKey size={12} /> Set Up Kit
          </button>
        </div>
      )}

      {/* ─── 1. Symmetrical 6-Column Vault Inventory Strip ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
        className="cockpit-strip"
      >
        {domainStrip.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'project') {
                  if (projects[0]) {
                    useProjectStore.getState().selectProject(projects[0].id);
                    setActiveView('project');
                  } else {
                    openAddProjectModal();
                  }
                } else {
                  setActiveView(item.id);
                }
              }}
              style={{
                background: 'var(--color-surface)',
                border: 'none',
                borderTop: `2px solid ${item.color}`,
                padding: '15px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 140ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface)')}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {item.label}
                </span>
                <Icon size={13} color={item.color} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', lineHeight: 1 }}>
                  {item.count}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{item.sub}</span>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* ─── 2. Unified Security Posture & Alerts Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        style={{
          ...panelStyle,
          padding: '14px 18px',
          borderLeft: `3px solid ${scoreColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{vaultScore}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-3)' }}>/100</span>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--color-border)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: scoreColor, letterSpacing: '0.08em' }}>
                {scoreLabel}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                · VAULT HEALTH POSTURE
              </span>
            </div>
            <div style={{ width: 220, maxWidth: '100%', height: 4, background: 'var(--color-surface-2)', marginTop: 6, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${vaultScore}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: scoreColor }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {attentionItems.length === 0 ? (
            <span style={{ fontSize: 11.5, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
              ✓ All secrets healthy · 0 expiring · 0 rotation due
            </span>
          ) : (
            attentionItems.slice(0, 4).map(s => {
              const isExp = attention.expired.includes(s);
              const isSoon = attention.expiringSoon.includes(s);
              const isLow = attention.recoveryCodesLow.includes(s);
              const tag = isExp ? 'EXPIRED' : isSoon ? 'EXPIRING' : isLow ? 'LOW CODES' : 'ROTATE';
              const tagColor = isExp || isLow ? 'var(--color-red)' : '#f59e0b';
              return (
                <button
                  key={s.id}
                  onClick={() => selectSecret(s.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    background: 'var(--color-bg)',
                    border: `1px solid ${tagColor}44`,
                    color: 'var(--color-text)',
                    fontSize: 11.5,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <FiAlertTriangle size={11} color={tagColor} />
                  <span>{s.name}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: tagColor }}>{tag}</span>
                </button>
              );
            })
          )}
        </div>
      </motion.div>

      {/* ─── 3. Asymmetric 2-Column Cockpit (Main Analytics/Workspaces + Sticky Quick Dock) ─── */}
      <div className="cockpit-columns">
        {/* LEFT STAGE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Unified Tabbed Analytics Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            style={panelStyle}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
              <span style={{ ...panelHeaderStyle, marginBottom: 0 }}>
                <FiActivity size={12} color="var(--color-green)" /> Vault Telemetry
              </span>
              <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg)', padding: 3, border: '1px solid var(--color-border)' }}>
                {[
                  { id: 'services' as const, label: 'Services', icon: FiLayers },
                  { id: 'environments' as const, label: 'Environments', icon: FiGlobe },
                  { id: 'types' as const, label: 'Secret Types', icon: FiLock },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = analyticsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAnalyticsTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 11px',
                        border: 'none',
                        background: active ? 'var(--color-surface-3)' : 'transparent',
                        color: active ? 'var(--color-green)' : 'var(--color-text-2)',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={11} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {storedSecrets.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: '12px 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                Add secrets to visualize service, environment, and type distribution.
              </p>
            ) : analyticsTab === 'services' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {serviceBreakdown.slice(0, 8).map(([svc, count]) => (
                  <HBar
                    key={svc}
                    label={svc}
                    count={count}
                    max={maxService}
                    total={storedSecrets.length}
                    color={serviceColorMap[svc] || '#10b981'}
                    icon={<ServiceIcon service={svc} size={12} />}
                  />
                ))}
              </div>
            ) : analyticsTab === 'environments' ? (
              <EnvRing data={envBreakdown} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {typeBreakdown.slice(0, 8).map(([type, count]) => (
                  <HBar
                    key={type}
                    label={type}
                    count={count}
                    max={maxType}
                    total={storedSecrets.length}
                    color={TYPE_COLORS[type] || '#64748b'}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
            style={panelStyle}
          >
            <div style={panelHeaderStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FiFolder size={12} color="#ec4899" /> Projects
              </span>
              <button onClick={openAddProjectModal} style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
                <FiPlus size={11} /> NEW PROJECT
              </button>
            </div>
            {projectStats.length === 0 && uncategorized === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', margin: 0, padding: '12px 0' }}>No projects yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {projectStats.map(p => {
                  const pColor = PROJECT_COLOR_MAP[p.color] || 'var(--color-green)';
                  return (
                    <div
                      key={p.id}
                      onClick={() => { useProjectStore.getState().selectProject(p.id); setActiveView('project'); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderLeft: `2px solid ${pColor}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 28, height: 28, background: `${pColor}18`, border: `1px solid ${pColor}33`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <ProjectIcon iconKey={p.icon} size={13} color={pColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{p.secretCount} secret{p.secretCount !== 1 ? 's' : ''}</div>
                      </div>
                      <FiChevronRight size={13} color="var(--color-text-3)" />
                    </div>
                  );
                })}
                {uncategorized > 0 && (
                  <div
                    onClick={() => { clearFilters(); setActiveView('all'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px dashed var(--color-border)', cursor: 'pointer' }}
                  >
                    <FiFolder size={14} color="var(--color-text-3)" />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-2)' }}>Uncategorized</div>
                      <div style={{ fontSize: 10.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{uncategorized} secrets</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Security Activity Ledger */}
          <VaultLedger limit={20} />
        </div>

        {/* RIGHT LIVE COMMAND DOCK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live 2FA Dock */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.14 }}
            style={{ ...panelStyle, borderTop: '2px solid var(--color-green)' }}
          >
            <div style={panelHeaderStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FiShield size={12} color="var(--color-green)" /> Live 2FA
              </span>
              <button onClick={() => setActiveView('totp')} style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                VIEW ALL →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liveCodes.map(c => {
                const codeColor = c.remaining <= 5 ? '#ef4444' : c.remaining <= 10 ? '#f59e0b' : 'var(--color-green)';
                const pct = Math.max(0, Math.min(100, (c.remaining / c.period) * 100));
                return (
                  <div
                    key={c.id}
                    onClick={() => handleCopy(c.code, c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <ServiceIcon service={c.issuer} size={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{c.issuer}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-mono)', color: codeColor, letterSpacing: '0.08em' }}>
                        {c.code.slice(0, 3)} {c.code.slice(3)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {copiedId === c.id ? <FiCheck size={12} color="var(--color-green)" /> : <FiCopy size={12} color="var(--color-text-3)" />}
                      <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: codeColor }}>{c.remaining}s</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: `${pct}%`, background: codeColor, transition: 'width 1s linear' }} />
                  </div>
                );
              })}
              {storedTOTPs.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>No 2FA seeds yet</span>
                  <button onClick={openAddTOTPModal} style={{ background: 'none', border: '1px solid var(--color-border-2)', color: 'var(--color-text-2)', fontSize: 10.5, padding: '4px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                    + Add
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* SSH Keys Dock */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            style={{ ...panelStyle, borderTop: '2px solid #a78bfa' }}
          >
            <div style={panelHeaderStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FiTerminal size={12} color="#a78bfa" /> SSH Keys
              </span>
              <button onClick={() => setActiveView('ssh')} style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                VIEW ALL →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {storedSSHKeys.slice(0, 3).map(k => (
                <div
                  key={k.id}
                  onClick={() => k.publicKey ? handleCopy(k.publicKey, k.id) : setActiveView('ssh')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                >
                  <FiKey size={13} color="#a78bfa" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{k.type} · {k.fingerprint.slice(0, 14)}...</div>
                  </div>
                  {k.publicKey ? (
                    copiedId === k.id ? <FiCheck size={12} color="var(--color-green)" /> : <FiCopy size={12} color="var(--color-text-3)" />
                  ) : (
                    <FiChevronRight size={13} color="var(--color-text-3)" />
                  )}
                </div>
              ))}
              {storedSSHKeys.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>No SSH keys yet</span>
                  <button onClick={() => openAddSSHModal()} style={{ background: 'none', border: '1px solid var(--color-border-2)', color: 'var(--color-text-2)', fontSize: 10.5, padding: '4px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                    + Import
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Secret Updates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            style={panelStyle}
          >
            <div style={panelHeaderStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FiRefreshCw size={12} color="var(--color-green)" /> Recent Updates
              </span>
              {storedSecrets.length > 0 && (
                <button
                  onClick={() => { clearFilters(); setSortState('updatedAt', 'desc'); setActiveView('all'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                  ALL →
                </button>
              )}
            </div>
            {recentSecrets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentSecrets.map((s, i) => (
                  <TimelineItem key={s.id} secret={s} isLast={i === recentSecrets.length - 1} onSelect={() => selectSecret(s.id)} />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: 0 }}>No recent updates.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
