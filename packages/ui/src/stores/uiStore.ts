import { create } from 'zustand';
import type { VaultFilter } from '@scync/core';

interface UIState {
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
  
  filter: VaultFilter;
  sortBy: 'createdAt' | 'name' | 'expiresOn';
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
  
  setFilter: (filter: Partial<VaultFilter>) => void;
  clearFilters: () => void;
  setSortBy: (by: UIState['sortBy']) => void;
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
  isMobileMenuOpen: false,
  
  filter: defaultFilter,
  sortBy: 'createdAt',
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
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  setFilter: (filterUpdate) => set((state) => ({ filter: { ...state.filter, ...filterUpdate } })),
  clearFilters: () => set({ filter: defaultFilter }),
  setSortBy: (by) => set((state) => ({ 
    sortBy: by,
    sortOrder: state.sortBy === by && state.sortOrder === 'desc' ? 'asc' : 'desc'
  })),
}));
