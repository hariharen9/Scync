import React from 'react';
import { useVaultStore } from '../stores/vaultStore';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { SecretCard } from './SecretCard';

export const SecretList: React.FC = () => {
  const { storedSecrets } = useVaultStore();
  const { filter, sortBy, sortOrder, activeView, selectedSecretId } = useUIStore();
  const { selectedProjectId, projects } = useProjectStore();

  const getProject = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId) || null;
  };

  let visibleSecrets = storedSecrets;

  // Filter by view/project
  if (activeView === 'project' && selectedProjectId) {
    visibleSecrets = visibleSecrets.filter(s => s.projectId === selectedProjectId);
  }

  // Filter by search and dropdowns
  visibleSecrets = visibleSecrets.filter(s => {
    if (filter.service && s.service !== filter.service) return false;
    if (filter.type && s.type !== filter.type) return false;
    if (filter.environment && s.environment !== filter.environment) return false;
    if (filter.status && s.status !== filter.status) return false;
    
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.service.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Sort
  visibleSecrets.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'createdAt') {
      cmp = a.createdAt.getTime() - b.createdAt.getTime();
    } else if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === 'expiresOn') {
      const tA = a.expiresOn ? a.expiresOn.getTime() : Infinity;
      const tB = b.expiresOn ? b.expiresOn.getTime() : Infinity;
      cmp = tA - tB;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  if (visibleSecrets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
        {filter.search ? (
          <>
            <h3 className="mb-2 text-lg font-medium text-zinc-300">No secrets match "{filter.search}"</h3>
            <p className="text-sm">Try a different name or clear filters.</p>
          </>
        ) : (
          <>
            <h3 className="mb-2 text-lg font-medium text-zinc-300">Your vault is empty</h3>
            <p className="text-sm">Add your first secret to get started.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${selectedSecretId ? 'xl:grid-cols-2' : 'xl:grid-cols-4'}`}>
      {visibleSecrets.map((secret) => (
        <SecretCard key={secret.id} secret={secret} project={getProject(secret.projectId)} />
      ))}
    </div>
  );
};
