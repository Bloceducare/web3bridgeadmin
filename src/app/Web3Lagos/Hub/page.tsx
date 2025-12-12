"use client";

import React, { useState, useEffect, useMemo } from "react";
import { HubRegistration, HubCheckIn, HubSpace, HubStats } from "@/hooks/interface";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { MdAdd, MdEdit, MdDelete, MdCheckCircle, MdCancel, MdRefresh, MdVisibility } from "react-icons/md";
import { FadeLoader, ClipLoader } from "react-spinners";
import TablePagination from "@/app/Web3Lagos/Participants/pagination";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2";

export default function HubManagementPage() {
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("registrations");
  const [loading, setLoading] = useState({ registrations: false, checkins: false, spaces: false, stats: false });
  
  // Registrations state
  const [registrations, setRegistrations] = useState<HubRegistration[]>([]);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isRegistrationViewModalOpen, setIsRegistrationViewModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<HubRegistration | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    location: "",
    reason: "",
    role: "",
    contribution: "",
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Check-ins state
  const [checkIns, setCheckIns] = useState<HubCheckIn[]>([]);
  const [activeCheckIns, setActiveCheckIns] = useState<HubCheckIn[]>([]);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    registration: "",
    space: "",
    purpose: "",
    notes: "",
  });

  // Spaces state
  const [spaces, setSpaces] = useState<HubSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<HubSpace | null>(null);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [spaceForm, setSpaceForm] = useState({
    name: "",
    description: "",
    capacity: "",
    is_available: true,
  });

  // Stats state
  const [stats, setStats] = useState<HubStats>({});

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch registrations
  const fetchRegistrations = async () => {
    if (!token) return;
    setLoading(prev => ({ ...prev, registrations: true }));
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/all/`, {
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(prev => ({ ...prev, registrations: false }));
    }
  };

  // Fetch check-ins
  const fetchCheckIns = async () => {
    if (!token) return;
    setLoading(prev => ({ ...prev, checkins: true }));
    try {
      const [allResponse, activeResponse] = await Promise.all([
        fetch(`${BASE_URL}/hub/checkin/all/`, {
          headers: { Authorization: `${token}` },
        }),
        fetch(`${BASE_URL}/hub/checkin/active/`, {
          headers: { Authorization: `${token}` },
        }),
      ]);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setCheckIns(allData.data || allData);
      }
      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveCheckIns(activeData.data || activeData);
      }
    } catch (error) {
      console.error("Error fetching check-ins:", error);
    } finally {
      setLoading(prev => ({ ...prev, checkins: false }));
    }
  };

  // Fetch spaces
  const fetchSpaces = async () => {
    if (!token) return;
    setLoading(prev => ({ ...prev, spaces: true }));
    try {
      const response = await fetch(`${BASE_URL}/hub/space/all/`, {
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSpaces(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
    } finally {
      setLoading(prev => ({ ...prev, spaces: false }));
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!token) return;
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const [regStats, checkinStats, spaceStats] = await Promise.all([
        fetch(`${BASE_URL}/hub/registration/stats/`, {
          headers: { Authorization: `${token}` },
        }),
        fetch(`${BASE_URL}/hub/checkin/stats/`, {
          headers: { Authorization: `${token}` },
        }),
        fetch(`${BASE_URL}/hub/space/stats/`, {
          headers: { Authorization: `${token}` },
        }),
      ]);

      const statsData: HubStats = {};
      if (regStats.ok) {
        const regData = await regStats.json();
        Object.assign(statsData, regData.data || regData);
      }
      if (checkinStats.ok) {
        const checkinData = await checkinStats.json();
        Object.assign(statsData, checkinData.data || checkinData);
      }
      if (spaceStats.ok) {
        const spaceData = await spaceStats.json();
        Object.assign(statsData, spaceData.data || spaceData);
      }
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      if (activeTab === "registrations") {
        fetchRegistrations();
        setCurrentPage(1); // Reset pagination when switching to registrations tab
      }
      if (activeTab === "checkins") fetchCheckIns();
      if (activeTab === "spaces") fetchSpaces();
    }
  }, [token, activeTab]);

  // Registration handlers
  const handleCreateRegistration = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/`, {
        method: "POST",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationForm),
      });
      if (response.ok) {
        await fetchRegistrations();
        await fetchStats();
        setIsRegistrationModalOpen(false);
        setRegistrationForm({
          name: "",
          email: "",
          phone_number: "",
          location: "",
          reason: "",
          role: "",
          contribution: "",
        });
        alert("Registration created successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to create registration"}`);
      }
    } catch (error) {
      console.error("Error creating registration:", error);
      alert("Failed to create registration");
    }
  };

  const handleUpdateRegistration = async () => {
    if (!token || !selectedRegistration) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/${selectedRegistration.id}/`, {
        method: "PUT",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationForm),
      });
      if (response.ok) {
        await fetchRegistrations();
        setIsRegistrationModalOpen(false);
        setSelectedRegistration(null);
        alert("Registration updated successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to update registration"}`);
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      alert("Failed to update registration");
    }
  };

  const handleApproveRegistration = async (id: number) => {
    if (!token || !confirm("Approve this registration?")) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/${id}/approve/`, {
        method: "POST",
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        await fetchRegistrations();
        await fetchStats();
        alert("Registration approved successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to approve registration"}`);
      }
    } catch (error) {
      console.error("Error approving registration:", error);
      alert("Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (id: number) => {
    if (!token || !confirm("Reject this registration?")) return;
    const registration = registrations.find(r => r.id === id);
    if (!registration) return;
    
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/${id}/reject/`, {
        method: "POST",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registration.name,
          email: registration.email,
          phone_number: registration.phone_number,
          location: registration.location,
          reason: registration.reason,
          role: registration.role,
          contribution: registration.contribution,
        }),
      });
      if (response.ok) {
        await fetchRegistrations();
        await fetchStats();
        alert("Registration rejected successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to reject registration"}`);
      }
    } catch (error) {
      console.error("Error rejecting registration:", error);
      alert("Failed to reject registration");
    }
  };

  const handleDeleteRegistration = async (id: number) => {
    if (!token || !confirm("Are you sure you want to delete this registration?")) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        await fetchRegistrations();
        await fetchStats();
        alert("Registration deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete registration");
    }
  };

  // Check-in handlers
  const handleCheckIn = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/checkin/`, {
        method: "POST",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration: parseInt(checkInForm.registration),
          space: checkInForm.space ? parseInt(checkInForm.space) : null,
          purpose: checkInForm.purpose || null,
          notes: checkInForm.notes || null,
        }),
      });
      if (response.ok) {
        await fetchCheckIns();
        await fetchStats();
        setIsCheckInModalOpen(false);
        setCheckInForm({ registration: "", space: "", purpose: "", notes: "" });
        alert("Check-in successful!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to check in"}`);
      }
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in");
    }
  };

  const handleCheckOut = async (checkInId: number) => {
    if (!token || !confirm("Check out this visitor?")) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/checkin/${checkInId}/check_out/`, {
        method: "POST",
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        await fetchCheckIns();
        await fetchStats();
        alert("Check-out successful!");
      }
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Failed to check out");
    }
  };

  const handleCheckOutByRegistration = async (registrationId: number) => {
    if (!token || !confirm("Check out this visitor?")) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/checkin/check_out_by_registration/`, {
        method: "POST",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registration: registrationId }),
      });
      if (response.ok) {
        await fetchCheckIns();
        await fetchStats();
        alert("Check-out successful!");
      }
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Failed to check out");
    }
  };

  const handleDeleteCheckIn = async (id: number) => {
    if (!token || !confirm("Are you sure you want to delete this check-in?")) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/checkin/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        await fetchCheckIns();
        await fetchStats();
        alert("Check-in deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting check-in:", error);
      alert("Failed to delete check-in");
    }
  };

  // Space handlers
  const handleCreateSpace = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/space/`, {
        method: "POST",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: spaceForm.name,
          description: spaceForm.description || null,
          capacity: spaceForm.capacity ? parseInt(spaceForm.capacity) : null,
          is_available: spaceForm.is_available,
        }),
      });
      if (response.ok) {
        await fetchSpaces();
        await fetchStats();
        setIsSpaceModalOpen(false);
        setSelectedSpace(null);
        setSpaceForm({
          name: "",
          description: "",
          capacity: "",
          is_available: true,
        });
        alert("Space created successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to create space"}`);
      }
    } catch (error) {
      console.error("Error creating space:", error);
      alert("Failed to create space");
    }
  };

  const handleUpdateSpace = async () => {
    if (!token || !selectedSpace) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/space/${selectedSpace.id}/`, {
        method: "PUT",
        headers: {
          Authorization: ` ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: spaceForm.name,
          description: spaceForm.description || null,
          capacity: spaceForm.capacity ? parseInt(spaceForm.capacity) : null,
          is_available: spaceForm.is_available,
        }),
      });
      if (response.ok) {
        await fetchSpaces();
        await fetchStats();
        setIsSpaceModalOpen(false);
        setSelectedSpace(null);
        setSpaceForm({
          name: "",
          description: "",
          capacity: "",
          is_available: true,
        });
        alert("Space updated successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to update space"}`);
      }
    } catch (error) {
      console.error("Error updating space:", error);
      alert("Failed to update space");
    }
  };

  const handleDeleteSpace = async (id: number) => {
    if (!token || !confirm("Are you sure you want to delete this space?")) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/space/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        await fetchSpaces();
        await fetchStats();
        alert("Space deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting space:", error);
      alert("Failed to delete space");
    }
  };

  const openRegistrationModal = (registration?: HubRegistration) => {
    if (registration) {
      setSelectedRegistration(registration);
      setRegistrationForm({
        name: registration.name,
        email: registration.email,
        phone_number: registration.phone_number,
        location: registration.location,
        reason: registration.reason,
        role: registration.role,
        contribution: registration.contribution,
      });
    } else {
      setSelectedRegistration(null);
      setRegistrationForm({
        name: "",
        email: "",
        phone_number: "",
        location: "",
        reason: "",
        role: "",
        contribution: "",
      });
    }
    setIsRegistrationModalOpen(true);
  };

  const openRegistrationViewModal = (registration: HubRegistration) => {
    setSelectedRegistration(registration);
    setIsRegistrationViewModalOpen(true);
  };

  const openSpaceModal = (space?: HubSpace) => {
    if (space) {
      setSelectedSpace(space);
      setSpaceForm({
        name: space.name,
        description: space.description || "",
        capacity: space.capacity?.toString() || "",
        is_available: space.is_available ?? true,
      });
    } else {
      setSelectedSpace(null);
      setSpaceForm({
        name: "",
        description: "",
        capacity: "",
        is_available: true,
      });
    }
    setIsSpaceModalOpen(true);
  };

  return (
    <main className="p-6 w-full space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ethereum Hub Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage registrations, check-ins, and spaces</p>
        </div>
        <Button onClick={fetchStats} variant="outline" className="flex items-center gap-2">
          <MdRefresh size={20} />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_registrations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_check_ins || activeCheckIns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_check_ins || checkIns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Spaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.available_spaces || spaces.filter(s => s.is_available).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="spaces">Spaces</TabsTrigger>
        </TabsList>

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Hub Registrations</h2>
            <Button onClick={() => openRegistrationModal()} className="flex items-center gap-2">
              <MdAdd size={20} />
              New Registration
            </Button>
          </div>

          {loading.registrations ? (
            <div className="flex justify-center items-center py-12">
              <FadeLoader color="#3b82f6" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No registrations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        (() => {
                          const indexOfLastItem = currentPage * itemsPerPage;
                          const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                          const currentItems = registrations.slice(indexOfFirstItem, indexOfLastItem);
                          return currentItems.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.name}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{reg.phone_number}</TableCell>
                          <TableCell>{reg.location}</TableCell>
                          <TableCell>{reg.role}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                reg.status === "approved" 
                                  ? "default" 
                                  : reg.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {reg.status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRegistrationViewModal(reg)}
                              title="View Details"
                            >
                              <MdVisibility size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                          ));
                        })()
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Pagination */}
              {registrations.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Items per page:</span>
                    <Select 
                      value={itemsPerPage.toString()} 
                      onValueChange={(v) => {
                        setItemsPerPage(parseInt(v));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(registrations.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Check-ins</h2>
            <Button onClick={() => setIsCheckInModalOpen(true)} className="flex items-center gap-2">
              <MdAdd size={20} />
              Check In Visitor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Check-ins */}
            <Card>
              <CardHeader>
                <CardTitle>Active Check-ins</CardTitle>
                <CardDescription>Currently checked in visitors</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.checkins ? (
                  <div className="flex justify-center py-8">
                    <ClipLoader color="#3b82f6" size={20} />
                  </div>
                ) : activeCheckIns.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active check-ins</p>
                ) : (
                  <div className="space-y-2">
                    {activeCheckIns.map((checkIn) => (
                      <div
                        key={checkIn.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {checkIn.registration_details?.name || `Registration #${checkIn.registration}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {checkIn.space_details?.name || "No space assigned"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(checkIn.id)}
                        >
                          Check Out
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Check-ins */}
            <Card>
              <CardHeader>
                <CardTitle>All Check-ins</CardTitle>
                <CardDescription>Complete check-in history</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.checkins ? (
                  <div className="flex justify-center py-8">
                    <ClipLoader color="#3b82f6" size={20} />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Visitor</TableHead>
                            <TableHead>Space</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {checkIns.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No check-ins found
                              </TableCell>
                            </TableRow>
                          ) : (
                            checkIns.slice(0, 10).map((checkIn) => (
                              <TableRow key={checkIn.id}>
                                <TableCell>
                                  {checkIn.registration_details?.name || `Registration #${checkIn.registration}`}
                                </TableCell>
                                <TableCell>
                                  {checkIn.space_details?.name || "N/A"}
                                </TableCell>
                                <TableCell>{checkIn.purpose || "N/A"}</TableCell>
                                <TableCell>
                                  <Badge variant={checkIn.is_active ? "default" : "secondary"}>
                                    {checkIn.is_active ? "Active" : "Checked Out"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {checkIn.is_active && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCheckOut(checkIn.id)}
                                      >
                                        Check Out
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteCheckIn(checkIn.id)}
                                      className="text-red-600"
                                      title="Delete"
                                    >
                                      <MdDelete size={16} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Spaces Tab */}
        <TabsContent value="spaces" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Hub Spaces</h2>
            <Button onClick={() => openSpaceModal()} className="flex items-center gap-2">
              <MdAdd size={20} />
              New Space
            </Button>
          </div>

          {loading.spaces ? (
            <div className="flex justify-center items-center py-12">
              <FadeLoader color="#3b82f6" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No spaces found
                </div>
              ) : (
                spaces.map((space) => (
                  <Card key={space.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{space.name}</CardTitle>
                        <Badge variant={space.is_available ? "default" : "secondary"}>
                          {space.is_available ? "Available" : "Occupied"}
                        </Badge>
                      </div>
                      {space.description && (
                        <CardDescription>{space.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {space.capacity && (
                        <p className="text-sm text-gray-600 mb-4">Capacity: {space.capacity}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => openSpaceModal(space)}
                        >
                          <MdEdit size={16} className="mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSpace(space.id)}
                          title="Delete"
                        >
                          <MdDelete size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Registration View/Details Modal */}
      <Dialog 
        open={isRegistrationViewModalOpen} 
        onOpenChange={(open) => {
          setIsRegistrationViewModalOpen(open);
          if (!open) setSelectedRegistration(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRegistration && (
            <>
              <DialogHeader>
                <DialogTitle>Registration Details</DialogTitle>
                <DialogDescription>
                  View and manage registration information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={
                      selectedRegistration.status === "approved" 
                        ? "default" 
                        : selectedRegistration.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-lg px-4 py-2"
                  >
                    {selectedRegistration.status || "pending"}
                  </Badge>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Full Name</Label>
                    <p className="text-base mt-1">{selectedRegistration.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Email</Label>
                    <p className="text-base mt-1">
                      <a href={`mailto:${selectedRegistration.email}`} className="text-blue-600 hover:underline">
                        {selectedRegistration.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Phone Number</Label>
                    <p className="text-base mt-1">
                      <a href={`tel:${selectedRegistration.phone_number}`} className="text-blue-600 hover:underline">
                        {selectedRegistration.phone_number}
                      </a>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Location</Label>
                    <p className="text-base mt-1">{selectedRegistration.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-500">Role</Label>
                    <p className="text-base mt-1">{selectedRegistration.role}</p>
                  </div>
                  {selectedRegistration.created_at && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-500">Registered</Label>
                      <p className="text-base mt-1">
                        {new Date(selectedRegistration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Reason for Visit</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-base whitespace-pre-wrap">{selectedRegistration.reason}</p>
                  </div>
                </div>

                {/* Contribution */}
                <div>
                  <Label className="text-sm font-semibold text-gray-500">Ethereum Contribution</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-base whitespace-pre-wrap">{selectedRegistration.contribution}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedRegistration.status !== "approved" && (
                    <Button
                      onClick={async () => {
                        await handleApproveRegistration(selectedRegistration.id);
                        setIsRegistrationViewModalOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <MdCheckCircle size={18} />
                      Approve
                    </Button>
                  )}
                  {selectedRegistration.status !== "rejected" && (
                    <Button
                      onClick={async () => {
                        await handleRejectRegistration(selectedRegistration.id);
                        setIsRegistrationViewModalOpen(false);
                      }}
                      variant="outline"
                      className="border-orange-600 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                    >
                      <MdCancel size={18} />
                      Reject
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setIsRegistrationViewModalOpen(false);
                      openRegistrationModal(selectedRegistration);
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MdEdit size={18} />
                    Edit
                  </Button>
                  <Button
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this registration?")) {
                        await handleDeleteRegistration(selectedRegistration.id);
                        setIsRegistrationViewModalOpen(false);
                      }
                    }}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <MdDelete size={18} />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsRegistrationViewModalOpen(false)}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Create/Edit Modal */}
      <Dialog open={isRegistrationModalOpen} onOpenChange={setIsRegistrationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRegistration ? "Edit Registration" : "New Registration"}
            </DialogTitle>
            <DialogDescription>
              {selectedRegistration
                ? "Update registration details"
                : "Create a new hub registration"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={registrationForm.name}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={registrationForm.email}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={registrationForm.phone_number}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, phone_number: e.target.value })
                }
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={registrationForm.location}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, location: e.target.value })
                }
                placeholder="Lagos, Nigeria"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Reason *</Label>
              <Textarea
                value={registrationForm.reason}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, reason: e.target.value })
                }
                placeholder="Why do you want to come and use the hub"
                rows={3}
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Input
                value={registrationForm.role}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, role: e.target.value })
                }
                placeholder="Developer, Founder, Creator..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Contribution *</Label>
              <Textarea
                value={registrationForm.contribution}
                onChange={(e) =>
                  setRegistrationForm({ ...registrationForm, contribution: e.target.value })
                }
                placeholder="Please share how you contribute to Ethereum"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsRegistrationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                selectedRegistration ? handleUpdateRegistration : handleCreateRegistration
              }
            >
              {selectedRegistration ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Modal */}
      <Dialog 
        open={isCheckInModalOpen} 
        onOpenChange={(open) => {
          setIsCheckInModalOpen(open);
          if (open && registrations.length === 0) {
            fetchRegistrations();
          }
          if (open && spaces.length === 0) {
            fetchSpaces();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Visitor</DialogTitle>
            <DialogDescription>Register a new check-in</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Registration *</Label>
              <Select
                value={checkInForm.registration}
                onValueChange={(value) =>
                  setCheckInForm({ ...checkInForm, registration: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select registration" />
                </SelectTrigger>
                <SelectContent>
                  {registrations.map((reg) => (
                    <SelectItem key={reg.id} value={reg.id.toString()}>
                      {reg.name} ({reg.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Space (Optional)</Label>
              <Select
                value={checkInForm.space}
                onValueChange={(value) =>
                  setCheckInForm({ ...checkInForm, space: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select space (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No space assigned</SelectItem>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id.toString()}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Purpose (Optional)</Label>
              <Input
                value={checkInForm.purpose}
                onChange={(e) =>
                  setCheckInForm({ ...checkInForm, purpose: e.target.value })
                }
                placeholder="Purpose of visit"
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={checkInForm.notes}
                onChange={(e) =>
                  setCheckInForm({ ...checkInForm, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn}>Check In</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Space Modal */}
      <Dialog 
        open={isSpaceModalOpen} 
        onOpenChange={(open) => {
          setIsSpaceModalOpen(open);
          if (!open) {
            setSelectedSpace(null);
            setSpaceForm({
              name: "",
              description: "",
              capacity: "",
              is_available: true,
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSpace ? "Edit Space" : "Create New Space"}</DialogTitle>
            <DialogDescription>
              {selectedSpace ? "Update space details" : "Add a new space to the hub"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={spaceForm.name}
                onChange={(e) =>
                  setSpaceForm({ ...spaceForm, name: e.target.value })
                }
                placeholder="Space name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={spaceForm.description}
                onChange={(e) =>
                  setSpaceForm({ ...spaceForm, description: e.target.value })
                }
                placeholder="Space description"
                rows={3}
              />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                value={spaceForm.capacity}
                onChange={(e) =>
                  setSpaceForm({ ...spaceForm, capacity: e.target.value })
                }
                placeholder="Maximum capacity"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                checked={spaceForm.is_available}
                onChange={(e) =>
                  setSpaceForm({ ...spaceForm, is_available: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="is_available">Available</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSpaceModalOpen(false);
                setSelectedSpace(null);
                setSpaceForm({
                  name: "",
                  description: "",
                  capacity: "",
                  is_available: true,
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={selectedSpace ? handleUpdateSpace : handleCreateSpace}
            >
              {selectedSpace ? "Update Space" : "Create Space"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

