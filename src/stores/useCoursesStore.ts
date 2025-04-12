import { create } from "zustand";
import { Program } from "@/hooks/interface";

interface ProgramState {
  programs: Program[];
  isCourseOpen: { [key: number]: boolean };
  loading: boolean;
  error: string | null;
  setPrograms: (data: Program[]) => void;
  setIsCourseOpen: (data: { [key: number]: boolean }) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
}

export const useProgramStore = create<ProgramState>((set) => ({
  programs: [],
  isCourseOpen: {},
  loading: false,
  error: null,

  setPrograms: (data) => set({ programs: data }),
  setIsCourseOpen: (data) => set({ isCourseOpen: data }),
  setLoading: (value) => set({ loading: value }),
  setError: (message) => set({ error: message }),
}));
