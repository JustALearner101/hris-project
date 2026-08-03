"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"


export function AppDialogRequest({
                                     open,
                                     onClose,
                                 }: {
    open: boolean
    onClose: () => void
}) {
    const [selected, setSelected] = React.useState<string | null>(null)
    const [description, setDescription] = React.useState("")
    const [attachment, setAttachment] = React.useState<File | null>(null)

    // Reset form saat dialog ditutup
    React.useEffect(() => {
        if (!open) {
            setSelected(null)
            setDescription("")
            setAttachment(null)
        }
    }, [open])

    const handleSubmit = () => {
        console.log("Submit:", {
            type: selected,
            description,
            attachment,
        })

        toast.success("Pengajuan berhasil dikirim", {
            description: `Jenis: ${selected}`,
        })

        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajukan Permintaan</DialogTitle>
                    <DialogDescription>
                        Pilih jenis pengajuan yang ingin kamu lakukan.
                    </DialogDescription>
                </DialogHeader>

                {/* Dropdown pilihan request */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {selected ? selected : "Pilih Jenis Pengajuan"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[220px]">
                        <DropdownMenuItem onClick={() => setSelected("Cuti/Izin")}>
                            Cuti/Izin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelected("Reimbursement")}>
                            Reimbursement
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelected("Lainnya")}>
                            Klaim Lainnya
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sub form tergantung jenis pengajuan */}
                {selected && (
                    <div className="space-y-4 mt-4">
                        {selected === "Cuti/Izin" && (
                            <>
                                <div>
                                    <Label className="mb-2" htmlFor="reason">Alasan Cuti/Izin</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Tuliskan alasan cuti/izin..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="attachment">Lampiran (opsional)</Label>
                                    <Input
                                        id="attachment"
                                        type="file"
                                        onChange={(e) =>
                                            setAttachment(e.target.files?.[0] || null)
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {selected === "Reimbursement" && (
                            <>
                                <div>
                                    <Label className="mb-2" htmlFor="detail">Keterangan</Label>
                                    <Textarea
                                        id="detail"
                                        placeholder="Detail reimbursement..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="attachment">Upload Bukti</Label>
                                    <Input
                                        id="attachment"
                                        type="file"
                                        onChange={(e) =>
                                            setAttachment(e.target.files?.[0] || null)
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {selected === "Lainnya" && (
                            <>
                                <div>
                                    <Label className="mb-2" htmlFor="detail">Keterangan</Label>
                                    <Textarea
                                        id="detail"
                                        placeholder="Tuliskan keterangan..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selected}>
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}