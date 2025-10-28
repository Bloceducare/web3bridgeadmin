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
import { Input } from "@/Components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";

function hasNameField(obj: any): obj is { name: string } {
  return obj && typeof obj === 'object' && typeof obj.name === 'string';
}

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
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Additional filter state
  const [filters, setFilters] = useState({
    cohort: null as string | null,
    course: null as string | null,
    paymentStatus: null as string | null,
    gender: null as string | null,
    country: null as string | null,
    search: "",
  });

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

  // Compute unique filter options
  const uniqueValues = useMemo(() => {
    const cohorts = new Set<string>();
    const courses = new Set<string>();
    const genders = new Set<string>();
    const paymentStatuses = new Set<string>();
    const countries = new Set<string>();
    participants.forEach((p) => {
      if (p.cohort) cohorts.add(p.cohort);
      if (p.course?.name) courses.add(p.course.name);
      if (typeof p.payment_status === "boolean") paymentStatuses.add(p.payment_status ? "paid" : "unpaid");
      if (p.gender) genders.add(p.gender);
      if (p.country) countries.add(p.country);
    });
    return {
      cohorts: Array.from(cohorts).sort(),
      courses: Array.from(courses).sort(),
      paymentStatuses: Array.from(paymentStatuses),
      genders: Array.from(genders).sort(),
      countries: Array.from(countries).sort(),
    };
  }, [participants]);

  // Replace filter effect
  useEffect(() => {
    let filtered = [...participants];

    if (statusFilter === "pending") {
      filtered = filtered.filter((p) => !p.status || p.status.toLowerCase() === "pending");
    } else if (statusFilter === "approved") {
      filtered = filtered.filter((p) => p.status.toLowerCase() === "approved");
    } else if (statusFilter === "rejected") {
      filtered = filtered.filter((p) => p.status.toLowerCase() === "rejected");
    }
    // Apply filters
    if (filters.cohort) {
      filtered = filtered.filter((p) => p.cohort === filters.cohort);
    }
    if (filters.course) {
      filtered = filtered.filter((p) => p.course?.name === filters.course);
    }
    if (filters.paymentStatus) {
      const isPaid = filters.paymentStatus === "paid";
      filtered = filtered.filter((p) => p.payment_status === isPaid);
    }
    if (filters.gender) {
      filtered = filtered.filter((p) => p.gender === filters.gender);
    }
    if (filters.country) {
      filtered = filtered.filter((p) => p.country === filters.country);
    }
    if (filters.search.trim()) {
      const terms = filters.search
        .split(/[,;\s]+/)
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
      if (terms.length > 0) {
        filtered = filtered.filter((p) => {
          const haystack = [
            p.name,
            p.email,
            p.github,
            p.number,
            p.city,
            p.state,
            p.country,
            p.cohort,
            p.course?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return terms.some((term) => haystack.includes(term));
        });
      }
    }
    // Sort by newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredParticipants(filtered);
    setCurrentPage(1);
  }, [participants, statusFilter, filters]);

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

      {/* Advanced Filters */}
      <div className="w-full flex flex-row flex-wrap gap-4 items-end mb-4">
        <Input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search all (name, email, github, phone, location, course, etc)"
          className="w-[190px] max-w-xs"
        />
        <Select value={filters.cohort ?? "all"} onValueChange={val => setFilters(f => ({ ...f, cohort: val === "all" ? null : val }))}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Cohorts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            {uniqueValues.cohorts.map(cohort => (<SelectItem key={cohort} value={cohort}>{cohort}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filters.course ?? "all"} onValueChange={val => setFilters(f => ({ ...f, course: val === "all" ? null : val }))}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {uniqueValues.courses.map(course => (<SelectItem key={course} value={course}>{course}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filters.paymentStatus ?? "all"} onValueChange={val => setFilters(f => ({ ...f, paymentStatus: val === "all" ? null : val }))}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Payment Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.gender ?? "all"} onValueChange={val => setFilters(f => ({ ...f, gender: val === "all" ? null : val }))}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueValues.genders.map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filters.country ?? "all"} onValueChange={val => setFilters(f => ({ ...f, country: val === "all" ? null : val }))}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueValues.countries.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        {(filters.search || filters.cohort || filters.course || filters.paymentStatus || filters.gender || filters.country) && (
          <Button variant="outline" size="sm" onClick={() => setFilters({ search: "", cohort: null, course: null, paymentStatus: null, gender: null, country: null })}>
            Clear Filters
          </Button>
        )}
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
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Cohort</TableHead>
                <TableHead className="font-semibold">Course</TableHead>
                <TableHead className="font-semibold" style={{minWidth:'135px'}}>GitHub</TableHead>
                <TableHead className="font-semibold">Paid</TableHead>
                <TableHead className="font-semibold text-right">Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No participants found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((participant) => {
                  const isLoading = isApproving === participant.id;
                  return (
                    <>
                      <TableRow
                        key={participant.id}
                        className={`hover:bg-gray-50`}
                      >
                        <TableCell className="font-medium">{participant.name || "N/A"}</TableCell>
                        <TableCell className="text-gray-600">{participant.email || "N/A"}</TableCell>
                        <TableCell className="text-gray-600">{participant.number || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{
                            participant.cohort
                              || (hasNameField(participant.registration)
                                    ? participant.registration.name
                                    : "—")
                              || "—"
                          }</Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{participant.course?.name || "—"}</TableCell>
                        <TableCell className="text-gray-600" style={{textWrap:'nowrap',minWidth:'120px'}}>
                          {participant.github ? (
                            <a
                              href={participant.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-600 hover:text-blue-800 font-mono text-xs"
                              tabIndex={-1}
                              title={participant.github}
                            >
                              {participant.github}
                            </a>
                          ) : (
                            <span className="text-gray-400 font-mono text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={participant.payment_status ? "default" : "secondary"} className={participant.payment_status ? "bg-green-100 text-green-800" : ""}>
                            {participant.payment_status ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedParticipant(participant)}>
                            Preview
                          </Button>
                        </TableCell>
                      </TableRow>
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

      <Dialog open={!!selectedParticipant} onOpenChange={open => !open && setSelectedParticipant(null)}>
        <DialogContent className="max-w-2xl w-full">
          {selectedParticipant && <>
            <DialogHeader>
              <DialogTitle>Participant Details</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mb-4">
              <MdLink size={20} className="text-gray-700" />
              <span className="font-bold text-base mr-2">GitHub:</span>
              {selectedParticipant.github ? (
                <a href={selectedParticipant.github} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800 font-mono text-xs">{selectedParticipant.github}</a>
              ) : (
                <span className="ml-2 text-gray-400 font-mono text-xs">Not provided</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="font-bold">Name:</span> {selectedParticipant.name}</div>
              <div><span className="font-bold">Email:</span> <a href={`mailto:${selectedParticipant.email}`}>{selectedParticipant.email}</a></div>
              <div><span className="font-bold">Phone:</span> {selectedParticipant.number || "—"}</div>
              <div><span className="font-bold">Cohort:</span> {selectedParticipant.cohort || (hasNameField(selectedParticipant.registration) ? selectedParticipant.registration.name : "—") || "—"}</div>
              <div><span className="font-bold">Course:</span> {selectedParticipant.course?.name || "—"}</div>
              <div><span className="font-bold">Gender:</span> {selectedParticipant.gender || "—"}</div>
              <div><span className="font-bold">Country:</span> {selectedParticipant.country || "—"}</div>
              <div><span className="font-bold">City:</span> {selectedParticipant.city || "—"}</div>
              <div><span className="font-bold">State:</span> {selectedParticipant.state || "—"}</div>
              <div><span className="font-bold">Venue:</span> {selectedParticipant.venue || "—"}</div>
              <div><span className="font-bold">Wallet Address:</span> <span className="font-mono text-xs">{selectedParticipant.wallet_address || "—"}</span></div>
              <div><span className="font-bold">Paid:</span> <Badge variant={selectedParticipant.payment_status ? "default" : "secondary"} className={selectedParticipant.payment_status ? "bg-green-100 text-green-800" : ""}>{selectedParticipant.payment_status ? "Paid" : "Unpaid"}</Badge></div>
              <div><span className="font-bold">Registered:</span> {selectedParticipant.created_at ? new Date(selectedParticipant.created_at).toLocaleDateString() : "—"}</div>
            </div>
            <div className="mt-4">
              <div className="font-bold mb-2">Motivation:</div>
              <div className="text-gray-700 bg-white rounded border p-3 min-h-[32px]">{selectedParticipant.motivation || "Not provided"}</div>
            </div>
            <div>
              <div className="font-bold mb-2">Achievements:</div>
              <div className="text-gray-700 bg-white rounded border p-3 min-h-[32px]">{selectedParticipant.achievement || "Not provided"}</div>
            </div>
            {/* Action buttons at bottom */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="default" size="sm" onClick={() => handleApprove(selectedParticipant)} disabled={isApproving === selectedParticipant.id} className="bg-green-600 hover:bg-green-700">
                {isApproving === selectedParticipant.id ? <ClipLoader color="#fff" size={16} /> : <><MdCheckCircle size={16} className="mr-1" />Approve</>}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleReject(selectedParticipant)} disabled={isApproving === selectedParticipant.id}>
                <MdCancel size={16} className="mr-1" />Reject
              </Button>
              <Button variant="outline" size="sm" onClick={() => {/* TODO: edit logic */}}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={async () => {
                if (confirm(`Are you sure you want to delete ${selectedParticipant.name}?`)) {
                  setIsApproving(selectedParticipant.id);
                  try {
                    await fetch(`https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/participant/${selectedParticipant.id}/`, { method: "DELETE", headers: { Authorization: token, "Content-Type": "application/json" } });
                    updateParticipant(selectedParticipant.id, { status: "deleted" });
                    alert('Deleted!');
                    setSelectedParticipant(null);
                  } catch(e) { alert('Delete failed.'); }
                  setIsApproving(null);
                }
              }}>
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedParticipant(null)}>
                Close
              </Button>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
