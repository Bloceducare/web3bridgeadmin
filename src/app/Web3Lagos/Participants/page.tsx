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
    <main className="p-4 w-full space-y-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Participants</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="w-1/3">
          <Input
            placeholder="Filter by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-2 px-4"
          />
        </div>

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
              {[5, 10, 20, 50].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((participant) => (
            <TableRow key={participant.id}>
              <TableCell>{participant.name}</TableCell>
              <TableCell>{participant.email}</TableCell>
              <TableCell>{participant.course.name}</TableCell>
              <TableCell>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedParticipant(participant)}
                  >
                    <MdMoreHoriz size={20} />
                  </Button>
                  <div className="absolute hidden group-hover:flex items-center space-x-2 bg-white shadow-md rounded-md p-2 z-10">
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
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={`cursor-pointer ${
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  onClick={() => handlePageChange(index + 1)}
                  isActive={currentPage === index + 1}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                className={`cursor-pointer ${
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>Update participant details</DialogDescription>
          </DialogHeader>

          <div className=" flex-1 overflow-y-auto pr-2 my-4">
            <div className="grid gap-4">
              {[
                { label: "Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Wallet Address", key: "wallet_address" },
                { label: "GitHub", key: "github" },
                { label: "City", key: "city" },
                { label: "State", key: "state" },
                { label: "Country", key: "country" },
                { label: "Gender", key: "gender" },
                { label: "Motivation", key: "motivation" },
                { label: "Achievement", key: "achievement" },
                { label: "Cohort", key: "cohort" },
                { label: "Payment Status", key: "payment_status" },
              ].map(({ label, key }) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={key} className="text-right">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    value={String(editFormData[key as keyof Participant] || "")}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-none border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isLoading.edit}
            >
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isLoading.edit}>
              {isLoading.edit ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this participant?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading.delete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading.delete}
            >
              {isLoading.delete ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
