import { error } from "console";
import { API_CONFIG, PAGINATION_CONFIG, DISCOUNT_CONFIG } from '@/lib/config';

// Types for the new discount code system
export interface DiscountCodeUsage {
  id: number;
  user_email: string;
  used_at: string;
  participant_id?: number;
}

export interface DiscountCode {
  id: number;
  code: string;
  created_at: string;
  is_used: boolean;
  validity: string;
  claimant: string | null;
  percentage: number;
  offset: number;
  usage_count: number;
  remaining_uses: number;
  usage_records: DiscountCodeUsage[];
}

export interface DiscountCodeValidation {
  valid: boolean;
  percentage?: number;
  offset?: number;
  usageCount?: number;
  remainingUses?: number;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: PaginationInfo;
}

// Fetch all discount codes with pagination support
export const fetchAllDiscount = async (
    token: string, 
    setDiscountCodes: (data: DiscountCode[]) => void, 
    setError: (message: string | null) => void,
    setLoading?: (value: (prev: any) => any) => void,
    setPagination?: (pagination: PaginationInfo) => void,
    pagination?: PaginationParams
) => { 

    if (setLoading) {
        setLoading((prev: any) => ({ ...prev, other: true }));
      }

    try {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || PAGINATION_CONFIG.DEFAULT_LIMIT;
        
        const response = await fetch(
            `${API_CONFIG.API_URL}/discount/all/?page=${page}&limit=${limit}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
            }
          );

          const data = await response.json();

          if(response.ok) { 
            // Handle the actual API response structure
            const discountCodes = data.data?.results || data.data || [];
            const paginationInfo = data.data?.pagination;
            
            setDiscountCodes(discountCodes);
            if (setPagination && paginationInfo) {
              setPagination(paginationInfo);
            }
          } else {
            setError(data.message || "Failed to fetch discount codes");
          }

    } catch (error) {
        console.log(error);
        setError("Network error occurred");
    } finally {
        if (setLoading) {
            setLoading((prev: any) => ({ ...prev, other: false }));
          }
    }
};

// Fetch all discount codes from all pages in the background
export const fetchAllDiscountCodesBackground = async (
    token: string, 
    setDiscountCodes: (data: DiscountCode[]) => void, 
    setError: (message: string | null) => void,
    setLoading?: (value: (prev: any) => any) => void,
    setPagination?: (pagination: PaginationInfo) => void
) => { 

    if (setLoading) {
        setLoading((prev: any) => ({ ...prev, other: true }));
    }

    try {
        // First, get the first page to determine total pages
        const firstPageResponse = await fetch(
            `${API_CONFIG.API_URL}/discount/all/?page=1&limit=${PAGINATION_CONFIG.DEFAULT_LIMIT}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
            }
        );

        const firstPageData = await firstPageResponse.json();

        if (!firstPageResponse.ok) {
            setError(firstPageData.message || "Failed to fetch discount codes");
            return;
        }

        // Extract pagination info from the response
        const paginationInfo = firstPageData.data?.pagination;
        
        if (setPagination && paginationInfo) {
            setPagination(paginationInfo);
        }

        // Get initial discount codes from first page
        const allDiscountCodes: DiscountCode[] = firstPageData.data?.results || firstPageData.data || [];
        
        // Check if there are more pages using has_next and next_page
        if (!paginationInfo?.has_next || paginationInfo.next_page === null) {
            // Only one page, just set the data
            setDiscountCodes(allDiscountCodes);
            return;
        }

        // Fetch remaining pages sequentially using next_page (more reliable than total_pages)
        const fetchPageWithRetry = async (page: number, maxRetries = 3): Promise<{ success: boolean; data?: any; nextPage?: number | null }> => {
            const url = `${API_CONFIG.API_URL}/discount/all/?page=${page}&limit=${PAGINATION_CONFIG.DEFAULT_LIMIT}`;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const response = await fetch(url, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `${token}`,
                        },
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    if (data.success && data.data?.results) {
                        return { 
                            success: true, 
                            data: data,
                            nextPage: data.data.pagination?.next_page ?? null
                        };
                    } else {
                        throw new Error("Invalid response structure");
                    }
                } catch (error: any) {
                    if (attempt < maxRetries - 1) {
                        const delay = 1000 * Math.pow(2, attempt); // Exponential backoff
                        console.warn(`Retrying page ${page} (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        console.error(`Failed to fetch page ${page} after ${maxRetries} attempts:`, error);
                        return { success: false, nextPage: null };
                    }
                }
            }
            return { success: false, nextPage: null };
        };

        // Fetch remaining pages sequentially using next_page
        let currentPage = paginationInfo.next_page;
        const failedPages: number[] = [];
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 5;
        
        while (currentPage !== null) {
            const result = await fetchPageWithRetry(currentPage);
            
            if (result.success && result.data) {
                // Reset consecutive failures on success
                consecutiveFailures = 0;
                
                // Add results from this page
                const pageResults = result.data.data?.results || [];
                allDiscountCodes.push(...pageResults);
                
                // Update state progressively
                setDiscountCodes([...allDiscountCodes]);
                
                // Move to next page
                currentPage = result.nextPage ?? null;
            } else {
                // Page failed after retries
                failedPages.push(currentPage);
                consecutiveFailures++;
                console.warn(`Skipping page ${currentPage} due to repeated failures. Continuing with next page...`);
                
                // If we have too many consecutive failures, stop
                if (consecutiveFailures >= maxConsecutiveFailures) {
                    console.error(`Stopping pagination after ${maxConsecutiveFailures} consecutive page failures.`);
                    break;
                }
                
                // Try to continue by incrementing (pages are sequential)
                currentPage = currentPage + 1;
                
                // Safety check: if we've failed too many total pages, stop
                if (failedPages.length > 20) {
                    console.error("Too many total page failures. Stopping pagination.");
                    break;
                }
            }
        }
        
        if (failedPages.length > 0) {
            console.warn(`Some discount code pages failed to load (pages: ${failedPages.join(', ')})`);
            setError(`Some pages failed to load (pages: ${failedPages.join(', ')}). Data may be incomplete.`);
        } else {
            console.log(`Successfully fetched all discount codes from all pages`);
        }

    } catch (error) {
        console.log(error);
        setError("Network error occurred while fetching all pages");
    } finally {
        if (setLoading) {
            setLoading((prev: any) => ({ ...prev, other: false }));
        }
    }
};

export const deleteCode = async ( id: number, token: string,
    setDelMessage: (data: string) => void) => {

        try {
            const response = await fetch(
              `${API_CONFIG.API_URL}/discount/${id}/`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `${token}`, 
                },
              }
            );

            if (response.status === 204) {
                // Successful delete with no content
                console.log("Code deleted successfully.");
                setDelMessage("Code deleted successfully.");
                return;
              }

              
            const data = await response.json();
        
            if (response.ok) {
              console.log("Course deleted:", data);
              setDelMessage("Code deleted successfully");
            } else {
              const data = await response.json();
              throw new Error(data.message || "Failed to delete course");
            }

            if (data.message.includes("does not exist")) {
                setDelMessage("This discount code does not exist.");
              } else {
                setDelMessage(data.message || "Failed to delete the code");
              }
            
          } catch (error) {
            console.error("Error deleting the course:", error);
            setDelMessage("Error deleting the Course");
          } 

}


export const generateDiscountCode = async (
  quantity: number,
  percentage: number,
  token: string, 
  setNewDiscountCodes: (data: any) => void, 
  setMessage: (data: string) => void,
  setLoading?: (value: (prev: any) => any) => void 
) => {

  if (setLoading) {
    setLoading((prev: any) => ({ ...prev, new: true }));
  }

  try {
    const response = await fetch(`${API_CONFIG.API_URL}/discount/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`, 
      },
      body: JSON.stringify({ quantity, percentage }),
    });

    const data = await response.json();

    if (response.ok) {
      setNewDiscountCodes(data.data);
    } else {
      throw new Error(data.message || "Failed to generate discount code");
    }

  } catch (error: any) {
    console.error("Error generating discount code:", error);
    setMessage(error.message || "Something went wrong");
  } finally {
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, new: false }));
    }
  }
};


// New validation function for multi-use discount codes
export const validateDiscountCode = async (
  code: string,
  userEmail?: string,
  token?: string
): Promise<DiscountCodeValidation> => {
  try {
    const requestBody: any = { code };
    if (userEmail) {
      requestBody.user_email = userEmail;
    }

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = token;
    }

    const response = await fetch(`${API_CONFIG.API_URL}/discount/validate/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        valid: true,
        percentage: data.data.percentage,
        offset: data.data.offset,
        usageCount: data.data.usage_count,
        remainingUses: data.data.remaining_uses
      };
    } else {
      return {
        valid: false,
        message: data.message || "Invalid discount code"
      };
    }

  } catch (error: any) {
    console.error("Error validating discount code:", error);
    return {
      valid: false,
      message: "Network error occurred"
    };
  }
};

// Mark discount code usage
export const markDiscountCodeUsage = async (
  code: string,
  userEmail: string,
  participantId?: number,
  token?: string
): Promise<{ success: boolean; message?: string; remainingUses?: number; isUsed?: boolean }> => {
  try {
    const requestBody: any = {
      code,
      user_email: userEmail
    };

    if (participantId) {
      requestBody.participant_id = participantId;
    }

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = token;
    }

    const response = await fetch(`${API_CONFIG.API_URL}/discount/mark_usage/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        remainingUses: data.data.remaining_uses,
        isUsed: data.data.is_used
      };
    } else {
      return {
        success: false,
        message: data.message || "Failed to mark code usage"
      };
    }

  } catch (error: any) {
    console.error("Error marking discount code usage:", error);
    return {
      success: false,
      message: "Network error occurred"
    };
  }
};

// Generate custom discount code
export const generateCustomDiscountCode = async (
  code: string,
  offset: number,
  percentage: number,
  token: string,
  setNewDiscountCode: (data: DiscountCode) => void,
  setMessage: (data: string) => void,
  setLoading?: (value: (prev: any) => any) => void
) => {
  if (setLoading) {
    setLoading((prev: any) => ({ ...prev, new: true }));
  }

  try {
    const response = await fetch(`${API_CONFIG.API_URL}/discount/generate_custom/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`, 
      },
      body: JSON.stringify({ code, offset, percentage }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setNewDiscountCode(data.data);
      setMessage("Custom discount code created successfully!");
    } else {
      throw new Error(data.message || "Failed to generate custom discount code");
    }

  } catch (error: any) {
    console.error("Error generating custom discount code:", error);
    setMessage(error.message || "Something went wrong");
  } finally {
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, new: false }));
    }
  }
};

