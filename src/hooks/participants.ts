import { useCallback, useState, useEffect } from "react";
import { ApiResponse, Participant, PaginationInfo } from "@/hooks/interface";
import { useParticipantsStore } from "@/stores/useParticipantsStore";

// Import the store directly for cache checking
const getStoreState = () => useParticipantsStore.getState();

// Base URL for API
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2";

/**
 * Simple function to fetch a single page of participants (backward compatible)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 50)
 * @param token - Authentication token
 * @returns Promise with participants array and pagination info
 */
export async function fetchParticipantsPage(
  page: number = 1,
  limit: number = 50,
  token?: string
): Promise<{ participants: Participant[]; pagination: PaginationInfo }> {
  const authToken = token || localStorage.getItem("token") || "";
  
  if (!authToken) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${BASE_URL}/cohort/participant/all/?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch participants: ${response.statusText}`);
  }

  const result: ApiResponse = await response.json();

  if (!result.success) {
    throw new Error("Failed to fetch participants");
  }

  return {
    participants: result.data.results,
    pagination: result.data.pagination,
  };
}

/**
 * Hook for paginated participant fetching with navigation controls
 * Useful for UI that shows participants page by page
 */
export const useFetchParticipantsPaginated = (
  initialPage: number = 1,
  initialLimit: number = 50,
  token?: string
) => {
  const [data, setData] = useState<Participant[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const fetchData = useCallback(async (page: number) => {
    const authToken = token || localStorage.getItem("token") || "";
    if (!authToken) {
      setError("No authentication token found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/cohort/participant/all/?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error("Failed to fetch participants");
      }

      // Sort by registration date (newest first)
      const sorted = [...result.data.results].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setData(sorted);
      setPagination(result.data.pagination);
    } catch (err) {
      console.error("Error fetching participants:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch participants");
    } finally {
      setIsLoading(false);
    }
  }, [limit, token]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const nextPage = useCallback(() => {
    if (pagination?.has_next) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination]);

  const previousPage = useCallback(() => {
    if (pagination?.has_previous) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination]);

  const goToPage = useCallback((page: number) => {
    if (pagination) {
      // Validate page number
      const maxPage = Math.ceil((pagination.current_page * pagination.limit) / pagination.limit);
      if (page >= 1 && page <= maxPage) {
        setCurrentPage(page);
      }
    } else {
      setCurrentPage(page);
    }
  }, [pagination]);

  return {
    data,
    pagination,
    isLoading,
    error,
    currentPage,
    nextPage,
    previousPage,
    goToPage,
    refetch: () => fetchData(currentPage),
  };
};

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
    async (token: string, forceRefresh = false, silent = false, loadAllPages = true) => {
      // Check cache validity - skip if cache is still valid and not forcing refresh
      const storeState = getStoreState();
      if (!forceRefresh && storeState.isCacheValid() && storeHasLoaded) {
        console.log("Using cached participants data");
        return;
      }

      // Check if already fetching or has loaded and no force refresh
      if (isFetching || (storeHasLoaded && !forceRefresh && !silent && storeState.isCacheValid())) {
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

        // Fetch the first page with new API structure (page & limit instead of page_size)
        const limit = 100; // Items per page
        const firstUrl = `${BASE_URL}/cohort/participant/all/?page=1&limit=${limit}`;
        
        // Add timeout to initial request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
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

        // Only fetch additional pages if explicitly requested (loadAllPages = true)
        // This allows progressive loading - users see data immediately
        if (loadAllPages && firstResult.data.pagination.has_next) {
          const pagination = firstResult.data.pagination;
          let currentPage = pagination.next_page;
          const additionalParticipants: Participant[] = [];
          const failedPages: number[] = [];
          const maxRetries = 3;
          const retryDelay = 1000; // 1 second base delay
          
          // Helper function to fetch a page with retry logic
          const fetchPageWithRetry = async (page: number, retryCount = 0): Promise<{ success: boolean; data?: ApiResponse; nextPage?: number | null }> => {
            const pageUrl = `${BASE_URL}/cohort/participant/all/?page=${page}&limit=${limit}`;
            
            try {
              const pageController = new AbortController();
              const pageTimeoutId = setTimeout(() => pageController.abort(), 30000);
              
              const pageResponse = await fetch(pageUrl, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                signal: pageController.signal,
              });
              
              clearTimeout(pageTimeoutId);

              if (!pageResponse.ok) {
                throw new Error(`HTTP ${pageResponse.status}: ${pageResponse.statusText}`);
              }

              const pageResult: ApiResponse = await pageResponse.json();
              
              if (pageResult.success && pageResult.data && pageResult.data.results) {
                return {
                  success: true,
                  data: pageResult,
                  nextPage: pageResult.data.pagination.next_page,
                };
              } else {
                throw new Error("Invalid response structure");
              }
            } catch (error: any) {
              // Retry logic with exponential backoff
              if (retryCount < maxRetries) {
                const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
                console.warn(`Retrying page ${page} (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchPageWithRetry(page, retryCount + 1);
              } else {
                // Max retries reached, log and return failure
                if (error.name === 'AbortError') {
                  console.error(`Timeout fetching page ${page} after ${maxRetries} retries`);
                } else {
                  console.error(`Failed to fetch page ${page} after ${maxRetries} retries:`, error.message);
                }
                return { success: false };
              }
            }
          };
          
          // Fetch remaining pages using the pagination info
          // Track consecutive failures to avoid infinite loops
          let consecutiveFailures = 0;
          const maxConsecutiveFailures = 5;
          let lastKnownNextPage: number | null = currentPage; // Track last known next page
          
          while (currentPage !== null) {
            const result = await fetchPageWithRetry(currentPage);
            
            if (result.success && result.data) {
              // Reset consecutive failures on success
              consecutiveFailures = 0;
              
              additionalParticipants.push(...result.data.data.results);
              
              // Update state progressively after each page
              const combined = [...firstResult.data.results, ...additionalParticipants];
              const sorted = combined.sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
              });
              setParticipants(sorted);
              
              // Use next_page from pagination (will be null when has_next is false)
              currentPage = result.nextPage ?? null;
              lastKnownNextPage = currentPage; // Update last known next page
            } else {
              // Page failed after retries
              failedPages.push(currentPage);
              consecutiveFailures++;
              console.warn(`Skipping page ${currentPage} due to repeated failures. Continuing with next page...`);
              
              // If we have too many consecutive failures, stop to avoid infinite loops
              if (consecutiveFailures >= maxConsecutiveFailures) {
                console.error(`Stopping pagination after ${maxConsecutiveFailures} consecutive page failures.`);
                break;
              }
              
              // Try to continue to next page
              // Since pages are sequential (1, 2, 3...), we can increment
              // But we also check if we had a last known next page that's higher
              if (lastKnownNextPage !== null && lastKnownNextPage > currentPage) {
                // Use the last known next page if it's ahead
                currentPage = lastKnownNextPage;
              } else {
                // Otherwise, increment sequentially
                currentPage = currentPage + 1;
              }
              
              // Additional safety: if we've failed too many total pages, stop
              if (failedPages.length > 20) {
                console.error("Too many total page failures. Stopping pagination.");
                break;
              }
            }
          }
          
          if (failedPages.length > 0) {
            console.warn(`Completed fetching with ${failedPages.length} failed pages:`, failedPages);
            setError(`Some pages failed to load (pages: ${failedPages.join(', ')}). Data may be incomplete.`);
          } else {
            console.log(`Completed fetching ${additionalParticipants.length} additional participants from all pages`);
          }
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

  // Streaming endpoint for very large datasets (thousands of records)
  const streamParticipants = useCallback(
    async (
      token: string,
      registrationId?: number,
      courseId?: number,
      chunkSize: number = 100,
      onProgress?: (progress: { total: number; current: number }) => void
    ): Promise<Participant[]> => {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      setParticipants([]);

      try {
        let queryParams = `chunk_size=${chunkSize}`;
        if (registrationId) queryParams += `&registration=${registrationId}`;
        if (courseId) queryParams += `&course=${courseId}`;

        const response = await fetch(
          `${BASE_URL}/cohort/participant/stream/?${queryParams}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to stream participants");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const allParticipants: Participant[] = [];

        if (!reader) {
          throw new Error("Stream reader not available");
        }

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const jsonData = JSON.parse(line);
              
              if (jsonData.status === 'started') {
                console.log('Streaming started');
              } else if (jsonData.chunk) {
                allParticipants.push(...jsonData.chunk);
                
                // Update state progressively
                setParticipants([...allParticipants]);
                
                // Report progress if callback provided
                if (onProgress) {
                  onProgress({
                    total: jsonData.total_sent || allParticipants.length,
                    current: allParticipants.length
                  });
                }
              } else if (jsonData.status === 'completed') {
                console.log(`Streaming completed. Total: ${jsonData.total_sent}`);
              }
            } catch (e) {
              console.warn('Failed to parse chunk:', e);
            }
          }
        }

        // Sort by registration date (newest first)
        const sorted = allParticipants.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        setParticipants(sorted);
        setHasLoaded(true);
        return sorted;
      } catch (error: any) {
        console.error("Error streaming participants:", error);
        setError(error.message || "Failed to stream participants");
        throw error;
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [setParticipants, setLoading, setError, setHasLoaded]
  );

  return {
    fetchParticipants,
    sendConfirmationEmail,
    streamParticipants,
    isFetching,
    hasLoaded: storeHasLoaded,
    forceRefresh: () => fetchParticipants(localStorage.getItem("token") || "", true, false, true),
    silentRefresh: () => fetchParticipants(localStorage.getItem("token") || "", false, true, true),
    loadAllPages: () => fetchParticipants(localStorage.getItem("token") || "", false, true, true),
  };
};