"use client"

import * as React from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Search, Megaphone, Pin } from "lucide-react"
import type { Announcement } from "@/types/announcement"
import { AnnouncementFormDialog } from "./announcement-form-dialog"
import { AnnouncementViewDrawer } from "./announcement-view-drawer"
import { toast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AnnouncementTableCard() {
    const { data, isLoading, mutate } = useSWR<{ data: Announcement[] }>("/api/announcement", fetcher)
    const items = React.useMemo(() => data?.data ?? [], [data?.data])

    const [query, setQuery] = React.useState("")
    const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
    const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [page, setPage] = React.useState(1)
    const pageSize = 10

    const filtered = React.useMemo(() => {
        let result = items
        const q = query.trim().toLowerCase()
        if (q) {
            result = result.filter((a) =>
                [a.title, a.content, a.category, a.createdBy].some((v) => String(v).toLowerCase().includes(q)),
            )
        }
        if (categoryFilter !== "all") {
            result = result.filter((a) => a.category === categoryFilter)
        }
        if (priorityFilter !== "all") {
            result = result.filter((a) => a.priority === priorityFilter)
        }
        if (statusFilter !== "all") {
            result = result.filter((a) => a.status === statusFilter)
        }
        return result
    }, [items, query, categoryFilter, priorityFilter, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

    React.useEffect(() => {
        setPage(1)
    }, [query, categoryFilter, priorityFilter, statusFilter])

    // Dialog state
    const [openCreate, setOpenCreate] = React.useState(false)
    const [openEdit, setOpenEdit] = React.useState(false)
    const [editData, setEditData] = React.useState<Partial<Announcement> | undefined>(undefined)
    const [openView, setOpenView] = React.useState(false)
    const [viewData, setViewData] = React.useState<Announcement | null>(null)
    const [openDelete, setOpenDelete] = React.useState(false)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)

    async function createAnnouncement(payload: Partial<Announcement>) {
        await fetch("/api/announcement", { method: "POST", body: JSON.stringify(payload) })
        await mutate()
        toast({ title: "Success", description: "Announcement created successfully." })
    }

    async function updateAnnouncement(id: string, patch: Partial<Announcement>) {
        await fetch(`/api/announcement/${id}`, { method: "PUT", body: JSON.stringify(patch) })
        await mutate()
        toast({ title: "Success", description: "Announcement updated successfully." })
    }

    async function deleteAnnouncement(id: string) {
        await fetch(`/api/announcement/${id}`, { method: "DELETE" })
        await mutate()
        toast({ title: "Success", description: "Announcement deleted successfully." })
    }

    async function handlePublish(id: string) {
        await updateAnnouncement(id, {
            status: "Published",
            publishedAt: new Date().toISOString(),
        })
    }

    async function handleAcknowledge(id: string) {
        const announcement = items.find((a) => a.id === id)
        if (announcement) {
            await updateAnnouncement(id, {
                acknowledgeCount: announcement.acknowledgeCount + 1,
            })
            toast({ title: "Acknowledged", description: "Thank you for acknowledging this announcement." })
        }
    }

    async function handleLike(id: string) {
        const announcement = items.find((a) => a.id === id)
        if (announcement) {
            await updateAnnouncement(id, {
                likeCount: announcement.likeCount + 1,
            })
            toast({ title: "Liked", description: "You liked this announcement." })
        }
    }

    const priorityColor = {
        Normal: "default",
        High: "secondary",
        Critical: "destructive",
    } as const

    const statusColor = {
        Draft: "secondary",
        Scheduled: "default",
        Published: "default",
        Expired: "secondary",
        Archived: "secondary",
    } as const

    return (
        <Card className="shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-balance">Announcement List</CardTitle>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search announcements..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-[240px] pl-8 md:w-[360px]"
                            />
                        </div>
                        <Button onClick={() => setOpenCreate(true)}>Create Announcement</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="HR Policy">HR Policy</SelectItem>
                                <SelectItem value="Event">Event</SelectItem>
                                <SelectItem value="Emergency">Emergency</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="Normal">Normal</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="rounded-lg border overflow-auto max-h-[480px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="sticky top-0 z-10 bg-background align-middle">
                                <TableHead className="w-[40px] align-middle"></TableHead>
                                <TableHead className="min-w-[280px] align-middle">Title</TableHead>
                                <TableHead className="hidden w-[120px] align-middle md:table-cell">Category</TableHead>
                                <TableHead className="hidden w-[100px] text-center align-middle md:table-cell">Priority</TableHead>
                                <TableHead className="w-[110px] text-center align-middle">Status</TableHead>
                                <TableHead className="hidden w-[140px] align-middle lg:table-cell">Published</TableHead>
                                <TableHead className="hidden w-[100px] text-center align-middle lg:table-cell">Views</TableHead>
                                <TableHead className="text-right pr-4 align-middle">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                        Loading announcements...
                                    </TableCell>
                                </TableRow>
                            ) : paged.length ? (
                                paged.map((a) => (
                                    <TableRow key={a.id} className="align-middle hover:bg-muted/40">
                                        <TableCell className="text-center">
                                            {a.isPinned && <Pin className="h-4 w-4" />}
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                type="button"
                                                className="text hover:underline text-left"
                                                onClick={() => {
                                                    setViewData(a)
                                                    setOpenView(true)
                                                }}
                                            >
                                                {a.title}
                                            </button>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className="text-xs">
                                                {a.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-center">
                                            <Badge variant={priorityColor[a.priority]} className="px-2 py-0.5 text-[11px] rounded-full">
                                                {a.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColor[a.status]} className="px-2 py-0.5 text-[11px] rounded-full">
                                                {a.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                            {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-center text-sm text-muted-foreground">
                                            {a.viewCount}
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <RowActions
                                                announcement={a}
                                                onView={() => {
                                                    setViewData(a)
                                                    setOpenView(true)
                                                }}
                                                onEdit={() => {
                                                    setEditData(a)
                                                    setOpenEdit(true)
                                                }}
                                                onDelete={() => {
                                                    setDeleteId(a.id)
                                                    setOpenDelete(true)
                                                }}
                                                onPublish={() => handlePublish(a.id)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-14">
                                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                                            <Megaphone className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                            <div className="text-sm text-muted-foreground">No announcements found.</div>
                                            <Button size="sm" onClick={() => setOpenCreate(true)}>
                                                Create Announcement
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            aria-disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <div className="px-2">
                            Page {page} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            aria-disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Create */}
            <AnnouncementFormDialog
                open={openCreate}
                onOpenChange={setOpenCreate}
                onSubmit={createAnnouncement}
                title="Create Announcement"
            />

            {/* Edit */}
            <AnnouncementFormDialog
                open={openEdit}
                onOpenChange={setOpenEdit}
                initial={editData}
                onSubmit={async (payload) => {
                    if (!editData?.id) return
                    await updateAnnouncement(editData.id as string, payload)
                }}
                title="Edit Announcement"
            />

            {/* View */}
            <AnnouncementViewDrawer
                open={openView}
                onOpenChange={setOpenView}
                announcement={viewData}
                onAcknowledge={handleAcknowledge}
                onLike={handleLike}
            />

            {/* Delete confirm */}
            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:opacity-90"
                            onClick={async () => {
                                if (deleteId) await deleteAnnouncement(deleteId)
                                setOpenDelete(false)
                                setDeleteId(null)
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

function RowActions({
                        announcement,
                        onView,
                        onEdit,
                        onDelete,
                        onPublish,
                    }: {
    announcement: Announcement
    onView: () => void
    onEdit: () => void
    onDelete: () => void
    onPublish: () => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Row actions">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
                {(announcement.status === "Draft" || announcement.status === "Scheduled") && (
                    <>
                        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={onPublish}>Publish Now</DropdownMenuItem>
                    </>
                )}
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}