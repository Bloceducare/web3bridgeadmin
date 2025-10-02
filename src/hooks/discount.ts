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
            `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/payment/discount/all/?page=${page}&limit=${limit}`,
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
        const totalPages = paginationInfo?.total_pages || 1;
        
        if (setPagination && paginationInfo) {
            setPagination(paginationInfo);
        }

        // If there's only one page, just set the data
        if (totalPages === 1) {
            const discountCodes = firstPageData.data?.results || firstPageData.data || [];
            setDiscountCodes(discountCodes);
            return;
        }

        // Fetch all pages in parallel
        const pagePromises = [];
        for (let page = 1; page <= totalPages; page++) {
            pagePromises.push(
                fetch(
                    `${API_CONFIG.API_URL}/discount/all/?page=${page}&limit=${PAGINATION_CONFIG.DEFAULT_LIMIT}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `${token}`,
                      },
                    }
                )
            );
        }

        const responses = await Promise.all(pagePromises);
        const allData = await Promise.all(responses.map(res => res.json()));

        // Combine all results
        let allDiscountCodes: DiscountCode[] = [];
        allData.forEach(data => {
            if (data.success && data.data?.results) {
                allDiscountCodes = [...allDiscountCodes, ...data.data.results];
            }
        });

        setDiscountCodes(allDiscountCodes);

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
              `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/payment/discount/${id}/`,
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
    const response = await fetch(`https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/payment/discount/generate/`, {
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
    const response = await fetch(`https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/payment/discount/generate_custom/`, {
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

