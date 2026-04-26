import React, { useMemo } from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { getAttentionSecrets } from '@scync/core';
import type { StoredSecret } from '@scync/core';
import {
  FiAlertTriangle, FiRefreshCw, FiPlus, FiKey,
  FiUploadCloud, FiFolder, FiChevronRight,
  FiActivity, FiLayers, FiGlobe, FiLock
} from 'react-icons/fi';

const SERVICE_COLORS: Record<string, string> = {
  'AWS': '#f59e0b', 'GitHub': '#f0f6fc', 'Google': '#4285f4', 'Stripe': '#635bff',
  'OpenAI': '#74aa9c', 'Vercel': '#ffffff', 'Supabase': '#3ecf8e', 'Anthropic': '#d4a27f',
  'Cloudflare': '#f48120', 'HuggingFace': '#ffd21e', 'Twilio': '#f22f46', 'SendGrid': '#1a82e2',
  'Netlify': '#00c7b7', 'Railway': '#a855f7', 'PlanetScale': '#f0f0f0', 'Neon': '#00e699',
  'OpenRouter': '#9b6dff', 'Other': '#10b981',
};
const ENV_COLORS: Record<string, string> = {
  'Production': '#ef4444', 'Staging': '#f59e0b', 'Development': '#3b82f6',
  'Work': '#60a5fa', 'Personal': '#8b5cf6',
};
const TYPE_COLORS: Record<string, string> = {
  'API Key': '#10b981', 'Personal Access Token': '#60a5fa', 'OAuth Token': '#f59e0b',
  'OAuth Client Secret': '#f97316', 'Recovery Codes': '#ef4444', 'Secret Key': '#34d399',
  'Webhook Secret': '#a78bfa', 'SSH Key': '#06b6d4', 'Service Account JSON': '#fbbf24',
  'Database URL': '#ec4899', 'Password': '#8b5cf6', 'Other': '#64748b',
};

const card: React.CSSProperties = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 20 };
const sTitle: React.CSSProperties = { fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 };

const HBar: React.FC<{ label: string; count: number; max: number; color: string }> = ({ label, count, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 24 }}>
    <span style={{ width: 90, fontSize: 11, color: 'var(--color-text-2)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    <div style={{ flex: 1, height: 4, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.max((count / max) * 100, 3)}%`, background: color, transition: 'width 600ms cubic-bezier(.16,1,.3,1)' }} />
    </div>
    <span style={{ width: 24, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-text)', textAlign: 'right' }}>{count}</span>
  </div>
);

const EnvRing: React.FC<{ data: { label: string; count: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((a, b) => a + b.count, 0);
  if (total === 0) return null;
  const r = 38; const c = 2 * Math.PI * r;
  let cumOffset = 0;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
        {data.map((d, i) => {
          const f = d.count / total; const dl = f * c; const doff = -cumOffset; cumOffset += dl;
          return <circle key={i} cx="48" cy="48" r={r} fill="none" stroke={d.color} strokeWidth="6" strokeDasharray={`${dl} ${c - dl}`} strokeDashoffset={doff} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />;
        })}
        <text x="48" y="46" textAnchor="middle" dominantBaseline="middle" fill="var(--color-text)" fontSize="18" fontWeight="800" fontFamily="var(--font-mono)">{total}</text>
        <text x="48" y="60" textAnchor="middle" dominantBaseline="middle" fill="var(--color-text-3)" fontSize="7" fontWeight="600" letterSpacing="0.5">TOTAL</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-2)' }}>{d.label}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-text)', marginLeft: 'auto' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{ secret: StoredSecret; isLast: boolean }> = ({ secret, isLast }) => {
  const relative = (date: Date) => {
    const diff = Date.now() - date.getTime(); const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24); if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };
  const wasUpdated = secret.updatedAt.getTime() - secret.createdAt.getTime() > 60000;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
        <div style={{ width: 6, height: 6, background: wasUpdated ? 'var(--color-amber)' : 'var(--color-green)', flexShrink: 0 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--color-border)', marginTop: 3 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 14, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{secret.name}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 5px', background: wasUpdated ? 'var(--color-amber-bg)' : 'var(--color-green-bg)', color: wasUpdated ? 'var(--color-amber)' : 'var(--color-green)' }}>{wasUpdated ? 'Updated' : 'Created'}</span>
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--color-text-3)', marginTop: 2, display: 'block' }}>{relative(secret.updatedAt)} · {secret.service}</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { storedSecrets } = useVaultStore();
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { openAddModal, openEnvImportModal, openAddProjectModal, setActiveView, setSortState, clearFilters } = useUIStore();

  const serviceColorMap = useMemo(() => { const map = { ...SERVICE_COLORS }; customServices.forEach(s => { map[s.name] = s.color; }); return map; }, [customServices]);
  const attention = useMemo(() => getAttentionSecrets(storedSecrets), [storedSecrets]);
  const activeCount = storedSecrets.filter(s => s.status === 'Active').length;

  const vaultScore = useMemo(() => {
    if (storedSecrets.length === 0) return 100;
    let score = 100; const total = storedSecrets.length;
    score -= Math.min(40, (attention.expired.length / total) * 80);
    score -= Math.min(25, (attention.expiringSoon.length / total) * 50);
    score -= Math.min(20, (attention.rotationOverdue.length / total) * 40);
    score -= Math.min(25, (attention.recoveryCodesLow.length / total) * 50);
    const revokedOrExpired = storedSecrets.filter(s => s.status === 'Expired' || s.status === 'Revoked').length;
    score -= Math.min(15, (revokedOrExpired / total) * 30);
    return Math.max(0, Math.round(score));
  }, [storedSecrets, attention]);

  const serviceBreakdown = useMemo(() => { const m: Record<string, number> = {}; storedSecrets.forEach(s => { m[s.service] = (m[s.service] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); }, [storedSecrets]);
  const envBreakdown = useMemo(() => { const m: Record<string, number> = {}; storedSecrets.forEach(s => { m[s.environment] = (m[s.environment] || 0) + 1; }); return Object.entries(m).map(([l, c]) => ({ label: l, count: c, color: ENV_COLORS[l] || '#64748b' })); }, [storedSecrets]);
  const typeBreakdown = useMemo(() => { const m: Record<string, number> = {}; storedSecrets.forEach(s => { m[s.type] = (m[s.type] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); }, [storedSecrets]);
  const recentSecrets = useMemo(() => [...storedSecrets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6), [storedSecrets]);
  const projectStats = useMemo(() => projects.map(p => ({ ...p, secretCount: storedSecrets.filter(s => s.projectId === p.id).length })), [projects, storedSecrets]);
  const uncategorized = storedSecrets.filter(s => !s.projectId).length;

  const greeting = (() => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; })();
  const maxService = serviceBreakdown.length > 0 ? serviceBreakdown[0][1] : 1;
  const maxType = typeBreakdown.length > 0 ? typeBreakdown[0][1] : 1;
  const hasIssues = attention.expired.length > 0 || attention.expiringSoon.length > 0 || attention.rotationOverdue.length > 0 || attention.recoveryCodesLow.length > 0;
  const scoreColor = vaultScore >= 80 ? 'var(--color-green)' : vaultScore >= 50 ? 'var(--color-amber)' : 'var(--color-red)';
  const scoreLabel = vaultScore >= 80 ? 'ALL CLEAR' : vaultScore >= 50 ? 'NEEDS ATTENTION' : 'CRITICAL';

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', animation: 'fadeUp .4s cubic-bezier(.16,1,.3,1) both' }}>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)', margin: 0 }}>
          {greeting}. <span style={{ color: 'var(--color-green)' }}>Your vault is unlocked.</span>
        </h2>
        <p style={{ marginTop: 6, fontSize: 12.5, color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
          {storedSecrets.length} secrets · {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeCount} active
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <FiPlus size={13} /> Add Secret
          </button>
          <button onClick={openEnvImportModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <FiUploadCloud size={13} /> Import .env
          </button>
          <button onClick={openAddProjectModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <FiFolder size={13} /> New Project
          </button>
        </div>
      </div>

      {/* Health Card */}
      <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{vaultScore}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--color-text-3)', opacity: 0.5 }}>/ 100</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'var(--color-border)' }} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Vault Health Score</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{scoreLabel}</div>
          <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', margin: 0, lineHeight: 1.5 }}>
            {vaultScore >= 80 ? 'All secrets are in good standing. No expired keys or overdue rotations.' : vaultScore >= 50 ? 'Some secrets need attention. Review expiring or stale keys.' : 'Multiple secrets are expired, need urgent rotation, or have low recovery codes.'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
        {[
          { label: 'Active', value: activeCount, icon: <FiKey size={14} />, color: 'var(--color-green)' },
          { label: 'Expiring Soon', value: attention.expiringSoon.length, icon: <FiAlertTriangle size={14} />, color: attention.expiringSoon.length > 0 ? 'var(--color-amber)' : 'var(--color-text-3)' },
          { label: 'Rotation Due', value: attention.rotationOverdue.length, icon: <FiRefreshCw size={14} />, color: attention.rotationOverdue.length > 0 ? 'var(--color-red)' : 'var(--color-text-3)' },
          { label: 'Projects', value: projects.length, icon: <FiFolder size={14} />, color: 'var(--color-text-2)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--color-surface)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: stat.color }}>{stat.icon}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginTop: 3 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attention */}
      {hasIssues && (
        <div style={{ ...card, marginBottom: 16, borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)' }}>
          <div style={{ ...sTitle, color: 'var(--color-amber)' }}><FiAlertTriangle size={12} /> Needs Attention</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...attention.expired, ...attention.expiringSoon, ...attention.rotationOverdue, ...attention.recoveryCodesLow].slice(0, 5).map(s => {
              const isExp = attention.expired.includes(s);
              const isSoon = attention.expiringSoon.includes(s);
              const isLowCodes = attention.recoveryCodesLow.includes(s);
              
              let badgeText = 'Rotate';
              if (isExp) badgeText = 'Expired';
              else if (isSoon) badgeText = 'Expiring';
              else if (isLowCodes) badgeText = 'Low Codes';
              
              const badgeColor = isExp || isLowCodes ? 'var(--color-red)' : isSoon ? 'var(--color-amber)' : '#f97316';
              const badgeBg = isExp || isLowCodes ? 'var(--color-red-bg)' : isSoon ? 'var(--color-amber-bg)' : 'rgba(249,115,22,0.08)';

              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <div style={{ width: 5, height: 5, flexShrink: 0, background: badgeColor }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 5px', background: badgeBg, color: badgeColor }}>{badgeText}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--color-text-3)' }}>{s.service}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
        {serviceBreakdown.length > 0 && <div style={{ ...card, border: 'none' }}><div style={sTitle}><FiLayers size={11} /> Services</div><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{serviceBreakdown.slice(0, 8).map(([svc, count]) => <HBar key={svc} label={svc} count={count} max={maxService} color={serviceColorMap[svc] || '#10b981'} />)}</div></div>}
        {envBreakdown.length > 0 && <div style={{ ...card, border: 'none' }}><div style={sTitle}><FiGlobe size={11} /> Environments</div><EnvRing data={envBreakdown} /></div>}
        {typeBreakdown.length > 0 && <div style={{ ...card, border: 'none' }}><div style={sTitle}><FiLock size={11} /> Secret Types</div><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{typeBreakdown.slice(0, 8).map(([type, count]) => <HBar key={type} label={type} count={count} max={maxType} color={TYPE_COLORS[type] || '#64748b'} />)}</div></div>}
      </div>

      {/* Projects + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1, background: 'var(--color-border)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
        <div style={{ ...card, border: 'none' }}>
          <div style={{ ...sTitle, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiFolder size={11} /> Projects</span>
            <button onClick={openAddProjectModal} style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 9.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><FiPlus size={10} /> ADD</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {projectStats.map(p => (
              <div key={p.id} onClick={() => { const { selectProject } = useProjectStore.getState(); selectProject(p.id); setActiveView('project'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 140ms' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 14 }}>{p.icon || '📁'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-text-3)' }}>{p.secretCount} secret{p.secretCount !== 1 ? 's' : ''}</div>
                </div>
                <FiChevronRight size={13} color="var(--color-text-3)" />
              </div>
            ))}
            {uncategorized > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px dashed var(--color-border)' }}>
                <span style={{ fontSize: 14, opacity: 0.4 }}>📂</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-3)' }}>Uncategorized</div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-text-3)' }}>{uncategorized} secret{uncategorized !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            {projects.length === 0 && uncategorized === 0 && <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', textAlign: 'center', padding: '16px 0' }}>No projects yet.</p>}
          </div>
        </div>

        <div style={{ ...card, border: 'none' }}>
          <div style={{ ...sTitle, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiActivity size={11} /> Recent Activity</span>
            {storedSecrets.length > 0 && (
              <button 
                onClick={() => { clearFilters(); setSortState('updatedAt', 'desc'); setActiveView('all'); }} 
                style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 9.5, fontWeight: 700, cursor: 'pointer' }}
              >
                VIEW ALL
              </button>
            )}
          </div>
          {recentSecrets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>{recentSecrets.map((s, i) => <TimelineItem key={s.id} secret={s} isLast={i === recentSecrets.length - 1} />)}</div>
          ) : <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', textAlign: 'center', padding: '24px 0' }}>No activity yet.</p>}
        </div>
      </div>

      {/* Empty State */}
      {storedSecrets.length === 0 && (
        <div style={{ border: '1px dashed var(--color-border-2)', background: 'var(--color-surface)', padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center', marginBottom: 16 }}><FiKey size={20} color="var(--color-green)" /></div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>Your vault is empty</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-2)', margin: '0 0 20px 0', maxWidth: 300 }}>Add your first secret to get started. Everything is encrypted before it leaves your device.</p>
          <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}><FiPlus size={14} /> Add Your First Secret</button>
        </div>
      )}
    </div>
  );
};
