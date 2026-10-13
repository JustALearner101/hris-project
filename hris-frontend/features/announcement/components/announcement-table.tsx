"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Megaphone, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Announcement } from "../types/announcement";
import { useAnnouncements } from "../api/use-announcement";
import { AnnouncementFormDialog } from "./announcement-form-dialog";
import { AnnouncementViewDrawer } from "./announcement-view-drawer";
import { DataTableSearch } from "@/components/ui/data-table-search";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

export function AnnouncementTable() {
  const { data: items, isLoading, mutate } = useAnnouncements();
  const { toast } = useToast();

  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filtered = React.useMemo(() => {
    let result = items;
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((a) =>
        [a.title, a.content, a.category, a.createdBy].some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((a) => a.priority === priorityFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result;
  }, [items, query, categoryFilter, priorityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [query, categoryFilter, priorityFilter, statusFilter]);

  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<Announcement> | undefined>(undefined);
  const [openView, setOpenView] = React.useState(false);
  const [viewData, setViewData] = React.useState<Announcement | null>(null);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  async function createAnnouncement(payload: Partial<Announcement>) {
    await fetch("/api/announcement", { method: "POST", body: JSON.stringify(payload) });
    await mutate();
    toast({ title: "Success", description: "Announcement created successfully." });
  }

  async function updateAnnouncement(id: string, patch: Partial<Announcement>) {
    await fetch(`/api/announcement/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    await mutate();
    toast({ title: "Success", description: "Announcement updated successfully." });
  }

  async function deleteAnnouncement(id: string) {
    await fetch(`/api/announcement/${id}`, { method: "DELETE" });
    await mutate();
    toast({ title: "Success", description: "Announcement deleted successfully." });
  }

  async function handlePublish(id: string) {
    await updateAnnouncement(id, {
      status: "Published",
      publishedAt: new Date().toISOString(),
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Company Announcements
          </CardTitle>
          <p className="text-sm text-muted-foreground">Broadcast news, policy updates, and notifications across your company.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>Create Announcement</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <DataTableSearch
            placeholder="Search announcements..."
            value={query}
            onChange={setQuery}
            debounceMs={0}
            className="w-full md:max-w-xs"
          />
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

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[130px]">Category</TableHead>
                <TableHead className="w-[110px]">Priority</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
                <TableHead className="w-[140px]">Created</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DataTableSkeleton columnCount={7} rowCount={5} />
              ) : paged.length > 0 ? (
                paged.map((a) => (
                  <TableRow key={a.id} className="align-top">
                    <TableCell>{a.isPinned && <Pin className="h-4 w-4 text-primary mt-1" />}</TableCell>
                    <TableCell>
                      <button
                        className="text-left font-medium hover:underline text-foreground"
                        onClick={() => {
                          setViewData(a);
                          setOpenView(true);
                        }}
                      >
                        {a.title}
                      </button>
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.content}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.priority === "Critical" ? "destructive" : a.priority === "High" ? "secondary" : "default"}>
                        {a.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === "Published" ? "default" : "secondary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setViewData(a);
                              setOpenView(true);
                            }}
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditData(a);
                              setOpenEdit(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          {a.status === "Draft" && (
                            <DropdownMenuItem onClick={() => handlePublish(a.id)}>Publish</DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeleteId(a.id);
                              setOpenDelete(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No announcements found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          isLoading={isLoading}
          entityName="announcements"
        />

        {/* Create Dialog */}
        <AnnouncementFormDialog
          open={openCreate}
          onOpenChange={setOpenCreate}
          onSubmit={createAnnouncement}
          title="Create Announcement"
        />

        {/* Edit Dialog */}
        {editData && (
          <AnnouncementFormDialog
            open={openEdit}
            onOpenChange={setOpenEdit}
            onSubmit={(patch) => updateAnnouncement(editData.id!, patch)}
            initial={editData}
            title="Edit Announcement"
          />
        )}

        {/* View Drawer */}
        <AnnouncementViewDrawer open={openView} onOpenChange={setOpenView} announcement={viewData} />

        {/* Delete Dialog */}
        <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this announcement? This action cannot be undone.</p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteAnnouncement(deleteId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
