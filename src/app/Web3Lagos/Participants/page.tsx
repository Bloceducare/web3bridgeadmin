"use client";

import React from 'react';
import { DataFetcher, useData } from '../../../Components/DataFetcher';
import { PageNav } from '../../../Components';

const AttendeeList: React.FC = () => {
  const { registrations } = useData();

  return (

      <tbody className='border-spacing-y-[10px]'>
        {registrations.map((registration) => (
          <tr className='border-[1px] p-10' key={registration.id}>
            <td><input type="checkbox" />{registration.name}</td>
            <td>{registration.email}</td>
            <td>{registration.gender}</td>
            <td>{registration.country}</td>
            <td>{registration.role}</td>
            <td><input type="checkbox" /><input type="checkbox" /><input type="checkbox" /></td>
            <td>Edit</td>
          </tr>
        ))}
      </tbody>
    // </table>
  );
};

const Participants: React.FC = () => {
  return (
    <div className='w-full h-full overflow-auto p-4'>
      <div className='flex flex-col w-full'>
      <PageNav pageTitle="Participants" />
        <div className='bg-red-200 flex overflow-y-auto w-full rounded-lg p-4'>
          <table className='table-auto overflow-auto w-full h-full'>
            <thead className='p-2 bg-slate-300 '>
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
            <DataFetcher>
              <AttendeeList />
            </DataFetcher>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Participants;
