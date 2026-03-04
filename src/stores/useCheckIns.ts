import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"; // Import persist
import { CheckIn } from "@/hooks/interface";

interface CheckInState {
  checkIns: CheckIn[];
  setCheckIns: (data: CheckIn[]) => void;
  addCheckIn: (data: CheckIn) => void;
  updateCheckIn: (id: number, data: Partial<CheckIn>) => void;
  deleteCheckIn: (id: number) => void;
}

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set) => ({
      checkIns: [],

      setCheckIns: (data) => set({ checkIns: data }),

      addCheckIn: (data) =>
        set((state) => ({
          checkIns: [data, ...state.checkIns],
        })),

      updateCheckIn: (id, data) =>
        set((state) => ({
          checkIns: state.checkIns.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),

      deleteCheckIn: (id) =>
        set((state) => ({
          checkIns: state.checkIns.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "check-in-storage",
      storage: createJSONStorage(() => localStorage), 
    }
  )
);