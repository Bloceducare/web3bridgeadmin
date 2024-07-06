import React from 'react';
import { useData } from '../Components/DataFetcher';

interface AttendeeListProps {
  currentPage: number;
}

const AttendeeList: React.FC<AttendeeListProps> = ({ currentPage }) => {
  const { registrations } = useData();
  const itemsPerPage = 30;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRegistrations = registrations.slice(startIndex, startIndex + itemsPerPage);

  return (
    <tbody className='border-spacing-y-[10px] overflow-y-auto'>
      {currentRegistrations.map((registration) => (
        <tr className='border-[1px] gap-4 w-full h-14 text-[14px]' key={registration.id}>
          <td className='flex items-center pl-3 h-full'><input type="checkbox" className='mr-2 h-5 w-5' />{registration.name}</td>
          <td>{registration.email}</td>
          <td>{registration.gender}</td>
          <td>{registration.country}</td>
          <td>{registration.role}</td>
          <td><input type="checkbox" /><input type="checkbox" /><input type="checkbox" /></td>
          <td>Edit</td>
        </tr>
      ))}
    </tbody>
  );
};

export default AttendeeList;
