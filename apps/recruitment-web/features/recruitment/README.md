# HR Admin ATS Feature (`features/recruitment`)

Provides the recruiter-facing Applicant Tracking System (ATS) dashboard in `apps/recruitment-web`, including job requisition management, Kanban pipeline stage progression, AI-parsed CV inspection, and one-click hiring (`candidate.hired` event emission).

## Key Modules
- `types/recruitment.ts`: DTO interfaces (`JobPostingDto`, `ApplicationDto`, `ApplicationDetailDto`, `ParsedCvProfile`) and `jobPostingFormSchema`.
- `api/use-recruitment.ts`: SWR hooks (`useJobPostings`, `useApplications`, `useApplicationDetail`, `useCandidates`) and REST mutation helpers.
- `components/job-posting-table.tsx`: DataTable for managing job requisitions and publishing to the public career portal.
- `components/job-posting-form-dialog.tsx`: Modal form for creating and editing job postings.
- `components/pipeline-board.tsx`: 6-stage Kanban board (`SOURCING`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`).
- `components/applicant-table.tsx`: Searchable applicant directory with AI parse status badges.
- `components/applicant-detail-drawer.tsx`: Structured viewer for AI-extracted CV JSON (`skills`, `experience`, `education`) and original document download.
