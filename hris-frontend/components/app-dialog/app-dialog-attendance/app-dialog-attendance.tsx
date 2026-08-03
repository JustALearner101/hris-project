import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"


type AppDialogAttendanceProps = {
    onClose: () => void;
};

const defaultWorkLocationList = [
    {
        value: "1",
        label: "Kantor Pusat ITCorp - Jakarta Pusat",
    },
    {
        value: "2",
        label: "Kantor Cabang ITCorp BDG - Bandung",
    },
    {
        value: "3",
        label: "Kantor Cabang ITCorp SBY - Surabaya",
    },
    {
        value: "4",
        label: "Remote - Work From Home",
    },
]

export function AppDialogAttendance({ onClose }: AppDialogAttendanceProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Attendance</DialogTitle>
                    <DialogDescription>
                        Clock in or clock out for your work session.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="location">Work Location</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                >
                                    {value
                                        ? defaultWorkLocationList.find((defaultWorkLocationList) => defaultWorkLocationList.value === value)?.label
                                        : "Select Work Location..."}
                                    <ChevronsUpDown className="opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 left-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search Work Location..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>No Work Location found.</CommandEmpty>
                                        <CommandGroup>
                                            {defaultWorkLocationList.map((defaultWorkLocationList) => (
                                                <CommandItem
                                                    key={defaultWorkLocationList.value}
                                                    value={defaultWorkLocationList.value}
                                                    onSelect={(currentValue) => {
                                                        setValue(currentValue === value ? "" : currentValue)
                                                        setOpen(false)
                                                    }}
                                                >
                                                    {defaultWorkLocationList.label}
                                                    <Check
                                                        className={cn(
                                                            "ml-auto",
                                                            value === defaultWorkLocationList.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-3">
                        <label className="flex flex-col gap-1">Work Plan</label>
                        <Textarea className="flex-1" placeholder="Write your work plan here..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Clock In</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}