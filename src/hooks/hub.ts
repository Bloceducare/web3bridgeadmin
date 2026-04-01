import { useCallback } from "react";
import { useToast } from "./use-toast";
import { useCheckInStore } from "@/stores/useCheckIns";
import { useHubRegistrationStore } from "@/stores/useHubRegistration";
import type { CheckIn } from "./interface";


export type RegistrationStatus = "all" | "pending" | "approved" | "rejected" | "checked_out" | "check_in";


export const useHub = () => {
    const { toast } = useToast();
    const setCheckIns = useCheckInStore((state) => state.setCheckIns); 
const setBucketData = useHubRegistrationStore((state) => state.setBucketData);


    // 1. Get All Check-Ins
    const getAllCheckIns = useCallback(async (token: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/hub/checkin/all/`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`, 
                },
            });

            if (!response.ok) throw new Error("Failed to fetch check-ins");

            const data = await response.json();
            const payload: unknown =
              data.data !== undefined ? data.data : data;
            let list: CheckIn[] = [];
            if (Array.isArray(payload)) {
              list = payload as CheckIn[];
            } else if (
              payload &&
              typeof payload === "object" &&
              Array.isArray((payload as { results?: CheckIn[] }).results)
            ) {
              list = (payload as { results: CheckIn[] }).results;
            }
            setCheckIns(list);
            
        } catch (error) {
            console.error("Error fetching check-ins:", error);
            toast({
                title: "Error",
                description: "Failed to fetch check-ins. Please try again.",
                variant: "destructive",
            });
        }
    }, [toast, setCheckIns]); 

    const fetchRegistrations = useCallback(async (token: string, status?: RegistrationStatus) => {
        try {
            const statusToFetch = status || "all";
            let url = `${process.env.NEXT_PUBLIC_BASE_URL}/hub/registration/all/`;
            
            if (statusToFetch !== "all") {
                url = `${process.env.NEXT_PUBLIC_BASE_URL}/hub/registration/by_status/?status=${statusToFetch}`;
            }
            
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Failed to fetch registrations");

            const data = await response.json();
            const fetchedData = data.data || data;
            setBucketData(status ?? "all", fetchedData); // Update the store with fetched registrations
            
        } catch (error) {
            console.error("Error fetching registrations:", error);
            toast({
                title: "Error",
                description: "Failed to load registrations.",
                variant: "destructive",
            });
            return null;
        }
    }, [toast]);

    return {
        getAllCheckIns,
        fetchRegistrations, 
    };
};