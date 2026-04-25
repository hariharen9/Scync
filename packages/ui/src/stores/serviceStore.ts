import { create } from 'zustand';
import type { CustomService } from '@scync/core';
import { subscribeToServices, createService, updateService, deleteService } from '@scync/core';

interface ServiceState {
  customServices: CustomService[];
  setServices: (services: CustomService[]) => void;
  createService: (uid: string, data: Omit<CustomService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateService: (uid: string, serviceId: string, data: Partial<CustomService>) => Promise<void>;
  deleteService: (uid: string, serviceId: string) => Promise<void>;
  subscribeToServices: (uid: string) => () => void;
}

export const useServiceStore = create<ServiceState>((set) => ({
  customServices: [],
  
  setServices: (services) => set({ customServices: services }),
  
  createService: async (uid, data) => {
    await createService(uid, data);
  },

  updateService: async (uid, serviceId, data) => {
    await updateService(uid, serviceId, data);
  },

  deleteService: async (uid, serviceId) => {
    await deleteService(uid, serviceId);
  },
  
  subscribeToServices: (uid: string) => {
    return subscribeToServices(uid, (services) => {
      set({ customServices: services });
    });
  }
}));
