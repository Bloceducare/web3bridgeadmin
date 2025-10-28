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
    async (token: string, forceRefresh = false, silent = false) => {
      // Check if already fetching or has loaded and no force refresh
      if (isFetching || (storeHasLoaded && !forceRefresh && !silent)) {
        console.log("Skipping fetch: isFetching=", isFetching, "storeHasLoaded=", storeHasLoaded, "forceRefresh=", forceRefresh);
        return;
      }

      try {
        setIsFetching(true);
        // Only show global loading state if not silent
        if (!silent) {
          setLoading(true);
        }
        setError(null);
        
        // Only clear participants if forcing refresh
        if (forceRefresh) {
          setParticipants([]);
        }

        // First, fetch the first page to get pagination info with a reasonable page size
        const pageSize = 50; // Limit per page to avoid timeout
        const firstUrl = `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/all/?page_size=${pageSize}`;
        
        // Add timeout to initial request with longer timeout for slower server
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
        
        let firstResponse = await fetch(firstUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!firstResponse.ok) {
          throw new Error(`API call failed: ${firstResponse.statusText}`);
        }

        const firstResult: ApiResponse = await firstResponse.json();
        
        if (!firstResult.success) {
          throw new Error("Failed to fetch participants");
        }

        // Immediately display first page data sorted by registration date (newest first)
        const allParticipants: Participant[] = [...firstResult.data.results].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
        setParticipants(allParticipants);
        setHasLoaded(true);

        const totalCount = firstResult.data.count;
        const actualPageSize = firstResult.data.results.length;
        const totalPages = Math.ceil(totalCount / actualPageSize);
        
        // If there are more pages, fetch them
        if (totalPages > 1) {
          const baseEndpoint = "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/all/";
          
          // Helper function to fetch a single page with retry logic (reduced retries)
          const fetchPageWithRetry = async (page: number, retries = 2): Promise<Participant[]> => {
            const pageUrl = firstResult.data.next
              ? firstResult.data.next.replace(/page=\d+/, `page=${page}`).replace(/page_size=\d+/, `page_size=${pageSize}`)
              : `${baseEndpoint}?page=${page}&page_size=${pageSize}`;
            
            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                // Create abort controller for timeout with longer timeout for slower server
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
                
                const response = await fetch(pageUrl, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  signal: controller.signal,
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                  if (response.status === 408 || response.status === 504) {
                    console.warn(`Timeout fetching page ${page}, attempt ${attempt}/${retries}`);
                  }
                  if (attempt === retries) {
                    console.warn(`Failed to fetch page ${page} after ${retries} attempts: ${response.statusText}`);
                    return [];
                  }
                  // Wait before retry (exponential backoff with longer delays)
                  const retryDelay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
                  console.log(`Page ${page} failed (attempt ${attempt}/${retries}), retrying in ${retryDelay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, retryDelay));
                  continue;
                }

                const result: ApiResponse = await response.json();
                if (result.success && result.data && result.data.results) {
                  return result.data.results;
                }
                
                if (attempt === retries) {
                  console.warn(`Invalid response for page ${page} after ${retries} attempts`);
                  return [];
                }
                
                const retryDelay = Math.pow(2, attempt) * 2000;
                console.log(`Page ${page} error (attempt ${attempt}/${retries}), retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              } catch (error: any) {
                // Check if it's an abort/timeout error
                if (error.name === 'AbortError' || error.message?.includes('timeout')) {
                  console.warn(`Timeout fetching page ${page}, attempt ${attempt}/${retries}`);
                }
                
                if (attempt === retries) {
                  console.error(`Error fetching page ${page} after ${retries} attempts:`, error);
                  return [];
                }
                // Wait before retry with longer delay
                const retryDelay = Math.pow(2, attempt) * 2000;
                console.log(`Page ${page} catch error (attempt ${attempt}/${retries}), retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              }
            }
            return [];
          };
          
          // Fetch pages very conservatively to avoid overwhelming the server
          // Only fetch 2 pages at a time with significant delays
          const batchSize = 2; // Very conservative: only 2 concurrent requests
          const delayBetweenBatches = 500; // 500ms delay between batches
          const additionalParticipants: Participant[] = [];
          
          // Process pages in small batches with delays
          for (let i = 2; i <= totalPages; i += batchSize) {
            const batchEnd = Math.min(i + batchSize - 1, totalPages);
            console.log(`Fetching pages ${i} to ${batchEnd} of ${totalPages}...`);
            
            const batchPromises: Promise<Participant[]>[] = [];
            for (let page = i; page <= batchEnd; page++) {
              batchPromises.push(fetchPageWithRetry(page));
            }
            
            // Wait for current batch to complete
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Collect successful results from this batch
            batchResults.forEach((result, batchIndex) => {
              if (result.status === 'fulfilled' && result.value.length > 0) {
                additionalParticipants.push(...result.value);
                
                // Combine all participants and sort by registration date (newest first)
                const allParticipants = [...firstResult.data.results, ...additionalParticipants];
                const sortedParticipants = allParticipants.sort((a, b) => {
                  const dateA = new Date(a.created_at || 0).getTime();
                  const dateB = new Date(b.created_at || 0).getTime();
                  return dateB - dateA; // Descending order (newest first)
                });
                
                // Update state progressively after each batch
                setParticipants(sortedParticipants);
              } else if (result.status === 'rejected') {
                console.warn(`Page ${i + batchIndex} failed to fetch:`, result.reason);
              }
            });
            
            // Longer delay between batches to give server time to recover
            if (batchEnd < totalPages) {
              console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
              await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
          }
          
          console.log(`Completed fetching ${additionalParticipants.length} additional participants across ${totalPages - 1} pages`);
        }
      } catch (error: any) {
        console.error("Error fetching participants:", error);
        
        // Handle timeout specifically
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          setError("Request timed out. The dataset might be too large. Please try refreshing.");
        } else {
          setError(error.message || "Failed to fetch participants");
        }
        
        if (!silent) {
          const errorMessage = error.name === 'AbortError' 
            ? "Request timed out due to large dataset. Please try again." 
            : `Failed to fetch participants: ${error.message}`;
          alert(errorMessage);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
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
    silentRefresh: () => fetchParticipants(localStorage.getItem("token") || "", false, true),
  };
};