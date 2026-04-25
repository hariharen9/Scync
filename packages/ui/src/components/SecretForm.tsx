import React, { useState } from 'react';
import type { SecretFormData, StoredSecret } from '@scync/core';
import {
  SERVICES, SECRET_TYPES, ENVIRONMENTS
} from '@scync/core';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Dropdown, type DropdownOption } from './Dropdown';
import { DatePicker } from './DatePicker';
import { FiKey, FiFileText, FiEye, FiEyeOff } from 'react-icons/fi';

interface SecretFormProps {
  initialData?: Omit<StoredSecret, 'encValue' | 'encNotes'> & { value?: string; notes?: string };
  onSubmit: (data: SecretFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '0.625rem',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  padding: '0.6rem 0.875rem',
  fontSize: '0.875rem',
  color: '#ededed',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
};

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  resize: 'none' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8b8b9e',
  marginBottom: '0.5rem',
};

// Map arrays to DropdownOption[]
const toOptions = (arr: readonly string[]): DropdownOption[] =>
  arr.map(v => ({ value: v, label: v }));

export const SecretForm: React.FC<SecretFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { projects } = useProjectStore();
  const { openAddProjectModal } = useUIStore();

  const [formData, setFormData] = useState<SecretFormData>({
    name: initialData?.name || '',
    service: initialData?.service || 'Other',
    type: initialData?.type || 'API Key',
    environment: initialData?.environment || 'Personal',
    status: initialData?.status || 'Active',
    value: initialData?.value || '',
    notes: initialData?.notes || '',
    lastRotated: initialData?.lastRotated || null,
    expiresOn: initialData?.expiresOn || null,
    projectId: initialData?.projectId || null,
  });

  const [showValue, setShowValue] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const focusedBorder = (field: string) => focused === field
    ? { borderColor: 'rgba(124,106,247,0.5)', boxShadow: '0 0 0 3px rgba(124,106,247,0.15)' }
    : {};

  const projectOptions: DropdownOption[] = [
    { value: '', label: 'Uncategorized' },
    ...projects.map(p => ({ value: p.id, label: p.name, icon: <span>{p.icon || '📁'}</span> })),
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
      {/* Name */}
      <div>
        <label style={labelStyle}>Secret Name</label>
        <div style={{ position: 'relative' }}>
          <FiKey size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#44445a', pointerEvents: 'none' }} />
          <input
            required
            name="name"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            style={{ ...inputStyle, paddingLeft: '2.5rem', ...focusedBorder('name') }}
            placeholder="e.g. OpenAI API Key"
            autoFocus
          />
        </div>
      </div>

      {/* Value */}
      <div>
        <label style={labelStyle}>Secret Value</label>
        <div style={{ position: 'relative' }}>
          <textarea
            required
            name="value"
            value={formData.value}
            onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
            onFocus={() => setFocused('value')}
            onBlur={() => setFocused(null)}
            rows={3}
            style={{
              ...monoInputStyle,
              paddingRight: '2.5rem',
              ...focusedBorder('value'),
              // @ts-ignore
              WebkitTextSecurity: showValue ? 'none' : 'disc',
            }}
            placeholder="sk-proj-..."
          />
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            style={{ position: 'absolute', right: '0.75rem', top: '0.75rem', background: 'none', border: 'none', color: '#44445a', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            {showValue ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
      </div>

      {/* 2-col dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <Dropdown
          label="Project"
          labelAction={{ label: '+ Add New', onClick: openAddProjectModal }}
          options={projectOptions}
          value={formData.projectId || ''}
          onChange={v => setFormData(p => ({ ...p, projectId: v || null }))}
        />
        <Dropdown
          label="Service"
          options={toOptions(SERVICES)}
          value={formData.service}
          onChange={v => setFormData(p => ({ ...p, service: v as any }))}
        />
        <Dropdown
          label="Type"
          options={toOptions(SECRET_TYPES)}
          value={formData.type}
          onChange={v => setFormData(p => ({ ...p, type: v as any }))}
        />
        <Dropdown
          label="Environment"
          options={toOptions(ENVIRONMENTS)}
          value={formData.environment}
          onChange={v => setFormData(p => ({ ...p, environment: v as any }))}
        />
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <DatePicker
          label="Last Rotated (Optional)"
          value={formData.lastRotated}
          onChange={v => setFormData(p => ({ ...p, lastRotated: v }))}
        />
        <DatePicker
          label="Expires On (Optional)"
          value={formData.expiresOn}
          onChange={v => setFormData(p => ({ ...p, expiresOn: v }))}
        />
      </div>

      {/* Notes */}
      <div>
        <label style={{ ...labelStyle }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <FiFileText size={10} /> Notes <span style={{ opacity: 0.4 }}>(Optional)</span>
          </span>
        </label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
          onFocus={() => setFocused('notes')}
          onBlur={() => setFocused(null)}
          rows={2}
          style={{ ...inputStyle, resize: 'none', fontSize: '0.8125rem', ...focusedBorder('notes') }}
          placeholder="Any context about this secret..."
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.25rem' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#8b8b9e', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.color = '#ededed'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#8b8b9e'; }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.20 300))', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1, transition: 'opacity 0.2s', fontFamily: 'inherit' }}
        >
          {isSubmitting ? (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
          ) : 'Save Secret'}
        </button>
      </div>
    </form>
  );
};
