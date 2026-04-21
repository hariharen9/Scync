import React, { useState, useEffect } from 'react';
import { 
  SERVICES, SECRET_TYPES, ENVIRONMENTS, STATUSES, 
  SecretFormData, StoredSecret 
} from '@scync/core';
import { useProjectStore } from '../stores/projectStore';

interface SecretFormProps {
  initialData?: Omit<StoredSecret, 'encValue' | 'encNotes'> & { value?: string; notes?: string };
  onSubmit: (data: SecretFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const SecretForm: React.FC<SecretFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}) => {
  const { projects } = useProjectStore();
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-400">Name</label>
        <input 
          required 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent" 
        />
      </div>
      
      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-400">Value</label>
        <textarea 
          required 
          name="value" 
          value={formData.value} 
          onChange={handleChange} 
          rows={3} 
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-accent" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Project</label>
          <select 
            name="projectId" 
            value={formData.projectId || ''} 
            onChange={handleChange} 
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
          >
            <option value="">Uncategorized</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Service</label>
          <select 
            name="service" 
            value={formData.service} 
            onChange={handleChange} 
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
          >
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Type</label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleChange} 
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
          >
            {SECRET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-400">Environment</label>
          <select 
            name="environment" 
            value={formData.environment} 
            onChange={handleChange} 
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent"
          >
            {ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-400">Notes (Optional)</label>
        <textarea 
          name="notes" 
          value={formData.notes || ''} 
          onChange={handleChange} 
          rows={2} 
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-accent" 
        />
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button 
          type="button" 
          onClick={onCancel} 
          className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="rounded bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Secret'}
        </button>
      </div>
    </form>
  );
};
