"use client";

import React, { useState, useEffect, } from 'react';
import { DataFetcher, useData } from '../../../Components/DataFetcher';
import {AttendeeList} from '../../../Components'; // Adjust import as needed
import Image from 'next/image';

import person from "../../../../public/Web3LagosSvg/Users.svg";
import download from "../../../../public/Web3LagosSvg/download.svg";
import right from "../../../../public/Web3LagosSvg/rightarrow.svg";
import left from "../../../../public/Web3LagosSvg/leftarrow.svg";

const Participants: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const { registrations } = useData();
  const totalPages = Math.ceil(registrations.length / itemsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    const token = localStorage.getItem("token")

    const fetchParticipants = async () => {
      if (!token) {
        setError("You are not logged in");
        setLoading(false);
         window.location.href = "/"
        return;
      }
    }

    fetchParticipants()
  }, [])
  

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className='w-full overflow-hidden h-full p-4'>
      <div className='flex flex-col w-full'>
        {/* Page Title and Button */}
        <div className='flex justify-between h-fit items-center w-full pb-10'>
          <div className={`flex items-center gap-3 pt-5 pl-4 rounded-md`}>
            <Image src={person} alt="Participants" className='w-[35px]' />
            <h4 className={`text-[24px] font-bold`}>Participants</h4>
          </div>
          {/* Downloads CSV File */}
          <button className='py-2 px-4 bg-[#0096FF] text-white rounded-md flex justify-center items-center gap-3 '>
            <Image src={download} alt="download icon" className='w-[18px]' />Export CSV
          </button>
        </div>
        {/* Main Table Container */}
        <div className='flex flex-col w-full h-[800px] rounded-lg border-[1px]'>
          <div className="flex p-4 justify-end">
            <input type="search" name="" id="" className='border-[1px] rounded-md' />
            <select>
              <option value="">good</option>
            </select>
          </div>
          <div className='flex overflow-y-auto h-full w-full'>
            <table className='table-auto w-full h-full'>
              <thead className='p-2 text-left text-[#3A4A59] bg-[#F9FBFC] h-14 '>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Country</th>
                  <th>Role</th>
                  <th>Attendance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <AttendeeList currentPage={currentPage} />
            </table>
          </div>
          {/* Table footer and Pagination */}
          <div className="flex p-4 justify-between items-center border-t-[1px]">
            <div></div>
            <div></div>
            <div className='flex gap-3'>
              <button
                className='py-2 shadow-md border-[1px] border-[#d2d2d2] w-28 px-4 text-[14px] bg-white rounded-md flex justify-between items-center gap-3'
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <Image src={left} alt="previous icon" className='w-[14px]' />Previous
              </button>
              <button
                className='py-2 shadow-md border-[1px] border-[#d2d2d2] w-24 px-4 bg-white rounded-md flex justify-between items-center gap-3 text-[14px]'
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next<Image src={right} alt="next icon" className='w-[14px]' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParticipantsPage: React.FC = () => (
  <DataFetcher>
    <Participants />
  </DataFetcher>
);

export default ParticipantsPage;
