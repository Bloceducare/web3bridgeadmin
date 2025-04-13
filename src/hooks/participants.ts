import { useCallback } from "react";
import { Participant, ApiResponse } from "@/hooks/interface";
import { useParticipantsStore } from "@/stores/useParticipantsStore";

export const useParticipants = () => {
  const { setParticipants, setLoading, setError } = useParticipantsStore();

  const fetchParticipants = useCallback(
    async (token: string) => {
      try {
        setLoading(true);
        setError(null);

        let allResults: Participant[] = [];
        let nextUrl: string | null =
          "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/all/";

        while (nextUrl) {
          const response = await fetch(nextUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
          }

          const result: ApiResponse = await response.json();

          if (result.success) {
            allResults = [...allResults, ...result.data.results];
            nextUrl = result.data.next;
          } else {
            throw new Error("Failed to fetch participants");
          }
        }

        setParticipants(allResults);
      } catch (error: any) {
        console.error("Error fetching participants:", error);
        setError(error.message || "Failed to fetch participants");
        alert("Failed to fetch participants");
      } finally {
        setLoading(false);
      }
    },
    [setParticipants, setLoading, setError]
  );

  return { fetchParticipants };
};
