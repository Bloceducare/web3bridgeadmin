"use client";

import { useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/Components/ui/pagination";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

export default function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  const paginationItems = useMemo(() => {
    const pageItems = [];

    // Calculate start and end page numbers to display
    let startPage = Math.max(currentPage - 1, 1);
    let endPage = Math.min(startPage + 1, totalPages);

    // Ensure we always show 2 pages when possible
    if (endPage - startPage < 1 && totalPages > 1) {
      if (currentPage === totalPages) {
        startPage = Math.max(totalPages - 1, 1);
      } else {
        endPage = Math.min(startPage + 1, totalPages);
      }
    }

    // Add first page if not included in the range
    if (startPage > 1) {
      pageItems.push(
        <PaginationItem key="first">
          <PaginationLink
            className="cursor-pointer"
            onClick={() => onPageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Add ellipsis if there's a gap
      if (startPage > 2) {
        pageItems.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-2">...</span>
          </PaginationItem>
        );
      }
    }

    // Add page items in the calculated range
    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <PaginationItem key={i}>
          <PaginationLink
            className="cursor-pointer"
            onClick={() => onPageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add last page if not included in the range
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        pageItems.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-2">...</span>
          </PaginationItem>
        );
      }

      pageItems.push(
        <PaginationItem key="last">
          <PaginationLink
            className="cursor-pointer"
            onClick={() => onPageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pageItems;
  }, [currentPage, totalPages, onPageChange]);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className={`cursor-pointer ${
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>

        {paginationItems}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={`cursor-pointer ${
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}