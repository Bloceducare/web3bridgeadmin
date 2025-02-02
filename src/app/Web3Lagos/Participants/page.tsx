"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/Components/ui/label";
import { MdMoreHoriz, MdDelete, MdEdit } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/Components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

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

interface Participant {
  id: number;
  course: Course;
  name: string;
  wallet_address: string;
  email: string;
  status: string;
  motivation: string;
  achievement: string;
  city: string;
  state: string;
  country: string;
  gender: string;
  github: string;
  cohort: null | string;
  payment_status: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    count: number;
    next: null | string;
    previous: null | string;
    results: Participant[];
  };
}

export default function ParticipantsTable() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);
  const [search, setSearch] = useState("");
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [token, setToken] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Participant>>({});
  const [isLoading, setIsLoading] = useState({
    edit: false,
    delete: false,
    fetch: true,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchParticipants = async () => {
      setIsLoading((prev) => ({ ...prev, fetch: true }));
      try {
        const response = await fetch(
          "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/all/",
          {
            method: "GET",
            headers: {
              Authorization: `${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok)
          throw new Error(`API call failed: ${response.statusText}`);

        const result: ApiResponse = await response.json();
        if (result.success) {
          setParticipants(result.data.results);
          setFilteredParticipants(result.data.results);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
        alert("Failed to fetch participants");
      } finally {
        setIsLoading((prev) => ({ ...prev, fetch: false }));
      }
    };

    fetchParticipants();
  }, [token]);

  useEffect(() => {
    const filtered = participants.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredParticipants(filtered);
    setCurrentPage(1);
  }, [search, participants]);

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

      const updatedParticipant = result.data;

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === selectedParticipant.id ? updatedParticipant : p
        )
      );
      setFilteredParticipants((prev) =>
        prev.map((p) =>
          p.id === selectedParticipant.id ? updatedParticipant : p
        )
      );
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

      setParticipants((prev) => prev.filter((p) => p.id !== id));
      setFilteredParticipants((prev) => prev.filter((p) => p.id !== id));
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

  const openEditModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setEditFormData({
      name: participant.name,
      email: participant.email,
      wallet_address: participant.wallet_address,
      github: participant.github,
      city: participant.city,
      state: participant.state,
      country: participant.country,
      gender: participant.gender,
      motivation: participant.motivation,
      achievement: participant.achievement,
      cohort: participant.cohort,
      payment_status: participant.payment_status,
    });
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

  const saveEdit = async () => {
    if (selectedParticipant) {
      await handleEdit(editFormData);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredParticipants.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  if (isLoading.fetch) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* <h1 className="text-2xl font-bold mb-4">Participants</h1> */}
      <ParticipantsTable data={participants} />
    </div>
  );
}

// import { ParticipantsTable } from "./ParticipantTable";
// import staticParticipants from "./staticParticipants";

// export default function ParticipantsPage() {
//   return <ParticipantsTable data={staticParticipants} />;
// }
