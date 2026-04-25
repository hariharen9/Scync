import { create } from 'zustand';
import type { CustomService } from '@scync/core';
import { subscribeToServices, createService } from '@scync/core';

interface ServiceState {
  customServices: CustomService[];
  setServices: (services: CustomService[]) => void;
  createService: (uid: string, data: Omit<CustomService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  subscribeToServices: (uid: string) => () => void;
}

export const useServiceStore = create<ServiceState>((set) => ({
  customServices: [],
  
  setServices: (services) => set({ customServices: services }),
  
  createService: async (uid, data) => {
    await createService(uid, data);
  },
  
  subscribeToServices: (uid: string) => {
    return subscribeToServices(uid, (services) => {
      set({ customServices: services });
    });
  }
}));
