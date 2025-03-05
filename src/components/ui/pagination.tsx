import React from "@/lib/react-helpers";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { cn } from "@/lib/utils"

type PaginationProps = {
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

const Pagination = ({
  total,
  currentPage,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) => {
  const totalPages = Math.ceil(total / pageSize)

  const getPageNumbers = () => {
    const visiblePageCount = 5 // Number of visible page numbers in the pagination
    const pageNumbers: (number | "...")[] = []

    if (totalPages <= visiblePageCount) {
      // If the total number of pages is less than or equal to the visible page count,
      // display all page numbers.
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // If the current page is among the first few pages,
      // display the first few pages, an ellipsis, and the last page.
      if (currentPage <= Math.ceil(visiblePageCount / 2)) {
        for (let i = 1; i <= visiblePageCount - 2; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push("...")
        pageNumbers.push(totalPages)
      }
      // If the current page is near the end,
      // display the first page, an ellipsis, and the last few pages.
      else if (currentPage >= totalPages - Math.floor(visiblePageCount / 2)) {
        pageNumbers.push(1)
        pageNumbers.push("...")
        for (let i = totalPages - visiblePageCount + 3; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      }
      // If the current page is somewhere in the middle,
      // display the first page, an ellipsis, the current page and its neighbors,
      // another ellipsis, and the last page.
      else {
        pageNumbers.push(1)
        pageNumbers.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push("...")
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={cn("mx-auto flex w-full items-center justify-center", className)}
    >
      <div className="flex items-center text-sm">
        <button
          onClick={() => onPageChange(1)}
          className="mx-2 flex h-8 w-8 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Go to first page</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="mx-2 flex h-8 w-8 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Go to previous page</span>
        </button>
        {pageNumbers.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="mx-2 h-8 w-8 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground">
              &hellip;
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                "mx-2 flex h-8 w-8 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                currentPage === page && "bg-accent text-accent-foreground"
              )}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="mx-2 flex h-8 w-8 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Go to next page</span>
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          className="mx-2 flex h-8 w-8 items-center justify-center rounded-md border border-muted bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Go to last page</span>
        </button>
      </div>
    </div>
  )
}

export { Pagination }
