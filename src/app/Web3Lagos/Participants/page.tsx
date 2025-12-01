"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { MdDelete, MdEdit, MdAdd, MdEmail, MdRefresh, MdFilterAlt, MdClear } from "react-icons/md";
import { Checkbox } from "@/Components/ui/checkbox";
import { useParticipantsStore } from "@/stores/useParticipantsStore";
import { Participant } from "@/hooks/interface";
import { useRouter } from "next/navigation";
import { FadeLoader, ClipLoader } from "react-spinners";
import { FaEnvelope, FaCheck } from "react-icons/fa";
import { AiFillCheckCircle } from "react-icons/ai";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";

import TablePagination from "./pagination";
import CreateParticipantModal from "./CreateParticipantModal";
import EditParticipantModal from "./EditParticipantModal";
import DeleteParticipantModal from "./DeleteParticipantModal";
import { fetchCohorts } from "@/hooks/useUpdateCourse";
import { downloadCSV } from "@/hooks/useCsvDownload";
import { useParticipants } from "@/hooks/participants";

// Interface definitions
interface Course {
  id: number;
  name: string;
  description: string;
  venue: string[];
  extra_info: string;
  duration: string;
  status: boolean;
  registration: number;
}

interface Cohort {
  id: number;
  name: string;
  cohort: string | null;
  is_open: boolean;
  start_date: string;
  end_date: string;
  registrationFee: string;
  courses: Course;
  registration: number;
}

interface FilterState {
  cohort: string | null;
  paymentStatus: string | null;
  course: string | null;
  status: string | null;
  gender: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
}

export default function ParticipantsTable() {
  // Get data and functions from stores and hooks
  const {
    participants,
    loading,
    hasLoaded,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    lastRefreshed,
  } = useParticipantsStore();
  const { fetchParticipants, sendConfirmationEmail, isFetching, silentRefresh, loadAllPages } =
    useParticipants();

  // Local state
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    cohort: null,
    paymentStatus: null,
    course: null,
    status: null,
    gender: null,
    country: null,
    state: null,
    city: null,
  });
  const [mes, setMess] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [token, setToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [registration, setRegistration] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadings, setLoading] = useState({ other: true });
  const [isLoading, setIsLoading] = useState({
    edit: false,
    delete: false,
    fetch: false,
    create: false,
    email: false,
    confirm: false,
  });
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const router = useRouter();

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch participants - load all pages automatically
  useEffect(() => {
    if (token && !isFetching && !hasFetchedOnce) {
      setHasFetchedOnce(true);
      // Load all pages automatically (loadAllPages = true by default now)
      fetchParticipants(token, false, false, true);
    }
  }, [token, fetchParticipants, isFetching, hasFetchedOnce]);

  // Background refresh every 5 minutes
  useEffect(() => {
    if (!hasLoaded || !token) return;
    
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Background refresh triggered');
        silentRefresh();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [hasLoaded, token, silentRefresh]);

  // Fetch cohorts when token is available
  useEffect(() => {
    if (token) {
      fetchCohorts(token, setRegistration, setError, setLoading);
    }
  }, [token]);

  // Fetch courses when token is available
  const fetchCourses = async () => {
    try {
      const response = await fetch(
        "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/course/all/",
        {
          method: "GET",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);
      const result = await response.json();
      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  // Get unique values for filtering
  const uniqueValues = useMemo(() => {
    const countries = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();
    const genders = new Set<string>();
    const statuses = new Set<string>();

    participants.forEach((p) => {
      if (p.country) countries.add(p.country);
      if (p.state) states.add(p.state);
      if (p.city) cities.add(p.city);
      if (p.gender) genders.add(p.gender);
      if (p.status) statuses.add(p.status);
    });

    return {
      countries: Array.from(countries).sort(),
      states: Array.from(states).sort(),
      cities: Array.from(cities).sort(),
      genders: Array.from(genders).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [participants]);

  // Advanced filtering with DB-query-like capabilities
  useEffect(() => {
    let filtered = [...participants];

    // Text search across multiple fields
    if (search.trim() !== "") {
      const searchTerms = search
        .split(/[,;\s]+/)
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length > 0);

      if (searchTerms.length > 0) {
        filtered = filtered.filter((participant) => {
          const searchableFields = [
            participant?.name?.toLowerCase() || "",
            participant?.email?.toLowerCase() || "",
            participant?.number?.toLowerCase() || "",
            participant?.wallet_address?.toLowerCase() || "",
            participant?.github?.toLowerCase() || "",
            participant?.city?.toLowerCase() || "",
            participant?.state?.toLowerCase() || "",
            participant?.country?.toLowerCase() || "",
            participant?.gender?.toLowerCase() || "",
            participant?.status?.toLowerCase() || "",
            participant?.cohort?.toLowerCase() || "",
            participant?.course?.name?.toLowerCase() || "",
            participant?.motivation?.toLowerCase() || "",
            participant?.achievement?.toLowerCase() || "",
            participant?.venue?.toString().toLowerCase() || "",
            participant?.created_at?.toString().toLowerCase() || "",
          ].filter(Boolean).join(" ");

          return searchTerms.some((term) => searchableFields.includes(term));
        });
      }
    }

    // Apply filters
    if (filters.cohort) {
      filtered = filtered.filter((p) => p.cohort === filters.cohort);
    }
    if (filters.paymentStatus) {
      const isPaid = filters.paymentStatus === "paid";
      filtered = filtered.filter((p) => p.payment_status === isPaid);
    }
    if (filters.course) {
      filtered = filtered.filter((p) => p.course?.name === filters.course);
    }
    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }
    if (filters.gender) {
      filtered = filtered.filter((p) => p.gender === filters.gender);
    }
    if (filters.country) {
      filtered = filtered.filter((p) => p.country === filters.country);
    }
    if (filters.state) {
      filtered = filtered.filter((p) => p.state === filters.state);
    }
    if (filters.city) {
      filtered = filtered.filter((p) => p.city === filters.city);
    }

    setFilteredParticipants(filtered);
    setCurrentPage(1);
    setSelectedParticipants([]);
    setSelectAll(false);
  }, [search, filters, participants]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchParticipants(token, true, false, false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Handle loading all pages
  const handleLoadAll = async () => {
    setIsRefreshing(true);
    try {
      await loadAllPages();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Handle creating a new participant
  const handleCreate = async (newParticipantData: Partial<Participant>) => {
    setIsLoading((prev) => ({ ...prev, create: true }));

    try {
      const response = await fetch(
        "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/",
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newParticipantData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create participant");
      }

      addParticipant(result.data);
      setIsCreateModalOpen(false);
      alert("Participant created successfully");
    } catch (error) {
      console.error("Error creating participant:", error);
      alert(error instanceof Error ? error.message : "Failed to create participant");
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  // Handle editing a participant
  const handleEdit = async (updatedData: Partial<Participant>) => {
    if (!selectedParticipant) return;

    setIsLoading((prev) => ({ ...prev, edit: true }));
    try {
      const response = await fetch(
        `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/${selectedParticipant.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update participant");
      }

      updateParticipant(selectedParticipant.id, result.data);
      setIsEditModalOpen(false);
      alert("Participant updated successfully");
    } catch (error) {
      console.error("Error updating participant:", error);
      alert(error instanceof Error ? error.message : "Failed to update participant");
    } finally {
      setIsLoading((prev) => ({ ...prev, edit: false }));
    }
  };

  // Handle deleting a participant
  const handleDelete = async (id: number) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      const response = await fetch(
        `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete: ${response.statusText}`);
      }

      deleteParticipant(id);
      setIsDeleteModalOpen(false);
      alert("Participant deleted successfully");
    } catch (error) {
      console.error("Error deleting participant:", error);
      alert(error instanceof Error ? error.message : "Failed to delete participant");
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  // Handle sending email to selected participants
  const handleSendEmail = async (participant: number[]) => {
    setIsLoading((prev) => ({ ...prev, email: true }));
    try {
      localStorage.setItem("selectedParticipants", JSON.stringify(participant));
      router.push("/Web3Lagos/Dashboard/SendEmail");
    } catch (error) {
      console.error("Error sending email:", error);
      alert(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsLoading((prev) => ({ ...prev, email: false }));
    }
  };

  // Handle sending confirmation email
  const sendConfirmationMail = async (email: string) => {
    setIsLoading((prev) => ({ ...prev, confirm: true }));
    setMess("Sending confirmation email...");

    try {
      if (token) {
        await sendConfirmationEmail(token, email);
      }
      setMess("Confirmation email sent successfully");
    } catch (error) {
      console.error("Error sending email:", error);
      setMess(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setTimeout(() => {
        setIsLoading((prev) => ({ ...prev, confirm: false }));
      }, 3000);
    }
  };

  // Modal actions
  const openEditModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedParticipant) {
      handleDelete(selectedParticipant.id);
    }
  };

  // Filter actions
  const resetFilters = () => {
    setSearch("");
    setFilters({
      cohort: null,
      paymentStatus: null,
      course: null,
      status: null,
      gender: null,
      country: null,
      state: null,
      city: null,
    });
    localStorage.removeItem("selectedParticipants");
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some((filter) => filter !== null) || search.trim() !== "";
  };

  // Selection actions
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(currentItems.map((p) => p.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectParticipant = (id: number) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(id)) {
        setSelectAll(false);
        return prev.filter((pId) => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = useMemo(() => {
    return filteredParticipants.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredParticipants, indexOfFirstItem, indexOfLastItem]);

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Handle CSV download
  const download = () => {
    downloadCSV(filteredParticipants, "participants_data.csv");
  };

  // Helper function to format venue display
  const formatVenue = (venue: string | string[] | null | undefined) => {
    if (!venue) return "N/A";
    if (Array.isArray(venue)) {
      return venue.length > 0 ? venue.join(", ") : "N/A";
    }
    return venue;
  };

  // Helper function to format registration date
  const formatRegistrationDate = (date: string | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const daysAgo = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (daysAgo === 0) return "Today";
      if (daysAgo === 1) return "Yesterday";
      if (daysAgo < 7) return `${daysAgo}d ago`;
      if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}w ago`;
      
      // Format as date
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Format last refresh time
  const formatLastRefreshed = () => {
    if (!lastRefreshed) return "Never";
    const now = Date.now();
    const diff = now - lastRefreshed;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Modified loading condition
  const shouldShowLoading = participants.length === 0 && (loading || isFetching);

  if (shouldShowLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <FadeLoader color="#3b82f6" />
        <p className="text-gray-600 font-medium">Loading participants...</p>
      </div>
    );
  }

  const showNumbers =
    selectedParticipants.length > 0
      ? selectedParticipants.length
      : filteredParticipants.length;

  return (
    <main className="p-6 w-full space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {participants.length} | Showing: {filteredParticipants.length}
            {hasActiveFilters() && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            className="flex items-center gap-2"
          >
            <MdRefresh className={isRefreshing ? "animate-spin" : ""} size={20} />
            Refresh
          </Button>
          {participants.length > 0 && participants.length < 1000 && (
            <Button
              variant="outline"
              onClick={handleLoadAll}
              disabled={isRefreshing || isFetching}
              className="flex items-center gap-2"
              title="Load all participants (may take a moment)"
            >
              <MdRefresh size={20} />
              Load All
            </Button>
          )}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <MdAdd size={20} />
            Add Participant
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Search by name, email, phone, wallet, github, location, course, status, etc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <MdFilterAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            {hasActiveFilters() && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                {Object.values(filters).filter(Boolean).length + (search ? 1 : 0)} filters active
              </Badge>
            )}
            
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <MdClear size={18} />
                Clear All
              </Button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select
              value={filters.cohort || undefined}
              onValueChange={(value) => setFilters({ ...filters, cohort: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cohorts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {registration.map((reg) => (
                  <SelectItem key={reg.id} value={reg.name}>
                    {reg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentStatus || undefined}
              onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.course || undefined}
              onValueChange={(value) => setFilters({ ...filters, course: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.name}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || undefined}
              onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueValues.statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <Button 
            variant="outline" 
            className="w-full md:w-auto"
            onClick={() => setShowAdvancedFilters(true)}
          >
            <MdFilterAlt size={18} className="mr-2" />
            Advanced Filters
          </Button>
          
          <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
                <DialogDescription>
                  Filter participants by specific criteria
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={filters.gender || "all"}
                    onValueChange={(value) => setFilters({ ...filters, gender: value === "all" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueValues.genders.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Country</Label>
                  <Select
                    value={filters.country || "all"}
                    onValueChange={(value) => setFilters({ ...filters, country: value === "all" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueValues.countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>State</Label>
                  <Select
                    value={filters.state || "all"}
                    onValueChange={(value) => setFilters({ ...filters, state: value === "all" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueValues.states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>City</Label>
                  <Select
                    value={filters.city || "all"}
                    onValueChange={(value) => setFilters({ ...filters, city: value === "all" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueValues.cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedParticipants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedParticipants([])}>
              Clear Selection
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (selectedParticipants.length > 0) {
                  handleSendEmail(selectedParticipants);
                }
              }}
              className="flex items-center gap-1"
            >
              <MdEmail size={16} />
              Send Email
            </Button>
          </div>
        </div>
      )}

      {/* Stats and Download */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100, 200, 500].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {lastRefreshed > 0 && (
            <span className="text-xs text-gray-500">
              Last refreshed: {formatLastRefreshed()}
            </span>
          )}
        </div>
        <Button onClick={download} variant="outline" className="flex items-center gap-2">
          Download CSV ({showNumbers})
        </Button>
      </div>

      {/* Background Loading Indicator */}
      {isFetching && participants.length > 0 && (
        <div className="flex justify-center items-center py-2 bg-blue-50 rounded-lg">
          <ClipLoader color="#3b82f6" size={20} />
          <span className="ml-2 text-sm text-blue-600">Updating in background...</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all participants"
                  />
                </TableHead>
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Cohort</TableHead>
                <TableHead className="font-semibold">Course</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Registered</TableHead>
                <TableHead className="font-semibold">Payment</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    No participants found. {hasActiveFilters() && "Try adjusting your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((participant, index) => {
                  const { id, name, email, number, course, cohort, city, state, country, payment_status, venue, created_at } =
                    participant;
                  const serialNumber = indexOfFirstItem + index + 1;
                  const isSelected = selectedParticipants.includes(id);

                  return (
                    <TableRow 
                      key={id} 
                      className={isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectParticipant(id)}
                          aria-label={`Select ${name}`}
                        />
                      </TableCell>
                      <TableCell className="text-gray-500">{serialNumber}</TableCell>
                      <TableCell className="font-medium">{name || "N/A"}</TableCell>
                      <TableCell className="text-gray-600">{email || "N/A"}</TableCell>
                      <TableCell className="text-gray-600">{number || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{cohort || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{course?.name || "N/A"}</TableCell>
                      <TableCell className="text-gray-600">
                        {[city, state, country].filter(Boolean).slice(0, 2).join(", ") || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {formatRegistrationDate(created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={payment_status ? "default" : "destructive"}
                          className={payment_status ? "bg-green-100 text-green-800" : ""}
                        >
                          {payment_status ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(participant)}
                            className="hover:bg-gray-100"
                          >
                            <MdEdit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(participant)}
                            className="hover:bg-red-50 text-red-600"
                          >
                            <MdDelete size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendConfirmationMail(email)}
                            className="hover:bg-blue-50 text-blue-600"
                            title="Send confirmation email"
                          >
                            <MdEmail size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modals */}
      <CreateParticipantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        courses={courses}
        cohorts={registration.map((reg) => ({
          id: parseInt(reg.id),
          name: reg.name,
          cohort: null,
          is_open: false,
          start_date: "",
          end_date: "",
          registrationFee: "",
          courses: {} as Course,
          registration: 0,
        }))}
        isLoading={isLoading.create}
      />

      <EditParticipantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        participant={selectedParticipant}
        onSubmit={handleEdit}
        courses={courses}
        cohorts={registration.map((reg) => ({
          id: parseInt(reg.id),
          name: reg.name,
          cohort: null,
          is_open: false,
          start_date: "",
          end_date: "",
          registrationFee: "",
          courses: {} as Course,
          registration: 0,
        }))}
        isLoading={isLoading.edit}
      />

      <DeleteParticipantModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={confirmDelete}
        isLoading={isLoading.delete}
      />

      {/* Email Sent Confirmation */}
      {isLoading.confirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center max-w-md">
            <FadeLoader color="#3b82f6" />
            <div className="flex justify-center items-center flex-col mt-4">
              {mes === "Confirmation email sent successfully" ? (
                <AiFillCheckCircle className="text-green-600 text-4xl mb-4" />
              ) : (
                <FaEnvelope className="text-blue-600 text-4xl mb-4" />
              )}
              <p className="text-gray-800 font-semibold text-lg text-center">{mes}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}