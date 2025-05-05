import { useCallback } from "react";
import { Participant, ApiResponse } from "@/hooks/interface";
import { useParticipantsStore } from "@/stores/useParticipantsStore";

export const useParticipants = () => {
  const { addParticipants, setParticipants, setLoading, setError } = useParticipantsStore();

  const fetchParticipants = useCallback(
    async (token: string) => {
      try {
        setLoading(true);
        setError(null);
        setParticipants([]); 
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
            addParticipants(result.data.results); 
            nextUrl = result.data.next;
          } else {
            throw new Error("Failed to fetch participants");
          }
        }
      } catch (error: any) {
        console.error("Error fetching participants:", error);
        setError(error.message || "Failed to fetch participants");
        alert("Failed to fetch participants");
      } finally {
        setLoading(false);
      }
    },
    [addParticipants, setParticipants, setLoading, setError]
  );

  const sendConfirmationEmail = useCallback(
    async (token: string, email: string) => {
      console.log ("Sending confirmation email to:", JSON.stringify(email));
      try {
        const response = await fetch(
          "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/send-confirmation-email/",
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
      } catch (error) {
        console.error("Error sending confirmation email:", error);
      }
    },
    []
  );

  

  return { fetchParticipants, sendConfirmationEmail };
};
