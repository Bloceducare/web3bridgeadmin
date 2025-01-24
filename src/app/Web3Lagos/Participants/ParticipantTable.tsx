// "use client";

// import React, { useState } from "react";
// import { MoreVertical, Edit, Trash2 } from "lucide-react";
// import { Participant } from "@/types/participants";
// import { deleteParticipant, updateParticipant } from "@/app/actions/participantActions";

// interface ParticipantTableProps {
//   initialParticipants?: Participant[];
//   totalParticipants?: number;
// }

// export default function ParticipantTable({
//   initialParticipants = [],
//   totalParticipants = 0,
// }: ParticipantTableProps) {
//   const [participants, setParticipants] = useState(initialParticipants);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
//   const [openMenuId, setOpenMenuId] = useState<string | null>(null);
//   const itemsPerPage = 10;

//   const handleDelete = async (id: string) => {
//     const result = await deleteParticipant(id);
//     if (!result?.error) {
//       setParticipants(participants.filter((p) => p.id !== id));
//     }
//   };

//   const handleEdit = (participant: Participant) => {
//     setEditingParticipant(participant);
//     setOpenMenuId(null);
//   };

//   const handleSaveEdit = async () => {
//     if (editingParticipant) {
//       const formData = new FormData();
//       Object.entries(editingParticipant).forEach(([key, value]) => {
//         if (key !== 'id') formData.append(key, value);
//       });

//       await updateParticipant(editingParticipant.id!, formData);
//       setEditingParticipant(null);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setEditingParticipant(prev => prev ? { ...prev, [name]: value } : null);
//   };

//   const paginatedParticipants = participants.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const totalPages = Math.ceil(participants.length / itemsPerPage);

//   return (
//     <div className="relative">
//       <table className="w-full bg-white">
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Email</th>
//             <th>Gender</th>
//             <th>Country</th>
//             <th>Role</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody className=" ">
//           {paginatedParticipants.map((participant) => (
//             <tr key={participant.id}>
//               {editingParticipant?.id === participant.id ? (
//                 <>
//                   <td><input name="name" value={editingParticipant.name} onChange={handleInputChange} /></td>
//                   <td><input name="email" value={editingParticipant.email} onChange={handleInputChange} /></td>
//                   <td><input name="gender" value={editingParticipant.gender} onChange={handleInputChange} /></td>
//                   <td><input name="country" value={editingParticipant.country} onChange={handleInputChange} /></td>
//                   <td><input name="role" value={editingParticipant.role} onChange={handleInputChange} /></td>
//                   <td>
//                     <button onClick={handleSaveEdit}>Save</button>
//                     <button onClick={() => setEditingParticipant(null)}>Cancel</button>
//                   </td>
//                 </>
//               ) : (
//                 <>
//                   <td>{participant.name}</td>
//                   <td>{participant.email}</td>
//                   <td>{participant.gender}</td>
//                   <td>{participant.country}</td>
//                   <td>{participant.role}</td>
//                   <td className="relative">
//                     <button
//                       onClick={() => setOpenMenuId(openMenuId === participant.id ? null : participant.id!)}
//                       className="p-1 hover:bg-gray-100 rounded"
//                     >
//                       <MoreVertical size={20} />
//                     </button>
//                     {openMenuId === participant.id && (
//                       <div className="absolute right-0 z-10 bg-white border rounded shadow-lg">
//                         <button
//                           onClick={() => handleEdit(participant)}
//                           className="flex items-center w-full p-2 hover:bg-gray-100"
//                         >
//                           <Edit size={16} className="mr-2" /> Edit
//                         </button>
//                         <button
//                           onClick={() => handleDelete(participant.id!)}
//                           className="flex items-center w-full p-2 hover:bg-gray-100 text-red-500"
//                         >
//                           <Trash2 size={16} className="mr-2" /> Delete
//                         </button>
//                       </div>
//                     )}
//                   </td>
//                 </>
//               )}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div className="flex justify-end mt-[2rem] ">
//         <button
//           onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//           disabled={currentPage === 1}
//           className="px-4  bg-gray-100 disabled:opacity-50"
//         >
//           Previous
//         </button>
//         <span className="m-2">Page {currentPage} of {totalPages}</span>
//         <button
//           onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//           disabled={currentPage === totalPages}
//           className="px-4  bg-gray-100 disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { deleteParticipant } from "@/app/actions/participantActions";

export type Participant = {
  id: string;
  name: string;
  email: string;
  gender: string;
  country: string;
  role: string;
  attendance: number;
};

export const columns: ColumnDef<Participant>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-gray-100 px-2 -ml-2 rounded-md transition-colors duration-200 ease-in-out"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase font-medium text-gray-800 pl-2">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: () => <div>Email</div>,
    cell: ({ row }) => (
      <div className="lowercase ">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "gender",
    header: () => <div>Gender</div>,
    cell: ({ row }) => <div>{row.getValue("gender")}</div>,
  },
  {
    accessorKey: "country",
    header: () => <div>Country</div>,
    cell: ({ row }) => <div>{row.getValue("country")}</div>,
  },
  {
    accessorKey: "role",
    header: () => <div>Role</div>,
    cell: ({ row }) => <div>{row.getValue("role")}</div>,
  },
  {
    accessorKey: "attendance",
    header: () => <div>Attendance</div>,
    cell: ({ row }) => {
      const attendance = row.getValue("attendance") as number;
      return (
        <div
          className={`
          ${
            attendance > 80
              ? "text-green-600"
              : attendance > 50
              ? "text-yellow-600"
              : "text-red-600"
          }
        `}
        >
          {attendance}%
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const participant = row.original;

      const handleDelete = async () => {
        await deleteParticipant(participant.id);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="flex items-center text-green-300"
              onClick={() => {
                /* Edit logic */
              }}
            >
              <Edit className="mr-2 h-4 w-4 " /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ParticipantsTable({ data }: { data: Participant[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm">
      <div>
        <h1 className="text-center font-semibold text-2xl">Participants</h1>
      </div>

      <div className="flex items-center py-4 mb-2">
        <input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="pl-10 w-1/3 py-1"
        />
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
