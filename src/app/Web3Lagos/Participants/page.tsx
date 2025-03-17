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
import { MdMoreHoriz, MdDelete, MdEdit, MdAdd } from "react-icons/md";
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

interface Participant {
  id: number;
  course: Course;
  cohorts: Cohort;
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
  payment_status: boolean;
  registration: number;
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
    create: false,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<Partial<Participant>>({
    name: "",
    email: "",
    wallet_address: "",
    github: "",
    city: "",
    state: "",
    country: "",
    gender: "",
    motivation: "",
    achievement: "",
    payment_status: false,
    registration: undefined,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<{
    id: number;
    registration: number;
  } | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<{
    id: number;
    registration: number;
  } | null>(null);

  const handleCourseSelect = (course: { id: number; registration: number }) => {
    setSelectedCourse(course);
  };

  const handleCohortSelect = (cohort: { id: number; registration: number }) => {
    setSelectedCohort(cohort);
  };
  const fetchCohorts = async () => {
    try {
      const response = await fetch(
        "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/all/",
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
        const allCohorts = result.data.results || result.data;
        setCohorts(allCohorts);
        return allCohorts;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch cohorts:", error);
      alert("Failed to fetch cohorts");
      return [];
    }
  };
  useEffect(() => {
    if (token) {
      fetchCohorts();
    }
  }, [token]);

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

  const handleCreate = async () => {
    setIsLoading((prev) => ({ ...prev, create: true }));
    if (!selectedCourse) {
      alert("Please select a course first");
      setIsLoading((prev) => ({ ...prev, create: false }));
      return;
    }

    try {
      const payload = {
        ...createFormData,
        course: selectedCourse.id,
        registration: selectedCourse.registration,
        cohort: selectedCohort?.id,
      };
      if (selectedCohort) {
        payload.cohort = selectedCohort.id;
      }

      const response = await fetch(
        "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/",
        {
          method: "POST",
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
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

      const newParticipant = result.data;
      setParticipants((prev) => [...prev, newParticipant]);
      setFilteredParticipants((prev) => [...prev, newParticipant]);
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: "",
        email: "",
        wallet_address: "",
        github: "",
        city: "",
        state: "",
        country: "",
        gender: "",
        motivation: "",
        achievement: "",
        payment_status: false,
      });
      setSelectedCourse(null);
      setSelectedCohort(null);
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
        p?.name.toLowerCase().includes(search.toLowerCase()) ||
        p?.email.toLowerCase().includes(search.toLowerCase())
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
      cohorts: participant.cohorts,
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

      <div className="flex justify-between items-center mb-4 ">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 space-x-2 bg-transparent text-black on hover:bg-gray-100"
        >
          <MdAdd size={20} />
          Add Participant
        </Button>

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
            <TableHead>Cohort</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems?.map((participant) => {
            const { id, name, email, course, cohorts } = participant;
            return (
              <TableRow key={id}>
                <TableCell>{name}</TableCell>
                <TableCell>{email}</TableCell>
                <TableCell>
                  {cohorts?.cohort || "No Cohort"}
                </TableCell>
                <TableCell>{course?.name || "No Course"}</TableCell>
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
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(currentPage - 1))}
                className={`cursor-pointer ${
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  className="cursor-pointer"
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

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle>Create New Participant</DialogTitle>
            <DialogDescription>
              Enter the details for the new participant
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 my-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-course" className="text-right">
                  Course
                </Label>
                <Select
                  onValueChange={(value) => {
                    const selectedCourse = courses.find(
                      (course) => course.name === value
                    );
                    if (selectedCourse) {
                      handleCourseSelect({
                        id: selectedCourse.id,
                        registration: selectedCourse.registration,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.name}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-cohort" className="text-right">
                  Cohort
                </Label>
                <Select
                  onValueChange={(value) => {
                    const selectedCohort = cohorts.find(
                      (cohorts) => cohorts.cohort === value
                    );
                    if (selectedCohort) {
                      handleCohortSelect({
                        id: selectedCohort.id,
                        registration: selectedCohort.registration,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts?.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.cohort || `cohort-${cohort.id}`}>
                        {cohort.cohort}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {[
                { label: "Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Wallet Address", key: "wallet_address" },
                { label: "GitHub", key: "github" },
                { label: "City", key: "city" },
                { label: "State", key: "state" },
                { label: "Country", key: "country" },
                { label: "Motivation", key: "motivation" },
                { label: "Achievement", key: "achievement" },
              ].map(({ label, key }) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`create-${key}`} className="text-right">
                    {label}
                  </Label>
                  <Input
                    id={`create-${key}`}
                    value={String(
                      createFormData[key as keyof Participant] || ""
                    )}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
              ))}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={createFormData.gender}
                  onValueChange={(value) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      gender: value,
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-payment_status" className="text-right">
                  Payment Status
                </Label>
                <Select
                  value={createFormData.payment_status ? "true" : "false"}
                  onValueChange={(value) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      payment_status: value === "true",
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Paid</SelectItem>
                    <SelectItem value="false">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-none border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isLoading.create}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading.create}
              className="bg-primary"
            >
              {isLoading.create ? "Creating..." : "Create Participant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>Update participant details</DialogDescription>
          </DialogHeader>

          <div className=" flex-1 overflow-y-auto pr-2 my-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-course" className="text-right">
                  Course
                </Label>
                <Select
                  defaultValue={selectedParticipant?.course.name}
                  onValueChange={(value) => {
                    const selectedCourse = courses.find(
                      (course) => course.name === value
                    );
                    if (selectedCourse) {
                      handleCourseSelect({
                        id: selectedCourse.id,
                        registration: selectedCourse.registration,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.name}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cohort" className="text-right">
                  Cohort
                </Label>
                <Select
                  defaultValue={selectedParticipant?.cohorts?.cohort || ""}
                  onValueChange={(value) => {
                    const selectedCohort = cohorts.find(
                      (cohort) => cohort.cohort === value
                    );
                    if (selectedCohort) {
                      handleCohortSelect({
                        id: selectedCohort.id,
                        registration: selectedCohort.registration,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.cohort || `cohort-${cohort.id}`}>
                        {cohort.cohort}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {[
                { label: "Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Wallet Address", key: "wallet_address" },
                { label: "GitHub", key: "github" },
                { label: "City", key: "city" },
                { label: "State", key: "state" },
                { label: "Country", key: "country" },
                { label: "Motivation", key: "motivation" },
                { label: "Achievement", key: "achievement" },
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={editFormData.gender}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      gender: value,
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Dropdown */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-payment_status" className="text-right">
                  Payment Status
                </Label>
                <Select
                  value={editFormData.payment_status ? "true" : "false"}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      payment_status: value === "true",
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Paid</SelectItem>
                    <SelectItem value="false">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
