"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronUp, Search } from "lucide-react"

export type ColumnDef<T> = {
    key: keyof T
    label: string
    align?: "left" | "center" | "right"
    width?: string
    render?: (value: T[keyof T], row: T) => React.ReactNode
    sortable?: boolean
}

export interface DataTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    actions?: (row: T) => React.ReactNode
    loading?: boolean
    // Controlled/semicontrolled search
    onSearch?: (query: string) => void
    initialSearch?: string
    // Pagination (internal by default)
    pageSize?: number
    onPageChange?: (page: number) => void
    // Accessibility
    caption?: string
    // Optional classNames
    className?: string
}

// Small helper for client-side filtering when onSearch is not provided
function defaultFilter<T>(rows: T[], q: string, cols: ColumnDef<T>[]) {
    if (!q) return rows
    const query = q.toLowerCase()
    return rows.filter((row) =>
        cols.some((c) => {
            const v = row[c.key]
            return v != null && String(v).toLowerCase().includes(query)
        }),
    )
}

export function DataTable<T>({
                                 data,
                                 columns,
                                 actions,
                                 loading = false,
                                 onSearch,
                                 initialSearch = "",
                                 pageSize = 10,
                                 onPageChange,
                                 caption,
                                 className,
                             }: DataTableProps<T>) {
    const [query, setQuery] = React.useState(initialSearch)
    const [page, setPage] = React.useState(1)
    const [sortKey, setSortKey] = React.useState<keyof T | null>(null)
    const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")

    // Derived rows: filter (if uncontrolled), sort, paginate
    const filtered = React.useMemo(() => {
        if (onSearch) return data // external search controls data
        return defaultFilter<T>(data, query, columns)
    }, [data, query, columns, onSearch])

    const sorted = React.useMemo(() => {
        if (!sortKey) return filtered
        const next = [...filtered]
        next.sort((a: T, b: T) => {
            const av = a[sortKey as keyof T]
            const bv = b[sortKey as keyof T]
            if (av == null && bv == null) return 0
            if (av == null) return sortDir === "asc" ? -1 : 1
            if (bv == null) return sortDir === "asc" ? 1 : -1
            if (typeof av === "number" && typeof bv === "number") {
                return sortDir === "asc" ? av - bv : bv - av
            }
            return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
        })
        return next
    }, [filtered, sortKey, sortDir])

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const pageStart = (currentPage - 1) * pageSize
    const pageRows = sorted.slice(pageStart, pageStart + pageSize)

    const handleSearchChange = (v: string) => {
        setQuery(v)
        setPage(1)
        if (onSearch) onSearch(v)
    }

    const handleHeaderClick = (col: ColumnDef<T>) => {
        if (!col.sortable) return
        if (sortKey === col.key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        } else {
            setSortKey(col.key)
            setSortDir("asc")
        }
    }

    const gotoPage = (p: number) => {
        const clamped = Math.max(1, Math.min(p, totalPages))
        setPage(clamped)
        onPageChange?.(clamped)
    }

    return (
        <Card className={cn("bg-card", className)}>
            <CardHeader className="flex items-center justify-between gap-2 sm:flex-row sm:gap-4">
                <CardTitle className="text-lg">List</CardTitle>

                <div className="w-full sm:w-auto">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            role="searchbox"
                            aria-label="Search"
                            placeholder="Search..."
                            className="pl-9"
                            value={query}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        {caption ? <caption className="sr-only">{caption}</caption> : null}
                        <TableHeader className="sticky top-0 bg-muted/50">
                            <TableRow>
                                {columns.map((col) => {
                                    const isSorted = sortKey === col.key
                                    return (
                                        <TableHead
                                            key={String(col.key)}
                                            className={cn(
                                                col.align === "center" && "text-center",
                                                col.align === "right" && "text-right",
                                                col.width && col.width,
                                            )}
                                            aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                                        >
                                            <button
                                                type="button"
                                                className={cn("inline-flex items-center gap-1", col.sortable && "cursor-pointer select-none")}
                                                onClick={() => handleHeaderClick(col)}
                                                aria-label={`Sort by ${col.label}`}
                                            >
                                                <span className="text-foreground">{col.label}</span>
                                                {col.sortable ? (
                                                    isSorted ? (
                                                        sortDir === "asc" ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )
                                                    ) : (
                                                        <ChevronUp className="h-4 w-4 opacity-0" />
                                                    )
                                                ) : null}
                                            </button>
                                        </TableHead>
                                    )
                                })}
                                {actions ? <TableHead className="w-10 text-right">Actions</TableHead> : null}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                                    <TableRow key={`skeleton-${i}`} aria-busy="true">
                                        {columns.map((col, j) => (
                                            <TableCell
                                                key={`s-${i}-${String(col.key)}-${j}`}
                                                className={cn(col.align === "center" && "text-center", col.align === "right" && "text-right")}
                                            >
                                                <Skeleton className="h-4 w-[80%]" />
                                            </TableCell>
                                        ))}
                                        {actions ? (
                                            <TableCell className="text-right">
                                                <Skeleton className="ml-auto h-6 w-10" />
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))
                            ) : pageRows.length > 0 ? (
                                pageRows.map((row, i) => (
                                    <TableRow key={`row-${i}`} tabIndex={0}>
                                        {columns.map((col) => {
                                            const raw = row[col.key]
                                            return (
                                                <TableCell
                                                    key={String(col.key)}
                                                    className={cn(col.align === "center" && "text-center", col.align === "right" && "text-right")}
                                                >
                                                    {col.render ? col.render(raw, row) : String(raw ?? "")}
                                                </TableCell>
                                            )
                                        })}
                                        {actions ? <TableCell className="text-right">{actions(row)}</TableCell> : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                                        <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                                            No data to display.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => gotoPage(currentPage - 1)} disabled={currentPage <= 1}>
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => gotoPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default DataTable