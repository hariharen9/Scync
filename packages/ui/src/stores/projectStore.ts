import { create } from 'zustand';
import { Project, subscribeToProjects, createProject, updateProject, deleteProject } from '@scync/core';

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  
  selectProject: (id: string | null) => void;
  setProjects: (projects: Project[]) => void;
  
  createProject: (uid: string, data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (uid: string, projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (uid: string, projectId: string, moveSecretsTo: string | null) => Promise<void>;
  
  subscribeToProjects: (uid: string) => () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProjectId: null,
  
  selectProject: (id) => set({ selectedProjectId: id }),
  setProjects: (projects) => set({ projects }),
  
  createProject: async (uid, data) => {
    await createProject(uid, data);
  },
  
  updateProject: async (uid, projectId, data) => {
    await updateProject(uid, projectId, data);
  },
  
  deleteProject: async (uid, projectId, moveSecretsTo) => {
    await deleteProject(uid, projectId, moveSecretsTo);
  },
  
  subscribeToProjects: (uid: string) => {
    return subscribeToProjects(uid, (projects) => {
      set({ projects });
    });
  }
}));
