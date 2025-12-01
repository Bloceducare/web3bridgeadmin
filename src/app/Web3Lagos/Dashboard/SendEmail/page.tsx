"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Participant } from '@/hooks/interface';
import { useParticipantsStore } from '@/stores/useParticipantsStore';
import { useParticipants } from '@/hooks/participants';
import { fetchCohorts } from '@/hooks/useUpdateCourse';
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false, loading: () => <div className="h-[30vh] bg-gray-100 animate-pulse rounded" /> });

function Page() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const { participants, hasLoaded } = useParticipantsStore();
  const { fetchParticipants, isFetching } = useParticipants();
  const [cohortFilter, setCohortFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<boolean | null>(null);
  const [registration, setRegistration] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({ other: true });
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [show, setShow] = useState(false);

  // Add state for new filters
  type FilterFields = {
    cohort: string;
    paymentStatus: boolean | null;
    course: string;
    gender: string;
    country: string;
    city: string;
    state: string;
    status: string;
  };

  const [filters, setFilters] = useState<FilterFields>({
    cohort: 'all',
    paymentStatus: null,
    course: 'all',
    gender: 'all',
    country: 'all',
    city: 'all',
    state: 'all',
    status: 'all',
  });

  useEffect(() => {
    const stored = localStorage.getItem("selectedParticipants");
    if (stored) {
      setSelectedParticipants(JSON.parse(stored));
      localStorage.removeItem("selectedParticipants");
      setShow(true);
    }
  }, []);

  const participantsToUse = selectedParticipants.length === 0 ? participants : selectedParticipants;

  useEffect(() => {
    if (token) {
      fetchCohorts(token, setRegistration, setError, setLoading);
    }
  }, [token]);
  const handleSubjectChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSubject(event.target.value);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      // Only fetch participants if not already loaded
      if (!hasLoaded && !isFetching) {
        fetchParticipants(storedToken, false, false, false);
      }
    }
  }, [hasLoaded, isFetching, fetchParticipants]);

  const handleFilter = useCallback(() => {
    if (selectedParticipants.length > 0) return;
  
    const filtered = participants.filter((p) => {
      const matchesCohort =
        cohortFilter.trim() === '' ||
        p.cohort?.toLowerCase() === cohortFilter.toLowerCase();
      const matchesPayment =
        paymentStatusFilter === null || p.payment_status === paymentStatusFilter;
  
      return matchesCohort && matchesPayment;
    });
  
    setFilteredParticipants(filtered);
  }, [selectedParticipants.length, participants, cohortFilter, paymentStatusFilter]);

  useEffect(() => {
    if (!show) {
      handleFilter();
    }
  }, [cohortFilter, paymentStatusFilter, show, handleFilter]);
  

  const handleSendFilteredEmails = async () => {
    if (!message.trim()) {
      setStatusMessage('Message cannot be empty!');
      setIsSuccess(false);
      return;
    }

    const ids =
    selectedParticipants.length > 0
      ? selectedParticipants
      : filteredParticipants.map(p => p.id);
    console.log("Filtered IDs:", ids);

    const messageData = {
      recipients: ids,
      subject: subject,
      body: message, 
    };
    try {
      const response = await fetch(
        'https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/bulk-email/send_bulk_email/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(messageData),
        }
      );
      if (response.ok) {
        setMessage('');
        setSubject('')
        setStatusMessage('Message sent successfully!');
        setIsSuccess(true);
        localStorage.removeItem("selectedParticipants");
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setStatusMessage('Error sending message. Please try again.');
      setIsSuccess(false);
      localStorage.removeItem("selectedParticipants");
    } 
  };

  const handleClearFilter = () => { 
    localStorage.removeItem("selectedParticipants");
    setShow(false);
  
    setFilteredParticipants(participants);
  }

  const handleAdvancedFilter = useCallback(() => {
    if (selectedParticipants.length > 0) return;
    const filtered = participants.filter((p) => {
      const matchesCohort = filters.cohort === 'all' || p.cohort?.toLowerCase() === filters.cohort.toLowerCase();
      const matchesPayment = filters.paymentStatus === null || p.payment_status === filters.paymentStatus;
      const matchesCourse = filters.course === 'all' || p.course?.name?.toLowerCase() === filters.course.toLowerCase();
      const matchesGender = filters.gender === 'all' || p.gender?.toLowerCase() === filters.gender.toLowerCase();
      const matchesCountry = filters.country === 'all' || p.country?.toLowerCase() === filters.country.toLowerCase();
      const matchesCity = filters.city === 'all' || p.city?.toLowerCase() === filters.city.toLowerCase();
      const matchesState = filters.state === 'all' || p.state?.toLowerCase() === filters.state.toLowerCase();
      const matchesStatus = filters.status === 'all' || p.status?.toLowerCase() === filters.status.toLowerCase();
      return (
        matchesCohort && matchesPayment && matchesCourse &&
        matchesGender && matchesCountry && matchesCity && matchesState && matchesStatus
      );
    });
    setFilteredParticipants(filtered);
  }, [selectedParticipants.length, participants, filters]);

  // Memoize filter options to avoid recalculating on every render
  const filterOptions = useMemo(() => {
    const courses = new Set<string>();
    const genders = new Set<string>();
    const countries = new Set<string>();
    const cities = new Set<string>();
    const states = new Set<string>();
    const statuses = new Set<string>();

    participants.forEach((p) => {
      if (p.course?.name) courses.add(p.course.name);
      if (p.gender) genders.add(p.gender);
      if (p.country) countries.add(p.country);
      if (p.city) cities.add(p.city);
      if (p.state) states.add(p.state);
      if (p.status) statuses.add(p.status);
    });

    return {
      courses: Array.from(courses).sort(),
      genders: Array.from(genders).sort(),
      countries: Array.from(countries).sort(),
      cities: Array.from(cities).sort(),
      states: Array.from(states).sort(),
      statuses: Array.from(statuses).sort(),
    };
  }, [participants]);

  return (
    <div className="w-full overflow-hidden p-4">
      <div className="mt-8 text-center">
        {participantsToUse.length === 0 ? (
          <p className="text-gray-500">Loading participants...</p>   ) : (  <div className="text-center">  <p>  You can proceed to send <b>{participantsToUse.length}</b> participants your message  </p>  </div>
        )}
        {show ? (
          <button className='mt-2 border-2 px-4 py-2 bg-red-600 rounded-lg  text-white' onClick={handleClearFilter}>Clear Filtering</button>
        ) : (
          <p></p>
        )

        }
      </div>

      <section className="flex justify-center mt-10">
        <div className="border shadow-xl w-10/12 flex flex-col space-y-8 p-10 rounded-xl">
          <div className='text-2xl font-semibold'>
            <h1>Email Administrator</h1>
          </div>

          <div className='flex flex-col gap-4'>
            <label className='text-black'>Subject</label>
            <textarea
              placeholder="Message subject"
              value={subject}
              onChange={handleSubjectChange}
              className="w-full h-[8vh] p-4 border-2 border-gray-300 rounded-lg outline-none resize-none"
            />
          </div>
          <div className='flex flex-col gap-4'>
            <label className='text-black'>Write your message</label>
             <ReactQuill
            theme="snow"
            value={message}
            onChange={setMessage}
            placeholder="Write your email here..."
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ size: [] }],
                [{ color: [] }, { background: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "clean"],
              ],
            }}
        formats={[
          "header",
          "bold", "italic", "underline", "strike",
          "size", "color", "background",
          "list", "bullet",
          "link",
        ]}
        className="bg-white h-[30vh] mb-10"
      />
          </div>
          <p className='mt-10'>Compose the email message that will be sent to the recipients</p>
          <section className='bg-gray-100 px-8 py-7 rounded-lg'>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="font-semibold block mb-1">Program</label>
                <Select value={filters.cohort} onValueChange={val => setFilters(f => ({ ...f, cohort: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Programs" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {registration.map((reg) => <SelectItem key={reg.id} value={reg.name}>{reg.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Payment Status</label>
                <Select
                  value={filters.paymentStatus === null ? "all" : filters.paymentStatus ? "paid" : "unpaid"}
                  onValueChange={val => setFilters(f => ({ ...f, paymentStatus: val === "all" ? null : val === "paid" } ))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Payment Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Course</label>
                <Select value={filters.course} onValueChange={val => setFilters(f => ({ ...f, course: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {filterOptions.courses.map(course => <SelectItem key={course} value={course}>{course}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Gender</label>
                <Select value={filters.gender} onValueChange={val => setFilters(f => ({ ...f, gender: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Genders" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    {filterOptions.genders.map(gender => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Country</label>
                <Select value={filters.country} onValueChange={val => setFilters(f => ({ ...f, country: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Countries" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {filterOptions.countries.map(country => <SelectItem key={country} value={country}>{country}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">City</label>
                <Select value={filters.city} onValueChange={val => setFilters(f => ({ ...f, city: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Cities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {filterOptions.cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">State</label>
                <Select value={filters.state} onValueChange={val => setFilters(f => ({ ...f, state: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All States" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {filterOptions.states.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Status</label>
                <Select value={filters.status} onValueChange={val => setFilters(f => ({ ...f, status: val }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {filterOptions.statuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button
              onClick={handleAdvancedFilter}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition mt-3 w-full md:w-auto"
            >
              Filter Participants
            </button>
            <div className="text-center mt-2 text-gray-600">
              <b>{filteredParticipants.length}</b> filtered participants will receive your message (unless overridden by manual selection).
            </div>
          </section>
          <button
              onClick={handleSendFilteredEmails}
              disabled={participantsToUse.length === 0}
              className={`mt-4 px-6 py-2 rounded-lg text-white transition duration-300 ${
                participantsToUse.length === 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-green-700 hover:bg-green-800 cursor-pointer'
              }`}
            >
              Send Message
            </button>
            </div>
          </section>
          <div className='flex justify-center mt-5'>
          {statusMessage && (
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button
            onClick={() => setStatusMessage("")}
            className="text-green-800 hover:text-green-600 text-xl font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

export default Page;
