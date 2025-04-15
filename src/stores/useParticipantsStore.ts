import { create } from "zustand";
import { Participant } from "@/hooks/interface";

type ParticipantStore = {
  participants: Participant[];
  loading: boolean;
  error: string | null;
  setParticipants: (data: Participant[]) => void;
  addParticipants: (data: Participant[]) => void; 
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useParticipantsStore = create<ParticipantStore>((set) => ({
  participants: [],
  loading: false,
  error: null,
  setParticipants: (data) => set({ participants: data }),
  addParticipants: (data) =>
    set((state) => ({ participants: [...state.participants, ...data] })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
