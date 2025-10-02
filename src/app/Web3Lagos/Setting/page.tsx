"use client"

import React, { useEffect, useState } from 'react'
import { 
  fetchAllDiscount, 
  deleteCode, 
  generateDiscountCode, 
  validateDiscountCode,
  generateCustomDiscountCode,
  DiscountCode,
  DiscountCodeValidation,
  PaginationInfo
} from '@/hooks/discount'
import { PAGINATION_CONFIG, DISCOUNT_CONFIG } from '@/lib/config'
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Users, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { BeatLoader } from 'react-spinners'
import { Pagination } from '@/Components'

function page() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [newDiscountCode, setNewDiscountCode] = useState<DiscountCode | null>(null)
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<number>>(new Set());
  const [pageLoadingStates, setPageLoadingStates] = useState<Record<number, boolean>>({});
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [showAllDiscount, setShowAllDiscount] = useState(false);
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [showCreateCustomDiscount, setShowCreateCustomDiscount] = useState(false);
  const [validate, setValidateDiscount] = useState(false)
  const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<string>(""); 
  const [Valmessage, setValMessage] = useState<string>(""); 
  const [filterDate, setFilterDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [itemsPerPage] = useState(PAGINATION_CONFIG.DEFAULT_LIMIT);

  // Custom discount code state
  const [customCode, setCustomCode] = useState("");
  const [customOffset, setCustomOffset] = useState(1);
  const [customPercentage, setCustomPercentage] = useState(0);

  // Usage records visibility
  const [expandedUsage, setExpandedUsage] = useState<Record<number, boolean>>({});

  const [OpenOverlay, setOpenOverlay] = useState(false);
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState<{
          delete: { [key: number]: boolean }; 
          other: boolean; 
          add: boolean;
          new: boolean;
          validate: boolean,
          view:{ [key: number]: boolean };
          custom: boolean;
        }>({
          delete: {}, 
          other: false,
          add: false,
          new: false,
          validate: false,
          view: {},
          custom: false
        });
  const [searchQuery, setSearchQuery] = useState("");


     useEffect(() => {
             const token = localStorage.getItem("token") || "";
             if (token) {
               setToken(token);
               loadAllDiscountCodes(token);
             } else {
               setError("No authentication token found. Please log in again.");
             }
   }, []);

   const loadAllDiscountCodes = async (token: string) => {
     try {
       // First, get the first page immediately to show data
       setLoading(prev => ({ ...prev, other: true }));
       setPageLoadingStates(prev => ({ ...prev, 1: true }));
       
       const firstPageResponse = await fetchAllDiscount(
         token, 
         (codes) => setDiscountCodes(codes), 
         setError, 
         undefined,
         (pagination) => {
           setPaginationInfo({
             current_page: 1,
             total_pages: pagination.total_pages,
             total_count: pagination.total_count,
             limit: 50,
             has_next: pagination.total_pages > 1,
             has_previous: false,
             next_page: pagination.total_pages > 1 ? 2 : null,
             previous_page: null
           });
           
           // Mark first page as loaded
           setLoadedPages(prev => new Set([...Array.from(prev), 1]));
           setPageLoadingStates(prev => ({ ...prev, 1: false }));
           
           // Start loading other pages in background
           if (pagination.total_pages > 1) {
             loadRemainingPagesInBackground(token, pagination.total_pages);
           }
         },
         { page: 1, limit: 50 }
       );
       
       setCurrentPage(1);
       
     } catch (error) {
       showNotification('error', 'Failed to load discount codes. Please try again.');
     } finally {
       setLoading(prev => ({ ...prev, other: false }));
     }
   };

   const loadRemainingPagesInBackground = async (token: string, totalPages: number) => {
     // Load pages 2+ in background without blocking UI
     for (let page = 2; page <= totalPages; page++) {
       setPageLoadingStates(prev => ({ ...prev, [page]: true }));
       
       try {
         await fetchAllDiscount(
           token, 
           (codes) => {
             // Append new codes to existing ones, avoiding duplicates
             setDiscountCodes(prev => {
               const existingIds = new Set(prev.map(code => code.id));
               const newCodes = codes.filter(code => !existingIds.has(code.id));
               return [...prev, ...newCodes];
             });
           }, 
           setError, 
           undefined,
           undefined,
           { page, limit: 50 }
         );
         
         // Mark page as loaded
         setLoadedPages(prev => new Set([...Array.from(prev), page]));
         setPageLoadingStates(prev => ({ ...prev, [page]: false }));
         
       } catch (error) {
         console.error(`Failed to load page ${page}:`, error);
         setPageLoadingStates(prev => ({ ...prev, [page]: false }));
       }
     }
   };

     const handleDelete = async (id: number) => {
      setLoading((prev) => ({  ...prev,  delete: {...prev.delete,  [id]: true,  }, }));
      try {
        await deleteCode(id, token, (message: string) => {
          setDelMessage((prev) => ({
            ...prev,
            [id]: message,
          }));
          showNotification('success', `Discount code deleted successfully!`);
        });
    
        // Remove the deleted code from local state
        setDiscountCodes(prev => prev.filter(code => code.id !== id));
      } catch (error) {
        console.error("Error deleting the course:", error);
        setDelMessage((prev) => ({
          ...prev,
          [id]: "An error occurred while deleting the course.",
        }));
        showNotification('error', 'Failed to delete discount code. Please try again.');
      } finally {
        setLoading((prev) => ({...prev, delete: {...prev.delete, [id]: false, }, }));
      }
    };
    const handleGenerateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      if (quantity < 1) {
        showNotification('error', "Please enter a valid quantity (minimum 1).");
        return;
      }
  
      if (percentage < 1 || percentage > 100) {
        showNotification('error', "Please enter a valid percentage (1-100).");
        return;
      }
  
      try {
      await generateDiscountCode(quantity, percentage, token, setNewDiscountCode, setMessage, setLoading);
        showNotification('success', `Successfully generated ${quantity} discount code(s)!`);
      } catch (error) {
        showNotification('error', 'Failed to generate discount codes. Please try again.');
      }
    };

    const handleValidateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      if (!code.trim()) {
        showNotification('error', "Please enter a discount code to validate");
        return;
      }
  
      try {
        const result = await validateDiscountCode(code, undefined, token);
        if (result.valid) {
          setValMessage(`✅ Code is valid! ${result.percentage}% discount, ${result.remainingUses} uses remaining`);
          showNotification('success', `Code "${code}" is valid! ${result.percentage}% discount available.`);
        } else {
          setValMessage(`❌ ${result.message}`);
          showNotification('error', `Code "${code}" is invalid: ${result.message}`);
        }
      } catch (error) {
        showNotification('error', 'Failed to validate discount code. Please try again.');
      }
    };

    const handleGenerateCustomDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      if (!customCode.trim()) {
        showNotification('error', "Please enter a custom code");
        return;
      }
  
      if (customOffset < 1) {
        showNotification('error', "Please enter a valid offset (minimum 1)");
        return;
      }
  
      if (customPercentage < 1 || customPercentage > 100) {
        showNotification('error', "Please enter a valid percentage (1-100)");
        return;
      }
  
      try {
        await generateCustomDiscountCode(
          customCode, 
          customOffset, 
          customPercentage, 
          token, 
          setNewDiscountCode, 
          setMessage, 
          setLoading
        );
        showNotification('success', `Custom discount code "${customCode}" created successfully!`);
      } catch (error) {
        showNotification('error', 'Failed to create custom discount code. Please try again.');
      }
    };

    const [filterOption, setFilterOption] = useState("all"); 
    
    // Clear selection when filters change
    const handleFilterChange = (newFilter: string) => {
      setFilterOption(newFilter);
      clearSelection();
    };

    // Clear individual filters
    const clearSearchFilter = () => {
      setSearchQuery("");
      clearSelection();
    };

    const clearStatusFilter = () => {
      setFilterOption("all");
      clearSelection();
    };

    const clearDateFilter = () => {
      setFilterDate("");
      clearSelection();
    };

    const clearAllFilters = () => {
      setSearchQuery("");
      setFilterOption("all");
      setFilterDate("");
      clearSelection();
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
      return searchQuery !== "" || filterOption !== "all" || filterDate !== "";
    }; 
    
    const handlePageChange = (page: number) => {
      clearSelection(); // Clear selection when changing pages
      setCurrentPage(page);
      
      // If this page isn't loaded yet, show loading state
      if (!loadedPages.has(page)) {
        setPageLoadingStates(prev => ({ ...prev, [page]: true }));
      }
    };

    // Filter discount codes (client-side filtering for current page)
    const filteredDiscounts = (discountCodes || []).filter((discount) => {
      const matchesSearch = discount.code.toLowerCase().includes(searchQuery.toLowerCase());
  
      const discountDate = new Date(discount.created_at).toISOString().split("T")[0]; 
  
      const matchesFilter =
          filterOption === "all" ||
          (filterOption === "used" && discount.is_used) ||
          (filterOption === "unused" && !discount.is_used) ||
          (filterOption === "single-use" && discount.offset === 1) ||
          (filterOption === "multi-use" && discount.offset > 1);
  
      const matchesDate = filterDate ? discountDate === filterDate : true;
  
      return matchesSearch && matchesFilter && matchesDate;
    });

    // Client-side pagination for filtered results
    const getPaginatedResults = () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredDiscounts.slice(startIndex, endIndex);
    };

    const paginatedResults = getPaginatedResults();
    const totalFilteredPages = Math.ceil(filteredDiscounts.length / itemsPerPage);

    const toggleUsageExpansion = (id: number) => {
      setExpandedUsage(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };
  
       const toggleAllDiscount = () => {
      setShowAllDiscount((prev) => !prev);
      setOpenOverlay((prev) => !prev);
    };
    const toggleCreateDiscount = () => {
    setShowCreateDiscount((prev) => !prev);
   setOpenOverlay((prev) => !prev);
    };

    const toggleCreateCustomDiscount = () => {
      setShowCreateCustomDiscount((prev) => !prev);
      setOpenOverlay((prev) => !prev);
    };

    const toggleValidateDiscount = () => {
      setValidateDiscount((prev) => !prev);
      setOpenOverlay((prev) => !prev);
    };

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000); // Auto-hide after 5 seconds
    };

    // Selection management functions
    const toggleCodeSelection = (codeId: number) => {
      setSelectedCodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(codeId)) {
          newSet.delete(codeId);
        } else {
          newSet.add(codeId);
        }
        return newSet;
      });
    };

    const selectAllCodes = () => {
      const allIds = new Set(paginatedResults.map(code => code.id));
      setSelectedCodes(allIds);
    };

    const clearSelection = () => {
      setSelectedCodes(new Set());
    };

    const isAllSelected = () => {
      return paginatedResults.length > 0 && selectedCodes.size === paginatedResults.length;
    };

    const isPartiallySelected = () => {
      return selectedCodes.size > 0 && selectedCodes.size < paginatedResults.length;
    };

    const handleCopySelectedCodes = () => {
      if (selectedCodes.size === 0) {
        showNotification('error', 'Please select at least one discount code to copy.');
        return;
      }

      const selectedCodesList = paginatedResults
        .filter(discount => selectedCodes.has(discount.id))
        .map(discount => discount.code)
        .join("\n");
    
      navigator.clipboard.writeText(selectedCodesList);
      showNotification('success', `${selectedCodes.size} selected discount code(s) copied to clipboard!`);
    };

    const handleCopyAllFilteredCodes = () => {
      const filteredCodes = filteredDiscounts.map((discount) => discount.code).join("\n");
    
      if (filteredCodes) {
        navigator.clipboard.writeText(filteredCodes);
        showNotification('success', `All ${filteredDiscounts.length} filtered discount codes copied to clipboard!`);
      } else {
        showNotification('error', 'No matching discount codes available.');
      }
    };
                   
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">

      {/* Notification Banner */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
            'bg-blue-100 border border-blue-300 text-blue-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notification.type === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Discount Code Management</h1>
          <p className="text-gray-600">Manage and monitor your discount codes with advanced analytics</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            <button
              onClick={() => loadAllDiscountCodes(token)}
              disabled={loading.other}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading.other ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Codes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading.other ? (
                    <BeatLoader size={8} color="#3B82F6" />
                  ) : (
                    paginationInfo?.total_count || discountCodes.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used Codes</p>
                <p className="text-3xl font-bold text-red-600">
                  {loading.other ? (
                    <BeatLoader size={8} color="#EF4444" />
                  ) : (
                    discountCodes.filter(code => code.is_used).length
                  )}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Codes</p>
                <p className="text-3xl font-bold text-green-600">
                  {loading.other ? (
                    <BeatLoader size={8} color="#10B981" />
                  ) : (
                    discountCodes.filter(code => !code.is_used).length
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usage Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {loading.other ? (
                    <BeatLoader size={8} color="#8B5CF6" />
                  ) : discountCodes.length > 0 ? (
                    `${Math.round((discountCodes.filter(code => code.is_used).length / discountCodes.length) * 100)}%`
                  ) : (
                    "0%"
                  )}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </motion.div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleValidateDiscount}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Verify Code</h3>
                <p className="text-sm text-gray-500">Check code validity</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleAllDiscount}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View All Codes</h3>
                <p className="text-sm text-gray-500">{paginationInfo?.total_count || 0} total codes</p>
              </div>
          </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleCreateDiscount}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Generate Random</h3>
                <p className="text-sm text-gray-500">Bulk code creation</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleCreateCustomDiscount}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Custom</h3>
                <p className="text-sm text-gray-500">Custom code with limits</p>
              </div>
            </div>
          </motion.button>
          </div>



          {/* Overlay */}
          {OpenOverlay && (
                  <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40"
                  onClick={() => {
                    setShowAllDiscount(false);
                    setShowCreateDiscount(false);
                    setShowCreateCustomDiscount(false);
                    setValidateDiscount(false);
                    setOpenOverlay(false);
                  }}
                  />
              )}


                 {/* Modals */}
     <AnimatePresence>
            {showAllDiscount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Discount Codes</h2>
                      {loading.other && (
                        <p className="text-sm text-blue-600 flex items-center gap-2 mt-1">
                          <BeatLoader size={8} color="#3B82F6" />
                          Loading first page...
                        </p>
                      )}
                      {!loading.other && pageLoadingStates[currentPage] && (
                        <p className="text-sm text-orange-600 flex items-center gap-2 mt-1">
                          <BeatLoader size={8} color="#F59E0B" />
                          Loading page {currentPage}...
                        </p>
                      )}
                      {!loading.other && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            Page {currentPage} of {totalFilteredPages} ({filteredDiscounts.length} filtered, {discountCodes.length} total codes)
                          </p>
                          {Object.keys(pageLoadingStates).some(page => pageLoadingStates[parseInt(page)]) && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Loading other pages in background...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  <button
                    onClick={toggleAllDiscount}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
                </div>

                  {/* Filters and Search */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                {/* Search Bar */}
                    <div className="mb-4">
                      <div className="relative max-w-md">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                <input
                  type="text"
                            placeholder="Search by discount code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                          {searchQuery && (
                            <button
                              onClick={clearSearchFilter}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Status Filter */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <div className="relative">
                          <select
                            value={filterOption}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                          >
                            <option value="all">All Codes</option>
                            <option value="used">Used</option>
                            <option value="unused">Unused</option>
                            <option value="single-use">Single-use</option>
                            <option value="multi-use">Multi-use</option>
                          </select>
                          {filterOption !== "all" && (
                            <button
                              onClick={clearStatusFilter}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Date Filter */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Date:</label>
                        <div className="relative">
                <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                          />
                          {filterDate && (
                            <button
                              onClick={clearDateFilter}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                </div>

                      {/* Clear All Filters */}
                      {hasActiveFilters() && (
                        <button
                          onClick={clearAllFilters}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear All
                        </button>
                      )}
              
                      {/* Selection Controls */}
                      {paginatedResults.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={isAllSelected() ? clearSelection : selectAllCodes}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-2 text-sm border border-gray-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isAllSelected() ? 'Deselect All' : 'Select All'}
                          </button>
                          
                          {selectedCodes.size > 0 && (
                            <span className="text-sm text-gray-600 px-2 py-1 bg-blue-50 rounded-md">
                              {selectedCodes.size} selected
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => loadAllDiscountCodes(token)}
                          disabled={loading.other}
                          className="px-3 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2 text-sm border border-gray-300"
                        >
                          <RefreshCw size={14} className={loading.other ? "animate-spin" : ""} />
                          Refresh
                        </button>

                                  <button
                          onClick={handleCopySelectedCodes}
                          disabled={selectedCodes.size === 0}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Selected ({selectedCodes.size})
                        </button>

                        <button
                          onClick={handleCopyAllFilteredCodes}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy All
              </button>
                      </div>
                    </div>
                  </div>
                

                  {/* Discount Codes Table */}
                  <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                      {loading.other ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <BeatLoader size={20} color="#3B82F6" />
                            <p className="mt-4 text-gray-600">Loading first page...</p>
                          </div>
                        </div>
                      ) : pageLoadingStates[currentPage] ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <BeatLoader size={20} color="#F59E0B" />
                            <p className="mt-4 text-gray-600">Loading page {currentPage}...</p>
                          </div>
                        </div>
                      ) : error ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                              onClick={() => loadAllDiscountCodes(token)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              Try Again
                            </button>
                          </div>
                        </div>
                      ) : paginatedResults.length > 0 ? (
                        <div className="grid gap-4 p-6">
                          {paginatedResults.map((discount) => (
                            <motion.div
                        key={discount.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${
                                selectedCodes.has(discount.id) 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-4">
                                    {/* Selection Checkbox */}
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedCodes.has(discount.id)}
                                        onChange={() => toggleCodeSelection(discount.id)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                      />
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-mono font-bold text-gray-900">{discount.code}</span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        discount.is_used 
                                          ? 'bg-red-100 text-red-800' 
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {discount.is_used ? 'Used' : 'Available'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">Type:</span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        discount.offset === 1 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {discount.offset === 1 ? 'Single-use' : `Multi-use (${discount.offset})`}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                      <p className="text-sm text-gray-500">Percentage</p>
                                      <p className="font-semibold text-gray-900">{discount.percentage || 0}%</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Usage</p>
                                      <p className="font-semibold text-gray-900">{discount.usage_count}/{discount.offset}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Remaining</p>
                                      <p className="font-semibold text-gray-900">{discount.remaining_uses}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Created</p>
                                      <p className="font-semibold text-gray-900">{new Date(discount.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>

                                  {/* Usage Records */}
                                  {discount.usage_records && discount.usage_records.length > 0 && (
                                    <div className="mt-4">
                                      <button
                                        onClick={() => toggleUsageExpansion(discount.id)}
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        <Users size={16} />
                                        {expandedUsage[discount.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        {expandedUsage[discount.id] ? 'Hide' : 'Show'} Usage Records ({discount.usage_records.length})
                                      </button>
                                      
                                      {expandedUsage[discount.id] && (
                                        <div className="mt-3 space-y-2">
                                          {discount.usage_records.map((usage) => (
                                            <div key={usage.id} className="p-3 bg-gray-50 rounded-lg border">
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                <div>
                                                  <span className="text-gray-500">Email:</span>
                                                  <p className="font-medium">{usage.user_email}</p>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Used:</span>
                                                  <p className="font-medium">{new Date(usage.used_at).toLocaleString()}</p>
                                                </div>
                                                {usage.participant_id && (
                                                  <div>
                                                    <span className="text-gray-500">Participant ID:</span>
                                                    <p className="font-medium">{usage.participant_id}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                  <button 
                                    onClick={() => handleDelete(discount.id)}
                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete code"
                                  >
                                    {loading.delete[discount.id] ? <BeatLoader size={8} /> : <Trash2 size={18} />}
                                  </button>
                                </div>
                        </div>

                        {Delmessage[discount.id] && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">{Delmessage[discount.id]}</p>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-500 text-lg">No matching discount codes found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                            </div>
                            )}
                      </div>
                  </div>

                  {/* Pagination */}
                  <div className="p-6 border-t border-gray-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalFilteredPages}
                      onPageChange={handlePageChange}
                      loading={loading.other || pageLoadingStates[currentPage]}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Create Discount Modal */}
            {showCreateDiscount && (
                <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-[10%] left-1/2 transform -translate-x-1/2 w-full max-w-3xl h-[700px] bg-white p-6 rounded-lg shadow-lg z-50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Generate new codes</h2>
                  <button
                    onClick={toggleCreateDiscount}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Discount Codes List */}
                <h2>Generate discount by specifying how many you want (1, 2, 3.....)</h2>
                <form className='mt-5' onSubmit={handleGenerateDiscount}>
                <div className='flex flex-col gap-2 text-lg font-semibold'>
                    <label>Number of discount codes</label>
                  <input type="number" className='border p-2 outline-none' onChange={(e) => setQuantity(Number(e.target.value))} min={1} />
                  
                  <label>Discount Percentage</label>
                  <input 
                    type="number" 
                    className='border p-2 outline-none' 
                    onChange={(e) => setPercentage(Number(e.target.value))} 
                    min={1} 
                    max={100}
                    placeholder="Enter percentage (1-100)"
                  />
                </div>

                <button type="submit" className='bg-black text-white px-3 py-2 rounded-md mt-3'>{loading.new ? "Generating..." : "Generate"} </button>
                </form>

                <div className="max-h-[50vh] overflow-y-auto space-y-3">
                  {newDiscountCode ? (
                    <div className="p-3 border rounded-lg bg-gray-100 space-y-2 mt-2">
                           <p>
                        <strong>Code:</strong> {newDiscountCode.code}
                        </p>
                        <p>
                        <strong>Percentage:</strong> {newDiscountCode.percentage}%
                        </p>
                        <p>
                        <strong>Used:</strong> {newDiscountCode.is_used ? "Yes" : "No"}
                        </p>
                        <p>
                        <strong>Validity:</strong> {newDiscountCode.validity}
                        </p>
                        <p>
                        <strong>Claimant:</strong> {newDiscountCode.claimant}
                        </p>
                      </div>
                  ) : (
                    <p className="text-gray-500 mt-5">{error ? "Unable to create Discount code" : "Create Discount code"}</p>
                  ) }
                </div>



                </motion.div>
            )}

            {/* Create Custom Discount Modal */}
            {showCreateCustomDiscount && (
                <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-[10%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl h-[600px] bg-white p-6 rounded-lg shadow-lg z-50 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Create Custom Discount Code</h2>
                  <button
                    onClick={toggleCreateCustomDiscount}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Custom Code Details</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create a custom discount code with specific usage limits. Perfect for special promotions or events.
                    </p>
                  </div>

                  <form onSubmit={handleGenerateCustomDiscount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Code (max 16 characters)
                      </label>
                      <input 
                        type="text" 
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., SUMMER2024"
                        maxLength={DISCOUNT_CONFIG.MAX_CODE_LENGTH}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usage Limit (how many people can use this code)
                      </label>
                      <input 
                        type="number" 
                        value={customOffset}
                        onChange={(e) => setCustomOffset(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={DISCOUNT_CONFIG.MIN_OFFSET}
                        max={DISCOUNT_CONFIG.MAX_OFFSET}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Set to 1 for single-use, or higher for multi-use codes
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Percentage
                      </label>
                      <input 
                        type="number" 
                        value={customPercentage}
                        onChange={(e) => setCustomPercentage(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={DISCOUNT_CONFIG.MIN_PERCENTAGE}
                        max={DISCOUNT_CONFIG.MAX_PERCENTAGE}
                        placeholder="Enter percentage (1-100)"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                      disabled={loading.custom}
                    >
                      {loading.custom ? "Creating..." : "Create Custom Code"}
                    </button>
                  </form>

                  {message && (
                    <div className={`p-3 rounded-lg ${
                      message.includes("successfully") 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}>
                      {message}
                    </div>
                  )}

                  {newDiscountCode && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Created Code:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Code:</strong> {newDiscountCode.code}</div>
                        <div><strong>Percentage:</strong> {newDiscountCode.percentage}%</div>
                        <div><strong>Type:</strong> {newDiscountCode.offset === 1 ? 'Single-use' : `Multi-use (${newDiscountCode.offset})`}</div>
                        <div><strong>Status:</strong> {newDiscountCode.is_used ? "Used" : "Available"}</div>
                        <div><strong>Remaining:</strong> {newDiscountCode.remaining_uses}</div>
                        <div><strong>Created:</strong> {new Date(newDiscountCode.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Validate discount */}
            {validate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Validate Code</h2>
                    <button
                      onClick={toggleValidateDiscount}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleValidateDiscount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                      <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter discount code"
                      />
                </div>

                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                      disabled={loading.validate}
                    >
                      {loading.validate ? "Validating..." : "Validate Code"}
                    </button>
                </form>

                  {Valmessage && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      Valmessage.includes("✅") 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}>
                      {Valmessage}
                    </div>
                  )}
                </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  )
}

export default page;