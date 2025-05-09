"use client";

import { useEffect, useState, useMemo } from "react";
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
import { MdMoreHoriz, MdDelete, MdEdit, MdAdd, MdEmail } from "react-icons/md";
import { Checkbox } from "@/Components/ui/checkbox";
import { useParticipantsStore } from "@/stores/useParticipantsStore";
import { Participant } from "@/hooks/interface";
import { useRouter } from "next/navigation";
import { FadeLoader } from "react-spinners";
import { FaEnvelope } from "react-icons/fa";
import { AiFillCheckCircle } from "react-icons/ai";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

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

export default function ParticipantsTable() {
  // Get data and functions from stores and hooks
  const {
    participants,
    loading,
    hasLoaded,
    addParticipant,
    updateParticipant,
    deleteParticipant,
  } = useParticipantsStore();
  const { fetchParticipants, sendConfirmationEmail, isFetching } =
    useParticipants();

  // Local state
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(
    null
  );
  const [mes, setMess] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [token, setToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [registration, setRegistration] = useState<
    { id: string; name: string }[]
  >([]);
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

  const router = useRouter();

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch participants only once when token is available
  useEffect(() => {
    if (token && !hasLoaded && !isFetching) {
      fetchParticipants(token);
    }
  }, [token, fetchParticipants, hasLoaded, isFetching]);

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
        "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/all/",
        {
          method: "GET",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`API call failed: ${response.statusText}`);
      const result = await response.json();
      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      alert("Failed to fetch courses");
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  // Update filtered participants when filters change
  useEffect(() => {
    let filtered = [...participants];

    if (search.trim() !== "") {
      filtered = filtered.filter(
        (p) =>
          p?.name?.toLowerCase().includes(search.toLowerCase()) ||
          p?.email?.toLowerCase().includes(search.toLowerCase()) ||
          (p?.created_at && p.created_at.toString().includes(search)) ||
          (p?.registration && p.registration.toString().includes(search))
      );
    }

    if (cohortFilter) {
      filtered = filtered.filter((p) => p.cohort === cohortFilter);
    }

    if (paymentStatusFilter) {
      const isPaid = paymentStatusFilter === "paid";
      filtered = filtered.filter((p) => p.payment_status === isPaid);
    }

    setFilteredParticipants(filtered);
    setCurrentPage(1);
    setSelectedParticipants([]);
    setSelectAll(false);
  }, [search, cohortFilter, paymentStatusFilter, participants]);

  // Handle creating a new participant
  const handleCreate = async (newParticipantData: Partial<Participant>) => {
    setIsLoading((prev) => ({ ...prev, create: true }));

    try {
      const response = await fetch(
        "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/",
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
        throw new Error(
          errorData.message || `Failed to create: ${response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create participant");
      }

      // Add the new participant to the store
      addParticipant(result.data);
      setIsCreateModalOpen(false);
      alert("Participant created successfully");
    } catch (error) {
      console.error("Error creating participant:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create participant"
      );
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
        `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/${selectedParticipant.id}/`,
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
        throw new Error(
          errorData.message || `Failed to update: ${response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to update participant");
      }

      // Update the participant in the store
      updateParticipant(selectedParticipant.id, result.data);
      setIsEditModalOpen(false);
      alert("Participant updated successfully");
    } catch (error) {
      console.error("Error updating participant:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update participant"
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, edit: false }));
    }
  };

  // Handle deleting a participant
  const handleDelete = async (id: number) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      const response = await fetch(
        `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/${id}/`,
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
        throw new Error(
          errorData.message || `Failed to delete: ${response.statusText}`
        );
      }

      // Remove the participant from the store
      deleteParticipant(id);
      setIsDeleteModalOpen(false);
      alert("Participant deleted successfully");
    } catch (error) {
      console.error("Error deleting participant:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete participant"
      );
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
    setCohortFilter(null);
    setPaymentStatusFilter(null);
    setFilteredParticipants(participants);
    localStorage.removeItem("selectedParticipants");
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
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants((prev) => prev.filter((pId) => pId !== id));
    } else {
      setSelectedParticipants((prev) => [...prev, id]);
    }
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
    downloadCSV(filteredParticipants, "my_data.csv");
  };

  // Show loading state if participants are being fetched
  if (loading && participants.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FadeLoader color="#000000" />
        <p className="ml-4">Loading participants...</p>
      </div>
    );
  }

  const showNumbers =
    selectedParticipants.length > 0
      ? selectedParticipants.length
      : filteredParticipants.length;

  return (
    <main className="p-4 w-full space-y-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Participants</h1>

      <div className="flex justify-between items-center mb-4 ">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 space-x-2 bg-transparent text-black on hover:bg-gray-100"
        >
          <MdAdd size={20} />
          Add Participant
        </Button>

        <div className="flex items-center gap-2 w-[60%]">
          {/* Search Input */}
          <Input
            placeholder="Filter by name, email, date registered or registration"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-2 px-4"
          />

          {/* Cohort Filter */}
          <Select
            value={cohortFilter || undefined}
            onValueChange={setCohortFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {registration.map((register) => (
                <SelectItem key={register.id} value={register.name}>
                  {register.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select
            value={paymentStatusFilter || undefined}
            onValueChange={setPaymentStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Button */}
          {(cohortFilter || paymentStatusFilter) && (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center gap-1"
            >
              Clear Filters
            </Button>
          )}
        </div>
        <button
          onClick={download}
          className="bg-black text-[12px] text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download CSV ({showNumbers})
        </button>

        <div className="flex items-center space-x-2">
          <span>Items per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="10" />
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
      </div>

      {/* Bulk actions section */}
      {selectedParticipants.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-2 rounded mb-2">
          <span className="text-sm font-medium">
            {selectedParticipants.length} participants selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedParticipants([])}
            >
              Clear Selection
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (selectedParticipants.length > 0) {
                  handleSendEmail(selectedParticipants);
                } else {
                  alert("No participant selected");
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

      <div className="text-sm text-gray-500 mb-2">
        Showing {currentItems.length} of {filteredParticipants.length}{" "}
        participants
        {(search || cohortFilter || paymentStatusFilter) && " (filtered)"}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectAll}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all participants"
              />
            </TableHead>
            <TableHead>S/N</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Cohort</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((participant, index) => {
            const { id, name, email, course, cohort, payment_status } =
              participant;
            const serialNumber = indexOfFirstItem + index + 1;
            const isSelected = selectedParticipants.includes(id);

            return (
              <TableRow key={id} className={isSelected ? "bg-blue-50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectParticipant(id)}
                    aria-label={`Select ${name}`}
                  />
                </TableCell>

                <TableCell>{serialNumber}</TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{email}</TableCell>
                <TableCell>{cohort}</TableCell>
                <TableCell>{course?.name || "No Course"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      payment_status
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {payment_status ? "Paid" : "Unpaid"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedParticipant(participant)}
                      className="group-hover:opacity-0"
                    >
                      <MdMoreHoriz size={20} />
                    </Button>
                    <div className="absolute top-0 right-0 hidden group-hover:flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(participant)}
                        className="hover:bg-gray-100"
                      >
                        <MdEdit size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteModal(participant)}
                        className="hover:bg-red-600"
                      >
                        <MdDelete size={16} />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => sendConfirmationMail(email)}
                        className="flex items-center gap-1"
                      >
                        <MdEmail size={16} />
                        Confirmation Email
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-4">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

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

      {isLoading.confirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="flex justify-center items-center flex-col">
            <FadeLoader color="#ffffff" />
            <div className="flex justify-center items-center flex-col">
              {mes === "Confirmation email sent successfully" ? (
                <AiFillCheckCircle className="text-white text-3xl mb-4" />
              ) : (
                <FaEnvelope className="text-white text-3xl mb-4" />
              )}
              <p className="text-white font-extrabold text-lg text-center">
                {mes}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
