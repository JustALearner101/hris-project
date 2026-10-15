"use client";

import { useState, useMemo } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import type { Shift, ShiftType } from "../types/shift";

interface ShiftFormDialogProps {
  mode: "create" | "edit";
  trigger?: React.ReactNode;
  initial?: Shift | null;
  onSaved?: (s: Shift) => void;
}

export function ShiftFormDialog({ mode, trigger, initial, onSaved }: ShiftFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<ShiftType>(initial?.type ?? "FIXED");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "16:00");
  const [breakDurationMin, setBreak] = useState(initial?.breakDurationMin ?? 60);
  const [gracePeriodMin, setGrace] = useState(initial?.gracePeriodMin ?? 10);
  const [validFrom, setFrom] = useState(initial?.validFrom ?? "");
  const [validTo, setTo] = useState(initial?.validTo ?? "");
  const [isDefault, setIsDefault] = useState(!!initial?.isDefault);
  const [active, setActive] = useState(initial?.active ?? true);

  const validTime = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start !== end;
  }, [startTime, endTime]);

  async function onSubmit() {
    if (!code || !name) {
      toast({ title: "Validation error", description: "Code and Name are required." });
      return;
    }
    if (!validTime) {
      toast({ title: "Invalid time", description: "Start and End cannot be same." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        tenantId: "tenant-demo",
        entityId: "entity-demo",
        code,
        name,
        type,
        startTime,
        endTime,
        breakDurationMin,
        gracePeriodMin,
        validFrom: validFrom || undefined,
        validTo: validTo || undefined,
        isDefault,
        active,
      };
      const res = await fetch(initial ? `/api/shifts/${initial.id}` : "/api/shifts", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Shift = await res.json();
      toast({ title: initial ? "Shift updated" : "Shift created" });
      onSaved?.(data);
      setOpen(false);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : "Unexpected error";
      toast({ title: "Failed", description: errorMsg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Shift" : `Edit Shift — ${initial?.code}`}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Shift Code *</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. S-MORNING" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Shift Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Shift" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ShiftType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">FIXED</SelectItem>
                  <SelectItem value="ROTATING">ROTATING</SelectItem>
                  <SelectItem value="SPLIT">SPLIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Grace Period (min)</Label>
              <Input type="number" value={gracePeriodMin} onChange={(e) => setGrace(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Break (min)</Label>
              <Input type="number" value={breakDurationMin} onChange={(e) => setBreak(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Valid From</Label>
              <Input type="date" value={validFrom} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Valid To</Label>
              <Input type="date" value={validTo} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="active">Active Status</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isDefault" checked={isDefault} onCheckedChange={setIsDefault} />
              <Label htmlFor="isDefault">Default Shift</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={submitting} onClick={onSubmit}>
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
