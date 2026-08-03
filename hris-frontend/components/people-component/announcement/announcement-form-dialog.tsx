"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { Announcement, AnnouncementCategory, AnnouncementPriority, DeliveryChannel } from "@/types/announcement"

interface AnnouncementFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: Partial<Announcement>) => Promise<void>
    initial?: Partial<Announcement>
    title: string
}

const categories: AnnouncementCategory[] = ["General", "HR Policy", "Event", "Emergency", "Other"]
const priorities: AnnouncementPriority[] = ["Normal", "High", "Critical"]
const channels: DeliveryChannel[] = ["web", "mobile", "email", "slack", "teams", "whatsapp"]

export function AnnouncementFormDialog({ open, onOpenChange, onSubmit, initial, title }: AnnouncementFormDialogProps) {
    const [formData, setFormData] = React.useState<Partial<Announcement>>({
        title: "",
        content: "",
        category: "General",
        priority: "Normal",
        status: "Draft",
        audience: { allEmployees: true },
        channels: ["web"],
        isPinned: false,
        requiresAcknowledgement: false,
        createdBy: "Current User",
        ...initial,
    })

    const [selectedChannels, setSelectedChannels] = React.useState<DeliveryChannel[]>(initial?.channels || ["web"])
    const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>(initial?.audience?.departments || [])
    const [departmentInput, setDepartmentInput] = React.useState("")

    // Date state for shadcn Calendar (fixes TS2552 / TS2304)
    const [date, setDate] = React.useState<Date | undefined>(() =>
        initial?.scheduledAt ? new Date(initial.scheduledAt) : undefined
    )

    React.useEffect(() => {
        if (open && initial) {
            setFormData({ ...formData, ...initial })
            setSelectedChannels(initial.channels || ["web"])
            setSelectedDepartments(initial.audience?.departments || [])
            setDate(initial.scheduledAt ? new Date(initial.scheduledAt) : undefined)
        }
    }, [open, initial])

    // Sync Calendar -> formData.scheduledAt
    React.useEffect(() => {
        const iso = date ? date.toISOString() : undefined
        if (formData.scheduledAt !== iso) {
            setFormData((prev) => ({ ...prev, scheduledAt: iso }))
        }
    }, [date])

    // Sync formData.scheduledAt -> Calendar (keeps typing in input and calendar selection consistent)
    React.useEffect(() => {
        if (formData.scheduledAt) {
            const d = new Date(formData.scheduledAt)
            if (!isNaN(d.getTime()) && (!date || d.getTime() !== date.getTime())) {
                setDate(d)
            }
        } else if (date) {
            setDate(undefined)
        }
    }, [formData.scheduledAt])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            ...formData,
            channels: selectedChannels,
            audience: {
                ...formData.audience,
                allEmployees: formData.audience?.allEmployees ?? true,
                departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
            },
        })
        onOpenChange(false)
        // Reset form
        setFormData({
            title: "",
            content: "",
            category: "General",
            priority: "Normal",
            status: "Draft",
            audience: { allEmployees: true },
            channels: ["web"],
            isPinned: false,
            requiresAcknowledgement: false,
            createdBy: "Current User",
        })
        setSelectedChannels(["web"])
        setSelectedDepartments([])
        setDate(undefined)
    }

    const toggleChannel = (channel: DeliveryChannel) => {
        setSelectedChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]))
    }

    const addDepartment  = () => {
        if (departmentInput.trim() && !selectedDepartments.includes(departmentInput.trim())) {
            setSelectedDepartments([...selectedDepartments, departmentInput.trim()])
            setDepartmentInput("")
        }
    }

    const removeDepartment = (dept: string) => {
        setSelectedDepartments(selectedDepartments.filter((d) => d !== dept))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Announcement title"
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Announcement content (supports HTML)"
                            rows={6}
                            maxLength={10000}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value as AnnouncementCategory })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value as AnnouncementPriority })}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorities.map((pri) => (
                                        <SelectItem key={pri} value={pri}>
                                            {pri}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Delivery Channels</Label>
                        <div className="flex flex-wrap gap-2">
                            {channels.map((channel) => (
                                <label key={channel} className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                        checked={selectedChannels.includes(channel)}
                                        onCheckedChange={() => toggleChannel(channel)}
                                    />
                                    <span className="text-sm capitalize">{channel}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={formData.audience?.allEmployees}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        audience: { ...formData.audience, allEmployees: checked === true },
                                    })
                                }
                            />
                            <span className="text-sm">All Employees</span>
                        </label>

                        {!formData.audience?.allEmployees && (
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="departments">Departments</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="departments"
                                        value={departmentInput}
                                        onChange={(e) => setDepartmentInput(e.target.value)}
                                        placeholder="Add department"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                addDepartment()
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" onClick={addDepartment}>
                                        Add
                                    </Button>
                                </div>
                                {selectedDepartments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {selectedDepartments.map((dept) => (
                                            <Badge key={dept} variant="secondary" className="gap-1">
                                                {dept}
                                                <button type="button" onClick={() => removeDepartment(dept)} className="hover:text-destructive">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={formData.isPinned}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked === true })}
                                />
                                <span className="text-sm">Pin this announcement</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={formData.requiresAcknowledgement}
                                    onCheckedChange={(checked) => setFormData({ ...formData, requiresAcknowledgement: checked === true })}
                                />
                                <span className="text-sm">Require acknowledgement</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledAt">Scheduled Date (optional)</Label>
                            <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={formData.scheduledAt ? formData.scheduledAt.slice(0, 16) : ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                                    })
                                }
                            />
                            {/*<Label htmlFor="date" className="px-1">*/}
                            {/*    Date of birth*/}
                            {/*</Label>*/}
                            {/*<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>*/}
                            {/*    <PopoverTrigger asChild>*/}
                            {/*        <Button*/}
                            {/*            variant="outline"*/}
                            {/*            id="date"*/}
                            {/*            className="w-48 justify-between font-normal"*/}
                            {/*        >*/}
                            {/*            {date ? date.toLocaleDateString() : "Select date"}*/}
                            {/*            <ChevronDownIcon />*/}
                            {/*        </Button>*/}
                            {/*    </PopoverTrigger>*/}
                            {/*    <PopoverContent className="w-auto overflow-hidden p-0" align="start">*/}
                            {/*        <Calendar*/}
                            {/*            mode="single"*/}
                            {/*            selected={date}*/}
                            {/*            captionLayout="dropdown"*/}
                            {/*            onSelect={(date) => {*/}
                            {/*                setDate(date)*/}
                            {/*                setPopoverOpen(false)*/}
                            {/*            }}*/}
                            {/*        />*/}
                            {/*    </PopoverContent>*/}
                            {/*</Popover>*/}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
                            <Input
                                id="expiresAt"
                                type="datetime-local"
                                value={formData.expiresAt ? formData.expiresAt.slice(0, 16) : ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}