"use client"

import React, { useEffect, useState } from 'react';
import { Participant, ApiResponse } from '@/hooks/interface';

function Page() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);

  const [cohortFilter, setCohortFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<boolean | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };
  const handleSubjectChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSubject(event.target.value);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchAllParticipants = async () => {
      try {
        let allResults: Participant[] = [];
        let nextUrl: string | null =
          "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/all/";

        while (nextUrl) {
          const response = await fetch(nextUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
          }

          const result: ApiResponse = await response.json();

          if (result.success) {
            allResults = [...allResults, ...result.data.results];
            nextUrl = result.data.next;
          } else {
            throw new Error("Failed to fetch participants");
          }
        }

        setParticipants(allResults);
        setFilteredParticipants(allResults);
      } catch (error) {
        console.error("Error fetching participants:", error);
        alert("Failed to fetch participants");
      }
    };

    fetchAllParticipants();
  }, [token]);

  const handleFilter = () => {
    const filtered = participants.filter((p) => {
      const matchesCohort = cohortFilter.trim() === '' || p.cohort.toLowerCase() === cohortFilter.toLowerCase();
      const matchesPayment =
        paymentStatusFilter === null || p.payment_status === paymentStatusFilter;

      return matchesCohort && matchesPayment;
    });

    setFilteredParticipants(filtered);
  };

  useEffect(() => {
    handleFilter();  
  }, [cohortFilter, paymentStatusFilter]); 

  const handleSendFilteredEmails = async () => {
    if (!message.trim()) {
      setStatusMessage('Message cannot be empty!');
      setIsSuccess(false);
      return;
    }

    const ids = filteredParticipants.map(p => p.id);
    console.log("Filtered IDs:", ids);

    const messageData = {
      receipents: ids,
      subject: subject,
      message: message,
    };

    try {
      const response = await fetch('https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/bulk-email/send_bulk_email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setMessage('');
        setStatusMessage('Message sent successfully!');
        setIsSuccess(true);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setStatusMessage('Error sending message. Please try again.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="w-full overflow-hidden p-4">
      <div className='text-2xl font-semibold'>
        <h1>Send Emails</h1>
      </div>


      <div className="mt-8 text-center">
        {filteredParticipants.length === 0 ? (
          <p className="text-gray-500">Loading partcipants...</p>
        ) : (
          <div className="text-center">
            <p>You  can proceed to send <b>{filteredParticipants.length}</b> partcipants your message</p>
          </div>
        )}
      </div>

      <section className="flex justify-center mt-10">
        <div className="border shadow-xl w-10/12 flex flex-col space-y-8 p-10 rounded-xl">
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
            <textarea
              placeholder="Write your message"
              value={message}
              onChange={handleChange}
              className="w-full h-[25vh] p-4 border-2 border-gray-300 rounded-lg outline-none resize-none"
            />
          </div>

          <div className='flex flex-col md:flex-row gap-4'>
            <input
              type="text"
              placeholder="Enter Cohort (e.g. web3 cohort VI)"
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="border p-2 rounded-lg w-full md:w-1/3"
            />
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all") {
                  setPaymentStatusFilter(null);
                } else {
                  setPaymentStatusFilter(value === "true");
                }
              }}
              className="border p-2 rounded-lg w-full md:w-1/3"
              defaultValue="all"
            >
              <option value="all">All Payment Status</option>
              <option value="true">Paid</option>
              <option value="false">Not Paid</option>
            </select>

            <button
              onClick={handleFilter}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Filter Participants ({filteredParticipants.length})
            </button>
          </div>

          <button
            onClick={handleSendFilteredEmails}
            disabled={filteredParticipants.length === 0}
            className={`mt-4 px-6 py-2 rounded-lg text-white transition duration-300 ${
              filteredParticipants.length === 0
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-green-700 hover:bg-green-800 cursor-pointer'
            }`}
          >
            Send Message
          </button>

        </div>
      </section>

      {/* Participants Preview */}
    

      {/* Status Message */}
      <div className='flex justify-center mt-5'>
        {statusMessage && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              borderRadius: '5px',
              width: '80%',
              backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
              color: isSuccess ? '#155724' : '#721c24',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;