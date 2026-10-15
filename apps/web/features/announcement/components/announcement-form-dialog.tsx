"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Announcement, AnnouncementCategory, AnnouncementPriority, DeliveryChannel } from "../types/announcement";

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Announcement>) => Promise<void>;
  initial?: Partial<Announcement>;
  title: string;
}

const categories: AnnouncementCategory[] = ["General", "HR Policy", "Event", "Emergency", "Other"];
const priorities: AnnouncementPriority[] = ["Normal", "High", "Critical"];
const channels: DeliveryChannel[] = ["web", "mobile", "email", "slack", "teams", "whatsapp"];

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
  });

  const [selectedChannels, setSelectedChannels] = React.useState<DeliveryChannel[]>(initial?.channels || ["web"]);
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>(initial?.audience?.departments || []);
  const [departmentInput, setDepartmentInput] = React.useState("");

  const [date, setDate] = React.useState<Date | undefined>(() =>
    initial?.scheduledAt ? new Date(initial.scheduledAt) : undefined
  );

  React.useEffect(() => {
    if (open && initial) {
      setFormData({ ...formData, ...initial });
      setSelectedChannels(initial.channels || ["web"]);
      setSelectedDepartments(initial.audience?.departments || []);
      setDate(initial.scheduledAt ? new Date(initial.scheduledAt) : undefined);
    }
  }, [open, initial]);

  React.useEffect(() => {
    const iso = date ? date.toISOString() : undefined;
    if (formData.scheduledAt !== iso) {
      setFormData((prev) => ({ ...prev, scheduledAt: iso }));
    }
  }, [date]);

  React.useEffect(() => {
    if (formData.scheduledAt) {
      const d = new Date(formData.scheduledAt);
      if (!isNaN(d.getTime()) && (!date || d.getTime() !== date.getTime())) {
        setDate(d);
      }
    } else if (date) {
      setDate(undefined);
    }
  }, [formData.scheduledAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      channels: selectedChannels,
      audience: {
        ...formData.audience,
        allEmployees: formData.audience?.allEmployees ?? true,
        departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
      },
    });
    onOpenChange(false);
  };

  const handleChannelToggle = (channel: DeliveryChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleAddDepartment = () => {
    if (departmentInput.trim() && !selectedDepartments.includes(departmentInput.trim())) {
      setSelectedDepartments((prev) => [...prev, departmentInput.trim()]);
      setDepartmentInput("");
    }
  };

  const handleRemoveDepartment = (dept: string) => {
    setSelectedDepartments((prev) => prev.filter((d) => d !== dept));
  };

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
              value={formData.title || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              rows={5}
              value={formData.content || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val as AnnouncementCategory }))}
              >
                <SelectTrigger>
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
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, priority: val as AnnouncementPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Audience Target</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allEmployees"
                checked={formData.audience?.allEmployees}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    audience: { ...prev.audience, allEmployees: !!checked },
                  }))
                }
              />
              <Label htmlFor="allEmployees" className="cursor-pointer">
                Target all employees
              </Label>
            </div>

            {!formData.audience?.allEmployees && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs">Specific Departments</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter department name"
                    value={departmentInput}
                    onChange={(e) => setDepartmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDepartment();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddDepartment}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedDepartments.map((dept) => (
                    <Badge key={dept} variant="secondary" className="gap-1">
                      {dept}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveDepartment(dept)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Delivery Channels</Label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={`channel-${channel}`}
                    checked={selectedChannels.includes(channel)}
                    onCheckedChange={() => handleChannelToggle(channel)}
                  />
                  <Label htmlFor={`channel-${channel}`} className="capitalize cursor-pointer">
                    {channel}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPinned"
                checked={formData.isPinned}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPinned: !!checked }))}
              />
              <Label htmlFor="isPinned" className="cursor-pointer">
                Pin to top
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresAcknowledgement"
                checked={formData.requiresAcknowledgement}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, requiresAcknowledgement: !!checked }))
                }
              />
              <Label htmlFor="requiresAcknowledgement" className="cursor-pointer">
                Requires acknowledgement
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Announcement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
