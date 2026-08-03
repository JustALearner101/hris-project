import type { Announcement } from "@/types/announcement"

const announcements: Announcement[] = [
    {
        id: "ann-001",
        title: "New Health Insurance Policy 2024",
        content:
            "<p>We're excited to announce our enhanced health insurance coverage starting January 2024. Key improvements include dental coverage, mental health support, and increased annual limits.</p><p>Please review the attached policy document and acknowledge your understanding by December 31st.</p>",
        category: "HR Policy",
        priority: "High",
        status: "Published",
        audience: { allEmployees: true },
        channels: ["web", "email"],
        attachments: [
            {
                id: "att-001",
                name: "Health_Insurance_Policy_2024.pdf",
                url: "/placeholder.pdf",
                size: 245000,
                type: "application/pdf",
            },
        ],
        isPinned: true,
        requiresAcknowledgement: true,
        publishedAt: "2024-01-15T09:00:00Z",
        expiresAt: "2024-12-31T23:59:59Z",
        createdBy: "HR Admin",
        createdAt: "2024-01-10T14:30:00Z",
        version: 1,
        viewCount: 142,
        acknowledgeCount: 98,
        likeCount: 24,
    },
    {
        id: "ann-002",
        title: "Company Town Hall - Q1 2024",
        content:
            "<p>Join us for our quarterly town hall meeting on February 15th at 2 PM. CEO will share company updates, Q4 results, and Q1 goals.</p><p>Meeting link will be shared via email.</p>",
        category: "Event",
        priority: "Normal",
        status: "Published",
        audience: { allEmployees: true },
        channels: ["web", "email", "slack"],
        isPinned: false,
        requiresAcknowledgement: false,
        scheduledAt: "2024-02-01T08:00:00Z",
        publishedAt: "2024-02-01T08:00:00Z",
        expiresAt: "2024-02-15T16:00:00Z",
        createdBy: "Communications Team",
        createdAt: "2024-01-25T10:00:00Z",
        version: 1,
        viewCount: 187,
        acknowledgeCount: 0,
        likeCount: 45,
    },
    {
        id: "ann-003",
        title: "Office Closure - Public Holiday",
        content:
            "<p>Our offices will be closed on February 20th for the national holiday. Emergency support will be available via hotline.</p>",
        category: "General",
        priority: "Normal",
        status: "Published",
        audience: { allEmployees: true },
        channels: ["web", "mobile", "email"],
        isPinned: false,
        requiresAcknowledgement: false,
        publishedAt: "2024-02-10T09:00:00Z",
        expiresAt: "2024-02-21T00:00:00Z",
        createdBy: "HR Admin",
        createdAt: "2024-02-08T11:00:00Z",
        version: 1,
        viewCount: 203,
        acknowledgeCount: 0,
        likeCount: 12,
    },
    {
        id: "ann-004",
        title: "Emergency: Server Maintenance Tonight",
        content:
            "<p><strong>URGENT:</strong> Critical server maintenance scheduled tonight 11 PM - 2 AM. All systems will be unavailable during this window.</p><p>Please save your work and log out before 11 PM.</p>",
        category: "Emergency",
        priority: "Critical",
        status: "Published",
        audience: { allEmployees: true },
        channels: ["web", "mobile", "email", "slack"],
        isPinned: true,
        requiresAcknowledgement: true,
        publishedAt: "2024-02-12T16:00:00Z",
        expiresAt: "2024-02-13T03:00:00Z",
        createdBy: "IT Department",
        createdAt: "2024-02-12T15:45:00Z",
        version: 1,
        viewCount: 215,
        acknowledgeCount: 189,
        likeCount: 8,
    },
    {
        id: "ann-005",
        title: "Employee Satisfaction Survey 2024",
        content:
            "<p>Help us improve! Take 5 minutes to complete our annual employee satisfaction survey. Your feedback is anonymous and valuable.</p>",
        category: "General",
        priority: "Normal",
        status: "Published",
        audience: { allEmployees: true },
        channels: ["web", "email"],
        poll: {
            question: "How satisfied are you with your work-life balance?",
            options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
            allowMultiple: false,
        },
        isPinned: false,
        requiresAcknowledgement: false,
        publishedAt: "2024-02-05T08:00:00Z",
        expiresAt: "2024-02-28T23:59:59Z",
        createdBy: "HR Admin",
        createdAt: "2024-02-01T09:00:00Z",
        version: 1,
        viewCount: 156,
        acknowledgeCount: 0,
        likeCount: 34,
    },
    {
        id: "ann-006",
        title: "New Remote Work Policy - Draft",
        content:
            "<p>We're updating our remote work policy. This draft is open for feedback from department heads before final approval.</p>",
        category: "HR Policy",
        priority: "Normal",
        status: "Draft",
        audience: {
            allEmployees: false,
            departments: ["Human Resources", "Engineering", "Finance"],
        },
        channels: ["web"],
        isPinned: false,
        requiresAcknowledgement: false,
        createdBy: "HR Admin",
        createdAt: "2024-02-14T10:00:00Z",
        version: 1,
        viewCount: 12,
        acknowledgeCount: 0,
        likeCount: 2,
    },
]

export function getAnnouncements() {
    return announcements
}

export function getAnnouncementById(id: string) {
    return announcements.find((a) => a.id === id)
}

export function createAnnouncement(
    data: Omit<Announcement, "id" | "createdAt" | "version" | "viewCount" | "acknowledgeCount" | "likeCount">,
) {
    const newAnnouncement: Announcement = {
        ...data,
        id: `ann-${Date.now()}`,
        createdAt: new Date().toISOString(),
        version: 1,
        viewCount: 0,
        acknowledgeCount: 0,
        likeCount: 0,
    }
    announcements.unshift(newAnnouncement)
    return newAnnouncement
}

export function updateAnnouncement(id: string, patch: Partial<Announcement>) {
    const idx = announcements.findIndex((a) => a.id === id)
    if (idx === -1) return null
    announcements[idx] = {
        ...announcements[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
        version: announcements[idx].version + 1,
    }
    return announcements[idx]
}

export function deleteAnnouncement(id: string) {
    const idx = announcements.findIndex((a) => a.id === id)
    if (idx === -1) return false
    announcements.splice(idx, 1)
    return true
}