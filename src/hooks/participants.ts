import { useCallback, useState } from "react";
import { ApiResponse, Participant } from "@/hooks/interface";
import { useParticipantsStore } from "@/stores/useParticipantsStore";

export const useParticipants = () => {
  const { 
    setParticipants, 
    setLoading, 
    setError, 
    hasLoaded: storeHasLoaded,
    setHasLoaded 
  } = useParticipantsStore();
  
  const [isFetching, setIsFetching] = useState(false);

  const fetchParticipants = useCallback(
    async (token: string, forceRefresh = false) => {
      // Check if already fetching or has loaded and no force refresh
      if (isFetching || (storeHasLoaded && !forceRefresh)) {
        console.log("Skipping fetch: isFetching=", isFetching, "storeHasLoaded=", storeHasLoaded, "forceRefresh=", forceRefresh);
        return;
      }

      try {
        setIsFetching(true);
        setLoading(true);
        setError(null);
        
        // Clear existing participants before fetching new ones if forced refresh
        if (forceRefresh) {
          setParticipants([]);
        }
        
        let allParticipants: Participant[] = [];
        let nextUrl: string | null = "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/all/";
        
        while (nextUrl) {
          const response = await fetch(nextUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
          }

          const result: ApiResponse = await response.json();
          
          if (result.success) {
            // Collect all participants first
            allParticipants = [...allParticipants, ...result.data.results];
            nextUrl = result.data.next;
          } else {
            throw new Error("Failed to fetch participants");
          }
        }
        
        // Set all participants at once
        setParticipants(allParticipants);
        setHasLoaded(true);
      } catch (error: any) {
        console.error("Error fetching participants:", error);
        setError(error.message || "Failed to fetch participants");
        alert("Failed to fetch participants");
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [setParticipants, setLoading, setError, isFetching, storeHasLoaded, setHasLoaded]
  );

  const sendConfirmationEmail = useCallback(
    async (token: string, email: string) => {
      console.log("Sending confirmation email to:", email);
      try {
        const response = await fetch(
          "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/send-confirmation-email/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
            body: JSON.stringify({ email }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send confirmation email");
        }

        const data = await response.json();
        console.log("Email sent successfully:", data);
        return data;
      } catch (error) {
        console.error("Error sending confirmation email:", error);
        throw error;
      }
    },
    []
  );

  return {
    fetchParticipants,
    sendConfirmationEmail,
    isFetching,
    hasLoaded: storeHasLoaded,
    forceRefresh: () => fetchParticipants(localStorage.getItem("token") || "", true),
  };
};