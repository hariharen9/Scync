import React, { useState } from 'react';
import { FiSearch, FiFolder, FiGrid, FiList } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useVaultStore } from '../stores/vaultStore';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, filter, setFilter } = useUIStore();
  const { projects, selectedProjectId, selectProject } = useProjectStore();
  const { storedSecrets } = useVaultStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ search: e.target.value });
  };

  const getProjectCount = (id: string | null) => {
    return storedSecrets.filter(s => s.projectId === id).length;
  };

  return (
    <div className="flex h-full w-60 flex-col border-r border-zinc-800 bg-[#111] text-zinc-400">
      <div className="p-4 border-b border-zinc-800/50">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search..."
            value={filter.search}
            onChange={handleSearchChange}
            className="w-full rounded-md border border-zinc-700/50 bg-zinc-900/50 py-1.5 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1 mb-6">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-sm transition-colors ${
              activeView === 'dashboard' ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiGrid className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveView('all')}
            className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-sm transition-colors ${
              activeView === 'all' ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiList className="h-4 w-4" />
              <span>All Secrets</span>
            </div>
            <span className="text-xs text-zinc-500">{storedSecrets.length}</span>
          </button>
        </div>

        <div className="mb-2 px-3 text-xs font-semibold tracking-wider text-zinc-500">
          PROJECTS
        </div>
        
        <div className="space-y-1">
          {projects.map((p) => (
            <button 
              key={p.id}
              onClick={() => { setActiveView('project'); selectProject(p.id); }}
              className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-sm transition-colors ${
                activeView === 'project' && selectedProjectId === p.id 
                  ? 'bg-accent/10 text-accent font-medium' 
                  : 'hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span>{p.icon || '📁'}</span>
                <span className="truncate">{p.name}</span>
              </div>
              <span className="text-xs text-zinc-500">{getProjectCount(p.id)}</span>
            </button>
          ))}
          
          <button 
            onClick={() => { setActiveView('project'); selectProject(null); }}
            className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-sm transition-colors ${
              activeView === 'project' && selectedProjectId === null 
                ? 'bg-accent/10 text-accent font-medium' 
                : 'hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <FiFolder className="h-4 w-4" />
              <span>Uncategorized</span>
            </div>
            <span className="text-xs text-zinc-500">{getProjectCount(null)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
