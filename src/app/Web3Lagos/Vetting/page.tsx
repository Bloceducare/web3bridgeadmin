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
import { Button } from "@/Components/ui/button";
import { useParticipantsStore } from "@/stores/useParticipantsStore";
import { Participant } from "@/hooks/interface";
import { useParticipants } from "@/hooks/participants";
import { FadeLoader, ClipLoader } from "react-spinners";
import { MdCheckCircle, MdCancel, MdEmail, MdLink, MdLocationOn, MdWork } from "react-icons/md";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import TablePagination from "@/app/Web3Lagos/Participants/pagination";

export default function VettingPage() {
  const {
    participants,
    loading,
    hasLoaded,
    updateParticipant,
  } = useParticipantsStore();
  
  const { fetchParticipants, sendConfirmationEmail, isFetching } = useParticipants();

  // Local state
  const [token, setToken] = useState("");
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isApproving, setIsApproving] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // Fetch participants
  useEffect(() => {
    if (token && !isFetching && !hasLoaded) {
      fetchParticipants(token);
    }
  }, [token, hasLoaded, isFetching, fetchParticipants]);

  // Filter participants by status
  useEffect(() => {
    let filtered = [...participants];

    // Filter by status
    if (statusFilter === "pending") {
      filtered = filtered.filter((p) => !p.status || p.status.toLowerCase() === "pending");
    } else if (statusFilter === "approved") {
      filtered = filtered.filter((p) => p.status.toLowerCase() === "approved");
    } else if (statusFilter === "rejected") {
      filtered = filtered.filter((p) => p.status.toLowerCase() === "rejected");
    }

    // Sort by newest first
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    setFilteredParticipants(filtered);
    setCurrentPage(1);
  }, [participants, statusFilter]);

  // Handle approve participant
  const handleApprove = async (participant: Participant) => {
    if (!token) {
      alert("No authentication token found");
      return;
    }

    setIsApproving(participant.id);

    try {
      // 1. Update status to approved
      const updateResponse = await fetch(
        `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/${participant.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...participant,
            status: "approved",
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to update participant status");
      }

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        throw new Error(updateResult.message || "Failed to update status");
      }

      // 2. Send confirmation email
      try {
        await sendConfirmationEmail(token, participant.email);
        alert(`Participant "${participant.name}" has been approved and confirmation email sent!`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        alert(`Participant "${participant.name}" has been approved, but email sending failed. Please send manually.`);
      }

      // 3. Update the participant in the store without refetching
      updateParticipant(participant.id, { status: "approved" });
    } catch (error) {
      console.error("Error approving participant:", error);
      alert(error instanceof Error ? error.message : "Failed to approve participant");
    } finally {
      setIsApproving(null);
    }
  };

  // Handle reject participant
  const handleReject = async (participant: Participant) => {
    if (!token) {
      alert("No authentication token found");
      return;
    }

    if (!confirm(`Are you sure you want to reject "${participant.name}"?`)) {
      return;
    }

    setIsApproving(participant.id);

    try {
      const response = await fetch(
        `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/${participant.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...participant,
            status: "rejected",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject participant");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to reject participant");
      }

      alert(`Participant "${participant.name}" has been rejected.`);
      
      // Update the participant in the store without refetching
      updateParticipant(participant.id, { status: "rejected" });
    } catch (error) {
      console.error("Error rejecting participant:", error);
      alert(error instanceof Error ? error.message : "Failed to reject participant");
    } finally {
      setIsApproving(null);
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

  // Loading state
  if (participants.length === 0 && (loading || isFetching)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <FadeLoader color="#3b82f6" />
        <p className="text-gray-600 font-medium">Loading participants...</p>
      </div>
    );
  }

  const pendingCount = participants.filter((p) => !p.status || p.status.toLowerCase() === "pending").length;
  const approvedCount = participants.filter((p) => p.status.toLowerCase() === "approved").length;
  const rejectedCount = participants.filter((p) => p.status.toLowerCase() === "rejected").length;

  return (
    <main className="p-6 w-full space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vetting Participants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve participant applications
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Items per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
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
        <div className="ml-auto text-sm text-gray-500">
          Showing {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Background Loading Indicator */}
      {isFetching && participants.length > 0 && (
        <div className="flex justify-center items-center py-2 bg-blue-50 rounded-lg">
          <ClipLoader color="#3b82f6" size={20} />
          <span className="ml-2 text-sm text-blue-600">Updating in background...</span>
        </div>
      )}

      {/* Vetting Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Cohort</TableHead>
                <TableHead className="font-semibold">Course</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No participants found for the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((participant) => {
                  const isExpanded = expandedRow === participant.id;
                  const isLoading = isApproving === participant.id;

                  return (
                    <>
                      <TableRow
                        key={participant.id}
                        className={`hover:bg-gray-50 ${isExpanded ? "bg-blue-50" : ""} cursor-pointer`}
                        onClick={() => setExpandedRow(isExpanded ? null : participant.id)}
                      >
                        <TableCell className="font-medium">
                          {participant.name || "N/A"}
                          {participant.number && (
                            <span className="text-gray-500 text-sm block">{participant.number}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">{participant.email || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.cohort || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {participant.course?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              participant.status?.toLowerCase() === "approved"
                                ? "default"
                                : participant.status?.toLowerCase() === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              participant.status?.toLowerCase() === "approved"
                                ? "bg-green-100 text-green-800"
                                : participant.status?.toLowerCase() === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {participant.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {[participant.city, participant.state, participant.country]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            {(!participant.status || participant.status.toLowerCase() === "pending") && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(participant);
                                  }}
                                  disabled={isLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isLoading ? (
                                    <ClipLoader color="#ffffff" size={16} />
                                  ) : (
                                    <>
                                      <MdCheckCircle size={16} className="mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(participant);
                                  }}
                                  disabled={isLoading}
                                >
                                  <MdCancel size={16} className="mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {participant.status?.toLowerCase() === "approved" && (
                              <div className="flex items-center text-green-600 text-sm">
                                <MdCheckCircle size={20} />
                                <span className="ml-1">Approved</span>
                              </div>
                            )}
                            {participant.status?.toLowerCase() === "rejected" && (
                              <div className="flex items-center text-red-600 text-sm">
                                <MdCancel size={20} />
                                <span className="ml-1">Rejected</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded details row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-blue-50">
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* GitHub Link */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <MdLink size={18} />
                                    GitHub Profile
                                  </div>
                                  {participant.github ? (
                                    <a
                                      href={participant.github}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      {participant.github}
                                    </a>
                                  ) : (
                                    <span className="text-gray-500 text-sm">Not provided</span>
                                  )}
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <MdLocationOn size={18} />
                                    Full Location
                                  </div>
                                  <span className="text-gray-600 text-sm">
                                    {[participant.city, participant.state, participant.country]
                                      .filter(Boolean)
                                      .join(", ") || "Not provided"}
                                  </span>
                                </div>

                                {/* Motivation */}
                                <div className="space-y-2 md:col-span-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <MdWork size={18} />
                                    Motivation
                                  </div>
                                  <p className="text-gray-600 text-sm bg-white p-3 rounded border">
                                    {participant.motivation || "Not provided"}
                                  </p>
                                </div>

                                {/* Achievement */}
                                <div className="space-y-2 md:col-span-2">
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <MdCheckCircle size={18} />
                                    Achievements
                                  </div>
                                  <p className="text-gray-600 text-sm bg-white p-3 rounded border">
                                    {participant.achievement || "Not provided"}
                                  </p>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700">Gender</div>
                                  <span className="text-gray-600 text-sm">{participant.gender || "N/A"}</span>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700">Payment Status</div>
                                  <Badge
                                    variant={participant.payment_status ? "default" : "secondary"}
                                    className={participant.payment_status ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {participant.payment_status ? "Paid" : "Unpaid"}
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700">Wallet Address</div>
                                  <span className="text-gray-600 font-mono text-xs break-all">
                                    {participant.wallet_address || "Not provided"}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-700">Registered</div>
                                  <span className="text-gray-600 text-sm">
                                    {participant.created_at
                                      ? new Date(participant.created_at).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </main>
  );
}
