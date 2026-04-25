import React, { useState } from 'react';
import type { SecretFormData, StoredSecret } from '@scync/core';
import { SERVICES, SECRET_TYPES, ENVIRONMENTS } from '@scync/core';
import { useProjectStore } from '../stores/projectStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown, type DropdownOption } from './Dropdown';
import { DatePicker } from './DatePicker';
import { ServiceIcon } from './ServiceIcon';
import { FiKey, FiFileText, FiEye, FiEyeOff } from 'react-icons/fi';

interface SecretFormProps {
  initialData?: Omit<StoredSecret, 'encValue' | 'encNotes'> & { value?: string; notes?: string };
  onSubmit: (data: SecretFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  padding: '8px 11px', fontSize: 12.5, color: 'var(--color-text)', outline: 'none',
  transition: 'border-color 140ms', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
};
const monoInputStyle: React.CSSProperties = {
  ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, resize: 'none' as const,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'var(--color-text-3)', marginBottom: 6,
};

const toOptions = (arr: readonly string[]): DropdownOption[] => arr.map(v => ({ value: v, label: v }));

export const SecretForm: React.FC<SecretFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { projects } = useProjectStore();
  const { customServices } = useServiceStore();
  const { openAddProjectModal, openAddServiceModal } = useUIStore();

  const [formData, setFormData] = useState<SecretFormData>({
    name: initialData?.name || '', service: initialData?.service || 'Other',
    type: initialData?.type || 'API Key', environment: initialData?.environment || 'Personal',
    status: initialData?.status || 'Active', value: initialData?.value || '',
    notes: initialData?.notes || '', lastRotated: initialData?.lastRotated || null,
    expiresOn: initialData?.expiresOn || null, projectId: initialData?.projectId || null,
  });
  const [showValue, setShowValue] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await onSubmit(formData); };

  const projectOptions: DropdownOption[] = [
    { value: '', label: 'Uncategorized' },
    ...projects.map(p => ({ value: p.id, label: p.name, icon: <span>{p.icon || '📁'}</span> })),
  ];
  const serviceOptions: DropdownOption[] = [
    ...SERVICES.map(s => ({ value: s, label: s, icon: <ServiceIcon service={s} size={13} className="text-current" /> })),
    ...customServices.map(s => ({ value: s.name, label: s.name, icon: <span style={{ fontSize: 14 }}>{s.icon || '🌐'}</span>, description: 'Custom' })),
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Secret Name</label>
        <div style={{ position: 'relative' }}>
          <FiKey size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input required name="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, paddingLeft: 28 }} placeholder="e.g. OpenAI API Key" autoFocus
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Secret Value</label>
        <div style={{ position: 'relative' }}>
          <textarea required name="value" value={formData.value} onChange={e => setFormData(p => ({ ...p, value: e.target.value }))} rows={3}
            style={{ ...monoInputStyle, paddingRight: 30, WebkitTextSecurity: showValue ? 'none' : 'disc' } as any} placeholder="sk-proj-..."
            onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
          <button type="button" onClick={() => setShowValue(!showValue)} style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: 0, display: 'flex' }}>
            {showValue ? <FiEyeOff size={13} /> : <FiEye size={13} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Dropdown label="Project" labelAction={{ label: '+ New', onClick: openAddProjectModal }} options={projectOptions} value={formData.projectId || ''} onChange={v => setFormData(p => ({ ...p, projectId: v || null }))} />
        <Dropdown label="Service" labelAction={{ label: '+ New', onClick: openAddServiceModal }} options={serviceOptions} value={formData.service} onChange={v => setFormData(p => ({ ...p, service: v }))} />
        <Dropdown label="Type" options={toOptions(SECRET_TYPES)} value={formData.type} onChange={v => setFormData(p => ({ ...p, type: v as any }))} />
        <Dropdown label="Environment" options={toOptions(ENVIRONMENTS)} value={formData.environment} onChange={v => setFormData(p => ({ ...p, environment: v as any }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <DatePicker label="Last Rotated (Optional)" value={formData.lastRotated} onChange={v => setFormData(p => ({ ...p, lastRotated: v }))} />
        <DatePicker label="Expires On (Optional)" value={formData.expiresOn} onChange={v => setFormData(p => ({ ...p, expiresOn: v }))} />
      </div>

      <div>
        <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiFileText size={9} /> Notes <span style={{ opacity: 0.4 }}>(Optional)</span></span></label>
        <textarea name="notes" value={formData.notes || ''} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none', fontSize: 12 }} placeholder="Any context about this secret..."
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-border-focus)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 140ms' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: 'white', color: '#080808', border: 'none', fontSize: 12, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1, fontFamily: 'var(--font-sans)', transition: 'opacity 140ms' }}>
          {isSubmitting ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#080808', animation: 'spin 0.7s linear infinite' }} /> : 'Save Secret'}
        </button>
      </div>
    </form>
  );
};
