import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Participant } from "@/hooks/interface";

type ParticipantStore = {
  participants: Participant[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  
  setParticipants: (data: Participant[]) => void;
  addParticipant: (data: Participant) => void;
  updateParticipant: (id: number, data: Partial<Participant>) => void;
  deleteParticipant: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasLoaded: (hasLoaded: boolean) => void;
  resetStore: () => void;
};

export const useParticipantsStore = create<ParticipantStore>()(
  persist(
    (set) => ({
      participants: [],
      loading: false,
      error: null,
      hasLoaded: false,
      
      setParticipants: (data) => set({ participants: data }),
      
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
        hasLoaded: false 
      }),
    }),
    {
      name: "participants-storage",
      partialize: (state) => ({
        participants: state.participants,
        hasLoaded: state.hasLoaded,
      }),
    }
  )
);