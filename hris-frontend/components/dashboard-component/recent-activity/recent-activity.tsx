import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const rows = [
    { id: "REQ-1042", type: "Leave", employee: "R. Hidayat", when: "Today, 09:12", status: "Pending" },
    { id: "REQ-1041", type: "Overtime", employee: "S. Amelia", when: "Yesterday, 18:20", status: "Approved" },
    { id: "ONB-203", type: "Onboarding", employee: "D. Pratama", when: "Yesterday, 10:45", status: "Scheduled" },
    { id: "PAY-0925", type: "Payroll", employee: "All Employees", when: "2 days ago", status: "Processing" },
]

export function RecentActivity() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ref</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>When</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium">{r.id}</TableCell>
                                <TableCell>{r.type}</TableCell>
                                <TableCell>{r.employee}</TableCell>
                                <TableCell>{r.when}</TableCell>
                                <TableCell className="text-right">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                    {r.status}
                  </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}