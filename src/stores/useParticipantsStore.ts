import { create } from "zustand";
import { Participant } from "@/hooks/interface";

type ParticipantStore = {
  participants: Participant[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  lastRefreshed: number;
  
  setParticipants: (data: Participant[]) => void;
  addParticipant: (data: Participant) => void;
  updateParticipant: (id: number, data: Partial<Participant>) => void;
  deleteParticipant: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasLoaded: (hasLoaded: boolean) => void;
  resetStore: () => void;
};

export const useParticipantsStore = create<ParticipantStore>((set) => ({
  participants: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastRefreshed: 0,
  
  setParticipants: (data) => set({ participants: data, lastRefreshed: Date.now() }),
  
  addParticipant: (data) => 
    set((state) => ({ 
      participants: [...state.participants, data] 
    })),
  
  updateParticipant: (id, data) =>
    set((state) => ({
      participants: state.participants.map(p => 
        p.id === id ? { ...p, ...data } : p
      )
    })),
  
  deleteParticipant: (id) =>
    set((state) => ({
      participants: state.participants.filter(p => p.id !== id)
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
}));