"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  UserCheck,
  XCircle,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationDto } from "../types/recruitment";

export interface ApplicantTableProps {
  data: ApplicationDto[];
  onInspect: (app: ApplicationDto) => void;
  onHire: (app: ApplicationDto) => void;
  onReject: (app: ApplicationDto) => void;
}

export function ApplicantTable({
  data,
  onInspect,
  onHire,
  onReject,
}: ApplicantTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (app) =>
        app.candidateName.toLowerCase().includes(q) ||
        app.candidateEmail.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q)
    );
  }, [data, search]);

  const renderParseBadge = (status: string) => {
    if (status === "PARSED") {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
          <CheckCircle2 className="h-3 w-3" />
          PARSED
        </Badge>
      );
    }
    if (status === "FAILED") {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          FAILED
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search applicants by candidate name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Role Applied</TableHead>
              <TableHead>Current Stage</TableHead>
              <TableHead>AI CV Parse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No applicants found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{app.candidateName}</div>
                      <div className="text-xs text-muted-foreground">
                        {app.candidateEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{app.jobTitle}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{app.currentStageName}</Badge>
                  </TableCell>
                  <TableCell>{renderParseBadge(app.cvParseStatus)}</TableCell>
                  <TableCell>
                    {app.status === "HIRED" ? (
                      <Badge className="bg-emerald-600 text-white">HIRED</Badge>
                    ) : app.status === "REJECTED" ? (
                      <Badge variant="destructive">REJECTED</Badge>
                    ) : (
                      <Badge variant="outline">{app.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onInspect(app)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Parsed CV
                      </Button>
                      {app.status !== "HIRED" && app.status !== "REJECTED" && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onHire(app)}
                          >
                            <UserCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                            Hire
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onReject(app)}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
