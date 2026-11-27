import React, { useState, useMemo } from 'react';
import type { SecretFormData, StoredSecret, RecoveryCodeSet, SecretType } from '@scync/core';
import { SERVICES, SECRET_TYPES, ENVIRONMENTS, looksLikeSSHPrivateKey } from '@scync/core';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown, type DropdownOption } from './Dropdown';
import { DatePicker } from './DatePicker';
import { ServiceIcon } from './ServiceIcon';
import { ProjectIcon, PROJECT_COLOR_MAP } from './ProjectIcons';
import { CustomServiceIcon } from './CustomServiceIcons';
import {
  FiKey, FiFileText, FiEye, FiEyeOff, FiList, FiPlus, FiTerminal,
  FiRefreshCw, FiDatabase, FiCheckCircle, FiAlertCircle, FiUpload,
} from 'react-icons/fi';
import { modalBtnPrimary, modalBtnSecondary, modalInputStyle, modalMonoInputStyle, modalLabelStyle } from './ModalShell';

interface SecretFormProps {
  initialData?: Omit<StoredSecret, 'encValue' | 'encNotes'> & { value?: string; notes?: string };
  onSubmit: (data: SecretFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const toOptions = (arr: readonly string[]): DropdownOption[] => arr.map(v => ({ value: v, label: v }));

const PLACEHOLDERS: Record<string, { name: string; value: string; hint?: string }> = {
  'API Key': { name: 'e.g. OpenAI Production Key', value: 'sk-proj-...', hint: 'Provider API key' },
  'Personal Access Token': { name: 'e.g. GitHub Fine-Grained PAT', value: 'github_pat_...', hint: 'Scoped personal access token' },
  'OAuth Token': { name: 'e.g. Slack Bot OAuth Token', value: 'xoxb-...', hint: 'Bearer / refresh token' },
  'OAuth Client Secret': { name: 'e.g. Google OAuth App', value: 'GOCSPX-...', hint: 'Client ID + Client Secret' },
  'Recovery Codes': { name: 'e.g. GitHub 2FA Backup Codes', value: '8f3a-2b1c\n9d4e-7f2d\n...', hint: 'One backup code per line' },
  'Recovery Phrase': { name: 'e.g. Ledger / MetaMask Seed', value: 'word1 word2 word3 ...', hint: '12 or 24-word seed phrase' },
  'Secret Key': { name: 'e.g. JWT Signing Secret', value: 'your-high-entropy-secret-string', hint: 'Symmetric / signing secret' },
  'Webhook Secret': { name: 'e.g. Stripe Signing Secret', value: 'whsec_...', hint: 'HMAC webhook verification secret' },
  'Service Account JSON': { name: 'e.g. Firebase Admin SDK', value: '{\n  "type": "service_account",\n  ...\n}', hint: 'GCP / Firebase credentials JSON' },
  'Database URL': { name: 'e.g. Prod Postgres Primary', value: 'postgres://user:pass@host:5432/db', hint: 'Connection URI builder' },
  'License Key': { name: 'e.g. JetBrains All Products', value: 'A1B2-C3D4-E5F6-G7H8', hint: 'Software activation key' },
  'Passphrase': { name: 'e.g. SSH / GPG Passphrase', value: 'correct-horse-battery-staple', hint: 'Multi-word passphrase' },
  'Secret Note': { name: 'e.g. Prod Incident Runbook', value: 'Write confidential notes here...', hint: 'Encrypted multi-line note' },
  'Password': { name: 'e.g. Legacy Server Root', value: 'your-complex-password', hint: 'Strong password' },
  'Other': { name: 'e.g. Custom Secret', value: 'Enter your secret here...', hint: 'Arbitrary encrypted value' },
};

const DB_PROTOCOLS = ['postgres://', 'postgresql://', 'mysql://', 'mongodb+srv://', 'mongodb://', 'redis://', 'rediss://'] as const;

function parseDbUri(uri: string) {
  const match = uri.trim().match(/^([a-zA-Z0-9+.-]+:\/\/)(?:([^:@/]+)(?::([^@/]*))?@)?([^:/?#]+)(?::(\d+))?(?:\/([^?#]*))?(.*)$/);
  if (!match) {
    return { protocol: 'postgres://', username: '', password: '', host: '', port: '', database: '', query: '' };
  }
  return {
    protocol: match[1] || 'postgres://',
    username: decodeURIComponent(match[2] || ''),
    password: decodeURIComponent(match[3] || ''),
    host: match[4] || '',
    port: match[5] || '',
    database: match[6] || '',
    query: match[7] || '',
  };
}

function buildDbUri(parts: ReturnType<typeof parseDbUri>) {
  if (!parts.host && !parts.username && !parts.password && !parts.database) return '';
  const auth = parts.username
    ? `${encodeURIComponent(parts.username)}${parts.password ? `:${encodeURIComponent(parts.password)}` : ''}@`
    : '';
  const port = parts.port ? `:${parts.port}` : '';
  const db = parts.database ? `/${parts.database}` : '';
  return `${parts.protocol}${auth}${parts.host}${port}${db}${parts.query || ''}`;
}

function randomHex(bytesLen: number): string {
  const bytes = new Uint8Array(bytesLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function randomStrongPassword(length = 20): string {
  const groups = ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', '!@#$%^&*()-_=+'];
  const all = groups.join('');
  const rand = (max: number) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  };
  const picks = groups.map(g => g[rand(g.length)]);
  while (picks.length < length) picks.push(all[rand(all.length)]);
  for (let i = picks.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks.join('');
}

function randomPassphrase(wordCount = 6): string {
  const words = [
    'amber', 'anchor', 'atlas', 'aurora', 'beacon', 'binary', 'breeze', 'canyon',
    'cipher', 'cobalt', 'comet', 'copper', 'cosmos', 'crystal', 'delta', 'echo',
    'ember', 'falcon', 'fjord', 'forest', 'galaxy', 'glacier', 'granite', 'harbor',
    'helix', 'horizon', 'indigo', 'ivory', 'jasper', 'juniper', 'krypton', 'lantern',
    'marble', 'matrix', 'mercury', 'meteor', 'mirage', 'monarch', 'nebula', 'nexus',
    'nimbus', 'obsidian', 'onyx', 'orbit', 'osprey', 'oxygen', 'paradox', 'phantom',
    'phoenix', 'photon', 'pioneer', 'prism', 'pulsar', 'quantum', 'quartz', 'quiver',
    'radium', 'raven', 'reactor', 'redwood', 'ripple', 'saffron', 'sentinel', 'shadow',
    'sierra', 'signal', 'silver', 'solstice', 'spectra', 'spruce', 'summit', 'timber',
    'titanium', 'torrent', 'tundra', 'vector', 'velvet', 'vertex', 'vortex', 'zenith',
  ];
  const rand = (max: number) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  };
  return Array.from({ length: wordCount }, () => words[rand(words.length)]).join('-');
}

function getPasswordStrength(pwd: string): { label: string; color: string; pct: number } {
  if (!pwd) return { label: 'Empty', color: 'var(--color-border-2)', pct: 0 };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 14) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: 'Weak', color: '#ef4444', pct: 30 };
  if (score === 3) return { label: 'Fair', color: '#f59e0b', pct: 55 };
  if (score === 4) return { label: 'Strong', color: '#60a5fa', pct: 80 };
  return { label: 'Very Strong', color: 'var(--color-green)', pct: 100 };
}

export const SecretForm: React.FC<SecretFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { openAddProjectModal, openAddServiceModal, openAddSSHModal, closeAddModal, closeEditModal } = useUIStore();

  const [formData, setFormData] = useState<SecretFormData>({
    name: initialData?.name || '',
    service: initialData?.service || 'Other',
    type: initialData?.type || 'API Key',
    environment: initialData?.environment || 'Personal',
    status: initialData?.status || 'Active',
    value: initialData?.type === 'Recovery Codes' && initialData?.value
      ? (() => {
          try {
            const parsed = JSON.parse(initialData.value) as RecoveryCodeSet;
            return parsed.codes.filter(c => !c.used).map(c => c.code).join('\n');
          } catch {
            return initialData.value;
          }
        })()
      : (initialData?.value || ''),
    notes: initialData?.notes || '',
    lastRotated: initialData?.lastRotated || null,
    expiresOn: initialData?.expiresOn || null,
    projectId: initialData?.projectId || null,
    remainingCodes: initialData?.remainingCodes || null,
  });

  const [showValue, setShowValue] = useState(false);

  // Recovery Phrase state
  const initialWords = (initialData?.type === 'Recovery Phrase' && initialData?.value)
    ? initialData.value.trim().split(/[\s,\n]+/).filter(Boolean)
    : [];
  const [phraseSize, setPhraseSize] = useState<12 | 24>(initialWords.length > 12 ? 24 : 12);
  const [phraseWords, setPhraseWords] = useState<string[]>(() => {
    const size = initialWords.length > 12 ? 24 : 12;
    return Array.from({ length: size }, (_, i) => initialWords[i] || '');
  });

  // Database URL structured state
  const [dbParts, setDbParts] = useState(() =>
    initialData?.type === 'Database URL' && initialData?.value
      ? parseDbUri(initialData.value)
      : { protocol: 'postgres://', username: '', password: '', host: '', port: '5432', database: '', query: '' }
  );

  // OAuth Client Secret structured state
  const [oauthPair, setOauthPair] = useState<{ clientId: string; clientSecret: string }>(() => {
    if (initialData?.type === 'OAuth Client Secret' && initialData?.value) {
      try {
        const parsed = JSON.parse(initialData.value);
        if (parsed && typeof parsed === 'object' && ('clientId' in parsed || 'clientSecret' in parsed)) {
          return { clientId: parsed.clientId || '', clientSecret: parsed.clientSecret || '' };
        }
      } catch {
        // plain string fallback
      }
      return { clientId: '', clientSecret: initialData.value };
    }
    return { clientId: '', clientSecret: '' };
  });

  const syncPhraseToForm = (nextWords: string[]) => {
    setPhraseWords(nextWords);
    setFormData(p => ({ ...p, value: nextWords.map(w => w.trim()).filter(Boolean).join(' ') }));
  };

  const handlePhraseSizeChange = (size: 12 | 24) => {
    setPhraseSize(size);
    const next = Array.from({ length: size }, (_, i) => phraseWords[i] || '');
    syncPhraseToForm(next);
  };

  const handleWordChange = (index: number, raw: string) => {
    const cleaned = raw.trim().split(/[\s,\n]+/).map(w => w.replace(/^\d+[.):-]\s*/, '').trim()).filter(Boolean);
    if (cleaned.length > 1) {
      const targetSize: 12 | 24 = cleaned.length > 12 ? 24 : phraseSize;
      if (targetSize !== phraseSize) setPhraseSize(targetSize);
      const next = Array.from({ length: targetSize }, (_, i) => phraseWords[i] || '');
      cleaned.forEach((w, offset) => {
        if (index + offset < targetSize) next[index + offset] = w;
      });
      syncPhraseToForm(next);
      return;
    }
    const next = [...phraseWords];
    next[index] = raw.replace(/\s+/g, '');
    syncPhraseToForm(next);
  };

  const updateDbField = (field: keyof typeof dbParts, val: string) => {
    const next = { ...dbParts, [field]: val };
    setDbParts(next);
    setFormData(p => ({ ...p, value: buildDbUri(next) }));
  };

  const updateOauthField = (field: 'clientId' | 'clientSecret', val: string) => {
    const next = { ...oauthPair, [field]: val };
    setOauthPair(next);
    const serialized = next.clientId.trim()
      ? JSON.stringify({ clientId: next.clientId.trim(), clientSecret: next.clientSecret })
      : next.clientSecret;
    setFormData(p => ({ ...p, value: serialized }));
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const pretty = JSON.stringify(parsed, null, 2);
          let autoName = '';
          if (parsed.project_id) autoName = `${parsed.project_id} Service Account`;
          else if (parsed.web?.project_id) autoName = `${parsed.web.project_id} OAuth Client`;
          else if (parsed.installed?.project_id) autoName = `${parsed.installed.project_id} OAuth Client`;
          setFormData(prev => ({ ...prev, value: pretty, name: prev.name || autoName }));
        } catch {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const jsonValidation = useMemo(() => {
    if (formData.type !== 'Service Account JSON' || !formData.value.trim()) return null;
    try {
      const parsed = JSON.parse(formData.value);
      return { valid: true, projectId: parsed?.project_id as string | undefined };
    } catch {
      return { valid: false, projectId: undefined };
    }
  }, [formData.type, formData.value]);

  const pwdStrength = useMemo(
    () => (formData.type === 'Password' ? getPasswordStrength(formData.value) : null),
    [formData.type, formData.value]
  );

  const handleGenerateValue = () => {
    let generated = '';
    if (formData.type === 'Webhook Secret') generated = `whsec_${randomHex(24)}`;
    else if (formData.type === 'API Key') generated = `sk_${randomHex(24)}`;
    else if (formData.type === 'Secret Key') generated = randomHex(32);
    else if (formData.type === 'Passphrase') generated = randomPassphrase(6);
    else if (formData.type === 'Password') generated = randomStrongPassword(20);
    if (generated) {
      setFormData(p => ({ ...p, value: generated }));
      setShowValue(true);
    }
  };

  const canGenerate = ['API Key', 'Secret Key', 'Webhook Secret', 'Passphrase', 'Password'].includes(formData.type);
  const currentPlaceholders = PLACEHOLDERS[formData.type] || PLACEHOLDERS['Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };

    if (finalData.type === 'Recovery Codes') {
      const lines = finalData.value.split('\n').map(l => l.trim()).filter(Boolean);
      const uniqueLines = Array.from(new Set(lines));

      let existingSet: RecoveryCodeSet = { codes: [] };
      if (initialData?.type === 'Recovery Codes' && initialData?.value) {
        try { existingSet = JSON.parse(initialData.value); } catch {}
      }

      const existingUsed = existingSet.codes.filter(c => c.used);
      const newCodes = uniqueLines.map(line => {
        const existing = existingSet.codes.find(c => c.code === line);
        return existing || { code: line, used: false, usedAt: null };
      });

      finalData.value = JSON.stringify({ codes: [...existingUsed, ...newCodes] });
      finalData.remainingCodes = newCodes.length;
    } else {
      finalData.remainingCodes = null;
    }

    await onSubmit(finalData);
  };

  const projectOptions: DropdownOption[] = [
    { value: '', label: 'Uncategorized' },
    ...projects.map(p => ({
      value: p.id,
      label: p.name,
      icon: <ProjectIcon iconKey={p.icon || 'FiFolder'} size={13} color={PROJECT_COLOR_MAP[p.color] ?? 'var(--color-text-2)'} />,
    })),
  ];

  const serviceOptions: DropdownOption[] = [
    { value: '__ADD_NEW__', label: '+ Add Custom Service...', icon: <FiPlus size={12} color="var(--color-green)" /> },
    ...SERVICES.map(s => ({ value: s, label: s, icon: <ServiceIcon service={s} size={13} className="text-current" /> })),
    ...customServices.map(s => ({
      value: s.name,
      label: s.name,
      icon: <CustomServiceIcon iconKey={s.icon || 'FiServer'} serviceName={s.name} size={13} color={PROJECT_COLOR_MAP[s.color] ?? 'var(--color-text-2)'} />,
      description: 'Custom',
    })),
  ];

  const renderValueEditor = () => {
    const type: SecretType = formData.type;

    if (type === 'Recovery Phrase') {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, padding: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            {phraseWords.map((word, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '5px 8px', gap: 6 }}>
                <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', width: 16, flexShrink: 0 }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <input
                  type={showValue ? 'text' : 'password'}
                  required={idx === 0}
                  value={word}
                  onChange={e => handleWordChange(idx, e.target.value)}
                  placeholder={`word ${idx + 1}`}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: 11.5, minWidth: 0 }}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: phraseWords.filter(Boolean).length === phraseSize ? 'var(--color-green)' : 'var(--color-text-3)', marginTop: 6 }}>
            {phraseWords.filter(Boolean).length} / {phraseSize} words entered
          </div>
        </>
      );
    }

    if (type === 'Recovery Codes') {
      return (
        <>
          <textarea
            required
            name="value"
            value={formData.value}
            onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
            rows={5}
            style={{ ...modalMonoInputStyle, resize: 'vertical' }}
            placeholder={currentPlaceholders.value}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {formData.value && (
            <div style={{ fontSize: 10.5, color: 'var(--color-green)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              <FiList size={11} /> {formData.value.split('\n').filter(l => l.trim()).length} codes detected
            </div>
          )}
        </>
      );
    }

    if (type === 'Service Account JSON') {
      return (
        <>
          <textarea
            required
            name="value"
            value={formData.value}
            onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
            rows={5}
            style={{ ...modalMonoInputStyle, resize: 'vertical' }}
            placeholder={currentPlaceholders.value}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          {jsonValidation && (
            <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, color: jsonValidation.valid ? 'var(--color-green)' : 'var(--color-red)' }}>
              {jsonValidation.valid ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
              {jsonValidation.valid
                ? `Valid JSON${jsonValidation.projectId ? ` • ${jsonValidation.projectId}` : ''}`
                : 'Invalid JSON syntax'}
            </div>
          )}
        </>
      );
    }

    if (type === 'Database URL') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 78px', gap: 8 }}>
            <select
              value={dbParts.protocol}
              onChange={e => updateDbField('protocol', e.target.value)}
              style={{ ...modalMonoInputStyle, padding: '8px 8px' }}
            >
              {DB_PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={dbParts.host}
              onChange={e => updateDbField('host', e.target.value)}
              placeholder="db.host.internal"
              style={modalMonoInputStyle}
            />
            <input
              value={dbParts.port}
              onChange={e => updateDbField('port', e.target.value)}
              placeholder="5432"
              style={modalMonoInputStyle}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input
              value={dbParts.database}
              onChange={e => updateDbField('database', e.target.value)}
              placeholder="database"
              style={modalMonoInputStyle}
            />
            <input
              value={dbParts.username}
              onChange={e => updateDbField('username', e.target.value)}
              placeholder="username"
              style={modalMonoInputStyle}
            />
            <input
              type={showValue ? 'text' : 'password'}
              value={dbParts.password}
              onChange={e => updateDbField('password', e.target.value)}
              placeholder="password"
              style={modalMonoInputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiDatabase size={12} color="var(--color-green)" style={{ flexShrink: 0 }} />
            <input
              required
              type={showValue ? 'text' : 'password'}
              value={formData.value}
              onChange={e => {
                const raw = e.target.value;
                setFormData(p => ({ ...p, value: raw }));
                setDbParts(parseDbUri(raw));
              }}
              placeholder="Or paste full connection URI..."
              style={{ ...modalMonoInputStyle, fontSize: 11, padding: '6px 9px', background: 'var(--color-surface-2)' }}
            />
          </div>
        </div>
      );
    }

    if (type === 'OAuth Client Secret') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={oauthPair.clientId}
            onChange={e => updateOauthField('clientId', e.target.value)}
            placeholder="Client ID (Optional — e.g. 123456-abc.apps.googleusercontent.com)"
            style={modalMonoInputStyle}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          <div style={{ position: 'relative' }}>
            <input
              required
              type={showValue ? 'text' : 'password'}
              value={oauthPair.clientSecret}
              onChange={e => updateOauthField('clientSecret', e.target.value)}
              placeholder="Client Secret (e.g. GOCSPX-...)"
              style={{ ...modalMonoInputStyle, paddingRight: 34 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
            <button type="button" onClick={() => setShowValue(!showValue)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              {showValue ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          </div>
        </div>
      );
    }

    if (type === 'Secret Note') {
      return (
        <>
          <textarea
            required
            name="value"
            value={formData.value}
            onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
            rows={5}
            style={{ ...modalInputStyle, lineHeight: 1.6, resize: 'vertical' }}
            placeholder={currentPlaceholders.value}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: 4 }}>
            {formData.value.length} characters · Encrypted end-to-end
          </div>
        </>
      );
    }

    if (type === 'License Key') {
      return (
        <div style={{ position: 'relative' }}>
          <input
            required
            type={showValue ? 'text' : 'password'}
            value={formData.value}
            onChange={e => setFormData(p => ({ ...p, value: e.target.value.toUpperCase() }))}
            placeholder={currentPlaceholders.value}
            style={{ ...modalMonoInputStyle, letterSpacing: '0.08em', paddingRight: 34 }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
          <button type="button" onClick={() => setShowValue(!showValue)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 0, display: 'flex' }}>
            {showValue ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
        </div>
      );
    }

    if (type === 'Password' || type === 'Passphrase') {
      return (
        <>
          <div style={{ position: 'relative' }}>
            <input
              required
              type={showValue ? 'text' : 'password'}
              value={formData.value}
              onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
              placeholder={currentPlaceholders.value}
              style={{ ...modalMonoInputStyle, paddingRight: 34 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            />
            <button type="button" onClick={() => setShowValue(!showValue)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              {showValue ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            </button>
          </div>
          {pwdStrength && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 3, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pwdStrength.pct}%`, background: pwdStrength.color, transition: 'width 180ms' }} />
              </div>
              {formData.value && (
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: pwdStrength.color, marginTop: 4 }}>
                  {pwdStrength.label.toUpperCase()}
                </div>
              )}
            </div>
          )}
          {type === 'Passphrase' && formData.value && (
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: 4 }}>
              {formData.value.trim().split(/[\s-]+/).filter(Boolean).length} words
            </div>
          )}
        </>
      );
    }

    // API Key, PAT, OAuth Token, Secret Key, Webhook Secret, Other
    return (
      <div style={{ position: 'relative' }}>
        <textarea
          required
          name="value"
          value={formData.value}
          onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
          rows={3}
          style={{ ...modalMonoInputStyle, paddingRight: 34, resize: 'none', WebkitTextSecurity: showValue ? 'none' : 'disc' } as any}
          placeholder={currentPlaceholders.value}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
        <button type="button" onClick={() => setShowValue(!showValue)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 0, display: 'flex' }}>
          {showValue ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {/* 1. Type & Service UP TOP so the form adapts immediately */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Dropdown
          label="Secret Type"
          options={toOptions(SECRET_TYPES)}
          value={formData.type}
          onChange={v => { setFormData(p => ({ ...p, type: v as SecretType })); setShowValue(false); }}
        />
        <Dropdown
          label="Service"
          labelAction={{ label: '+ New', onClick: openAddServiceModal }}
          options={serviceOptions}
          value={formData.service}
          onChange={v => {
            if (v === '__ADD_NEW__') openAddServiceModal();
            else setFormData(p => ({ ...p, service: v }));
          }}
        />
      </div>

      {/* 2. Secret Name */}
      <div>
        <label style={modalLabelStyle}>Secret Name</label>
        <div style={{ position: 'relative' }}>
          <FiKey size={12} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input
            required
            name="name"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            style={{ ...modalInputStyle, paddingLeft: 32 }}
            placeholder={currentPlaceholders.name}
            autoFocus
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>
      </div>

      {/* 3. Dynamic Type-Specific Value Editor */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
          <label style={{ ...modalLabelStyle, marginBottom: 0 }}>
            {formData.type === 'Recovery Codes'
              ? 'Recovery Codes (One per line)'
              : formData.type === 'Recovery Phrase'
                ? 'Recovery Phrase (Paste into any box)'
                : formData.type === 'Database URL'
                  ? 'Connection URI Builder'
                  : formData.type === 'OAuth Client Secret'
                    ? 'OAuth Credentials'
                    : formData.type === 'Secret Note'
                      ? 'Encrypted Note'
                      : 'Secret Value'}
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {formData.type === 'Recovery Phrase' && (
              <div style={{ display: 'flex', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                {([12, 24] as const).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handlePhraseSizeChange(sz)}
                    style={{
                      padding: '2px 7px', border: 'none',
                      background: phraseSize === sz ? 'var(--color-surface-3)' : 'transparent',
                      color: phraseSize === sz ? 'var(--color-green)' : 'var(--color-text-3)',
                      fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                    }}
                  >
                    {sz}W
                  </button>
                ))}
              </div>
            )}

            {(formData.type === 'Recovery Phrase' || formData.type === 'Database URL') && (
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-2)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'var(--font-mono)' }}
              >
                {showValue ? <><FiEyeOff size={11} /> HIDE</> : <><FiEye size={11} /> SHOW</>}
              </button>
            )}

            {formData.type === 'Service Account JSON' && (
              <button
                type="button"
                onClick={handleImportJson}
                style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <FiUpload size={11} /> IMPORT JSON
              </button>
            )}

            {canGenerate && (
              <button
                type="button"
                onClick={handleGenerateValue}
                style={{ background: 'none', border: 'none', color: 'var(--color-green)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <FiRefreshCw size={11} /> GENERATE
              </button>
            )}
          </div>
        </div>

        {renderValueEditor()}

        {looksLikeSSHPrivateKey(formData.value) && (
          <div style={{
            marginTop: 8, padding: '9px 12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid var(--color-green-border, rgba(16, 185, 129, 0.25))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--color-text-2)' }}>
              <FiTerminal size={13} color="var(--color-green)" style={{ flexShrink: 0 }} />
              <span>Looks like an SSH / <span style={{ fontFamily: 'var(--font-mono)' }}>.pem</span> private key.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const prefill = { name: formData.name.trim() || undefined, privateKey: formData.value };
                closeAddModal();
                closeEditModal();
                openAddSSHModal(prefill);
              }}
              style={{
                background: 'none', border: '1px solid var(--color-green)', color: 'var(--color-green)',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '4px 9px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)',
              }}
            >
              Store in SSH Manager
            </button>
          </div>
        )}
      </div>

      {/* 4. Project & Environment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Dropdown label="Project" labelAction={{ label: '+ New', onClick: openAddProjectModal }} options={projectOptions} value={formData.projectId || ''} onChange={v => setFormData(p => ({ ...p, projectId: v || null }))} />
        <Dropdown label="Environment" options={toOptions(ENVIRONMENTS)} value={formData.environment} onChange={v => setFormData(p => ({ ...p, environment: v as any }))} />
      </div>

      {/* 5. Lifecycle Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <DatePicker label="Created / Rotated (Optional)" value={formData.lastRotated} onChange={v => setFormData(p => ({ ...p, lastRotated: v }))} />
        <DatePicker label="Expires On (Optional)" value={formData.expiresOn} onChange={v => setFormData(p => ({ ...p, expiresOn: v }))} />
      </div>

      {/* 6. Notes */}
      <div>
        <label style={modalLabelStyle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <FiFileText size={10} /> Notes <span style={{ opacity: 0.55, textTransform: 'none' }}>(Optional)</span>
          </span>
        </label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
          rows={2}
          style={{ ...modalInputStyle, resize: 'none', fontSize: 12.5 }}
          placeholder="Any context about this secret..."
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-green)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
        <button type="button" onClick={onCancel} style={modalBtnSecondary}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={{ ...modalBtnPrimary, opacity: isSubmitting ? 0.5 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'Saving...' : 'Save Secret'}
        </button>
      </div>
    </form>
  );
};
