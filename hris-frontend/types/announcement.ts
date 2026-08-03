export type AnnouncementCategory = "General" | "HR Policy" | "Event" | "Emergency" | "Other"
export type AnnouncementPriority = "Normal" | "High" | "Critical"
export type AnnouncementStatus = "Draft" | "Scheduled" | "Published" | "Expired" | "Archived"
export type DeliveryChannel = "web" | "mobile" | "email" | "slack" | "teams" | "whatsapp"

export interface AnnouncementAttachment {
    id: string
    name: string
    url: string
    size: number
    type: string
}

export interface AnnouncementAudience {
    allEmployees: boolean
    departments?: string[]
    positions?: string[]
    employeeIds?: string[]
}

export interface AnnouncementPoll {
    question: string
    options: string[]
    allowMultiple: boolean
}

export interface Announcement {
    id: string
    title: string
    content: string // rich text/HTML
    category: AnnouncementCategory
    priority: AnnouncementPriority
    status: AnnouncementStatus
    audience: AnnouncementAudience
    channels: DeliveryChannel[]
    attachments?: AnnouncementAttachment[]
    poll?: AnnouncementPoll
    isPinned: boolean
    requiresAcknowledgement: boolean
    scheduledAt?: string // ISO date
    expiresAt?: string // ISO date
    publishedAt?: string // ISO date
    createdBy: string
    createdAt: string
    updatedBy?: string
    updatedAt?: string
    version: number
    // Engagement metrics
    viewCount: number
    acknowledgeCount: number
    likeCount: number
}

export interface AnnouncementAcknowledgement {
    announcementId: string
    employeeId: string
    acknowledgedAt: string
}