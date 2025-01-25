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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  deleteParticipant,
  updateParticipant,
} from "@/app/actions/participantActions";

export type Participant = {
  id: string;
  name: string;
  email: string;
  gender: string;
  country: string;
  course: string;
  // attendance: number;
};

export function ParticipantsTable({ data }: { data: Participant[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingParticipant, setEditingParticipant] =
    React.useState<Participant | null>(null);

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingParticipant) {
      try {
        await updateParticipant(editingParticipant);
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Failed to update participant", error);
      }
    }
  };

  const handleDelete = async (participantId: string) => {
    try {
      await deleteParticipant(participantId);
    } catch (error) {
      console.error("Failed to delete participant", error);
    }
  };

  const columns: ColumnDef<Participant>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-gray-100 px-2 -ml-2 rounded-md transition-colors duration-200 ease-in-out"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
        <div className="lowercase">{row.getValue("email")}</div>
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
                onClick={() => handleEdit(participant)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center text-red-600"
                onClick={() => handleDelete(participant.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
          </DialogHeader>
          {editingParticipant && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingParticipant.name}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingParticipant.email}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      email: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Input
                  id="gender"
                  value={editingParticipant.gender}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      gender: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                  Country
                </Label>
                <Input
                  id="country"
                  value={editingParticipant.country}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      country: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Input
                  id="course"
                  value={editingParticipant.course}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      course: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="attendance" className="text-right">
                  Attendance
                </Label>
                <Input
                  id="attendance"
                  type="number"
                  value={editingParticipant.attendance}
                  onChange={(e) =>
                    setEditingParticipant({
                      ...editingParticipant,
                      attendance: Number(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div> */}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleSaveEdit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
