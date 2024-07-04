"use client";

import React from 'react';
import { DataFetcher, useData } from '../../../Components/DataFetcher';
import { table } from 'console';

const AttendeeList: React.FC = () => {
  const { registrations } = useData();

  return (

      <tbody className='border-spacing-y-[10px]'>
        {registrations.map((registration) => (
          <tr className='border-[1px] p-10' key={registration.id}>
            <td>{registration.id}</td>
            <td>{registration.name}</td>
            <td>{registration.email}</td>
            <td>{registration.phone}</td>
            <td>{registration.location}</td>
            <td>{registration.gender}</td>
            <td>{registration.telegramusername}</td>
            <td>{registration.country}</td>
            <td>{registration.xhandle}</td>
            <td>{registration.role}</td>
          </tr>
        ))}
      </tbody>
    // </table>
  );
};

const Attendees: React.FC = () => {
  return (
    <div className='w-full h-full overflow-auto p-4'>
      <div className='flex flex-col w-full'>
        <h1>Registrations</h1>
        <div className='bg-red-200 flex overflow-y-auto w-full rounded-lg p-4'>
          <table className='table-auto overflow-auto w-full h-full'>
            <thead className='p-2 bg-slate-300 '>
              <tr>
                <th>No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Location</th>
                <th>Gender</th>
                <th>Telegramusername</th>
                <th>Xhandle</th>
                <th>Role</th>
              </tr>
            </thead>
            <DataFetcher>
              <AttendeeList />
            </DataFetcher>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendees;
