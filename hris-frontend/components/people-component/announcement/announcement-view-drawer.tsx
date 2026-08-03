"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, Bell, Pin, CheckCircle2, ThumbsUp, Eye } from "lucide-react"
import type { Announcement } from "@/types/announcement"

interface AnnouncementViewDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    announcement: Announcement | null
    onAcknowledge?: (id: string) => void
    onLike?: (id: string) => void
}

export function AnnouncementViewDrawer({
                                           open,
                                           onOpenChange,
                                           announcement,
                                           onAcknowledge,
                                           onLike,
                                       }: AnnouncementViewDrawerProps) {
    if (!announcement) return null

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
                        {/* Content */}
                        <div className="prose prose-sm max-w-none overflow-x-hidden">
                            <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                        </div>

                        <Separator />

                        {/* Metadata */}
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

                        {/* Engagement Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                    <Eye className="h-4 w-4" />
                                </div>
                                <div className="text-2xl font-semibold">{announcement.viewCount}</div>
                                <div className="text-xs text-muted-foreground">Views</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div className="text-2xl font-semibold">{announcement.acknowledgeCount}</div>
                                <div className="text-xs text-muted-foreground">Acknowledged</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                    <ThumbsUp className="h-4 w-4" />
                                </div>
                                <div className="text-2xl font-semibold">{announcement.likeCount}</div>
                                <div className="text-xs text-muted-foreground">Likes</div>
                            </div>
                        </div>

                        {/* Poll */}
                        {announcement.poll && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="font-medium">{announcement.poll.question}</h3>
                                    <div className="space-y-2">
                                        {announcement.poll.options.map((option, idx) => (
                                            <Button key={idx} variant="outline" className="w-full justify-start bg-transparent">
                                                {option}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Attachments */}
                        {announcement.attachments && announcement.attachments.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h3 className="font-medium text-sm">Attachments</h3>
                                    {announcement.attachments.map((att) => (
                                        <a
                                            key={att.id}
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                                        >
                                            📎 {att.name} ({(att.size / 1024).toFixed(0)} KB)
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                            {announcement.requiresAcknowledgement && onAcknowledge && (
                                <Button onClick={() => onAcknowledge(announcement.id)} className="flex-1">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Acknowledge
                                </Button>
                            )}
                            {onLike && (
                                <Button variant="outline" onClick={() => onLike(announcement.id)}>
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    Like
                                </Button>
                            )}
                        </div>

                        {/* Audit Info */}
                        <Separator />
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div>
                                Created by {announcement.createdBy} on {new Date(announcement.createdAt).toLocaleString()}
                            </div>
                            {announcement.updatedAt && (
                                <div>
                                    Last updated by {announcement.updatedBy} on {new Date(announcement.updatedAt).toLocaleString()}
                                </div>
                            )}
                            <div>Version {announcement.version}</div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}