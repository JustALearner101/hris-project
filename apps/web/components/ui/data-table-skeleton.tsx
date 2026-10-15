"use client"

import * as React from "react"
import { TableRow, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export interface DataTableSkeletonProps {
    columnCount: number
    rowCount?: number
}

export function DataTableSkeleton({ columnCount, rowCount = 5 }: DataTableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow key={`skeleton-row-${i}`} aria-busy="true">
                    {Array.from({ length: columnCount }).map((_, j) => (
                        <TableCell key={`skeleton-cell-${i}-${j}`}>
                            <Skeleton className="h-5 w-full max-w-[120px]" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    )
}
