"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Plus,
  Briefcase,
  Users,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createJobPosting,
  deleteJobPosting,
  hireApplication,
  moveApplicationStage,
  publishJobPosting,
  rejectApplication,
  unpublishJobPosting,
  updateJobPosting,
  useApplications,
  useJobPostings,
} from "@/features/recruitment/api/use-recruitment";
import {
  ApplicationDto,
  JobPostingDto,
  JobPostingFormValues,
  PipelineStageType,
} from "@/features/recruitment/types/recruitment";
import { JobPostingTable } from "@/features/recruitment/components/job-posting-table";
import { JobPostingFormDialog } from "@/features/recruitment/components/job-posting-form-dialog";
import { PipelineBoard } from "@/features/recruitment/components/pipeline-board";
import { ApplicantTable } from "@/features/recruitment/components/applicant-table";
import { ApplicantDetailDrawer } from "@/features/recruitment/components/applicant-detail-drawer";

export default function RecruitmentDashboardPage() {
  const [activeTab, setActiveTab] = React.useState("jobs");
  const [selectedJobId, setSelectedJobId] = React.useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingJob, setEditingJob] = React.useState<JobPostingDto | null>(
    null
  );
  const [inspectingApp, setInspectingApp] =
    React.useState<ApplicationDto | null>(null);

  const {
    jobPostings,
    isLoading: jobsLoading,
    mutate: mutateJobs,
  } = useJobPostings({ limit: 100 });

  const { applications, mutate: mutateApps } = useApplications({
    jobPostingId:
      selectedJobId !== "ALL" ? Number(selectedJobId) : undefined,
    limit: 200,
  });

  const publishedCount = React.useMemo(
    () => jobPostings.filter((j) => j.status === "PUBLISHED").length,
    [jobPostings]
  );

  const parsedCount = React.useMemo(
    () => applications.filter((a) => a.cvParseStatus === "PARSED").length,
    [applications]
  );

  const hiredCount = React.useMemo(
    () => applications.filter((a) => a.status === "HIRED").length,
    [applications]
  );

  const handleCreateOrUpdateJob = async (values: JobPostingFormValues) => {
    try {
      if (editingJob) {
        await updateJobPosting(editingJob.id, values);
        toast.success(`Updated "${values.title}"`);
      } else {
        await createJobPosting(values);
        toast.success(`Created job posting "${values.title}"`);
      }
      await mutateJobs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save job posting"
      );
      throw error;
    }
  };

  const handlePublishToggle = async (job: JobPostingDto) => {
    try {
      if (job.status === "PUBLISHED") {
        await unpublishJobPosting(job.id);
        toast.success(`Unpublished "${job.title}" from Career Portal`);
      } else {
        await publishJobPosting(job.id);
        toast.success(`Published "${job.title}" to Career Portal`);
      }
      await mutateJobs();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to toggle publication state"
      );
    }
  };

  const handleDeleteJob = async (job: JobPostingDto) => {
    try {
      await deleteJobPosting(job.id);
      toast.success(`Deleted "${job.title}"`);
      await mutateJobs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete job posting"
      );
    }
  };

  const handleMoveStage = async (
    app: ApplicationDto,
    targetStageType: PipelineStageType
  ) => {
    try {
      await moveApplicationStage(app.id, {
        targetStageType,
        notes: `Moved to ${targetStageType} via Kanban board`,
      });
      toast.success(`Moved ${app.candidateName} to ${targetStageType}`);
      await mutateApps();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move candidate stage"
      );
    }
  };

  const handleHire = async (app: ApplicationDto) => {
    try {
      await hireApplication(app.id, {
        notes: "Hired by HR Admin — published candidate.hired event",
      });
      toast.success(
        `Hired ${app.candidateName}! Employee onboarding event dispatched.`
      );
      await Promise.all([mutateApps(), mutateJobs()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to hire candidate"
      );
    }
  };

  const handleReject = async (app: ApplicationDto) => {
    try {
      await rejectApplication(app.id, {
        reason: "Not selected for current requisition",
      });
      toast.success(`Marked ${app.candidateName} as rejected.`);
      await mutateApps();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject candidate"
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Talent Acquisition & ATS
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage job requisitions, AI-parsed CVs, and hiring pipelines across
            all departments.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingJob(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Job Requisition
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">
              Total Requisitions
            </CardDescription>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobPostings.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedCount} live on Career Portal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">
              Active Applicants
            </CardDescription>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all active pipeline stages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">
              AI CVs Parsed
            </CardDescription>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parsedCount}</div>
            <p className="text-xs text-muted-foreground">
              OCR + LLM structured extraction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium">
              Candidates Hired
            </CardDescription>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hiredCount}</div>
            <p className="text-xs text-muted-foreground">
              Synced via candidate.hired stream
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <TabsList>
            <TabsTrigger value="jobs">
              Job Postings ({jobPostings.length})
            </TabsTrigger>
            <TabsTrigger value="pipeline">
              Kanban Pipeline ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="applicants">Applicant Directory</TabsTrigger>
          </TabsList>

          {(activeTab === "pipeline" || activeTab === "applicants") && (
            <div className="w-full sm:w-72">
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger aria-label="Filter pipeline by job posting">
                  <SelectValue placeholder="All Job Postings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Job Postings</SelectItem>
                  {jobPostings.map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Requisitions</CardTitle>
              <CardDescription>
                Create, edit, and publish open positions to the public career
                portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobPostingTable
                data={jobPostings}
                isLoading={jobsLoading}
                onEdit={(job) => {
                  setEditingJob(job);
                  setDialogOpen(true);
                }}
                onPublishToggle={handlePublishToggle}
                onDelete={handleDeleteJob}
                onSelectPipeline={(job) => {
                  setSelectedJobId(String(job.id));
                  setActiveTab("pipeline");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineBoard
            applications={applications}
            onMoveStage={handleMoveStage}
            onSelectApplication={(app) => setInspectingApp(app)}
            onHire={handleHire}
            onReject={handleReject}
          />
        </TabsContent>

        <TabsContent value="applicants">
          <Card>
            <CardHeader>
              <CardTitle>Applicant Directory</CardTitle>
              <CardDescription>
                Inspect AI-extracted skills, experience, and original CV
                documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicantTable
                data={applications}
                onInspect={(app) => setInspectingApp(app)}
                onHire={handleHire}
                onReject={handleReject}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <JobPostingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingJob}
        onSubmit={handleCreateOrUpdateJob}
      />

      <ApplicantDetailDrawer
        application={inspectingApp}
        open={Boolean(inspectingApp)}
        onOpenChange={(open) => {
          if (!open) setInspectingApp(null);
        }}
        onHire={handleHire}
        onReject={handleReject}
      />
    </div>
  );
}
