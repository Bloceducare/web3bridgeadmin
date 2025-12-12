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
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/Components/ui/toaster";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2";

export default function HubManagementPage() {
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("registrations");
  const [loading, setLoading] = useState({ registrations: false, checkins: false, spaces: false, stats: false, checkInSubmit: false });
  
  // Registrations state
  const [registrations, setRegistrations] = useState<HubRegistration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<HubRegistration[]>([]); // Store all for counts
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<string>("pending"); // Default to pending
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

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch registrations by status
  const fetchRegistrations = async (status?: string) => {
    if (!token) return;
    setLoading(prev => ({ ...prev, registrations: true }));
    try {
      const statusToFetch = status || registrationStatusFilter;
      let url = `${BASE_URL}/hub/registration/all/`;
      
      // If status is specified and not "all", use the by_status endpoint
      if (statusToFetch && statusToFetch !== "all") {
        url = `${BASE_URL}/hub/registration/by_status/?status=${statusToFetch}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedRegistrations = data.data || data;
        setRegistrations(fetchedRegistrations);
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
      const response = await fetch(`${BASE_URL}/hub/checkin/all/`, {
        headers: { Authorization: `${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const allCheckIns = data.data || data;
        setCheckIns(allCheckIns);
        // Filter active check-ins based on status field
        const active = allCheckIns.filter((checkIn: HubCheckIn) => 
          checkIn.status === "checked_in"
        );
        setActiveCheckIns(active);
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
      
      // Registration stats: { total, pending, approved, rejected }
      if (regStats.ok) {
        const regData = await regStats.json();
        const regStatsData = regData.data || regData;
        statsData.total_registrations = regStatsData.total;
        statsData.pending_registrations = regStatsData.pending;
        statsData.approved_registrations = regStatsData.approved;
        statsData.rejected_registrations = regStatsData.rejected;
      }
      
      // Check-in stats: { total, checked_in, checked_out, today_checkins }
      if (checkinStats.ok) {
        const checkinData = await checkinStats.json();
        const checkinStatsData = checkinData.data || checkinData;
        statsData.total_check_ins = checkinStatsData.total;
        statsData.active_check_ins = checkinStatsData.checked_in;
        statsData.checked_out = checkinStatsData.checked_out;
        statsData.today_checkins = checkinStatsData.today_checkins;
      }
      
      // Space stats: { total_spaces, total_capacity, total_occupancy, total_available, occupancy_percentage }
      if (spaceStats.ok) {
        const spaceData = await spaceStats.json();
        const spaceStatsData = spaceData.data || spaceData;
        statsData.total_spaces = spaceStatsData.total_spaces;
        statsData.total_capacity = spaceStatsData.total_capacity;
        statsData.total_occupancy = spaceStatsData.total_occupancy;
        statsData.total_available = spaceStatsData.total_available;
        statsData.occupancy_percentage = spaceStatsData.occupancy_percentage;
      }
      
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Fetch all registrations for counts
  const fetchAllRegistrationsForCounts = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/all/`, {
        headers: { Authorization: `${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAllRegistrations(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching all registrations:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      if (activeTab === "registrations") {
        // Fetch all for counts, then fetch filtered
        fetchAllRegistrationsForCounts();
        fetchRegistrations(registrationStatusFilter);
        setCurrentPage(1); // Reset pagination when switching to registrations tab
      }
      if (activeTab === "checkins") fetchCheckIns();
      if (activeTab === "spaces") fetchSpaces();
    }
  }, [token, activeTab]);

  // Fetch when status filter changes
  useEffect(() => {
    if (token && activeTab === "registrations") {
      fetchRegistrations(registrationStatusFilter);
      setCurrentPage(1);
    }
  }, [registrationStatusFilter]);

  // Registration handlers
  const handleCreateRegistration = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationForm),
      });
      if (response.ok) {
        await fetchAllRegistrationsForCounts();
        await fetchRegistrations(registrationStatusFilter);
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
        toast({
          title: "Success",
          description: "Registration created successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating registration:", error);
      toast({
        title: "Error",
        description: "Failed to create registration",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRegistration = async () => {
    if (!token || !selectedRegistration) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/registration/${selectedRegistration.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationForm),
      });
      if (response.ok) {
        await fetchAllRegistrationsForCounts();
        await fetchRegistrations(registrationStatusFilter);
        setIsRegistrationModalOpen(false);
        setSelectedRegistration(null);
        toast({
          title: "Success",
          description: "Registration updated successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      toast({
        title: "Error",
        description: "Failed to update registration",
        variant: "destructive",
      });
    }
  };

  const handleApproveRegistration = async (id: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Approve Registration",
      description: "Are you sure you want to approve this registration?",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        try {
          const response = await fetch(`${BASE_URL}/hub/registration/${id}/approve/`, {
            method: "POST",
            headers: { Authorization: `${token}` },
          });
          if (response.ok) {
            await fetchAllRegistrationsForCounts();
            await fetchRegistrations(registrationStatusFilter);
            await fetchStats();
            toast({
              title: "Success",
              description: "Registration approved successfully!",
            });
          } else {
            const error = await response.json();
            toast({
              title: "Error",
              description: error.message || "Failed to approve registration",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error approving registration:", error);
          toast({
            title: "Error",
            description: "Failed to approve registration",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleRejectRegistration = async (id: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Reject Registration",
      description: "Are you sure you want to reject this registration?",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        const registration = registrations.find(r => r.id === id);
        if (!registration) return;
        
        try {
          const response = await fetch(`${BASE_URL}/hub/registration/${id}/reject/`, {
            method: "POST",
            headers: {
              Authorization: `${token}`,
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
            await fetchAllRegistrationsForCounts();
            await fetchRegistrations(registrationStatusFilter);
            await fetchStats();
            toast({
              title: "Success",
              description: "Registration rejected successfully!",
            });
          } else {
            const error = await response.json();
            toast({
              title: "Error",
              description: error.message || "Failed to reject registration",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error rejecting registration:", error);
          toast({
            title: "Error",
            description: "Failed to reject registration",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleDeleteRegistration = async (id: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Delete Registration",
      description: "Are you sure you want to delete this registration? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        try {
          const response = await fetch(`${BASE_URL}/hub/registration/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `${token}` },
          });
          if (response.ok) {
            await fetchAllRegistrationsForCounts();
            await fetchRegistrations(registrationStatusFilter);
            await fetchStats();
            toast({
              title: "Success",
              description: "Registration deleted successfully!",
            });
          }
        } catch (error) {
          console.error("Error deleting registration:", error);
          toast({
            title: "Error",
            description: "Failed to delete registration",
            variant: "destructive",
          });
        }
      },
    });
  };

  // Check-in handlers
  const handleCheckIn = async () => {
    if (!token) return;
    setLoading(prev => ({ ...prev, checkInSubmit: true }));
    try {
      const response = await fetch(`${BASE_URL}/hub/checkin/`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registration: parseInt(checkInForm.registration),
          // Space is optional - backend will auto-assign if not provided
          ...(checkInForm.space && checkInForm.space !== "none" ? { space: parseInt(checkInForm.space) } : {}),
          purpose: checkInForm.purpose || null,
          notes: checkInForm.notes || null,
        }),
      });
      if (response.ok) {
        await fetchCheckIns();
        await fetchStats();
        setIsCheckInModalOpen(false);
        setCheckInForm({ registration: "", space: "none", purpose: "", notes: "" });
        toast({
          title: "Success",
          description: "Check-in successful!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to check in",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, checkInSubmit: false }));
    }
  };

  const handleCheckOut = async (checkInId: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Check Out Visitor",
      description: "Are you sure you want to check out this visitor?",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        try {
          const response = await fetch(`${BASE_URL}/hub/checkin/${checkInId}/check_out/`, {
            method: "POST",
            headers: { Authorization: `${token}` },
          });
          if (response.ok) {
            await fetchCheckIns();
            await fetchStats();
            toast({
              title: "Success",
              description: "Check-out successful!",
            });
          }
        } catch (error) {
          console.error("Error checking out:", error);
          toast({
            title: "Error",
            description: "Failed to check out",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleCheckOutByRegistration = async (registrationId: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Check Out Visitor",
      description: "Are you sure you want to check out this visitor?",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        try {
          const response = await fetch(`${BASE_URL}/hub/checkin/check_out_by_registration/`, {
            method: "POST",
            headers: {
              Authorization: `${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ registration: registrationId }),
          });
          if (response.ok) {
            await fetchCheckIns();
            await fetchStats();
            toast({
              title: "Success",
              description: "Check-out successful!",
            });
          }
        } catch (error) {
          console.error("Error checking out:", error);
          toast({
            title: "Error",
            description: "Failed to check out",
            variant: "destructive",
          });
        }
      },
    });
  };

  const handleDeleteCheckIn = async (id: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Delete Check-in",
      description: "Are you sure you want to delete this check-in? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        try {
          const response = await fetch(`${BASE_URL}/hub/checkin/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `${token}` },
          });
          if (response.ok) {
            await fetchCheckIns();
            await fetchStats();
            toast({
              title: "Success",
              description: "Check-in deleted successfully!",
            });
          }
        } catch (error) {
          console.error("Error deleting check-in:", error);
          toast({
            title: "Error",
            description: "Failed to delete check-in",
            variant: "destructive",
          });
        }
      },
    });
  };

  // Space handlers
  const handleCreateSpace = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/space/`, {
        method: "POST",
        headers: {
          Authorization: `${token}`,
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
        toast({
          title: "Success",
          description: "Space created successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create space",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating space:", error);
      toast({
        title: "Error",
        description: "Failed to create space",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSpace = async () => {
    if (!token || !selectedSpace) return;
    try {
      const response = await fetch(`${BASE_URL}/hub/space/${selectedSpace.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
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
        toast({
          title: "Success",
          description: "Space updated successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update space",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating space:", error);
      toast({
        title: "Error",
        description: "Failed to update space",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpace = async (id: number) => {
    if (!token) return;
    setConfirmDialog({
      open: true,
      title: "Delete Space",
      description: "Are you sure you want to delete this space? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} });
        try {
          const response = await fetch(`${BASE_URL}/hub/space/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `${token}` },
          });
          if (response.ok) {
            await fetchSpaces();
            await fetchStats();
            toast({
              title: "Success",
              description: "Space deleted successfully!",
            });
          }
        } catch (error) {
          console.error("Error deleting space:", error);
          toast({
            title: "Error",
            description: "Failed to delete space",
            variant: "destructive",
          });
        }
      },
    });
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
    <>
      <Toaster />
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
            <div className="text-2xl font-bold text-blue-600">{stats.total_available || spaces.filter(s => s.is_available).length}</div>
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

          {/* Status Filter Tabs */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={registrationStatusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRegistrationStatusFilter("pending");
                  setCurrentPage(1);
                }}
              >
                Pending ({allRegistrations.filter(r => r.status === "pending" || !r.status).length})
              </Button>
              <Button
                variant={registrationStatusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRegistrationStatusFilter("approved");
                  setCurrentPage(1);
                }}
              >
                Approved ({allRegistrations.filter(r => r.status === "approved").length})
              </Button>
              <Button
                variant={registrationStatusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRegistrationStatusFilter("rejected");
                  setCurrentPage(1);
                }}
              >
                Rejected ({allRegistrations.filter(r => r.status === "rejected").length})
              </Button>
              <Button
                variant={registrationStatusFilter === "checked_out" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRegistrationStatusFilter("checked_out");
                  setCurrentPage(1);
                }}
              >
                Checked Out ({allRegistrations.filter(r => r.status === "checked_out").length})
              </Button>
              <Button
                variant={registrationStatusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRegistrationStatusFilter("all");
                  setCurrentPage(1);
                }}
              >
                All ({allRegistrations.length})
              </Button>
            </div>
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
                                  : reg.status === "checked_out"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {reg.status === "checked_out" ? "Checked Out" : reg.status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRegistrationViewModal(reg)}
                                title="View Details"
                              >
                                <MdVisibility size={16} />
                              </Button>
                              {/* Show check-in button for approved registrations */}
                              {registrationStatusFilter === "approved" && reg.status === "approved" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCheckInForm({
                                      registration: reg.id.toString(),
                                      space: "",
                                      purpose: "",
                                      notes: "",
                                    });
                                    setIsCheckInModalOpen(true);
                                  }}
                                  title="Check In"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  Check In
                                </Button>
                              )}
                            </div>
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
                            {checkIn.registration_name || checkIn.registration_details?.name || `Registration #${checkIn.registration}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {checkIn.space_name || checkIn.space_details?.name || "No space assigned"}
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
                                  {checkIn.registration_name || checkIn.registration_details?.name || `Registration #${checkIn.registration}`}
                                </TableCell>
                                <TableCell>
                                  {checkIn.space_name || checkIn.space_details?.name || "N/A"}
                                </TableCell>
                                <TableCell>{checkIn.purpose || "N/A"}</TableCell>
                                <TableCell>
                                  <Badge variant={checkIn.status === "checked_in" ? "default" : "secondary"}>
                                    {checkIn.status === "checked_in" ? "Active" : "Checked Out"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {checkIn.status === "checked_in" && (
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
                        : selectedRegistration.status === "checked_out"
                        ? "outline"
                        : "secondary"
                    }
                    className="text-lg px-4 py-2"
                  >
                    {selectedRegistration.status === "checked_out" ? "Checked Out" : selectedRegistration.status || "pending"}
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
                  {/* Check-in button for approved registrations */}
                  {selectedRegistration.status === "approved" && (
                    <Button
                      onClick={() => {
                        setCheckInForm({
                          registration: selectedRegistration.id.toString(),
                          space: "",
                          purpose: "",
                          notes: "",
                        });
                        setIsRegistrationViewModalOpen(false);
                        setIsCheckInModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                      <MdAdd size={18} />
                      Check In
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
          if (open) {
            // Fetch all registrations (especially approved ones) for check-in
            if (registrations.length === 0 || allRegistrations.length === 0) {
              fetchRegistrations("all");
            }
            if (spaces.length === 0) {
              fetchSpaces();
            }
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
                  {(allRegistrations.length > 0 ? allRegistrations : registrations)
                    .filter((reg) => reg.status === "approved")
                    .map((reg) => (
                      <SelectItem key={reg.id} value={reg.id.toString()}>
                        {reg.name} ({reg.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Space (Optional - Auto-assigned if not selected)</Label>
              <Select
                value={checkInForm.space}
                onValueChange={(value) =>
                  setCheckInForm({ ...checkInForm, space: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select space (optional - will auto-assign if not selected)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auto-assign (recommended)</SelectItem>
                  {spaces
                    .filter((space) => space.is_available)
                    .map((space) => (
                      <SelectItem key={space.id} value={space.id.toString()}>
                        {space.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                If no space is selected, the system will automatically assign to the space with the most available capacity.
              </p>
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
            <Button 
              variant="outline" 
              onClick={() => setIsCheckInModalOpen(false)}
              disabled={loading.checkInSubmit}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckIn}
              disabled={loading.checkInSubmit || !checkInForm.registration}
            >
              {loading.checkInSubmit ? (
                <>
                  <ClipLoader size={16} color="#fff" className="mr-2" />
                  Checking In...
                </>
              ) : (
                "Check In"
              )}
            </Button>
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, title: "", description: "", onConfirm: () => {} })}
            >
              Cancel
            </Button>
            <Button onClick={confirmDialog.onConfirm}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
    </>
  );
}

