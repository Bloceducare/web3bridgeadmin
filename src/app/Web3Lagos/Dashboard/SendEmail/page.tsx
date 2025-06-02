"use client";

import React, { useEffect, useState } from 'react';
import { Participant } from '@/hooks/interface';
import { useParticipantsStore } from '@/stores/useParticipantsStore';
import { fetchCohorts } from '@/hooks/useUpdateCourse';
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

function Page() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const { participants } = useParticipantsStore();
  const [cohortFilter, setCohortFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<boolean | null>(null);
  const [registration, setRegistration] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({ other: true });
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [show, setShow] = useState(false);

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
    if (storedToken) setToken(storedToken);
  }, []);

  const handleFilter = () => {
    if (selectedParticipants.length > 0) return;
  
    const filtered = participants.filter((p) => {
      const matchesCohort =
        cohortFilter.trim() === '' ||
        p.cohort.toLowerCase() === cohortFilter.toLowerCase();
      const matchesPayment =
        paymentStatusFilter === null || p.payment_status === paymentStatusFilter;
  
      return matchesCohort && matchesPayment;
    });
  
    setFilteredParticipants(filtered);
  };
  

  useEffect(() => {
    if (!show) {
      handleFilter();
    }
  }, [cohortFilter, paymentStatusFilter, show]);
  

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
        'http://127.0.0.1:8000/api/v2/cohort/bulk-email/send_bulk_email/',
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
          <section className='bg-gray-300 px-10 py-7 rounded-lg'>
            {show ? (
              <p>You have  ({selectedParticipants.length}) selected Participants</p>
            ) : (
              <section> 
                     <div className='text-2xl font-semibold'>
              <h1>Filter Participants</h1>
            </div>
            <div className='flex flex-col md:flex-col gap-4 mt-5'>
              <div className='space-y-4'>
                <p className="font-semibold">Select program</p>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    setCohortFilter(value === "all" ? "" : value);
                  }}
                  defaultValue="all"
                  className='border p-2 rounded-lg w-full md:w-1/2 outline-none'
                >
                  <option value="all">All Programs</option>
                  {registration.map((register) => (
                    <option key={register.id} value={register.name}>
                      {register.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-4'>
                <h1>Select Payment Status</h1>
                <div className="flex space-x-4">         
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="all"
                      defaultChecked
                      onChange={() => setPaymentStatusFilter(null)}
                      className="form-radio"
                    />
                    <span>All Payment Status</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="true"
                      onChange={() => setPaymentStatusFilter(true)}
                      className="form-radio"
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="false"
                      onChange={() => setPaymentStatusFilter(false)}
                      className="form-radio"
                    />
                    <span>Not Paid</span>
                  </label>
                </div>
            </div>
              <button
              onClick={handleFilter}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              <div className="text-center">
                {selectedParticipants.length > 0 ? (
                  <p>
                    <b>Selected Participants</b> ({selectedParticipants.length})
                  </p>
                ) : (
                  <p>
                    <b>Filtered Participants</b> ({filteredParticipants.length})
                  </p>
                )}
              </div>
            </button>

            </div>

                </section>
            )}
       

      
         
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
