import React, { useMemo } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { getAttentionSecrets } from '@scync/core';
import type { StoredSecret } from '@scync/core';
import { motion } from 'framer-motion';
import {
  FiShield, FiAlertTriangle, FiRefreshCw, FiPlus, FiKey,
  FiUploadCloud, FiFolder, FiClock, FiChevronRight,
  FiActivity, FiLayers, FiGlobe, FiLock
} from 'react-icons/fi';

// ── Color maps ──
const SERVICE_COLORS: Record<string, string> = {
  'AWS': '#f59e0b', 'GitHub': '#f0f6fc', 'Google': '#4285f4', 'Stripe': '#635bff',
  'OpenAI': '#74aa9c', 'Vercel': '#ffffff', 'Supabase': '#3ecf8e', 'Anthropic': '#d4a27f',
  'Cloudflare': '#f48120', 'HuggingFace': '#ffd21e', 'Twilio': '#f22f46', 'SendGrid': '#1a82e2',
  'Netlify': '#00c7b7', 'Railway': '#a855f7', 'PlanetScale': '#f0f0f0', 'Neon': '#00e699',
  'OpenRouter': '#9b6dff', 'Other': '#7c6af7',
};

const ENV_COLORS: Record<string, string> = {
  'Production': '#f87171', 'Staging': '#fbbf24', 'Development': '#34d399',
  'Work': '#60a5fa', 'Personal': '#a78bfa',
};

const TYPE_COLORS: Record<string, string> = {
  'API Key': '#7c6af7', 'Personal Access Token': '#60a5fa', 'OAuth Token': '#f59e0b',
  'OAuth Client Secret': '#f97316', 'Recovery Codes': '#f87171', 'Secret Key': '#34d399',
  'Webhook Secret': '#a78bfa', 'SSH Key': '#06b6d4', 'Service Account JSON': '#fbbf24',
  'Database URL': '#ec4899', 'Password': '#8b5cf6', 'Other': '#64748b',
};

// ── Shared styles ──
const sectionTitle: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#44445a', marginBottom: '1rem',
  display: 'flex', alignItems: 'center', gap: '0.5rem',
};
const cardBase: React.CSSProperties = {
  borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(18,18,28,0.7)', padding: '1.5rem',
};

// ── Vault Score Ring (SVG) ──
const VaultScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 54; const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const label = score >= 80 ? 'Healthy' : score >= 50 ? 'Needs Attention' : 'Critical';

  return (
    <div style={{ ...cardBase, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 1.75rem' }}>
      <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
        <svg width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '2rem', fontWeight: 800, color: '#ededed', lineHeight: 1 }}
          >{score}</motion.span>
          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#44445a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>/ 100</span>
        </div>
      </div>
      <div style={{ minWidth: 200, flex: 1 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color, margin: 0 }}>
          {label}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#8b8b9e', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
          {score >= 80
            ? 'All secrets are in good standing. No expired keys or overdue rotations.'
            : score >= 50
              ? 'Some secrets need your attention. Review expiring or stale keys.'
              : 'Multiple secrets are expired or need urgent rotation.'}
        </p>
      </div>
    </div>
  );
};

// ── Horizontal Bar ──
const HBar: React.FC<{ label: string; count: number; max: number; color: string }> = ({ label, count, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: 28 }}>
    <span style={{ width: 100, fontSize: '0.75rem', color: '#8b8b9e', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max((count / max) * 100, 2)}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: '100%', borderRadius: 3, background: color }}
      />
    </div>
    <span style={{ width: 28, fontSize: '0.75rem', fontWeight: 600, color: '#ededed', textAlign: 'right' }}>{count}</span>
  </div>
);

// ── Environment Ring (SVG Donut) ──
const EnvRing: React.FC<{ data: { label: string; count: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) return null;
  const r = 40; const c = 2 * Math.PI * r;
  let cumOffset = 0;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {data.map((d, i) => {
          const fraction = d.count / total;
          const dashLen = fraction * c;
          const dashOff = -cumOffset;
          cumOffset += dashLen;
          return (
            <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="8"
              strokeDasharray={`${dashLen} ${c - dashLen}`} strokeDashoffset={dashOff}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          );
        })}
        <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="#ededed" fontSize="16" fontWeight="800">{total}</text>
        <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fill="#44445a" fontSize="7" fontWeight="600" letterSpacing="0.5">TOTAL</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: '#8b8b9e' }}>{d.label}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ededed', marginLeft: 'auto' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Timeline Item ──
const TimelineItem: React.FC<{ secret: StoredSecret; isLast: boolean }> = ({ secret, isLast }) => {
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
    <div style={{ display: 'flex', gap: '0.875rem' }}>
      {/* Timeline connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.25rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: wasUpdated ? '#fbbf24' : '#7c6af7', flexShrink: 0 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: '0.25rem' }} />}
      </div>
      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : '1.25rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ededed', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {secret.name}
          </span>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '0.1rem 0.375rem', borderRadius: '0.3rem',
            background: wasUpdated ? 'rgba(251,191,36,0.1)' : 'rgba(124,106,247,0.1)',
            color: wasUpdated ? '#fbbf24' : '#7c6af7',
          }}>
            {wasUpdated ? 'Updated' : 'Created'}
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#44445a', marginTop: '0.125rem', display: 'block' }}>
          {relative(secret.updatedAt)} · {secret.service}
        </span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
// ██  DASHBOARD
// ══════════════════════════════════════════════════
export const Dashboard: React.FC = () => {
  const { storedSecrets } = useVaultStore();
  const { projects } = useProjectStore();
  const { openAddModal, openEnvImportModal, openAddProjectModal, setActiveView } = useUIStore();

  const attention = useMemo(() => getAttentionSecrets(storedSecrets), [storedSecrets]);

  // ── Derived data ──
  const activeCount = storedSecrets.filter(s => s.status === 'Active').length;

  const vaultScore = useMemo(() => {
    if (storedSecrets.length === 0) return 100;
    let score = 100;
    const total = storedSecrets.length;
    score -= Math.min(40, (attention.expired.length / total) * 80);
    score -= Math.min(25, (attention.expiringSoon.length / total) * 50);
    score -= Math.min(20, (attention.rotationOverdue.length / total) * 40);
    const revokedOrExpired = storedSecrets.filter(s => s.status === 'Expired' || s.status === 'Revoked').length;
    score -= Math.min(15, (revokedOrExpired / total) * 30);
    return Math.max(0, Math.round(score));
  }, [storedSecrets, attention]);

  const serviceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    storedSecrets.forEach(s => { map[s.service] = (map[s.service] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [storedSecrets]);

  const envBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    storedSecrets.forEach(s => { map[s.environment] = (map[s.environment] || 0) + 1; });
    return Object.entries(map).map(([label, count]) => ({
      label, count, color: ENV_COLORS[label] || '#64748b',
    }));
  }, [storedSecrets]);

  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    storedSecrets.forEach(s => { map[s.type] = (map[s.type] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [storedSecrets]);

  const recentSecrets = useMemo(() =>
    [...storedSecrets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6),
    [storedSecrets]
  );

  const projectStats = useMemo(() =>
    projects.map(p => ({
      ...p,
      secretCount: storedSecrets.filter(s => s.projectId === p.id).length,
      activeCount: storedSecrets.filter(s => s.projectId === p.id && s.status === 'Active').length,
    })),
    [projects, storedSecrets]
  );
  const uncategorized = storedSecrets.filter(s => !s.projectId).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const maxService = serviceBreakdown.length > 0 ? serviceBreakdown[0][1] : 1;
  const maxType = typeBreakdown.length > 0 ? typeBreakdown[0][1] : 1;

  const hasIssues = attention.expired.length > 0 || attention.expiringSoon.length > 0 || attention.rotationOverdue.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}
    >
      {/* ═══ HERO ═══ */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2
          className="text-3xl sm:text-4xl"
          style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#ededed', margin: 0 }}
        >
          {greeting}. <span className="gradient-text">Your vault is unlocked.</span>
        </h2>
        <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: '#8b8b9e' }}>
          {storedSecrets.length} secrets · {projects.length} projects · {activeCount} active
        </p>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginTop: '1.5rem' }}>
          <button
            onClick={openAddModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem',
              borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.20 300))',
              color: 'white', fontSize: '0.8125rem', fontWeight: 600,
            }}
          >
            <FiPlus size={15} /> Add Secret
          </button>
          <button
            onClick={openEnvImportModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem',
              borderRadius: '0.625rem', cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
              color: '#8b8b9e', fontSize: '0.8125rem', fontWeight: 500,
            }}
          >
            <FiUploadCloud size={15} /> Import .env
          </button>
          <button
            onClick={openAddProjectModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem',
              borderRadius: '0.625rem', cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
              color: '#8b8b9e', fontSize: '0.8125rem', fontWeight: 500,
            }}
          >
            <FiFolder size={15} /> New Project
          </button>
        </div>
      </div>

      {/* ═══ VAULT SCORE + STAT PILLS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
        <VaultScoreRing score={vaultScore} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Active', value: activeCount, icon: <FiKey size={16} />, color: '#34d399' },
            { label: 'Expiring Soon', value: attention.expiringSoon.length, icon: <FiAlertTriangle size={16} />, color: attention.expiringSoon.length > 0 ? '#fbbf24' : '#44445a' },
            { label: 'Rotation Due', value: attention.rotationOverdue.length, icon: <FiRefreshCw size={16} />, color: attention.rotationOverdue.length > 0 ? '#f87171' : '#44445a' },
            { label: 'Projects', value: projects.length, icon: <FiFolder size={16} />, color: '#7c6af7' },
          ].map(stat => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.1)' }}
              style={{
                ...cardBase,
                padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                cursor: 'default',
              }}
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ededed', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#44445a', marginTop: '0.25rem' }}>{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══ ATTENTION ITEMS ═══ */}
      {hasIssues && (
        <div style={{ ...cardBase, marginBottom: '2rem', padding: '1.25rem 1.5rem', border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.03)' }}>
          <div style={{ ...sectionTitle, color: '#fbbf24', marginBottom: '0.875rem' }}>
            <FiAlertTriangle size={13} /> Needs Attention
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[...attention.expired, ...attention.expiringSoon, ...attention.rotationOverdue]
              .slice(0, 5)
              .map(s => {
                const isExp = attention.expired.includes(s);
                const isSoon = attention.expiringSoon.includes(s);
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.875rem', borderRadius: '0.625rem',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: isExp ? '#f87171' : isSoon ? '#fbbf24' : '#f97316',
                    }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ededed', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.name}
                    </span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '0.15rem 0.4rem', borderRadius: '0.3rem',
                      background: isExp ? 'rgba(248,113,113,0.1)' : isSoon ? 'rgba(251,191,36,0.1)' : 'rgba(249,115,22,0.1)',
                      color: isExp ? '#f87171' : isSoon ? '#fbbf24' : '#f97316',
                    }}>
                      {isExp ? 'Expired' : isSoon ? 'Expiring' : 'Rotate'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#44445a' }}>{s.service}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ═══ SERVICE + ENVIRONMENT + TYPE (3-col grid) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {/* Service Breakdown */}
        {serviceBreakdown.length > 0 && (
          <div style={cardBase}>
            <div style={sectionTitle}><FiLayers size={12} /> Services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {serviceBreakdown.slice(0, 8).map(([svc, count]) => (
                <HBar key={svc} label={svc} count={count} max={maxService} color={SERVICE_COLORS[svc] || '#7c6af7'} />
              ))}
            </div>
          </div>
        )}

        {/* Environment Distribution */}
        {envBreakdown.length > 0 && (
          <div style={cardBase}>
            <div style={sectionTitle}><FiGlobe size={12} /> Environments</div>
            <EnvRing data={envBreakdown} />
          </div>
        )}

        {/* Type Breakdown */}
        {typeBreakdown.length > 0 && (
          <div style={cardBase}>
            <div style={sectionTitle}><FiLock size={12} /> Secret Types</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {typeBreakdown.slice(0, 8).map(([type, count]) => (
                <HBar key={type} label={type} count={count} max={maxType} color={TYPE_COLORS[type] || '#64748b'} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ PROJECTS + RECENT ACTIVITY (2-col) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {/* Project Overview */}
        <div style={cardBase}>
          <div style={{ ...sectionTitle, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiFolder size={12} /> Projects</span>
            <button
              onClick={openAddProjectModal}
              style={{ background: 'transparent', border: 'none', color: '#7c6af7', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <FiPlus size={11} /> ADD
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {projectStats.map(p => (
              <motion.div
                key={p.id}
                whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 0.875rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                }}
                onClick={() => {
                  const { selectProject } = useProjectStore.getState();
                  selectProject(p.id);
                  setActiveView('project');
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{p.icon || '📁'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ededed', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#44445a' }}>{p.secretCount} secret{p.secretCount !== 1 ? 's' : ''}</div>
                </div>
                <FiChevronRight size={14} style={{ color: '#2e2e3a' }} />
              </motion.div>
            ))}
            {uncategorized > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 0.875rem', borderRadius: '0.75rem',
                border: '1px dashed rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: '1.125rem', opacity: 0.4 }}>📂</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#44445a' }}>Uncategorized</div>
                  <div style={{ fontSize: '0.7rem', color: '#2e2e3a' }}>{uncategorized} secret{uncategorized !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            {projects.length === 0 && uncategorized === 0 && (
              <p style={{ fontSize: '0.8125rem', color: '#44445a', textAlign: 'center', padding: '1rem 0' }}>
                No projects yet. Create one to organize your secrets.
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={cardBase}>
          <div style={{ ...sectionTitle, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiActivity size={12} /> Recent Activity</span>
            {storedSecrets.length > 0 && (
              <button
                onClick={() => setActiveView('all')}
                style={{ background: 'transparent', border: 'none', color: '#7c6af7', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
              >
                VIEW ALL
              </button>
            )}
          </div>
          {recentSecrets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentSecrets.map((s, i) => (
                <TimelineItem key={s.id} secret={s} isLast={i === recentSecrets.length - 1} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: '#44445a', textAlign: 'center', padding: '2rem 0' }}>
              No activity yet. Add your first secret to get started.
            </p>
          )}
        </div>
      </div>

      {/* ═══ EMPTY STATE ═══ */}
      {storedSecrets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.08)',
            background: 'rgba(18,18,28,0.4)', padding: '5rem 2rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '1rem', background: 'rgba(124,106,247,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem',
          }}>
            <FiKey size={24} color="#7c6af7" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ededed', margin: '0 0 0.5rem 0' }}>
            Your vault is empty
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#8b8b9e', margin: '0 0 1.75rem 0', maxWidth: 320 }}>
            Add your first secret to get started. Everything is encrypted before it leaves your device.
          </p>
          <button onClick={openAddModal} className="btn-primary">
            <FiPlus size={16} /> Add Your First Secret
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};
