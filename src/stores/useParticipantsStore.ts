import { create } from "zustand";
import { Participant } from "@/hooks/interface";

type ParticipantStore = {
  participants: Participant[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  lastRefreshed: number;
  cacheExpiry: number; // Cache expiry time in milliseconds (default: 5 minutes)
  
  setParticipants: (data: Participant[]) => void;
  addParticipant: (data: Participant) => void;
  updateParticipant: (id: number, data: Partial<Participant>) => void;
  deleteParticipant: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasLoaded: (hasLoaded: boolean) => void;
  resetStore: () => void;
  isCacheValid: () => boolean;
};

export const useParticipantsStore = create<ParticipantStore>((set, get) => ({
  participants: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastRefreshed: 0,
  cacheExpiry: 30 * 60 * 1000, // 10 minutes default cache expiry (matches backend cache)
  
  setParticipants: (data) => set({ 
    participants: data, 
    lastRefreshed: Date.now() 
  }),
  
  addParticipant: (data) => 
    set((state) => ({ 
      participants: [...state.participants, data],
      lastRefreshed: Date.now() // Update cache timestamp
    })),
  
  updateParticipant: (id, data) =>
    set((state) => ({
      participants: state.participants.map(p => 
        p.id === id ? { ...p, ...data } : p
      ),
      lastRefreshed: Date.now() // Update cache timestamp
    })),
  
  deleteParticipant: (id) =>
    set((state) => ({
      participants: state.participants.filter(p => p.id !== id),
      lastRefreshed: Date.now() // Update cache timestamp
    })),
    
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setHasLoaded: (hasLoaded) => set({ hasLoaded }),
  
  resetStore: () => set({ 
    participants: [], 
    loading: false, 
    error: null, 
    hasLoaded: false,
    lastRefreshed: 0 
  }),

  isCacheValid: () => {
    const state = get();
    if (!state.hasLoaded || state.lastRefreshed === 0) return false;
    const now = Date.now();
    return (now - state.lastRefreshed) < state.cacheExpiry;
  },
}));