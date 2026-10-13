"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Bell, Pin, CheckCircle2, ThumbsUp, Eye } from "lucide-react";
import type { Announcement } from "../types/announcement";

interface AnnouncementViewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  onAcknowledge?: (id: string) => void;
  onLike?: (id: string) => void;
}

export function AnnouncementViewDrawer({
  open,
  onOpenChange,
  announcement,
  onAcknowledge,
  onLike,
}: AnnouncementViewDrawerProps) {
  if (!announcement) return null;

  const priorityColor = {
    Normal: "default",
    High: "secondary",
    Critical: "destructive",
  } as const;

  const statusColor = {
    Draft: "secondary",
    Scheduled: "default",
    Published: "default",
    Expired: "secondary",
    Archived: "secondary",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[75vw] max-h-[80vh] overflow-y-auto overflow-x-hidden p-0">
        <div className="p-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-2">
              {announcement.isPinned && <Pin className="h-7 w-4 text-primary flex-shrink-0" />}
              <DialogTitle className="text-xl text-balance pr-8">{announcement.title}</DialogTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={priorityColor[announcement.priority]}>{announcement.priority}</Badge>
              <Badge variant={statusColor[announcement.status]}>{announcement.status}</Badge>
              <Badge variant="outline">{announcement.category}</Badge>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="prose prose-sm max-w-none overflow-x-hidden">
              <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Published:{" "}
                  {announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleString() : "Not published"}
                </span>
              </div>
              {announcement.expiresAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Expires: {new Date(announcement.expiresAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  Audience:{" "}
                  {announcement.audience.allEmployees
                    ? "All Employees"
                    : `${announcement.audience.departments?.join(", ") || "Specific groups"}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bell className="h-4 w-4" />
                <span>Channels: {announcement.channels.join(", ")}</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">Views</span>
                </div>
                <div className="text-lg font-semibold">{announcement.viewCount}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Acknowledged</span>
                </div>
                <div className="text-lg font-semibold">{announcement.acknowledgeCount}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs">Likes</span>
                </div>
                <div className="text-lg font-semibold">{announcement.likeCount}</div>
              </div>
            </div>

            {(onAcknowledge || onLike) && (
              <div className="flex justify-end gap-2 pt-2">
                {onLike && (
                  <Button variant="outline" size="sm" onClick={() => onLike(announcement.id)}>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                )}
                {onAcknowledge && announcement.requiresAcknowledgement && (
                  <Button size="sm" onClick={() => onAcknowledge(announcement.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
