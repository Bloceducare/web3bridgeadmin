import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HubRegistration } from "@/hooks/interface";

export type RegistrationStatus = "all" | "pending" | "approved" | "rejected" | "checked_out" | "check_in";

interface HubRegistrationState {
  
  buckets: Record<RegistrationStatus, HubRegistration[]>;
  
  // Actions
  setBucketData: (status: RegistrationStatus, data: HubRegistration[]) => void;
  updateRegistrationInBuckets: (id: number, data: Partial<HubRegistration>) => void;
  addRegistrationToBucket: (status: RegistrationStatus, data: HubRegistration) => void;
  clearAllBuckets: () => void;
}

export const useHubRegistrationStore = create<HubRegistrationState>()(
  persist(
    (set) => ({
      // Initial state with empty buckets for every status
      buckets: {
        all: [],
        pending: [],
        approved: [],
        rejected: [],
        checked_out: [],
        check_in: [],
      },

      // Set data for a specific bucket (e.g., when API returns filtered results)
      setBucketData: (status, data) =>
        set((state) => ({
          buckets: {
            ...state.buckets,
            [status]: Array.isArray(data) ? data : [],
          },
        })),

      // Add a registration to a specific bucket
      addRegistrationToBucket: (status, data) =>
        set((state) => ({
          buckets: {
            ...state.buckets,
            [status]: [data, ...state.buckets[status]],
            // Also add to 'all' if it's not already there
            all: [data, ...state.buckets.all],
          },
        })),

      // Update a registration across ALL buckets (to keep UI consistent)
      updateRegistrationInBuckets: (id, updatedFields) =>
        set((state) => {
          const newBuckets = { ...state.buckets };
          
          // Iterate through every bucket and update the item if found
          (Object.keys(newBuckets) as RegistrationStatus[]).forEach((status) => {
            newBuckets[status] = newBuckets[status].map((reg) =>
              reg.id === id ? { ...reg, ...updatedFields } : reg
            );
          });

          return { buckets: newBuckets };
        }),

      // Reset everything
      clearAllBuckets: () =>
        set({
          buckets: {
            all: [],
            pending: [],
            approved: [],
            rejected: [],
            checked_out: [],
            check_in: [],
          },
        }),
    }),
    {
      name: "hub-registrations-storage",
      partialize: (state) => ({ buckets: state.buckets }),
    }
  )
);