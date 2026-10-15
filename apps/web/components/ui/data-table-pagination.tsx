"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export interface DataTablePaginationProps {
    page: number
    totalPages: number
    totalItems: number
    pageSize: number
    onPageChange: (page: number) => void
    isLoading?: boolean
    entityName?: string
}

export function DataTablePagination({
    page,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    isLoading = false,
    entityName = "items",
}: DataTablePaginationProps) {
    const start = totalItems > 0 ? (page - 1) * pageSize + 1 : 0
    const end = Math.min(page * pageSize, totalItems)

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
            <div>
                Showing {start}-{end} of {totalItems} {entityName}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isLoading}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </Button>
                <div className="px-2 select-none">
                    Page {page} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
