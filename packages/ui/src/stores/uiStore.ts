import { create } from 'zustand';
import type { VaultFilter } from '@scync/core';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

export interface SettingsConfig {
  inactivityLockMinutes: number | null; // null means never
  windowBlurLock: boolean;
}

const DEFAULT_SETTINGS: SettingsConfig = {
  inactivityLockMinutes: 15,
  windowBlurLock: false,
};

const getStoredSettings = (): SettingsConfig => {
  try {
    const s = localStorage.getItem('scync_settings');
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch (e) {}
  return DEFAULT_SETTINGS;
};

export interface UIState {
  // Navigation
  activeView: 'dashboard' | 'project' | 'all';
  setActiveView: (view: UIState['activeView']) => void;

  // View state
  selectedSecretId: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isEnvImportModalOpen: boolean;
  isAddProjectModalOpen: boolean;
  isAddServiceModalOpen: boolean;
  isAboutModalOpen: boolean;
  isSettingsModalOpen: boolean;
  confirmConfig: ConfirmConfig | null;
  
  settings: SettingsConfig;
  
  filter: VaultFilter;
  sortBy: 'createdAt' | 'name' | 'expiresOn' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  selectSecret: (id: string | null) => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (id: string) => void;
  closeEditModal: () => void;
  openEnvImportModal: () => void;
  closeEnvImportModal: () => void;
  openAddProjectModal: () => void;
  closeAddProjectModal: () => void;
  openAddServiceModal: () => void;
  closeAddServiceModal: () => void;
  openAboutModal: () => void;
  closeAboutModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openConfirmModal: (config: ConfirmConfig) => void;
  closeConfirmModal: () => void;
  updateSettings: (partial: Partial<SettingsConfig>) => void;
  
  setFilter: (filter: Partial<VaultFilter>) => void;
  clearFilters: () => void;
  setSortBy: (by: UIState['sortBy']) => void;
  setSortState: (by: UIState['sortBy'], order: UIState['sortOrder']) => void;
  // Mobile State
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const defaultFilter: VaultFilter = {
  service: '',
  type: '',
  environment: '',
  status: '',
  projectId: '',
  search: ''
};

export const useUIStore = create<UIState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view, selectedSecretId: null, isMobileMenuOpen: false }),

  selectedSecretId: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isEnvImportModalOpen: false,
  isAddProjectModalOpen: false,
  isAddServiceModalOpen: false,
  isAboutModalOpen: false,
  isSettingsModalOpen: false,
  confirmConfig: null,
  isMobileMenuOpen: false,
  
  settings: getStoredSettings(),
  
  filter: defaultFilter,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  
  selectSecret: (id) => set({ selectedSecretId: id }),
  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),
  openEditModal: (id) => set({ isEditModalOpen: true, selectedSecretId: id }),
  closeEditModal: () => set({ isEditModalOpen: false }),
  openEnvImportModal: () => set({ isEnvImportModalOpen: true }),
  closeEnvImportModal: () => set({ isEnvImportModalOpen: false }),
  openAddProjectModal: () => set({ isAddProjectModalOpen: true }),
  closeAddProjectModal: () => set({ isAddProjectModalOpen: false }),
  openAddServiceModal: () => set({ isAddServiceModalOpen: true }),
  closeAddServiceModal: () => set({ isAddServiceModalOpen: false }),
  openAboutModal: () => set({ isAboutModalOpen: true }),
  closeAboutModal: () => set({ isAboutModalOpen: false }),
  openSettingsModal: () => set({ isSettingsModalOpen: true, isMobileMenuOpen: false }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
  openConfirmModal: (config) => set({ confirmConfig: config }),
  closeConfirmModal: () => set({ confirmConfig: null }),
  
  updateSettings: (partial) => set((state) => {
    const newSettings = { ...state.settings, ...partial };
    try { localStorage.setItem('scync_settings', JSON.stringify(newSettings)); } catch (e) {}
    return { settings: newSettings };
  }),
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  setFilter: (filterUpdate) => set((state) => ({ filter: { ...state.filter, ...filterUpdate } })),
  clearFilters: () => set({ filter: defaultFilter }),
  setSortBy: (by) => set((state) => ({ 
    sortBy: by,
    sortOrder: state.sortBy === by && state.sortOrder === 'desc' ? 'asc' : 'desc'
  })),
  setSortState: (by, order) => set({ sortBy: by, sortOrder: order }),
}));
